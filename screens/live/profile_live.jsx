/* PROFILE + AI — LIVE-only forks (real Telegram user, app.mode === "live" is
   ALWAYS true here). The demo ("Павел") and fresh branches are stripped: no
   curated level 7 / 72% / 1240 XP, no scripted "Павел Хиллсон" header, no demo
   orbit faces, no fresh Apple-Health intro, no scripted "Павел" insights /
   patterns / sparkline. Everything is real — real level/XP via bosLiveXPLive +
   bosLevelInfoLive, the real OrbitField with your invited people, real achievements,
   and the honest AI hub driven by app.aiBrief.

   Reuses the shared core/ toolkit (OrbitField, SysCard, SysBtn, AvatarPickerSheet,
   EditProfileSheet, InfoSheet, useAIT, buildQuickPrompts) + framework
   (PageHeader, BosAvatar, BosOrbFace, SiriOrb, I, hooks useApp/useNav/useSheet,
   every bos* helper, BOS_ACHIEVEMENTS_LIVE, tintFromMood).

   TYPOGRAPHY: primary labels (user name, section/row primary titles, list-item
   primary text) carry iOS Headline weight (fontWeight: 600 / 700) — matching the
   «Следующие шаги» pills. Secondary/caption text is left untouched.

   Top-level declarations in this file: `function ProfileLive`, `function AILive`
   and the local-analytics helpers of the AI tab (bosAiStatsLive / bosAiReadingLive /
   bosAiWhyPickLive / bosAiMemoryLive / bosAiMemoryPctLive + small format utils). */

// Люди орбиты «Я»: показать СРАЗУ из кэша (память → localStorage), обновить фоном и МОЛЧА.
// Это был единственный экран «с людьми» без кэша — аватарки «доскакивали» ~секунду при каждом заходе.
var _bosOrbitPeopleCache = null;

function ProfileLive() {
  const { navigate } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  const { open: openSheet, close: closeSheet } = useSheet();
  const openAvatar = () => openSheet(<AvatarPickerSheetLive dark={app?.themeOverride === "dark"} />);
  // LIVE: always real data.
  const _xp = bosLiveXPLive(app);
  const _li = bosLevelInfoLive(_xp);
  const lvlNum = _li.level;
  const lvlPct = _li.pct;

  // Real multiplayer: pull the people you've actually invited (referral circle) from
  // the cloud and put them on your orbit — PLUS the person who invited YOU (myInviter),
  // so a newcomer's orbit is never empty: the bridge works both ways from day one.
  const [livePeople, setLivePeople] = React.useState(() => {
    if (Array.isArray(_bosOrbitPeopleCache)) return _bosOrbitPeopleCache;
    try { const c = JSON.parse(localStorage.getItem("bos:cache:orbitPeople") || "null"); if (Array.isArray(c)) return c; } catch (e) {}
    return [];
  });
  React.useEffect(() => {
    let on = true;
    try {
      if (window.bosCloud && window.bosCloud.enabled()) {
        const _me = (window.bosCloud.uidSync && window.bosCloud.uidSync()) || null;
        const _mk = (p) => ({ id: (p && p.id) || null, avatar: (p && p.avatar) || "default", name: (p && (p.username || p.name)) || "" });
        Promise.all([
          window.bosCloud.invitedPeople().catch(() => []),
          (window.bosCloud.myInviter ? window.bosCloud.myInviter() : Promise.resolve(null)).catch(() => null),
        ]).then(([list, inv]) => {
          if (!on) return;
          // Себя на своей орбите быть не должно (ты — центр), и один человек не двоится, даже если
          // пришёл из двух источников (баг «вижу себя дважды»): фильтр self по id + дедуп по id.
          const _raw = [];
          if (inv && inv.username) _raw.push(_mk(inv)); // зовущий — первым, ближе всех
          (Array.isArray(list) ? list : []).forEach((p) => _raw.push(_mk(p)));
          const _seen = {};
          const out = _raw.filter((x) => {
            if (_me && x.id && x.id === _me) return false;
            const k = x.id || ("n:" + x.avatar + "|" + x.name);
            if (_seen[k]) return false; _seen[k] = 1; return true;
          });
          // «Пусто = правда»-защита: invitedPeople при обрыве возвращает [] (неотличимо от «нет друзей»).
          // Приглашённые/пригласивший сами не исчезают, поэтому пустой ответ ПРИ ЖИВОМ КЭШЕ = обрыв →
          // не затираем орбиту пустотой (у НОВОГО юзера кэш пуст → пустой ответ проходит, это верно).
          if (!out.length) {
            let _lp = _bosOrbitPeopleCache;
            if (!_lp) { try { _lp = JSON.parse(localStorage.getItem("bos:cache:orbitPeople") || "null"); } catch (e) {} }
            if (Array.isArray(_lp) && _lp.length) return;
          }
          _bosOrbitPeopleCache = out;
          try { localStorage.setItem("bos:cache:orbitPeople", JSON.stringify(out)); } catch (e) {}
          // Молча: state (и пересборку орбиты) дёргаем только если список реально изменился.
          setLivePeople((prev) => JSON.stringify(prev) === JSON.stringify(out) ? prev : out);
        }).catch(() => {});
      }
    } catch (e) {}
    return () => { on = false; };
  }, []);
  const orbitPeople = livePeople;

  // Publish MY public ORBIT (level + habit icons + people count) so my system shows REAL to others in
  // «Вселенная» — their orbits with my habits/people, как у меня (David). World-readable; no-ops until
  // David adds the pub_orbit column. Only emoji+colour leave the device (no habit names). Re-publishes
  // when anything changes via a small signature string.
  // Скрытые копии привычек круга (shelved, Г) и goalOnly не светятся ни на орбите, ни в витрине.
  const _visHabits = (app?.habits || []).filter((h) => !h.shelved && !h.goalOnly);
  const _pubHabits = _visHabits.map((h) => ({ e: h.emoji, c: h.color }));
  // Реальные лица людей на орбите → во «Вселенную» (David: «настоящие аватарки на орбитах, не мемоджи»).
  const _pubFaces = orbitPeople.map((p) => p.avatar || "default").slice(0, 10);
  const _pubSig = JSON.stringify(_pubHabits) + "|" + orbitPeople.length + "|" + JSON.stringify(_pubFaces) + "|" + lvlNum + "|" + lvlPct + "|" + (app?.goals || []).length;
  React.useEffect(() => {
    try { if (window.bosCloud && window.bosCloud.enabled() && window.bosCloud.savePublicStats) window.bosCloud.savePublicStats({ level: lvlNum, lvlPct: lvlPct, habits: _pubHabits, goals: (app?.goals || []).length, people: orbitPeople.length, faces: _pubFaces }); } catch (e) {}
  }, [_pubSig]);

  // Achievements badge — REAL earned set + emojis.
  const _liveAch = bosEarnedAchievementsLive(app).filter((a) => a.earned);
  const _achTotal = BOS_ACHIEVEMENTS_LIVE.length;
  const _achEarnedN = _liveAch.length;
  const _achEmojis = _liveAch.slice(0, 3).map((a) => a.i);
  const _achCircles = livePeople.length;
  const isDark = app?.themeOverride === "dark";
  const [universeOpen, setUniverseOpen] = React.useState(false); // зум-аут в «Вселенную»
  // Единый ЦЕЛОСТНЫЙ переход: меряем твою орбиту на «Я» и отдаём её рект во Вселенную — она стартует
  // ровно отсюда и плавно отдаляется к множеству систем (David: «ощущение перехода ОТ нашей системы»).
  const orbitRef = React.useRef(null);
  const [universeFrom, setUniverseFrom] = React.useState(null);
  const openUniverse = () => {
    try { const r = orbitRef.current && orbitRef.current.getBoundingClientRect(); setUniverseFrom(r && r.width ? { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height, size: Math.min(r.width, r.height) } : null); } catch (e) { setUniverseFrom(null); }
    setUniverseOpen(true);
  };
  const statCard = isDark
    ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }
    : { background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" };
  // Grouped iOS-style menu (v280): plain render-fn so re-renders never remount the rows.
  const chip = (icon) => <span className="bos-sys-chip-bg" style={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0 }}>{React.createElement(icon, { size: 16, color: "var(--text)" })}</span>;
  const navRow = (icon, label, id, last) => (
    <button key={id} onClick={() => navigate(id, { from: "profile" })} className="tap" style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: "transparent", border: 0, borderBottom: last ? "none" : "0.5px solid var(--line)", cursor: "pointer", textAlign: "left", padding: "13px 14px" }}>
      {chip(icon)}
      <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: "var(--text)" }}>{label}</span>
      <I.ChevronRight size={18} className="bos-sys-text-2" />
    </button>
  );
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      {/* Правый-верх: «Вселенная» (зум-аут к другим системам) + карандаш-правки (как на стр. Привычки).
          David: кнопке вселенной «снизу по центру между блоками не место» → ушла в шапку. */}
      <PageHeader onBack={() => navigate("home")} title="" right={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* «Вселенная» — спираль-кнопка РАСШИРЕНА в пилюлю с подписью (David: «у спирали добавь
              подпись вселенная, продли до кнопки в том же стиле»); то же стекло, что у карандаша. */}
          <button onClick={openUniverse} className="tap" aria-label="Вселенная" title="Вселенная"
            style={{ height: 40, borderRadius: 999, border: 0, padding: "0 15px", gap: 7, display: "flex", alignItems: "center", cursor: "pointer", color: isDark ? "#fff" : "var(--text)", background: (typeof BOS_TILE_SHEEN !== "undefined" ? BOS_TILE_SHEEN + ", " : "") + (isDark ? "rgba(255,255,255,0.10)" : "var(--surface-3)"), boxShadow: (typeof bosTileGlass === "function" ? bosTileGlass(isDark) : "none") }}>
            <I.Galaxy size={18} strokeWidth={1.8} />
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.2px" }}>Вселенная</span>
          </button>
          {typeof EditGlassButtonLive === "function" ? <EditGlassButtonLive onClick={openAvatar} /> : null}
        </div>
      } />

      <div style={{ textAlign: "center", marginTop: 4 }}>
        {/* Your orbit — you in the centre, habits orbiting by strength, your invited people around you */}
        {/* Центр = аватар с золотым кольцом + ЦИФРОЙ уровня (как на главной); карандаш ушёл наверх-вправо. */}
        {/* При входе во Вселенную прячем СТРАНИЧНУЮ орбиту (overlay рисует её идентичную копию ровно
            на этом же месте) → нет «двойной орбиты», переход читается как одно целое. */}
        <div ref={orbitRef} style={{ opacity: universeOpen ? 0 : 1, transition: "opacity 0.2s ease" }}>
          <OrbitField avatar={app?.avatar} name={app?.userName} habits={_visHabits} people={orbitPeople} levelPct={lvlPct} moodC={app?.mood?.c} dark={app?.themeOverride === "dark"} hideLevelArc editable={false} levelBadge={lvlNum} />
        </div>
        <div style={{ fontFamily: "var(--bos-title-font)", fontWeight: 700, fontSize: 28, marginTop: 6, color: "var(--text)" }}>{app?.userName || "Ты"}</div>
      </div>

      {universeOpen && typeof UniverseFieldLive === "function" && <UniverseFieldLive app={app} people={orbitPeople} from={universeFrom} onClose={() => setUniverseOpen(false)} />}

      {/* Уровень (золотая ВЕРХУШКА — перенесена с главной) + Достижения + Друзья — ЕДИНЫЙ блок в стиле
          «Настройки/Уведомления/Поддержка» (David: «друзья/достижения/уровни одним блоком, уровень
          интегрировать как верхушку красивее; старый верхний стат-блок убрать»). */}
      <div className="bos-sys-card" style={{ marginTop: 16, padding: 0, overflow: "hidden" }}>
        {/* Уровень — теперь РАВНОВЫСОКАЯ строка как остальные: прогресс свёрнут в тонкое ЗОЛОТОЕ
            КОЛЬЦО вокруг иконки (язык орбит/колец приложения), без тяжёлого баннера и широкой полосы.
            Иконка — монохромный SVG в кружке, как у Достижений/Друзей и нижнего меню. */}
        <button onClick={() => navigate("levels", { from: "profile" })} className="tap" style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "transparent", border: 0, cursor: "pointer", textAlign: "left", padding: "13px 14px" }}>
          <span style={{ position: "relative", width: 40, height: 40, flexShrink: 0, display: "grid", placeItems: "center" }}>
            <svg width="40" height="40" viewBox="0 0 40 40" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)", transformBox: "fill-box", transformOrigin: "center" }}>
              <circle cx="20" cy="20" r="18" fill="none" stroke={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)"} strokeWidth="2.5" />
              <circle cx="20" cy="20" r="18" fill="none" stroke="url(#bosLvlRing)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="113.1" strokeDashoffset={113.1 * (1 - Math.max(0, Math.min(100, lvlPct)) / 100)} />
              <defs><linearGradient id="bosLvlRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FEDE34" /><stop offset="1" stopColor="#EF9F14" /></linearGradient></defs>
            </svg>
            <span className="bos-sys-chip-bg" style={{ width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center" }}><I.Sparkles size={15} color="var(--text)" /></span>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>Уровень {lvlNum}</div>
            <div className="bos-sys-text-3" style={{ fontSize: 12.5, marginTop: 1 }}>До {lvlNum + 1} уровня — {lvlPct}% · {_xp} XP</div>
          </div>
          <I.ChevronRight size={18} className="bos-sys-text-2" />
        </button>
        <button onClick={() => navigate("achievements", { from: "profile" })} className="tap" style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "transparent", border: 0, borderTop: "0.5px solid var(--line)", cursor: "pointer", textAlign: "left", padding: "13px 14px" }}>
          {chip(I.Trophy)}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>Достижения</div>
            <div className="bos-sys-text-3" style={{ fontSize: 12.5, marginTop: 1 }}>{_achEarnedN + " из " + _achTotal + (_achEarnedN === 0 ? " · открой первую" : "")}</div>
          </div>
          <div style={{ display: "flex", marginRight: 4 }}>
            {_achEmojis.map((e, i) => <span key={i} style={{ width: 24, height: 24, borderRadius: 7, background: "var(--card-2)", display: "grid", placeItems: "center", fontSize: 12, marginLeft: i ? -7 : 0, border: "1.5px solid var(--card)" }}>{e}</span>)}
          </div>
          <I.ChevronRight size={18} className="bos-sys-text-2" />
        </button>
        {/* «Друзья» УБРАНЫ (David 2026-07-14): люди объединяются в совместных привычках/целях/кругах,
            отдельная вкладка «Друзья» пользы не несла. Маршрут "friends" жив (нотификации), только строки нет. */}
      </div>

      {/* App menu — one grouped iOS card, hairline-divided rows */}
      {/* App menu — Настройки first, Уведомления under (David). ИИ-инсайты removed (ИИ is its
          own tab) and История removed (it's reachable from the home calendar). */}
      <div className="bos-sys-card" style={{ marginTop: 12, padding: 0, overflow: "hidden" }}>
        {/* «Как устроен Balance» и «Обучение» УБРАНЫ отсюда (David 2026-07-14): гид живёт на
            «Сообществе» карточкой «Как устроен Balance» (СУТЬ) — там его настоящее место, новичок
            приходит к людям. Компоненты гида/статей живы, просто не дублируются в настройках. */}
        {navRow(I.Settings, "Настройки", "settings")}
        {navRow(I.Bell, "Уведомления", "notifications")}
        {navRow(I.Help, "Поддержка и помощь", "support", true)}
      </div>
      {/* «Выйти» ПЕРЕЕХАЛО в Настройки (David 2026-07-15) — красной кнопке не место на витрине
          «Я», рядом с орбитами и тёплой подписью. Живёт в SettingsLive (profile_extra_live). */}
      {/* Тёплая подпись — переехала из настроек СЮДА, к орбитам (David: «сделано с любовью на „Я"»). */}
      <div className="bos-sys-text-3" style={{ textAlign: "center", padding: "18px 14px 4px", fontSize: 12.5, opacity: 0.85 }}>Сделано с 💛</div>
    </div>
  );
}

/* ── Вкладка ИИ (финал-сборка 2026-07-16, David): «экран, который тебя понимает» ─────────────
   Порядок: чтение дня → БОЛЬШОЕ колесо (не трогаем) → плитки пульса → вопрос «что помешало?» →
   «Что я уже понял о тебе» → чат. «Скоро в Balance AI» оставлено как было (решение позже).
   ВСЯ аналитика считается ЛОКАЛЬНО из журнала отметок/состояний — работает без ИИ-ключа.
   Правила доверия из макета: (1) порог уверенности — инсайт только при сильном эффекте и
   достатке наблюдений; (2) цифра + источник в каждой фразе; (3) «не про меня» на каждой строке;
   (4) мало данных → вопрос, не вывод. */

var BOS_AI_DOW_RU = ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"];
function bosAiCapLive(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function bosAiNumRuLive(x, digits) { var n = (digits == null ? 1 : digits); return (Math.round(x * Math.pow(10, n)) / Math.pow(10, n)).toString().replace(".", ","); }

/* Один проход по журналу → все честные цифры вкладки. Пороги уверенности зашиты здесь. */
function bosAiStatsLive(app) {
  var habits = ((app && app.habits) || []).filter(function (h) { return h && !h.shelved && !h.goalOnly; });
  var dayMoods = (app && app.dayMoods) || {};
  var todayDow = bosDowOfKey(bosTodayKey());
  var D = 28; // окно наблюдения — 4 недели
  function schedOn(h, dow) { var m = bosDaysMask(h.days); return !m || !!m[dow]; }

  // Ритм недели (вчера и глубже: сегодняшний открытый день не занижает свой день недели)
  var dowSched = [0, 0, 0, 0, 0, 0, 0], dowDone = [0, 0, 0, 0, 0, 0, 0], histDays = {};
  habits.forEach(function (h) {
    var log = h.log || {};
    for (var off = 1; off <= D; off++) {
      var k = bosDayKeyOffset(off), dow = bosDowOfKey(k);
      if (!schedOn(h, dow)) continue;
      dowSched[dow]++; if (log[k]) dowDone[dow]++;
    }
    for (var k2 in log) if (log[k2]) histDays[k2] = 1;
  });
  var daysHist = Object.keys(histDays).length;
  var rates = dowSched.map(function (s, i) { return s ? dowDone[i] / s : null; });

  // Текущая неделя по дням (Пн..сегодня) + прошлая неделя целиком
  var bars = [null, null, null, null, null, null, null];
  var wSched = 0, wDone = 0, pSched = 0, pDone = 0;
  for (var off1 = 0; off1 <= todayDow; off1++) {
    var k3 = bosDayKeyOffset(off1), dow3 = bosDowOfKey(k3), s3 = 0, d3 = 0;
    habits.forEach(function (h) { if (schedOn(h, dow3)) { s3++; if ((h.log || {})[k3]) d3++; } });
    bars[dow3] = s3 ? d3 / s3 : null; wSched += s3; wDone += d3;
  }
  for (var off2 = todayDow + 1; off2 <= todayDow + 7; off2++) {
    var k4 = bosDayKeyOffset(off2), dow4 = bosDowOfKey(k4);
    habits.forEach(function (h) { if (schedOn(h, dow4)) { pSched++; if ((h.log || {})[k4]) pDone++; } });
  }
  var weekPct = wSched ? Math.round(wDone / wSched * 100) : null;
  var prevPct = pSched ? Math.round(pDone / pSched * 100) : null;

  // Рекорды серий: лучшая серия в истории (с учётом расписания) vs текущая
  var record = null, recordNow = null;
  habits.forEach(function (h) {
    var log = h.log || {}, mask = bosDaysMask(h.days);
    var best = 0, run = 0;
    for (var off3 = 120; off3 >= 1; off3--) {
      var k5 = bosDayKeyOffset(off3);
      if (log[k5]) run++;
      else if (!mask || mask[bosDowOfKey(k5)]) run = 0; // пропущен СВОЙ день — серия рвётся
      if (run > best) best = run;
    }
    var cur = h.streak || 0;
    if (cur > best) best = cur;
    if (best >= 5 && cur >= 2 && cur < best) {
      var left = best - cur + 1;
      if (!record || left < record.left || (left === record.left && cur > record.cur)) record = { h: h, cur: cur, best: best, left: left };
    }
    if (best >= 5 && cur >= best) { if (!recordNow || cur > recordNow.cur) recordNow = { h: h, cur: cur, best: best }; }
  });

  // Состояние ↔ привычки: средняя валентность (0..6) в дни С привычкой и в её же дни БЕЗ
  var stateIns = null, moodDays = 0;
  for (var mk in dayMoods) if (dayMoods[mk] != null && /^\d{4}-\d{2}-\d{2}$/.test(mk)) moodDays++;
  habits.forEach(function (h) {
    var log = h.log || {}, wi = [], wo = [];
    for (var off4 = 0; off4 <= D; off4++) {
      var k6 = bosDayKeyOffset(off4), mv = dayMoods[k6];
      if (mv == null) continue;
      if (log[k6]) wi.push(+mv);
      else if (schedOn(h, bosDowOfKey(k6))) wo.push(+mv);
    }
    if (wi.length >= 6 && wo.length >= 6) { // порог: по 6+ дней с состоянием на каждой стороне
      var aw = wi.reduce(function (a, b) { return a + b; }, 0) / wi.length;
      var ao = wo.reduce(function (a, b) { return a + b; }, 0) / wo.length;
      var d = aw - ao;
      if (Math.abs(d) >= 0.5 && (!stateIns || Math.abs(d) > Math.abs(stateIns.delta))) stateIns = { h: h, delta: d, nWith: wi.length, nWithout: wo.length };
    }
  });

  // Связка a→b: в дни с A привычка B закрыта в ×lift чаще обычного
  var link = null;
  for (var i = 0; i < habits.length; i++) for (var j = 0; j < habits.length; j++) {
    if (i === j) continue;
    var A = habits[i], B = habits[j], la = A.log || {}, lb = B.log || {};
    var n = 0, aD = 0, bD = 0, both = 0;
    for (var off5 = 1; off5 <= D; off5++) {
      var k7 = bosDayKeyOffset(off5), dow7 = bosDowOfKey(k7);
      if (!schedOn(A, dow7) || !schedOn(B, dow7)) continue;
      n++;
      if (la[k7]) { aD++; if (lb[k7]) both++; }
      if (lb[k7]) bD++;
    }
    if (n >= 14 && aD >= 8 && bD >= 4 && aD < n) { // пороги: 2+ недели общих дней, A устойчива
      var pb = bD / n;
      if (pb > 0) {
        var lift = (both / aD) / pb;
        if (lift >= 1.5 && (!link || lift > link.lift)) link = { a: A, b: B, lift: lift, n: n };
      }
    }
  }

  // Слабый день недели: ≥6 наблюдений на день и разрыв ≥ 45% ↔ 60%
  var weekday = null, okIdx = [];
  for (var d2 = 0; d2 < 7; d2++) if (dowSched[d2] >= 6 && rates[d2] != null) okIdx.push(d2);
  if (okIdx.length >= 5) {
    var worst = null, rest = 0, restN = 0;
    okIdx.forEach(function (x) { if (worst === null || rates[x] < rates[worst]) worst = x; });
    okIdx.forEach(function (x) { if (x !== worst) { rest += rates[x]; restN++; } });
    var restAvg = restN ? rest / restN : 0;
    if (rates[worst] <= 0.45 && restAvg >= 0.6) weekday = { dow: worst, rate: Math.round(rates[worst] * 100), restAvg: Math.round(restAvg * 100) };
  }

  var doneToday = habits.filter(function (h) { return h.done; }).length;
  var schedToday = habits.filter(function (h) { return schedOn(h, todayDow); }).length;
  return { habits: habits, daysHist: daysHist, moodDays: moodDays, rates: rates, dowSched: dowSched,
    bars: bars, weekPct: weekPct, prevPct: prevPct, record: record, recordNow: recordNow,
    stateIns: stateIns, link: link, weekday: weekday, doneToday: doneToday, schedToday: schedToday, todayDow: todayDow };
}

/* «Чтение дня»: правило hero-строки — ТОЛЬКО конкретный факт о тебе с цифрой; нет факта → вопрос. */
function bosAiReadingLive(st) {
  var dowName = BOS_AI_DOW_RU[st.todayDow];
  var kick = "Чтение дня · " + dowName;
  var r = st.rates[st.todayDow], enough = st.dowSched[st.todayDow] >= 6;
  if (enough && r != null && r >= 0.7)
    return { kick: kick, line: bosAiCapLive(dowName) + " — твой сильный день: обычно " + Math.round(r * 100) + "%. Сегодня уже " + st.doneToday + " из " + st.schedToday + "." };
  if (st.weekday && st.weekday.dow === st.todayDow)
    return { kick: kick, line: bosAiCapLive(dowName) + " — твоё слабое звено (обычно " + st.weekday.rate + "%). Один закрытый пункт сегодня — уже победа." };
  if (st.record && st.record.left <= 3)
    return { kick: kick, line: "До рекорда «" + (st.record.h.name || "привычки") + "» — " + st.record.left + " дн. Серия " + st.record.cur + ", рекорд " + st.record.best + "." };
  if (st.weekPct != null && st.prevPct != null && Math.abs(st.weekPct - st.prevPct) >= 10)
    return { kick: kick, line: st.weekPct >= st.prevPct
      ? "Эта неделя сильнее прошлой: " + st.weekPct + "% против " + st.prevPct + "%."
      : "Эта неделя тише прошлой: " + st.weekPct + "% против " + st.prevPct + "%. Один шаг сегодня развернёт тренд." };
  if (st.schedToday > 0 && st.weekPct != null)
    return { kick: kick, line: "Сегодня " + st.doneToday + " из " + st.schedToday + ". Неделя идёт на " + st.weekPct + "%." };
  return { kick: "Знакомимся", line: "Отмечай дни и состояние — через несколько дней я начну замечать твои закономерности." };
}

/* Вопрос «что помешало?»: вчера был запланирован, не закрыт, привычка не случайная (5+ отметок). */
function bosAiWhyPickLive(app) {
  var habits = ((app && app.habits) || []).filter(function (h) { return h && !h.shelved && !h.goalOnly; });
  var yk = bosDayKeyOffset(1), dow = bosDowOfKey(yk), best = null;
  habits.forEach(function (h) {
    var log = h.log || {};
    if (log[yk]) return;
    var m = bosDaysMask(h.days); if (m && !m[dow]) return;
    var total = 0; for (var k in log) if (log[k]) total++;
    if (total < 5) return;
    if (!best || total > best.total) best = { h: h, total: total };
  });
  return best ? { h: best.h, yk: yk } : null;
}
var BOS_AI_WHY_REASONS = [
  { id: "work", t: "Работа допоздна" },
  { id: "people", t: "Гости / люди" },
  { id: "tired", t: "Не было сил" },
];
function bosAiWhyStoreLive(pid) { try { return JSON.parse(localStorage.getItem("bos:why:" + pid) || "{}"); } catch (e) { return {}; } }

/* «Что я уже понял о тебе»: максимум 3 строки, каждая с цифрой и источником; «не про меня» — навсегда. */
function bosAiMemoryLive(app, st) {
  var pid = (app && app.persistId) || "live";
  var out = [];
  if (st.weekday) out.push({ id: "wd", icon: "ChartBar", t: bosAiCapLive(BOS_AI_DOW_RU[st.weekday.dow]) + " — слабое звено", s: "закрывается " + st.weekday.rate + "% против " + st.weekday.restAvg + "% в остальные дни", src: "из отметок" });
  if (st.link) out.push({ id: "link", icon: "Group", t: "«" + st.link.a.name + "» тянет за собой «" + st.link.b.name + "»", s: "в дни с первой вторая закрыта в ×" + bosAiNumRuLive(st.link.lift) + " чаще", src: "из отметок" });
  if (st.stateIns) out.push({ id: "state", icon: "Smile", t: st.stateIns.delta >= 0 ? "«" + st.stateIns.h.name + "» поднимает твоё состояние" : "В дни без «" + st.stateIns.h.name + "» тебе легче", s: "разница " + (st.stateIns.delta >= 0 ? "+" : "−") + bosAiNumRuLive(Math.abs(st.stateIns.delta)) + " балла · " + (st.stateIns.nWith + st.stateIns.nWithout) + " дней с отметкой состояния", src: "из отметок" });
  // из ответов на «что помешало?»
  try {
    var wm = bosAiWhyStoreLive(pid), counts = {}, totalW = 0;
    for (var k in wm) { if (!wm[k]) continue; counts[wm[k]] = (counts[wm[k]] || 0) + 1; totalW++; }
    var topId = null; for (var r in counts) if (!topId || counts[r] > counts[topId]) topId = r;
    if (topId && counts[topId] >= 2) {
      var lbl = { work: "работа", people: "люди и встречи", tired: "усталость" }[topId] || topId;
      out.push({ id: "barrier", icon: "Ban", t: "Главный барьер — " + lbl, s: counts[topId] + " из " + totalW + " пропусков — «" + (BOS_AI_WHY_REASONS.filter(function (x) { return x.id === topId; })[0] || { t: lbl }).t + "»", src: "из ответов" });
    }
  } catch (e) {}
  // из времени отметок (Э2, копится с этой версии)
  try {
    var mt = JSON.parse(localStorage.getItem("bos:marktimes:" + pid) || "{}"), mins = [];
    for (var dkey in mt) for (var hkey in mt[dkey]) { var v = +mt[dkey][hkey]; if (v >= 0 && v < 1440) mins.push(v); }
    if (mins.length >= 15) {
      var avg = mins.reduce(function (a, b) { return a + b; }, 0) / mins.length;
      var hh = Math.floor(avg / 60), mm2 = Math.round(avg % 60), tstr = hh + ":" + (mm2 < 10 ? "0" : "") + mm2;
      if (avg <= 690) out.push({ id: "lark", icon: "Sun", t: "Ты жаворонок: утро — твоё время", s: "средняя отметка в " + tstr + " · " + mins.length + " отметок", src: "из времени отметок" });
      else if (avg >= 990) out.push({ id: "owl", icon: "Moon", t: "Ты сова: вечер сильнее утра", s: "средняя отметка в " + tstr + " · " + mins.length + " отметок", src: "из времени отметок" });
    }
  } catch (e) {}
  var dis = []; try { dis = JSON.parse(localStorage.getItem("bos:aime:no:" + pid) || "[]"); } catch (e) {}
  return out.filter(function (x) { return dis.indexOf(x.id) < 0; }).slice(0, 3);
}
function bosAiMemoryPctLive(app, st) {
  var pid = (app && app.persistId) || "live", answers = 0, times = 0;
  try { var wm = bosAiWhyStoreLive(pid); for (var k in wm) if (wm[k]) answers++; } catch (e) {}
  try { var mt = JSON.parse(localStorage.getItem("bos:marktimes:" + pid) || "{}"); for (var d in mt) times += Object.keys(mt[d]).length; } catch (e) {}
  var raw = st.daysHist * 2 + st.moodDays + answers * 4 + (times >= 15 ? 5 : 0);
  return Math.max(5, Math.min(90, Math.round(raw / 5) * 5));
}

function AILive() {
  const { navigate } = useNav();
  const app = useApp();
  const { open: openSheet, close: closeSheet } = useSheet();
  const t = useAIT();
  const [ask, setAsk] = useP("");
  const isDarkAI = app.themeOverride === "dark";
  const pid = app.persistId || "live";

  const liveHabits = (app.habits || []).filter((h) => !h.shelved && !h.goalOnly);
  const liveXP = (typeof bosLiveXPLive === "function") ? bosLiveXPLive(app) : 0;
  const lvl = (typeof bosLevelInfoLive === "function") ? bosLevelInfoLive(liveXP) : { level: 1 };
  const isBlank = liveHabits.length === 0;

  // Вся аналитика — один локальный проход; ИИ-ключ не нужен (Э1).
  const st = React.useMemo(() => bosAiStatsLive(app), [app.habits, app.dayMoods]);
  const reading = bosAiReadingLive(st);

  // ЧЕСТНЫЙ НОЛЬ (канон Э1): «сейчас» берём из сегодняшней ОТМЕТКИ, а не из атома-по-умолчанию
  // (тот показывал «Хорошо», даже если человек ничего не отмечал). Не отмечено → серый орб
  // и честное «не отмечено» в кикере.
  const _tkAI = (typeof bosTodayKey === "function") ? bosTodayKey() : "";
  const _bAI = app.dayMoods ? app.dayMoods[_tkAI] : null;
  const _mToday = (_bAI != null && typeof bosStateResolve === "function") ? bosStateResolve(_bAI) : null;
  const moodC = _mToday && _mToday.c;
  const liveTint = (moodC && typeof tintFromMood === "function") ? tintFromMood(moodC) : ["#d9dde4", "#9aa3b2", "#3d4553"];
  const moodName = _mToday ? _mToday.t : "не отмечено";

  // «Что помешало?» — максимум один вопрос, и только если на него ещё не отвечали.
  const why = React.useMemo(() => bosAiWhyPickLive(app), [app.habits]);
  const whyKey = why ? why.yk + "|" + (why.h.cloudId || why.h.id) : null;
  const [whyDone, setWhyDone] = React.useState(false);
  const [whyPicked, setWhyPicked] = React.useState(null);
  const whyAnswered = whyKey ? !!bosAiWhyStoreLive(pid)[whyKey] : false;
  const showWhy = !isBlank && why && !whyAnswered && !whyDone;
  const answerWhy = (rid) => {
    try { var m = bosAiWhyStoreLive(pid); m[whyKey] = rid; localStorage.setItem("bos:why:" + pid, JSON.stringify(m)); } catch (e) {}
    setWhyPicked(rid);
    if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
    window.setTimeout(() => setWhyDone(true), 1500);
  };

  // «Что я уже понял о тебе» + «не про меня»
  const [memTick, setMemTick] = React.useState(0);
  const memory = React.useMemo(() => bosAiMemoryLive(app, st), [st, memTick]);
  const memPct = bosAiMemoryPctLive(app, st);
  const dismissMem = (id) => {
    try { var d = JSON.parse(localStorage.getItem("bos:aime:no:" + pid) || "[]"); if (d.indexOf(id) < 0) d.push(id); localStorage.setItem("bos:aime:no:" + pid, JSON.stringify(d)); } catch (e) {}
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
    setMemTick((x) => x + 1);
  };

  // Общие кирпичики оформления
  const tileCard = { background: "var(--card)", borderRadius: 18, boxShadow: "var(--card-shadow)", padding: "12px 13px", textAlign: "left", border: 0, cursor: "pointer", color: "var(--text)", fontFamily: "inherit" };
  const kStyle = { fontSize: 9.5, color: "var(--text-4)", fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase" };
  const loBar = isDarkAI ? "rgba(255,255,255,0.12)" : "rgba(10,10,10,0.10)";
  const goldInk = isDarkAI ? "#F0C838" : "#C8930A";
  const chipIcon = (name) => <span className="bos-sys-chip-bg" style={{ width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0 }}>{(typeof bosIconEl === "function" && bosIconEl(name, { size: 15, color: "var(--text-2)" })) || "✦"}</span>;
  const tileSheet = (title, value, expl, prompt) => openSheet(
    <div style={{ padding: "2px 20px 10px", color: "var(--text)" }}>
      <div style={{ textAlign: "center", fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--text-4)" }}>{title}</div>
      <div style={{ textAlign: "center", fontSize: 34, fontWeight: 800, letterSpacing: "-1px", marginTop: 8 }}>{value}</div>
      <div style={{ fontSize: 13.5, color: "var(--text-3)", lineHeight: 1.55, marginTop: 10, textAlign: "center", textWrap: "balance" }}>{expl}</div>
      <button className="tap" onClick={() => { try { closeSheet(); } catch (e) {} navigate("ai-chat", { prompt: prompt }); }}
        style={{ display: "block", width: "100%", marginTop: 16, border: 0, cursor: "pointer", borderRadius: 999, padding: 13, fontSize: 15, fontWeight: 700, fontFamily: "inherit", background: isDarkAI ? "#f2f2f5" : "#0a0a0a", color: isDarkAI ? "#0a0a0a" : "#fff" }}>Обсудить с ИИ</button>
    </div>
  );

  // Плитка «Пульс недели»
  const pulseTile = (
    <button key="pulse" className="tap" data-no-haptic style={tileCard}
      onClick={() => st.weekPct != null && tileSheet("Пульс недели", st.weekPct + "%",
        "Доля закрытых привычек с понедельника. " + (st.prevPct != null ? "Прошлая неделя — " + st.prevPct + "%." : "Прошлой недели для сравнения пока нет."),
        "Мой пульс недели " + st.weekPct + "%" + (st.prevPct != null ? " (прошлая " + st.prevPct + "%)" : "") + ". Что подтянуть в первую очередь?")}>
      <div style={kStyle}>Пульс недели</div>
      {st.weekPct != null ? (
        <React.Fragment>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.4px", marginTop: 4 }}>
            {st.weekPct}%{st.prevPct != null && <span style={{ fontSize: 10.5, fontWeight: 800, color: goldInk, verticalAlign: 3, marginLeft: 4 }}>{st.weekPct >= st.prevPct ? "▲" : "▼"} {Math.abs(st.weekPct - st.prevPct)}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 28, marginTop: 7 }}>
            {st.bars.map((b, i) => (
              <span key={i} style={{ flex: 1, borderRadius: 3, height: b == null ? 5 : Math.max(4, Math.round(b * 28)), background: b == null ? loBar : (b >= 0.5 ? "linear-gradient(180deg,#FEDE34,#EF9F14)" : loBar) }} />
            ))}
          </div>
        </React.Fragment>
      ) : (
        <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 6, lineHeight: 1.45 }}>Появится после первых отметок на этой неделе.</div>
      )}
    </button>
  );

  // Плитка «До рекорда»
  const rec = st.record, recNow = st.recordNow;
  const recPct = rec ? Math.max(0.06, Math.min(1, rec.cur / rec.best)) : (recNow ? 1 : 0);
  const RING = 2 * Math.PI * 19;
  const recordTile = (
    <button key="rec" className="tap" data-no-haptic style={tileCard}
      onClick={() => (rec || recNow) && tileSheet("Серия и рекорд",
        rec ? rec.cur + " из " + rec.best : recNow.cur + " дн.",
        rec ? "«" + rec.h.name + "»: серия " + rec.cur + " дн., личный рекорд — " + rec.best + ". До нового рекорда " + rec.left + " дн." : "«" + recNow.h.name + "»: " + recNow.cur + " дн. подряд — это твой личный рекорд прямо сейчас.",
        rec ? "Моя серия «" + rec.h.name + "» " + rec.cur + " дн., рекорд " + rec.best + ". Помоги дотянуть до рекорда." : "У меня рекордная серия «" + recNow.h.name + "» — " + recNow.cur + " дн. Как её удержать?")}>
      <div style={kStyle}>До рекорда</div>
      {rec ? (
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 6 }}>
          <span style={{ position: "relative", width: 44, height: 44, flexShrink: 0, display: "grid", placeItems: "center" }}>
            <svg width="44" height="44" viewBox="0 0 44 44" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
              <circle cx="22" cy="22" r="19" fill="none" stroke={loBar} strokeWidth="4.5" />
              <circle cx="22" cy="22" r="19" fill="none" stroke="url(#bosAiRecRing)" strokeWidth="4.5" strokeLinecap="round" strokeDasharray={RING} strokeDashoffset={RING * (1 - recPct)} />
              <defs><linearGradient id="bosAiRecRing"><stop offset="0" stopColor="#FEDE34" /><stop offset="1" stopColor="#EF9F14" /></linearGradient></defs>
            </svg>
            <b style={{ fontSize: 10.5, fontWeight: 800 }}>{rec.cur}/{rec.best}</b>
          </span>
          <span style={{ fontSize: 10.5, color: "var(--text-4)", lineHeight: 1.4, minWidth: 0 }}>{rec.h.emoji} {rec.h.name}<br /><b style={{ color: "var(--text)", fontSize: 12 }}>{rec.left} дн.</b> до рекорда</span>
        </div>
      ) : recNow ? (
        <React.Fragment>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.4px", marginTop: 4 }}>{recNow.cur} дн. <span style={{ fontSize: 10.5, color: goldInk, verticalAlign: 3 }}>рекорд!</span></div>
          <div style={{ fontSize: 10.5, color: "var(--text-4)", marginTop: 3 }}>{recNow.h.emoji} {recNow.h.name} — сейчас твоя лучшая серия</div>
        </React.Fragment>
      ) : (
        <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 6, lineHeight: 1.45 }}>Держи серию от 5 дней — здесь появится счёт до рекорда.</div>
      )}
    </button>
  );

  // Плитка «Состояние ↔ привычки» (одна золотая линия, без второго пунктира)
  const sIns = st.stateIns;
  const moodLine = React.useMemo(() => {
    var pts = [], dm = app.dayMoods || {};
    for (var off = 13; off >= 0; off--) { var v = dm[bosDayKeyOffset(off)]; pts.push(v == null ? null : +v); }
    var out = [], xstep = 120 / 13;
    for (var i2 = 0; i2 < 14; i2++) if (pts[i2] != null) out.push((i2 * xstep).toFixed(1) + "," + (30 - pts[i2] / 6 * 26).toFixed(1));
    return out.length >= 2 ? out.join(" ") : null;
  }, [app.dayMoods]);
  const stateTile = (
    <button key="state" className="tap" data-no-haptic style={tileCard}
      onClick={() => sIns && tileSheet("Состояние ↔ привычки", (sIns.delta >= 0 ? "+" : "−") + bosAiNumRuLive(Math.abs(sIns.delta)),
        "В дни с «" + sIns.h.name + "» твоё состояние в среднем " + (sIns.delta >= 0 ? "выше" : "ниже") + " на " + bosAiNumRuLive(Math.abs(sIns.delta)) + " балла (по " + (sIns.nWith + sIns.nWithout) + " дням с отметкой состояния).",
        "Заметил, что «" + sIns.h.name + "» связана с моим состоянием (" + (sIns.delta >= 0 ? "+" : "−") + bosAiNumRuLive(Math.abs(sIns.delta)) + " балла). Что с этим делать?")}>
      <div style={kStyle}>Состояние ↔ привычки</div>
      {sIns ? (
        <React.Fragment>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.4px", marginTop: 4 }}>{(sIns.delta >= 0 ? "+" : "−") + bosAiNumRuLive(Math.abs(sIns.delta))}</div>
          {moodLine && <svg viewBox="0 0 120 34" style={{ width: "100%", height: 26, marginTop: 4 }}><polyline points={moodLine} fill="none" stroke="#EF9F14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          <div style={{ fontSize: 10.5, color: "var(--text-4)", marginTop: 3 }}>в дни с {sIns.h.emoji} — {sIns.delta >= 0 ? "заметно выше" : "ниже"}</div>
        </React.Fragment>
      ) : (
        <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 6, lineHeight: 1.45 }}>Отмечай состояние на главной — увижу, какие привычки его поднимают.</div>
      )}
    </button>
  );

  // Плитка «Связка»
  const lk = st.link;
  const linkTile = (
    <button key="link" className="tap" data-no-haptic style={tileCard}
      onClick={() => lk && tileSheet("Связка привычек", "×" + bosAiNumRuLive(lk.lift),
        "В дни с «" + lk.a.name + "» привычка «" + lk.b.name + "» закрыта в " + bosAiNumRuLive(lk.lift) + " раза чаще обычного (за " + lk.n + " общих дней).",
        "У меня связка: «" + lk.a.name + "» тянет «" + lk.b.name + "» (×" + bosAiNumRuLive(lk.lift) + "). Как этим пользоваться?")}>
      <div style={kStyle}>Связка</div>
      {lk ? (
        <React.Fragment>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.3px", marginTop: 5 }}>{lk.a.emoji} → {lk.b.emoji}</div>
          <div style={{ fontSize: 10.5, color: "var(--text-4)", marginTop: 3, lineHeight: 1.4 }}>после «{lk.a.name}» — «{lk.b.name}» <b style={{ color: "var(--text)" }}>×{bosAiNumRuLive(lk.lift)}</b> чаще</div>
          <div style={{ height: 4, borderRadius: 99, background: loBar, marginTop: 8, overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: Math.min(100, Math.round(lk.lift / 3 * 100)) + "%", borderRadius: 99, background: "linear-gradient(90deg,#FEDE34,#EF9F14)" }} /></div>
        </React.Fragment>
      ) : (
        <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 6, lineHeight: 1.45 }}>Ищу пары «одна привычка тянет другую» — нужно ещё немного общих дней.</div>
      )}
    </button>
  );

  return (
    <div className="page-in" style={{ padding: "0 12px 24px" }}>
      <div style={{ padding: "4px 4px 14px" }}>
        <div style={{ fontSize: 12, color: "var(--text-4)", letterSpacing: 0.4 }}>{(app.userName || "").trim() ? "Персонально · для " + app.userName.trim() : "Твой помощник"}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.5px", marginTop: 2 }}>Balance AI</div>
      </div>

      {/* «Чтение дня» — только факт с цифрой (или честный вопрос). Орб — в цвет состояния. */}
      <div data-tour="ai-hero" style={{ background: "var(--card)", borderRadius: 22, padding: "15px 16px", boxShadow: "var(--card-shadow)", display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ flexShrink: 0, width: 64, height: 64, display: "grid", placeItems: "center" }}>
          <PlanetOrb size={64} tint={liveTint} live />

        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, color: "var(--text-4)", fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }}>
            {reading.kick}{moodName ? " · " + moodName : ""}
          </div>
          <div style={{ ...BOS_AI_TEXT, marginTop: 5 }}>{reading.line}</div>
        </div>
      </div>

      {/* БАЛАНС ЖИЗНИ — большое колесо, как было (David: «важный блок, не трогай»). */}
      {typeof BosBalanceWheelLive === "function" && (
        <div style={{ marginTop: 14 }}>
          {!app?.baseline && typeof BosWheelLockedLive === "function"
            ? <BosWheelLockedLive app={app} dark={isDarkAI} openSheet={openSheet} />
            : (!isBlank && <BosBalanceWheelLive app={app} dark={isDarkAI} navigate={navigate} openSheet={openSheet} tint={liveTint} />)}
        </div>
      )}

      {/* ТВОЙ ПУЛЬС — 4 живые плитки, чистая математика по журналу (Э1). Тап → шторка с разбором. */}
      {!isBlank && (
        <React.Fragment>
          <div className="section-label" style={{ marginTop: 18, color: "var(--text-3)", padding: "0 4px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span>Твой пульс</span><span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-4)", textTransform: "none", letterSpacing: 0 }}>обновляется с каждой отметкой</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
            {pulseTile}{recordTile}{stateTile}{linkTile}
          </div>
        </React.Fragment>
      )}

      {/* «Что помешало?» — один вопрос по поводу (вчерашний пропуск), ответ одним тапом (Э2). */}
      {showWhy && (
        <div style={{ background: "var(--card)", borderRadius: 22, padding: "14px 15px", marginTop: 10, boxShadow: "var(--card-shadow)" }}>
          {whyPicked ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {chipIcon("Sparkles")}
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>Понял, учту. Спасибо, что рассказал.</span>
            </div>
          ) : (
            <React.Fragment>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)", lineHeight: 1.4 }}>
                Вчера <span style={{ color: goldInk }}>«{why.h.name}»</span> не закрылась — что помешало?
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                {BOS_AI_WHY_REASONS.map((r) => (
                  <button key={r.id} className="tap" data-no-haptic onClick={() => answerWhy(r.id)}
                    style={{ border: 0, cursor: "pointer", borderRadius: 999, padding: "8px 13px", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", background: isDarkAI ? "rgba(255,255,255,0.08)" : "var(--surface-3)", color: "var(--text)" }}>{r.t}</button>
                ))}
                <button className="tap" data-no-haptic onClick={() => navigate("ai-chat", { prompt: "Вчера не получилось закрыть «" + why.h.name + "» — расскажу, что помешало." })}
                  style={{ border: 0, cursor: "pointer", borderRadius: 999, padding: "8px 13px", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", background: isDarkAI ? "rgba(255,255,255,0.08)" : "var(--surface-3)", color: "var(--text)" }}>Своё…</button>
              </div>
              <div style={{ fontSize: 10.5, color: "var(--text-4)", marginTop: 9 }}>Один тап. Запомню и учту в подсказках.</div>
            </React.Fragment>
          )}
        </div>
      )}

      {/* «Что я уже понял о тебе» — максимум 3 строки, цифра + источник, «не про меня» на каждой. */}
      {!isBlank && (
        <div style={{ background: "var(--card)", borderRadius: 22, padding: "14px 15px", marginTop: 10, boxShadow: "var(--card-shadow)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <b style={{ fontSize: 15.5, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.2px" }}>Что я уже понял о тебе</b>
            <span style={{ fontSize: 10, fontWeight: 800, color: goldInk, background: isDarkAI ? "rgba(240,200,40,0.14)" : "rgba(240,195,10,0.13)", borderRadius: 999, padding: "3px 9px" }}>память {memPct}%</span>
          </div>
          {memory.length ? (
            <React.Fragment>
              {memory.map((m, i) => (
                <div key={m.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "11px 0 0", marginTop: i ? 10 : 2, borderTop: i ? "0.5px solid var(--line)" : "none" }}>
                  {chipIcon(m.icon)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>{m.t}</div>
                    <div style={{ fontSize: 10.5, color: "var(--text-4)", marginTop: 2, lineHeight: 1.4 }}>{m.s}</div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-4)", background: isDarkAI ? "rgba(255,255,255,0.07)" : "var(--surface-2)", borderRadius: 999, padding: "3px 8px", flexShrink: 0 }}>{m.src}</span>
                  <button className="tap" data-no-haptic aria-label="Не про меня" onClick={() => dismissMem(m.id)}
                    style={{ width: 22, height: 22, borderRadius: "50%", border: 0, cursor: "pointer", flexShrink: 0, display: "grid", placeItems: "center", background: "transparent", color: "var(--text-4)", fontSize: 11, fontWeight: 700 }}>✕</button>
                </div>
              ))}
              <div style={{ fontSize: 10.5, color: "var(--text-4)", marginTop: 11, paddingTop: 10, borderTop: "0.5px solid var(--line)" }}>Не про тебя? Жми ✕ — уберу и пересмотрю. Твоё «нет» тоже меня учит.</div>
            </React.Fragment>
          ) : (
            <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 8, lineHeight: 1.5 }}>
              Пока знаю мало — и не буду выдумывать. Отмечай дни, состояние и отвечай на короткие вопросы: здесь появятся наблюдения о тебе, каждое — с цифрой и источником.
            </div>
          )}
        </div>
      )}

      {/* «Спроси что угодно» — вход в разговор. */}
      <div style={{ background: "var(--card)", borderRadius: 22, padding: 10, marginTop: 10, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 2px 0 8px" }}>
          <input value={ask} onChange={e => setAsk(e.target.value)} placeholder="Спросить Balance AI…"
            onKeyDown={e => e.key === "Enter" && navigate("ai-chat", ask.trim() ? { prompt: ask } : {})}
            style={{ flex: 1, border: 0, outline: 0, background: "transparent", color: "var(--text)", fontSize: 14, padding: "8px 4px" }}/>
          <button onClick={() => navigate("ai-chat", ask.trim() ? { prompt: ask } : {})} className="tap hit44" aria-label="Спросить"
            style={{ width: 34, height: 34, borderRadius: "50%", background: isDarkAI ? "#f2f2f5" : "#0a0a0a", border: 0, color: isDarkAI ? "#0a0a0a" : "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <I.Send size={13}/>
          </button>
        </div>
      </div>

      {isBlank ? (
        /* HONEST empty state for a brand-new live user — no fake recommendations. */
        <>
          <button onClick={() => navigate("mood")} className="tap"
            style={{ width: "100%", marginTop: 12, background: "var(--card)", border: 0, borderRadius: 22, padding: 16, boxShadow: "var(--card-shadow)", display: "flex", alignItems: "center", gap: 13, textAlign: "left", color: "var(--text)" }}>
            <span style={{ width: 46, height: 46, borderRadius: 14, background: "linear-gradient(135deg,#e9f1ff,#cfe1ff)", display: "grid", placeItems: "center", flexShrink: 0 }}>{(typeof bosIconEl === "function" && bosIconEl("Smile", { size: 24, color: "#2f4258" })) || "🧭"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600 }}>Отметить состояние</div>
              <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 2, lineHeight: 1.45 }}>Пара секунд — и советы начнут подстраиваться под тебя.</div>
            </div>
            <I.ChevronRight size={18} color="var(--text-4)"/>
          </button>
          <button onClick={() => navigate("ai-chat", { prompt: "Расскажу немного о себе и своих целях" })} className="tap"
            style={{ width: "100%", marginTop: 10, background: "var(--card)", border: 0, borderRadius: 22, padding: 16, boxShadow: "var(--card-shadow)", display: "flex", alignItems: "center", gap: 13, textAlign: "left", color: "var(--text)" }}>
            <span style={{ width: 46, height: 46, borderRadius: 14, background: "var(--surface-3)", display: "grid", placeItems: "center", flexShrink: 0 }}>{(typeof bosIconEl === "function" && bosIconEl("MessageCircle", { size: 23, color: "var(--text-2)" })) || "💬"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600 }}>Рассказать о себе</div>
              <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 2, lineHeight: 1.45 }}>Пара минут — и ИИ узнает твои цели и ритм дня.</div>
            </div>
            <I.ChevronRight size={18} color="var(--text-4)"/>
          </button>
          <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-4)", marginTop: 18, padding: "0 24px", lineHeight: 1.5 }}>
            Подсказки появятся здесь, как только наберётся немного твоих данных.
          </div>
        </>
      ) : null}

      {/* «Скоро в Balance AI» — оставлено КАК БЫЛО (David 2026-07-16: «пока не трогай, подумаем»). */}
      <div className="section-label" style={{ marginTop: 18, color: "var(--text-3)", padding: "0 4px" }}>Скоро в Balance AI</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
        {[
          { i: "📊", icon: "ChartBar", t: "Аналитика", need: 10, d: "Твои закономерности: что качает, а что мешает.", details: [
            ["ChartBar", "Что качает энергию", "Какие привычки реально двигают серию и настроение — по твоим отметкам."],
            ["Target", "Где проседает", "Дни и связки, на которых чаще всего рвётся ритм."],
            ["Group", "Связки привычек", "Что с чем работает в паре — и что стоит переставить."],
          ] },
          { i: "🧠", icon: "Compass", t: "Наставник", need: 15, d: "Личная программа и разбор недели.", details: [
            ["MapPin", "Программа под тебя", "Личный план на неделю из твоих целей и ритма."],
            ["Search", "Разбор недели", "Что получилось, что нет и почему — раз в неделю, честно."],
            ["Bolt", "Челленджи под ритм", "Персональные вызовы там, где тебе по силам расти."],
          ] },
        ].map((f) => {
          const unlocked = lvl.level >= f.need;
          const pct = Math.max(6, Math.min(100, Math.round((lvl.level / f.need) * 100)));
          const chipBg = (typeof BOS_TILE_SHEEN === "string" ? BOS_TILE_SHEEN + ", " : "") + (isDarkAI ? "rgba(255,255,255,0.08)" : "var(--surface-3)");
          const glass = (typeof bosTileGlass === "function") ? bosTileGlass(isDarkAI) : "none";
          const openDetails = () => openSheet(
            <div style={{ padding: "2px 18px 8px", color: "var(--text)" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 14 }}>
                <span style={{ width: 56, height: 56, borderRadius: 18, background: chipBg, boxShadow: glass, display: "grid", placeItems: "center" }}>{(typeof bosIconEl === "function" && bosIconEl(f.icon, { size: 28, color: "var(--text-2)" })) || f.i}</span>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.3px", marginTop: 10 }}>{f.t}</div>
                <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4 }}>{unlocked ? "Готовим к запуску — ты уже открыл" : "Откроется на " + f.need + " уровне · у тебя " + lvl.level + "-й"}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {f.details.map((d, j) => (
                  <div key={j} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 13, borderRadius: 18, background: isDarkAI ? "rgba(255,255,255,0.06)" : "var(--surface-2)" }}>
                    <span style={{ width: 34, height: 34, borderRadius: 11, background: chipBg, boxShadow: glass, display: "grid", placeItems: "center", flexShrink: 0 }}>{(typeof bosIconEl === "function" && bosIconEl(d[0], { size: 17, color: "var(--text-2)" })) || d[0]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 600 }}>{d[1]}</div>
                      <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 2, lineHeight: 1.45 }}>{d[2]}</div>
                    </div>
                  </div>
                ))}
              </div>
              {!unlocked && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ height: 6, borderRadius: 999, background: isDarkAI ? "rgba(255,255,255,0.10)" : "var(--surface-3)", overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", width: pct + "%", background: "linear-gradient(135deg,#FEDE34,#EF9F14)", borderRadius: 999 }} />
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 6, fontWeight: 600, textAlign: "center" }}>Уровень {lvl.level} из {f.need} — каждая отметка приближает</div>
                </div>
              )}
            </div>
          );
          return (
            <button key={f.t} onClick={openDetails} className="tap" style={{ textAlign: "left", border: 0, cursor: "pointer", borderRadius: 22, padding: 15, background: "var(--card)", boxShadow: "var(--card-shadow)", color: "var(--text)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ width: 40, height: 40, borderRadius: 13, background: chipBg, boxShadow: glass, display: "grid", placeItems: "center" }}>{(typeof bosIconEl === "function" && bosIconEl(f.icon, { size: 22, color: "var(--text-2)" })) || f.i}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", background: isDarkAI ? "rgba(255,255,255,0.08)" : "var(--surface-3)", borderRadius: 999, padding: "4px 9px" }}>{unlocked ? <><I.Sparkles size={10} filled strokeWidth={0} style={{ marginRight: 3, verticalAlign: "-1px" }}/>скоро</> : <><I.Lock size={10} strokeWidth={2.4}/> {f.need} ур.</>}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 12, letterSpacing: "-0.2px" }}>{f.t}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 3, lineHeight: 1.4 }}>{f.d}</div>
              <div style={{ marginTop: 11 }}>
                <div style={{ height: 5, borderRadius: 999, background: isDarkAI ? "rgba(255,255,255,0.10)" : "var(--surface-3)", overflow: "hidden" }}>
                  <span style={{ display: "block", height: "100%", width: pct + "%", background: isDarkAI ? "#f2f2f5" : "#0a0a0a", borderRadius: 999 }} />
                </div>
                <div style={{ fontSize: 10.5, color: "var(--text-4)", marginTop: 5, fontWeight: 600 }}>{unlocked ? "Готовим к запуску" : "Уровень " + lvl.level + " / " + f.need + " · подробнее ›"}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

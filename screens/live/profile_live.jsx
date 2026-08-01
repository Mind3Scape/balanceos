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

  // Achievement preview — real earned orbital relics, never generic emoji.
  const _liveAch = bosEarnedAchievementsLive(app).filter((a) => a.earned);
  const _achTotal = BOS_ACHIEVEMENTS_LIVE.length;
  const _achEarnedN = _liveAch.length;
  const _achPreview = _liveAch.slice(-3).reverse();
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
          <OrbitField avatar={app?.avatar} name={app?.userName} habits={_visHabits} people={orbitPeople} levelPct={lvlPct} moodC={app?.mood?.c} dark={app?.themeOverride === "dark"} hideLevelArc editable={false} levelBadge={lvlNum} centerMood={(() => { try { const _tk = (typeof bosTodayKey === "function") ? bosTodayKey() : ""; return (app?.dayMoods && app.dayMoods[_tk] != null && app?.mood?.c) ? app.mood.c : null; } catch (e) { return null; } })()} />
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
            {_achPreview.map((a, i) => <AchievementArtworkLive key={a.id} ach={a} size={27} style={{ marginLeft: i ? -7 : 0, border: "1.5px solid var(--card)", background: "var(--card)", boxShadow: "0 2px 7px rgba(0,0,0,.10)" }} />)}
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

/* ═══════════ «ЧТО Я ЗАМЕТИЛ» — верхний блок вкладки ИИ ═══════════
   David 2026-08-01: «„Чтение дня“ нелогично — это подсказки; „поставить 25 минут“ — что это
   вообще; и не ограничивай ИИ заготовками — пусть сам смотрит контекст человека». Поэтому:
   форму задаём мы (заголовок → на чём основано → что можно сделать → ответы), а СОДЕРЖАНИЕ
   пишет модель по реальным фактам. Заготовки остаются только как честный запасной вариант,
   когда ключа нет или модель молчит — тогда лучше сухая правда, чем пустая карточка. */
var BOS_OBS_SYSTEM =
  "Ты — Balance AI в приложении привычек. Пользователь открыл вкладку ИИ. Напиши 1–3 НАБЛЮДЕНИЯ о нём " +
  "по фактам ниже. Верни СТРОГО JSON-массив без пояснений:\n" +
  '[{"kick":"...","head":"...","body":"...","offer":"...","chips":["...","..."]}]\n' +
  "kick — 1–3 слова, как называется этот разговор («Что я заметил», «Пока только факты», «Знакомимся»).\n" +
  "head — короткая фраза-вывод, которую человек мог бы пересказать другу (до 60 знаков, без точки в конце).\n" +
  "body — 1–2 предложения, ОБЯЗАТЕЛЬНО с цифрой и окном времени из фактов (до 180 знаков).\n" +
  "offer — одно маленькое действие, которое реально умеет приложение: отметить привычку, поменять дни или " +
  "напоминание, добавить привычку в сферу, снизить цель, позвать человека в совместную привычку, отметить " +
  "состояние. Ничего другого приложение не умеет — не выдумывай таймеры, трекеры сна, экспорт и прочее. " +
  "Если предложить нечего — пустая строка.\n" +
  "chips — 2 коротких ответа человека (до 22 знаков), продолжающих разговор.\n" +
  "Правила: по-русски, на «ты», тепло и без пафоса. Никаких выводов без числа — если данных мало, так и скажи. " +
  "Не ставь диагнозов и не обещай результатов. Не повторяй факты дословно — говори по-человечески.";

function bosObsFactsLive(app, st) {
  var out = [];
  try {
    var name = ((app && app.userName) || "").trim(); if (name) out.push("Имя: " + name + ".");
    out.push("Отмеченных дней всего: " + st.daysHist + ". Дней с отметкой состояния: " + st.moodDays + ".");
    out.push("Привычек активных: " + st.habits.length + (st.habits.length ? " (" + st.habits.map(function (h) { return h.name; }).slice(0, 8).join(", ") + ")" : "") + ".");
    out.push("Сегодня закрыто " + st.doneToday + " из " + st.schedToday + ".");
    if (st.weekPct != null) out.push("Эта неделя: " + st.weekPct + "%" + (st.prevPct != null ? ", прошлая: " + st.prevPct + "%" : "") + ".");
    if (st.weekday) out.push("Слабый день недели: " + BOS_AI_DOW_RU[st.weekday.dow] + " — " + st.weekday.rate + "% против " + st.weekday.restAvg + "% в остальные.");
    if (st.record) out.push("До рекорда «" + st.record.h.name + "»: серия " + st.record.cur + ", рекорд " + st.record.best + ", осталось " + st.record.left + " дн.");
    if (st.recordNow) out.push("Сейчас личный рекорд «" + st.recordNow.h.name + "»: " + st.recordNow.cur + " дн.");
    if (st.state) out.push("В дни с «" + st.state.h.name + "» состояние " + (st.state.delta >= 0 ? "выше" : "ниже") + " на " + bosAiNumRuLive(Math.abs(st.state.delta)) + " балла (по " + (st.state.nWith + st.state.nWithout) + " дням).");
    if (st.link) out.push("Связка: в дни с «" + st.link.a.name + "» привычка «" + st.link.b.name + "» закрыта в " + bosAiNumRuLive(st.link.lift) + " раза чаще (за " + st.link.n + " общих дней).");
    var wd = (typeof bosWheelData === "function") ? bosWheelData(app) : null;
    if (wd && wd.spheres) {
      var f = wd.spheres.filter(function (s) { return s.n; });
      if (f.length) {
        var wk = f.reduce(function (a, s) { return s.v < a.v ? s : a; });
        var sg = f.reduce(function (a, s) { return s.v > a.v ? s : a; });
        out.push("Баланс жизни " + wd.overall + " из 100. Сильнее всего «" + sg.l + "» (" + Math.round(sg.v * 100) + "), слабее всех «" + wk.l + "» (" + Math.round(wk.v * 100) + "). Личная норма — 55.");
      }
      var emp = wd.spheres.filter(function (s) { return !s.n; }).map(function (s) { return s.l; });
      if (emp.length) out.push("Пустые сферы (ни одной привычки): " + emp.join(", ") + ".");
    }
    var why = (typeof bosAiWhyPickLive === "function") ? bosAiWhyPickLive(app) : null;
    if (why) out.push("Вчера была запланирована и не закрыта привычка «" + why.h.name + "».");
  } catch (e) {}
  return out.join("\n");
}
/* Запасные наблюдения — считаются локально, без ключа. Ровно та же анатомия. */
function bosObsLocalLive(app, st) {
  var out = [];
  var wd = (typeof bosWheelData === "function") ? bosWheelData(app) : null;
  var filled = wd ? wd.spheres.filter(function (s) { return s.n; }) : [];
  if (st.daysHist < 1) {
    out.push({ kick: "Знакомимся", head: "Пока я о тебе ничего не знаю",
      body: "Наблюдения появятся из отмеченных дней — придумывать за тебя я не буду.",
      offer: "Начни с одной маленькой привычки и отметь сегодняшний день.",
      chips: ["С чего начать?", "Отметить состояние"] });
    return out;
  }
  if (st.daysHist < 7) {
    out.push({ kick: "Пока только факты", head: "Отмеченных дней — " + st.daysHist,
      body: "Закономерности я ищу с седьмого дня: раньше это будет гадание, а не наблюдение. Сегодня закрыто " + st.doneToday + " из " + st.schedToday + ".",
      offer: "", chips: ["Что ты уже видишь?", "Как это работает?"] });
    return out;
  }
  if (st.weekday) out.push({ kick: "Что я заметил", head: bosAiCapLive(BOS_AI_DOW_RU[st.weekday.dow]) + " — твоё слабое звено",
    body: "В этот день закрывается " + st.weekday.rate + "% привычек против " + st.weekday.restAvg + "% в остальные — за 4 недели.",
    offer: "Оставь на этот день одну привычку вместо всех — так ритм не рвётся.",
    chips: ["Почему так выходит?", "Что убрать?"] });
  if (st.state) out.push({ kick: "Что я заметил", head: "«" + st.state.h.name + "» " + (st.state.delta >= 0 ? "поднимает твой день" : "совпадает с тяжёлыми днями"),
    body: "В дни с этой привычкой состояние " + (st.state.delta >= 0 ? "выше" : "ниже") + " на " + bosAiNumRuLive(Math.abs(st.state.delta)) + " балла — по " + (st.state.nWith + st.state.nWithout) + " дням с отметкой.",
    offer: st.state.delta >= 0 ? "Добавь её в те дни недели, где её сейчас нет." : "",
    chips: ["Разобрать подробнее", "Совпадение?"] });
  if (st.link) out.push({ kick: "Что я заметил", head: "«" + st.link.a.name + "» тянет за собой «" + st.link.b.name + "»",
    body: "В дни с первой вторая закрыта в " + bosAiNumRuLive(st.link.lift) + " раза чаще — за " + st.link.n + " общих дней.",
    offer: "Поставь их подряд: напоминание второй сразу после первой.",
    chips: ["Как связать?", "Разобрать подробнее"] });
  if (st.record) out.push({ kick: "Что я заметил", head: "До рекорда «" + st.record.h.name + "» — " + st.record.left + " дн.",
    body: "Серия сейчас " + st.record.cur + " дней, личный рекорд " + st.record.best + ".",
    offer: "Отметь её сегодня — до рекорда останется " + Math.max(0, st.record.left - 1) + ".",
    chips: ["Как удержать серию?", "Что мешало раньше?"] });
  if (!out.length && filled.length) {
    var wk = filled.reduce(function (a, s) { return s.v < a.v ? s : a; });
    out.push({ kick: "Что я заметил", head: "«" + wk.l + "» держится ниже твоей нормы",
      body: "Сфера на " + Math.round(wk.v * 100) + " при норме 55 — по всем твоим отметкам за всё время.",
      offer: "Добавь в неё одну маленькую привычку — сфера начнёт наливаться.",
      chips: ["Что туда добавить?", "Почему просела?"] });
  }
  if (!out.length) out.push({ kick: "Что я заметил", head: "Сферы держатся ровно",
    body: "Ни одна не проседает заметно ниже нормы — за всё время наблюдений это редкость.",
    offer: "", chips: ["Что подтянуть?", "Разбери мою неделю"] });
  return out.slice(0, 3);
}
function bosObsCleanLive(x) {
  if (!x || typeof x !== "object") return null;
  var s = function (v, max) { return ("" + (v == null ? "" : v)).replace(/\s+/g, " ").trim().slice(0, max); };
  var head = s(x.head, 90), body = s(x.body, 260);
  if (!head || !body) return null;
  var letters = (head + body).replace(/[^A-Za-zА-Яа-яЁё]/g, "");
  var cyr = (letters.match(/[А-Яа-яЁё]/g) || []).length;
  if (!letters.length || cyr / letters.length < 0.6) return null;      // не по-русски → не показываем
  var chips = (Array.isArray(x.chips) ? x.chips : []).map(function (c) { return s(typeof c === "string" ? c : c && c.t, 26); }).filter(Boolean).slice(0, 2);
  return { kick: s(x.kick, 26) || "Что я заметил", head: head, body: body, offer: s(x.offer, 180), chips: chips.length ? chips : ["Разобрать подробнее"] };
}
async function bosObsFetchLive(app, st) {
  try {
    if (typeof aiRaw !== "function") return null;
    var facts = bosObsFactsLive(app, st);
    if (!facts) return null;
    var raw = await aiRaw([{ role: "system", content: BOS_OBS_SYSTEM }, { role: "user", content: facts }]);
    if (!raw) return null;
    var m = ("" + raw).match(/\[[\s\S]*\]/);
    if (!m) return null;
    var arr = JSON.parse(m[0]);
    if (!Array.isArray(arr)) return null;
    var out = arr.map(bosObsCleanLive).filter(Boolean).slice(0, 3);
    return out.length ? out : null;
  } catch (e) { return null; }
}

/* Карточка наблюдения. Сразу показывает локальный (честный) вариант, а когда ответит модель —
   молча подменяет его на живой. Ответ модели кэшируется на день: экран не должен просить
   новый текст на каждом входе (и жечь ключ). */
function BosObsCardLive(props) {
  var app = props.app, st = props.st, navigate = props.navigate, dark = !!props.dark, pid = props.pid;
  var dayKey = (typeof bosTodayKey === "function") ? bosTodayKey() : "day";
  var cacheKey = "bos:obs:" + pid + ":" + dayKey, noKey = "bos:obs:no:" + pid;
  var local = React.useMemo(function () { return bosObsLocalLive(app, st); }, [st]);
  var stItems = React.useState(function () {
    try { var c = JSON.parse(localStorage.getItem(cacheKey) || "null"); if (c && c.items && c.items.length) return c.items; } catch (e) {}
    return local;
  });
  var items = stItems[0], setItems = stItems[1];
  var stIdx = React.useState(0); var idx = stIdx[0], setIdx = stIdx[1];
  var stNo = React.useState(function () { try { return JSON.parse(localStorage.getItem(noKey) || "[]"); } catch (e) { return []; } });
  var no = stNo[0], setNo = stNo[1];

  React.useEffect(function () {
    var dead = false;
    try { var c = JSON.parse(localStorage.getItem(cacheKey) || "null"); if (c && c.items && c.items.length) return; } catch (e) {}
    if (st.daysHist < 1) return;                       // пустому дню нечего наблюдать — и модель не зовём
    bosObsFetchLive(app, st).then(function (arr) {
      if (dead || !arr || !arr.length) return;
      try { localStorage.setItem(cacheKey, JSON.stringify({ v: 1, items: arr })); } catch (e) {}
      setItems(arr); setIdx(0);
    });
    return function () { dead = true; };
  }, [cacheKey, st.daysHist]);

  var live = (items || []).filter(function (o) { return no.indexOf(o.head) < 0; });
  if (!live.length) live = local;
  var i = Math.min(idx, live.length - 1), o = live[i] || local[0];
  if (!o) return null;

  var srcBits = ["отмеченных дней " + st.daysHist];
  if (st.habits.length) srcBits.push("привычек " + st.habits.length);
  if (st.moodDays) srcBits.push("отметок состояния " + st.moodDays);

  var ask = function (chip) { navigate("ai-chat", { prompt: "«" + o.head + "» — " + chip }); };
  var skip = function () {
    var nn = no.concat([o.head]);
    try { localStorage.setItem(noKey, JSON.stringify(nn.slice(-40))); } catch (e) {}
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
    setNo(nn); setIdx(0);
  };

  return (
    <div className={"aiobs" + (dark ? " dk" : "")}>
      <div className="aiobs-who">
        {/* Здесь и живёт сфера ИИ (David): она в цвет сегодняшнего состояния — говорит не
            абстрактный значок, а твоя планета. В шапке страницы её больше нет (один факт —
            одно место). */}
        {/* PlanetOrb — React.memo, а это ОБЪЕКТ, не функция: проверять надо на undefined,
            иначе сфера молча не рисуется. */}
        <span className="aiobs-orb">{typeof PlanetOrb !== "undefined" ? <PlanetOrb size={30} tint={props.tint} live /> : null}</span>
        <span className="aiobs-kick">{o.kick}</span>
        {live.length > 1 && <span className="aiobs-cnt">· {i + 1} из {live.length}</span>}
        <span className="aiobs-tm">сегодня</span>
      </div>
      <div className="aiobs-head">{o.head}</div>
      <div className="aiobs-body">{o.body}</div>
      {o.offer ? (
        <div className="aiobs-offer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0, marginTop: 1 }}><path d="M13 4.5 20.5 12 13 19.5v-4.3H4v-6.4h9z" /></svg>
          <span>{o.offer}</span>
        </div>
      ) : null}
      <div className="aiobs-src">Основание: {srcBits.join(" · ")} — только твои данные</div>
      <div className="aiobs-chips">
        {(o.chips || []).map(function (c, j) {
          return <button key={j} className={"aiobs-chip tap" + (j === 0 ? " solid" : "")} data-no-haptic onClick={function () { ask(c); }}>{c}</button>;
        })}
        <button className="aiobs-chip ghost tap" data-no-haptic onClick={skip}>Мимо</button>
      </div>
      <div className="aiobs-after">
        <span className="h">«Мимо» — уберу это наблюдение</span>
        {live.length > 1 && (
          <button className="n tap" data-no-haptic onClick={function () { setIdx((i + 1) % live.length); }}>Ещё наблюдение ›</button>
        )}
      </div>
    </div>
  );
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

  // ЧЕСТНЫЙ НОЛЬ (канон Э1): «сейчас» берём из сегодняшней ОТМЕТКИ, а не из атома-по-умолчанию
  // (тот показывал «Хорошо», даже если человек ничего не отмечал). Не отмечено → серый орб
  // и честное «не отмечено» в кикере.
  const _tkAI = (typeof bosTodayKey === "function") ? bosTodayKey() : "";
  const _bAI = app.dayMoods ? app.dayMoods[_tkAI] : null;
  const _mToday = (_bAI != null && typeof bosStateResolve === "function") ? bosStateResolve(_bAI) : null;
  const moodC = _mToday && _mToday.c;
  const liveTint = (moodC && typeof tintFromMood === "function") ? tintFromMood(moodC) : ["#d9dde4", "#9aa3b2", "#3d4553"];
  const moodName = _mToday ? _mToday.t : "не отмечено";

  return (
    <div className="page-in" style={{ padding: "0 12px 24px" }}>
      {/* Шапка: только имя вкладки. Сфера ИИ переехала в карточку наблюдения — она там и
          «говорит» (David 2026-08-01). */}
      <div style={{ padding: "4px 4px 12px" }}>
        <div style={{ fontSize: 11.5, color: "var(--text-4)", letterSpacing: 0.3 }}>
          {(app.userName || "").trim() ? "Персонально · для " + app.userName.trim() : "Твой помощник"}{moodName ? " · " + moodName : ""}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.5px", marginTop: 1 }}>Balance AI</div>
      </div>

      {/* ═══ БЛОК 1 — ЧТО Я ЗАМЕТИЛ ═══ Здесь говорит сам ИИ: что увидел в твоих данных, что
          предлагает, и чем можно ответить. Всё, что раньше лежало в плитках «Твой пульс»,
          он теперь говорит предложениями (David 2026-08-01: «не пихать кучу мелких виджетов»). */}
      <div data-tour="ai-hero">
        <BosObsCardLive app={app} st={st} navigate={navigate} dark={isDarkAI} pid={pid} tint={liveTint} />
      </div>

      {/* ═══ БЛОК 2 — БАЛАНС ЖИЗНИ ═══ Колесо-лепестки. Рисуем ВСЕГДА, когда база пройдена:
          раньше при нуле привычек карточка исчезала совсем — человек проходил опрос ради
          обещанного «колесо оживёт» и терял его (найдено 2026-07-31). */}
      {typeof BosBalanceWheelLive === "function" && (
        <div style={{ marginTop: 12 }}>
          {!app?.baseline && typeof BosWheelLockedLive === "function"
            ? <BosWheelLockedLive app={app} dark={isDarkAI} openSheet={openSheet} />
            : <BosBalanceWheelLive app={app} dark={isDarkAI} navigate={navigate} openSheet={openSheet} tint={liveTint} />}
        </div>
      )}

      {/* Поле разговора — под обоими блоками (David: «спросить Balance AI вниз, под баланс жизни»). */}
      <div style={{ background: "var(--card)", borderRadius: 22, padding: 10, marginTop: 12, boxShadow: "var(--card-shadow)" }}>
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
    </div>
  );
}

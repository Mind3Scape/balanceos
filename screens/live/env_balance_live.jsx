/* ─────────────────────────────────────────────────────────────────────────────
   БАЛАНС ОКРУЖЕНИЯ — СОСТОЯНИЕ окружения как целого + твоё влияние + петля.
   (David 2026-07-06 переосмысление: суть = не «сеть связей», а ОБЩЕЕ СОСТОЯНИЕ,
   которое вы держите вместе; отметил своё → общий баланс подрос → поддержи другого
   → растёте вместе. Согласовано макетом 2026-07-06-баланс-окружения-состояние.html.)

   ДВЕ части:
   • BosEnvBalanceLive     — БЛОК на стр. ИИ: кольцо-состояние (центр=индекс, люди
     хороводом вокруг, ты питаешь кольцо) + голос ИИ (реципрокность) + «Подробнее →».
   • BosEnvBalanceFullLive — ЭКРАН env-balance: большое кольцо + КОЛЛЕКТИВНОЕ колесо
     баланса по сферам (агрегат привычек всех) + список людей + «чем полезен».

   Живые данные: invitedPeople + myInviter → profilesPublic (level/lvlPct/habits/goals).
   Всё на стандартных атомах приложения (глянцевые диски, стекло, зоны баланса).
   ───────────────────────────────────────────────────────────────────────────── */

var _bosEnvPeopleCache;
var BOS_ENV_SHEEN = "linear-gradient(165deg, rgba(255,255,255,0.55), rgba(255,255,255,0.12) 46%, rgba(255,255,255,0) 72%)";

function bosEnvBond(s) {
  if (!s) return 0.30;
  var lvl = Math.min(s.level || 0, 10), pct = Math.min(Math.max(s.lvlPct || 0, 0), 100);
  var hab = Math.min((s.habits && s.habits.length) || 0, 6), g = Math.min(s.goals || 0, 3);
  return Math.max(0.14, Math.min(1, 0.26 + lvl * 0.045 + (pct / 100) * 0.18 + hab * 0.035 + g * 0.03));
}
function bosEnvWord(v) { return v >= 70 ? "Крепкое" : v >= 55 ? "Живое" : v >= 40 ? "Ровное" : "Тихое"; }
function bosEnvZone(v100) { return (typeof bosZoneColor === "function") ? bosZoneColor(v100 / 100) : (v100 >= 70 ? "#34C759" : v100 >= 52 ? "#FFC400" : "#FF8A3D"); }
function bosEnvPlural(n) { var a = Math.abs(n) % 100, b = a % 10; if (a > 10 && a < 20) return "близких"; if (b === 1) return "близкий"; if (b >= 2 && b <= 4) return "близких"; return "близких"; }

// СВЕЖЕСТЬ: сколько дней человек не отмечался (по last_active). null = данных нет (НЕ врём «давно
// не заходил», пока метки нет — patch_profile_last_active.sql / до первой активности).
function bosEnvStaleDays(lastActive) {
  if (!lastActive) return null;
  var t = new Date(lastActive).getTime();
  if (isNaN(t)) return null;
  var d = (Date.now() - t) / 86400000;
  return d < 0 ? 0 : d;
}
// Кого поддержать (честно): сперва самый ЗАТИХШИЙ по свежести (данные есть и давно ≥3 дней), иначе
// самый просевший по крепости орбиты (bond). reason «quiet» = знаем, что давно молчит; «dip» = просто
// слабая орбита (без ложных слов о «давно не заходил»). Порог свежести намеренно мягкий.
function bosEnvSupportTarget(people) {
  var quiet = people
    .map(function (p) { return { p: p, days: bosEnvStaleDays(p.lastActive) }; })
    .filter(function (x) { return x.days != null && x.days >= 3 && x.p.name; })
    .sort(function (a, b) { return b.days - a.days; })[0];
  if (quiet) return { p: quiet.p, reason: "quiet", days: Math.round(quiet.days) };
  var dip = people.reduce(function (m, n) { return (!m || n.b < m.b) ? n : m; }, null);
  if (dip && dip.b < 0.42 && dip.name) return { p: dip, reason: "dip" };
  return null;
}
// Ближний с предложением помощи (offer) — для тёплой подсказки «{Имя} может помочь: …».
function bosEnvOfferer(people) { return people.filter(function (p) { return p.offer && p.name; })[0] || null; }

// глянцевый СТАНДАРТНЫЙ диск (как во Вселенной) + лицо (мемоджи→эмодзи→инициал→силуэт)
function bosEnvNode(avatar, name, size, dark, youRing) {
  var a = "" + (avatar || "");
  var plate = dark ? "linear-gradient(160deg,#464c58,#30353f)" : "linear-gradient(160deg,#eef1f6,#dadfe7)";
  // «Ты» — не iOS-синий обод (David: «странное синенькое кольцо»), а мягкий СТЕКЛЯННЫЙ обод в палитре:
  // белый внутренний блик + еле-заметный серебристый ореол. Отмечает «меня», но в тон всему стеклу.
  var sh = youRing
    ? (dark ? "0 7px 18px rgba(0,0,0,0.5), inset 0 0 0 1.6px rgba(255,255,255,0.5), 0 0 0 2px rgba(150,160,175,0.32)" : "0 7px 18px rgba(24,34,64,0.18), inset 0 0 0 1.6px rgba(255,255,255,0.95), 0 0 0 2px rgba(150,160,175,0.34), inset 0 1.5px 0.5px rgba(255,255,255,0.9)")
    : (dark ? "0 7px 18px rgba(0,0,0,0.5), inset 0 0.5px 0.5px rgba(255,255,255,0.14), inset 0 0 0 0.7px rgba(255,255,255,0.06)" : "0 7px 18px rgba(24,34,64,0.18), inset 0 1.5px 0.5px rgba(255,255,255,0.92), inset 0 0 0 0.7px rgba(0,0,0,0.05)");
  var base = { width: size, height: size, borderRadius: "50%", flexShrink: 0, boxShadow: sh, display: "grid", placeItems: "center" };
  if (/^m\d+$/.test(a)) return <div style={Object.assign({}, base, { background: "url(./assets/people/" + a + ".png) center/cover no-repeat, " + BOS_ENV_SHEEN + ", " + plate })} />;
  if (a.indexOf("emoji:") === 0) return <div style={Object.assign({}, base, { background: BOS_ENV_SHEEN + ", " + plate, fontSize: Math.round(size * 0.54), lineHeight: 1 })}>{a.slice(6)}</div>;
  var initial = ("" + (name || "")).trim().charAt(0).toUpperCase();
  if (initial) return <div style={Object.assign({}, base, { background: BOS_ENV_SHEEN + ", " + plate, color: dark ? "#cfd5e1" : "#586274", fontWeight: 700, fontSize: Math.round(size * 0.42), fontFamily: "-apple-system, system-ui, sans-serif" })}>{initial}</div>;
  return <div style={Object.assign({}, base, { background: BOS_ENV_SHEEN + ", " + plate })}>{(typeof I !== "undefined" && I.Person) ? <I.Person size={Math.round(size * 0.55)} color={dark ? "#aab1bf" : "#8a92a3"} /> : null}</div>;
}

// КОЛЬЦО-СОСТОЯНИЕ (индекс) — зона баланса, число+слово в центре
function bosEnvRing(index, word, sub, size, dark) {
  var R = size / 2 - 16, sw = Math.max(9, Math.round(size * 0.075)), c = size / 2, C = 2 * Math.PI * R;
  var dash = (index / 100 * C).toFixed(1), col = bosEnvZone(index);
  return (
    <svg width={size} height={size} viewBox={"0 0 " + size + " " + size} style={{ display: "block", overflow: "visible" }}>
      <circle cx={c} cy={c} r={R} fill="none" stroke={dark ? "rgba(255,255,255,0.09)" : "#eef0f3"} strokeWidth={sw} />
      {/* петля-награда: кольцо ЗАПОЛНЯЕТСЯ снизу-вверх при появлении (отметился → выросло) */}
      <circle cx={c} cy={c} r={R} fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" strokeDasharray={C.toFixed(1)} strokeDashoffset={(C - dash).toFixed(1)} transform={"rotate(-90 " + c + " " + c + ")"}>
        <animate attributeName="stroke-dashoffset" from={C.toFixed(1)} to={(C - dash).toFixed(1)} dur="0.95s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.34 0 0.18 1" />
      </circle>
      <text x={c} y={c - size * 0.02} fontSize={Math.round(size * 0.28)} fontWeight="800" textAnchor="middle" fill={dark ? "#f2f2f5" : "#101828"} style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-1.5px" }}>{index}</text>
      <text x={c} y={c + size * 0.095} fontSize={Math.round(size * 0.088)} fontWeight="700" textAnchor="middle" fill={dark ? "#f2f2f5" : "#101828"}>{word}</text>
      {sub ? <text x={c} y={c + size * 0.17} fontSize={Math.round(size * 0.062)} fontWeight="600" letterSpacing="0.8" textAnchor="middle" fill={dark ? "#8e8e93" : "#9f9fa9"}>{sub}</text> : null}
    </svg>
  );
}

// общий загрузчик «моих людей» + их состояние (кэш «пусто=правда»)
function bosEnvUsePeople() {
  var st = React.useState(function () {
    if (Array.isArray(_bosEnvPeopleCache)) return _bosEnvPeopleCache;
    try { var c = JSON.parse(localStorage.getItem("bos:cache:envPeople") || "null"); if (Array.isArray(c)) return c; } catch (e) {}
    return null;
  });
  var people = st[0], setPeople = st[1];
  React.useEffect(function () {
    var on = true;
    try {
      if (!(window.bosCloud && window.bosCloud.enabled && window.bosCloud.enabled())) return;
      Promise.all([
        window.bosCloud.invitedPeople ? window.bosCloud.invitedPeople().catch(function () { return []; }) : Promise.resolve([]),
        window.bosCloud.myInviter ? window.bosCloud.myInviter().catch(function () { return null; }) : Promise.resolve(null),
      ]).then(function (res) {
        if (!on) return;
        var list = Array.isArray(res[0]) ? res[0] : [], inv = res[1];
        var base = [];
        if (inv && inv.id) base.push({ id: inv.id, avatar: inv.avatar, name: inv.username || inv.name || "", inviter: true });
        list.forEach(function (p) { if (p && p.id) base.push({ id: p.id, avatar: p.avatar, name: p.username || p.name || "", mine: true }); });
        if (!base.length) {
          var lp = _bosEnvPeopleCache;
          if (!lp) { try { lp = JSON.parse(localStorage.getItem("bos:cache:envPeople") || "null"); } catch (e) {} }
          if (Array.isArray(lp) && lp.length) return;
          _bosEnvPeopleCache = []; setPeople([]); return;
        }
        var finish = function (stats) {
          if (!on) return; stats = stats || {};
          var out = base.map(function (p) { var s = stats[p.id] || {}; return { id: p.id, avatar: p.avatar, name: p.name, inviter: !!p.inviter, mine: !!p.mine, b: bosEnvBond(s), level: s.level || 0, habits: Array.isArray(s.habits) ? s.habits : [], offer: s.offer || null, lastActive: s.lastActive || null }; });
          _bosEnvPeopleCache = out;
          try { localStorage.setItem("bos:cache:envPeople", JSON.stringify(out)); } catch (e) {}
          setPeople(function (prev) { return JSON.stringify(prev) === JSON.stringify(out) ? prev : out; });
        };
        var ids = base.map(function (p) { return p.id; });
        if (window.bosCloud.profilesPublic && ids.length) window.bosCloud.profilesPublic(ids).then(finish).catch(function () { finish({}); });
        else finish({});
      }).catch(function () {});
    } catch (e) {}
    return function () { on = false; };
  }, []);
  return people;
}

// «Пульс дня» круга: {marked, avg?, faces:[uid]} из серверного агрегата bos_env_pulse.
// Телефон НИКОГДА не получает чужих состояний — только общий тон (и то от ≥3 влившихся).
var _bosEnvPulseCache;
function bosEnvUsePulse(people) {
  var st = React.useState(_bosEnvPulseCache || null);
  var pulse = st[0], setPulse = st[1];
  var ids = Array.isArray(people) ? people.map(function (p) { return p && p.id; }).filter(Boolean).join(",") : "";
  React.useEffect(function () {
    var on = true;
    try {
      if (!(window.bosCloud && window.bosCloud.enabled && window.bosCloud.enabled() && window.bosCloud.envPulse)) return;
      var day = (typeof bosTodayKey === "function") ? bosTodayKey() : null;
      if (!day) return;
      window.bosCloud.envPulse(ids ? ids.split(",") : [], day).then(function (r) {
        if (on && r) { _bosEnvPulseCache = r; setPulse(r); }
      }).catch(function () {});
    } catch (e) {}
    return function () { on = false; };
  }, [ids]);
  return pulse;
}

// подпись под светилом — честная по слоям данных (агрегат → счётчик → только я)
function bosEnvPulseCaption(pulse, total, meIn) {
  var avg = (pulse && pulse.avg != null) ? Number(pulse.avg) : null;
  var marked = (pulse && pulse.marked != null) ? pulse.marked : null;
  if (avg != null) {
    var w = null;
    try { if (typeof bosStateResolve === "function") w = (bosStateResolve(Math.round(avg)) || {}).t; } catch (e) {}
    return { main: (w ? w + " · " : "") + "влились " + marked + " из " + total, sub: "Общий тон дня. По одному состояния не видит никто — даже мы." };
  }
  if (marked != null) {
    if (marked > 0) return { main: "Влились " + marked + " из " + total, sub: "Общий тон появится, когда вольются трое." };
    return { main: "Сегодня ещё никто не влился", sub: meIn ? "Твой тон готов влиться первым." : "Отметь состояние — и вливай свой тон в общий." };
  }
  return { main: meIn ? "Пока это твой тон" : "Отметь состояние — начни общий тон", sub: "Общий появится, когда в круге вольются трое." };
}

// тихая легенда под сценой — только когда в круге ЕСТЬ и влившиеся (ближе к огню), и нет (дальше).
// total = сколько сидит у огня, включая тебя. Без смешения дистанция ничего не «читается».
function bosEnvSceneLegend(pulse, total, meIn) {
  var faces = (pulse && Array.isArray(pulse.faces)) ? pulse.faces : [];
  var near = faces.length + (meIn ? 1 : 0);
  if (near <= 0 || near >= total || total < 2) return null;
  return "Кто ближе к светилу — тот сегодня влился";
}

/* СВЕТИЛО — «круг у огня» (David 2026-07-09): очаг-орб в центре, свои сидят вокруг на РАЗНЫХ
   расстояниях. Влился сегодня → подсел ближе, ярче и крупнее; не влился → сидит дальше в полутени.
   «Я» — всегда ближний нижний (у огня спереди). Углы неравномерные, сцена сплюснута «с угла» и
   тихо дышит (CSS-дрейф) — пентаграммы нет. Каждый тап отвечает: орб → волна тепла по нитям
   («послать тепло»); лицо своего → карточка снизу; своё неотмеченное лицо → шторка состояния.
   При входе, если мой день отмечен, искра летит от меня к огню и вливается (орб делает вдох).
   ПРИВАТНОСТЬ незыблема: чужой ТОН не виден нигде — ни цветом узла, ни в карточке. Показываем
   лишь факт «влился» (у тех, кто сам разрешил), offer и крепость орбиты (публичный pub_orbit). */
function BosEnvSunLive(props) {
  var app = props.app || {};
  var people = Array.isArray(props.people) ? props.people : [];
  var pulse = props.pulse || null;
  var dark = !!props.dark;
  var size = props.size || 320;
  var nav = (typeof useNav === "function") ? useNav() : null;
  var navigate = (nav && nav.navigate) || props.navigate || function () {};
  var sheet = (typeof useSheet === "function") ? useSheet() : null;

  var tk = (typeof bosTodayKey === "function") ? bosTodayKey() : null;
  var myBucket = (tk && app.dayMoods && app.dayMoods[tk] != null) ? app.dayMoods[tk] : null;
  var avg = (pulse && pulse.avg != null) ? Number(pulse.avg) : null;
  var marked = (pulse && pulse.marked != null) ? pulse.marked : null;
  var faces = (pulse && Array.isArray(pulse.faces)) ? pulse.faces : [];
  var meIn = myBucket != null;

  var v = avg != null ? Math.max(0, Math.min(1, avg / 6)) : (myBucket != null ? Math.max(0, Math.min(1, myBucket / 6)) : null);
  var tint = null;
  try { if (v != null && typeof bosStateTintForV === "function") tint = bosStateTintForV(v); } catch (e) {}
  try { if (!tint && typeof tintFromMood === "function") tint = tintFromMood(dark ? "#8b93a3" : "#b7bcc7"); } catch (e2) {}
  var glowC = (tint && tint[1]) || "#b7bcc7";
  // Огонь светится ОБЩИМ тоном, но МЯГКО (David: «не кричать зелёным») — тон приглушён к серебру на 42%.
  var softTint = tint;
  try { if (tint && typeof bosMixHex === "function") { var _neu = dark ? "#8b93a3" : "#c4c9d2"; softTint = tint.map(function (c) { return (c && ("" + c)[0] === "#") ? bosMixHex(c, _neu, 0.42) : c; }); } } catch (e3) {}
  // Нити/волна/искра/светлячки/точки — НЕЙТРАЛЬНОЕ стекло (как связи во Вселенной), БЕЗ тона (David).
  var glintC = dark ? "rgba(232,238,246,0.9)" : "#aeb6c4";
  var fireflyC = dark ? "rgba(226,232,240,0.85)" : "rgba(150,160,175,0.8)";
  var pearlBg = dark ? "radial-gradient(circle at 40% 34%, #ffffff, #aab2c0)" : "radial-gradient(circle at 40% 34%, #ffffff, #d7dce4)";

  // геометрия очага (фикс-координата 320×258): орб чуть выше центра, свои — «подковой» над огнём,
  // «я» всегда внизу-спереди. SQ<1 = вид с угла (как на костёр). Радиус несёт смысл: near/far.
  var W = 320, H = 258, cx = 160, cy = 120, SQ = 0.82, orbPx = 86;
  var jit = function (n) { var s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };
  var P = function (deg, r) { var a = deg * Math.PI / 180; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * SQ]; };

  var shown = people.slice(0, 7);
  var nShown = shown.length;
  var others = shown.map(function (p, i) {
    var inF = faces.indexOf(p.id) >= 0;
    var base = 150 + ((i + 0.5) / Math.max(1, nShown)) * 240;   // подкова 150°→390°, «я» в нижнем окне
    var ang = base + (jit(i + 3) * 22 - 11);                     // неравномерный джиттер → нет звезды
    return { id: p.id, avatar: p.avatar, name: p.name, offer: p.offer, inviter: p.inviter, b: p.b, habits: p.habits,
      you: false, inF: inF, ang: ang, rNear: 62 + jit(i + 7) * 6, rFar: 92 + jit(i + 13) * 8, size: inF ? 32 : 26 };
  });
  var meNode = { id: "__me", avatar: app.avatar, name: app.userName || "Ты", you: true, inF: meIn, ang: 90, rNear: 70, rFar: 70, size: 36 };
  var nodes = [meNode].concat(others);

  // мягкая история появления + интерактив без 60fps-часов (дрейф на CSS, волны — дискретные)
  var stWave = React.useState(0); var wave = stWave[0], setWave = stWave[1];
  var stGlow = React.useState(false); var glowPulse = stGlow[0], setGlow = stGlow[1];
  var stNudge = React.useState(null); var nudgedId = stNudge[0], setNudged = stNudge[1];
  var stSpark = React.useState(false); var sparkOn = stSpark[0], setSpark = stSpark[1];

  React.useEffect(function () {
    if (!meIn) return;
    var timers = [];
    setSpark(true);
    timers.push(setTimeout(function () { setSpark(false); }, 1250));
    timers.push(setTimeout(function () { setWave(function (w) { return w + 1; }); setGlow(true); }, 1000)); // искра долетела → огонь вдохнул
    timers.push(setTimeout(function () { setGlow(false); }, 1650));
    return function () { timers.forEach(clearTimeout); };
  }, []);

  var sendWarmth = function () {
    setWave(function (w) { return w + 1; });
    setGlow(true);
    setTimeout(function () { setGlow(false); }, 620);
    try { if (window.tgHaptic) window.tgHaptic("light"); } catch (e) {}
  };
  var openMe = function () {
    if (meIn) { sendWarmth(); return; }
    try { if (sheet && sheet.open && typeof StateSheetLive === "function") { sheet.open(<StateSheetLive />); return; } } catch (e) {}
    try { navigate("mood"); } catch (e2) {}
  };
  var openPerson = function (p) {
    setNudged(p.id);
    setTimeout(function () { setNudged(function (cur) { return cur === p.id ? null : cur; }); }, 1900);
    try { if (window.tgHaptic) window.tgHaptic("light"); } catch (e) {}
    try { if (sheet && sheet.open && typeof BosEnvPersonCardLive === "function") sheet.open(<BosEnvPersonCardLive person={p} inFaces={p.inF} glowC={glowC} dark={dark} navigate={navigate} close={sheet.close} />); } catch (e2) {}
  };

  var linkCore = dark ? "rgba(214,220,232,0.42)" : "rgba(146,153,167,0.48)";
  var linkShine = "rgba(255,255,255,0.72)";
  var anon = (marked != null) ? Math.max(0, marked - faces.length - (meIn ? 1 : 0)) : 0;
  var Orb = window.StateOrb;
  var driftCls = ["bosSunDriftA", "bosSunDriftB", "bosSunDriftC"];
  var posOf = function (n) { return P(n.ang, n.you ? n.rNear : (n.inF ? n.rNear : n.rFar)); };

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: size, margin: "0 auto", aspectRatio: W + " / " + H }}>
      <style>{
        "@keyframes bosSunDraw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}" +
        "@keyframes bosSunPul{from{stroke-dashoffset:0.2}to{stroke-dashoffset:-1}}" +
        "@keyframes bosSunSurge{0%{stroke-dashoffset:1;opacity:.85}100%{stroke-dashoffset:0;opacity:0}}" +
        "@keyframes bosSunPop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}" +
        "@keyframes bosSunFire{0%,100%{opacity:.24}50%{opacity:.9}}" +
        "@keyframes bosSunInhale{0%{transform:scale(1)}32%{transform:scale(1.06)}100%{transform:scale(1)}}" +
        "@keyframes bosSunDriftA{0%,100%{transform:translate(0,0)}34%{transform:translate(1.6px,-1.3px)}67%{transform:translate(-1.3px,1.2px)}}" +
        "@keyframes bosSunDriftB{0%,100%{transform:translate(0,0)}34%{transform:translate(-1.5px,-0.9px)}67%{transform:translate(1.2px,1.5px)}}" +
        "@keyframes bosSunDriftC{0%,100%{transform:translate(0,0)}50%{transform:translate(1.3px,1.3px)}}"
      }</style>
      <svg viewBox={"0 0 " + W + " " + H} width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
        {nodes.map(function (n, i) {
          var q = posOf(n);
          var dashed = n.you && !meIn;
          return (
            <g key={"ln" + n.id} opacity={n.you ? (meIn ? 0.95 : 0.55) : (n.inF ? 0.85 : 0.6)}>
              <line x1={cx} y1={cy} x2={q[0].toFixed(1)} y2={q[1].toFixed(1)} stroke={linkCore} strokeWidth={(n.inF || n.you) ? 1.3 : 1} strokeLinecap="round" strokeDasharray={dashed ? "2 3" : "none"} />
              {dashed ? null : <line x1={cx} y1={cy} x2={q[0].toFixed(1)} y2={q[1].toFixed(1)} stroke={linkShine} strokeWidth="2.1" pathLength="1" strokeDasharray="0.18 1" style={{ animation: "bosSunPul 3.4s ease-in-out " + (0.4 + i * 0.16).toFixed(2) + "s infinite both, bosSunDraw 0.5s ease " + (0.12 + i * 0.05).toFixed(2) + "s both" }} />}
            </g>
          );
        })}
        {wave > 0 ? (
          <g key={"surge" + wave}>
            {nodes.map(function (n, i) {
              var q = posOf(n);
              return <line key={"sg" + n.id} x1={cx} y1={cy} x2={q[0].toFixed(1)} y2={q[1].toFixed(1)} stroke={glintC} strokeWidth="2.4" strokeLinecap="round" pathLength="1" strokeDasharray="0.3 1" style={{ animation: "bosSunSurge 0.6s ease " + (i * 0.04).toFixed(2) + "s both" }} />;
            })}
          </g>
        ) : null}
        {Array.apply(null, Array(Math.min(anon, 6))).map(function (_x, i) {
          var a = ((i * 63 + 18) % 360) * Math.PI / 180, rr = orbPx / 2 + 12 + (i % 3) * 6;
          return <circle key={"ff" + i} cx={(cx + Math.cos(a) * rr).toFixed(1)} cy={(cy + Math.sin(a) * rr * 0.9).toFixed(1)} r="2.5" fill={fireflyC} style={{ animation: "bosSunFire 2.6s ease-in-out " + (i * 0.45).toFixed(2) + "s infinite" }} />;
        })}
        {(sparkOn && meIn) ? (
          <circle key="spark" r="2.5" fill={glintC} opacity="0">
            <animate attributeName="cx" from={posOf(meNode)[0].toFixed(1)} to={cx} dur="0.85s" begin="0.15s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1" />
            <animate attributeName="cy" from={posOf(meNode)[1].toFixed(1)} to={cy} dur="0.85s" begin="0.15s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1" />
            <animate attributeName="opacity" values="0;0.95;0.95;0" keyTimes="0;0.2;0.85;1" dur="1s" begin="0.15s" fill="freeze" />
            <animate attributeName="r" values="2;3.4;1.4" keyTimes="0;0.7;1" dur="1s" begin="0.15s" fill="freeze" />
          </circle>
        ) : null}
      </svg>

      <div onClick={sendWarmth} className="tap" data-no-haptic style={{ position: "absolute", left: (cx / W * 100) + "%", top: (cy / H * 100) + "%", transform: "translate(-50%,-50%)", cursor: "pointer", pointerEvents: "auto" }}>
        <div key={"orb" + wave} style={{ animation: wave > 0 ? "bosSunInhale 0.7s cubic-bezier(.3,.7,.3,1) both" : undefined }}>
          {Orb ? <Orb size={orbPx} tint={softTint || undefined} intensity={avg != null ? 1.05 : 0.9} />
               : <div style={{ width: orbPx, height: orbPx, borderRadius: "50%", background: "radial-gradient(circle at 42% 36%, " + ((softTint && softTint[0]) || "#e7eaf0") + ", " + ((softTint && softTint[1]) || "#c4c9d2") + ")" }} />}
        </div>
      </div>

      {nodes.map(function (n, i) {
        var q = posOf(n);
        var dx = cx - q[0], dy = cy - q[1], dd = Math.sqrt(dx * dx + dy * dy) || 1;
        var lean = nudgedId === n.id ? 7 : 0;
        var leanT = lean ? " translate(" + (dx / dd * lean).toFixed(1) + "px," + (dy / dd * lean).toFixed(1) + "px)" : "";
        var dim = n.you ? (meIn ? 1 : 0.5) : (n.inF ? 1 : 0.72);
        var hot = glowPulse && (n.inF || n.you);
        return (
          <div key={"nd" + n.id} onClick={function () { if (n.you) openMe(); else openPerson(n); }} className="tap" data-no-haptic
            style={{ position: "absolute", left: (q[0] / W * 100) + "%", top: (q[1] / H * 100) + "%", transform: "translate(-50%,-50%)", pointerEvents: "auto", cursor: "pointer", zIndex: n.you ? 4 : (n.inF ? 3 : 2) }}>
            <div key={"pop" + n.id + (n.inF ? 1 : 0)} style={{ animation: "bosSunPop 0.5s cubic-bezier(.2,1.3,.4,1) " + (0.4 + i * 0.06).toFixed(2) + "s both" }}>
              <div style={{ animation: driftCls[i % 3] + " " + (8 + (i % 4)) + "s ease-in-out " + (-(i * 1.3)).toFixed(1) + "s infinite", opacity: dim, transition: "opacity 0.5s ease" }}>
                <div style={{ position: "relative", transform: (hot ? "scale(1.08)" : "scale(1)") + leanT, transition: "transform 0.35s ease" }}>
                  {bosEnvNode(n.avatar, n.name, n.size, dark, !!n.you && meIn)}
                  {n.inF ? <span style={{ position: "absolute", right: -1, bottom: -1, width: 10, height: 10, borderRadius: "50%", background: pearlBg, boxShadow: "0 0 0 2px var(--card), 0 1px 2px rgba(0,0,0,0.28), inset 0 0.5px 0.5px rgba(255,255,255,0.9)" }} /> : null}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* КАРТОЧКА СВОЕГО — открывается снизу по тапу лица в «круге у огня». Возвращает считываемость
   «кто как», не загромождая сцену. ПРИВАТНОСТЬ: тон человека НЕ показываем. Только факт «влился
   сегодня» (если он в faces), его offer, крепость орбиты (bond) и его активные сферы. */
function BosEnvPersonCardLive(props) {
  var p = props.person || {};
  var inFaces = !!props.inFaces;
  var dark = !!props.dark;
  var glowC = props.glowC || "#b7bcc7";
  var navigate = props.navigate || function () {};
  var close = props.close || function () {};
  var pct = Math.round(Math.max(0, Math.min(1, p.b || 0.3)) * 100);
  var word = bosEnvWord(pct);
  var spheres = [];
  try {
    var seen = {};
    (Array.isArray(p.habits) ? p.habits : []).forEach(function (h) {
      var e = (h && (h.e || h.emoji)) || (typeof h === "string" ? h : null);
      if (e && !seen[e]) { seen[e] = 1; spheres.push(e); }
    });
  } catch (e) {}
  spheres = spheres.slice(0, 6);
  var txt = dark ? "#fff" : "var(--text)";
  var sub = dark ? "rgba(255,255,255,0.55)" : "var(--text-4)";
  var name = p.name || "Близкий";
  var support = function () {
    try { navigate("ai-chat", { prompt: "Как по-доброму поддержать близкого (" + name + "), чтобы вернуть ему тонус?" }); } catch (e) {}
    try { close(); } catch (e2) {}
  };
  return (
    <div style={{ padding: "2px 20px 22px", color: txt }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>{bosEnvNode(p.avatar, name, 72, dark, false)}</div>
      <div style={{ textAlign: "center", fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px" }}>{name}</div>
      {p.inviter ? <div style={{ textAlign: "center", fontSize: 12.5, color: sub, marginTop: 2 }}>позвал тебя</div> : null}
      {inFaces ? (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: txt, background: dark ? "rgba(255,255,255,0.08)" : "rgba(120,130,145,0.10)", border: dark ? "0.5px solid rgba(255,255,255,0.14)" : "0.5px solid rgba(120,130,145,0.28)", borderRadius: 999, padding: "6px 13px" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: dark ? "radial-gradient(circle at 40% 34%, #ffffff, #aab2c0)" : "radial-gradient(circle at 40% 34%, #ffffff, #d7dce4)", boxShadow: "0 1px 2px rgba(0,0,0,0.25), inset 0 0.5px 0.5px rgba(255,255,255,0.9)" }} /> Влился сегодня
          </span>
        </div>
      ) : null}
      {p.offer ? <div style={{ fontSize: 13.5, color: dark ? "rgba(255,255,255,0.78)" : "var(--text-2)", lineHeight: 1.45, textAlign: "center", marginTop: 12 }}>🤝 может помочь: {p.offer}</div> : null}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span style={{ fontSize: 12.5, color: sub }}>Орбита</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: txt }}>{word}</span>
        </div>
        <div style={{ height: 7, borderRadius: 4, background: dark ? "rgba(255,255,255,0.10)" : "var(--surface-3)", overflow: "hidden" }}>
          <i style={{ display: "block", height: "100%", width: pct + "%", borderRadius: 4, background: bosEnvZone(pct) }} />
        </div>
      </div>
      {spheres.length ? (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11.5, color: sub, marginBottom: 7 }}>В ритме держит</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {spheres.map(function (e, i) { return <span key={i} style={{ display: "inline-grid", placeItems: "center", width: 34, height: 34, borderRadius: 10, fontSize: 17, background: dark ? "rgba(255,255,255,0.06)" : "var(--surface-3)" }}>{e}</span>; })}
          </div>
        </div>
      ) : null}
      <button onClick={support} className="tap" style={{ width: "100%", marginTop: 20, background: dark ? "#f2f2f5" : "#101828", color: dark ? "#101828" : "#fff", border: 0, borderRadius: 999, padding: 14, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Поддержать</button>
    </div>
  );
}

// индекс окружения = средняя крепость людей, приподнятая твоим балансом
function bosEnvIndex(people, myLight) {
  if (!people.length) return 0;
  var avg = people.reduce(function (s, p) { return s + p.b; }, 0) / people.length;
  return Math.round((avg * 0.7 + myLight * 0.3) * 100);
}
function bosEnvMyLight(app) {
  var v = 0.6;
  try { if (typeof bosWheelData === "function") { var wd = bosWheelData(app); if (wd && wd.overall != null) v = Math.max(0, Math.min(1, wd.overall / 100)); } } catch (e) {}
  return v;
}

function bosEnvInvite(openSheet, navigate, dark) {
  return function () {
    try { if (typeof ShareAppSheetLive === "function") { openSheet(<ShareAppSheetLive dark={dark} />); return; } } catch (e) {}
    try { navigate("home"); } catch (e2) {}
  };
}

/* ═══════════ БЛОК на странице ИИ — кольцо-состояние ═══════════ */
function BosEnvBalanceLive(props) {
  var app = props.app || {};
  var navigate = props.navigate || function () {};
  var openSheet = props.openSheet || function () {};
  var dark = !!props.dark;
  var hideTitle = !!props.hideTitle; // в переключателе «Жизнь/Окружение» заголовок = пилюля сверху
  var bare = !!props.bare;           // без своей карточки (внутри общей карточки переключателя)
  var wrapStyle = bare ? { padding: "0" } : { background: "var(--card)", borderRadius: 24, boxShadow: "var(--card-shadow)", padding: "16px 16px 14px" };
  var people = bosEnvUsePeople();
  var myLight = bosEnvMyLight(app);
  if (people === null) return null;

  var open = function () { try { navigate("env-balance"); } catch (e) {} };

  // ПУСТОЕ
  if (!people.length) {
    return (
      <div style={wrapStyle}>
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.3px", color: "var(--text)" }}>Баланс окружения</div>
        <div style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.45, marginTop: 4, marginBottom: 14 }}>Состояние, которое вы держите вместе. Пока в нём только ты — позови первого своего.</div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>{bosEnvNode(app.avatar, app.userName || "", 60, dark, true)}</div>
        <button className="tap hit44" onClick={bosEnvInvite(openSheet, navigate, dark)} style={{ display: "block", width: "100%", background: dark ? "#f2f2f5" : "#101828", color: dark ? "#101828" : "#fff", fontSize: 14, fontWeight: 700, border: 0, borderRadius: 999, padding: "12px", cursor: "pointer" }}>＋ Позвать своего</button>
      </div>
    );
  }

  var total = people.length;
  var shown = people.slice(0, 7);
  var pulse = bosEnvUsePulse(people);
  var meIn = false;
  try { var _tkB = (typeof bosTodayKey === "function") ? bosTodayKey() : null; meIn = !!(_tkB && app.dayMoods && app.dayMoods[_tkB] != null); } catch (e) {}
  var cap = bosEnvPulseCaption(pulse, total + 1, meIn);
  var legend = bosEnvSceneLegend(pulse, Math.min(total, 7) + 1, meIn);

  // подсказка ИИ — реципрокность. Приоритет ЧЕСТНО: (1) кто затих/просел → поддержи; (2) кто предлагает
  // помощь (offer) → загляни к нему; (3) иначе — поделись сам. Имена в ИМЕНИТЕЛЬНОМ, глаголы нейтральные.
  var support = bosEnvSupportTarget(shown);
  var offerer = bosEnvOfferer(shown);
  var nudge;
  if (support) {
    var nm = support.p.name;
    var body = support.reason === "quiet"
      ? <span><b>Ты сейчас в балансе — самое время делиться.</b> {nm} — давно тихо, {support.days} дн. без отметок. Загляни, поддержи — и вы снова в ритме.</span>
      : <span><b>Ты сейчас в балансе — самое время делиться.</b> {nm} сейчас в спаде — поддержи, и общий баланс подрастёт. Так вы и растёте вместе.</span>;
    var q = support.reason === "quiet" ? "давно не отмечался" : "сейчас в спаде";
    nudge = { text: body, act: "💬 Поддержать", on: function () { navigate("ai-chat", { prompt: "Как по-доброму поддержать близкого (" + nm + "), который " + q + "?" }); } };
  } else if (offerer) {
    nudge = { text: <span><b>{offerer.name} рядом и может помочь:</b> «{offerer.offer}». Загляни — так добро и ходит по кругу.</span>, act: "Подробнее →", on: function () { try { navigate("env-balance"); } catch (e) {} } };
  } else {
    nudge = { text: <span><b>Окружение держится на тебе.</b> Поделись, чем ты силён — кому-то это сейчас нужно, и вы вырастете вместе.</span>, act: "＋ Чем могу быть полезен", on: function () { try { navigate("env-balance"); } catch (e) {} } };
  }

  return (
    <div style={wrapStyle}>
      {hideTitle ? null : (
      <button onClick={open} className="tap" data-no-haptic style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "transparent", border: 0, padding: 0, cursor: "pointer", textAlign: "left" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.3px", color: "var(--text)" }}>Баланс окружения</div>
          <div style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.45, marginTop: 3 }}>Состояние, которое вы держите вместе.</div>
        </div>
      </button>
      )}

      {/* светило — «круг у огня» (BosEnvSunLive) */}
      <div style={{ margin: (hideTitle ? "2px" : "6px") + " 0 2px" }}>
        <BosEnvSunLive app={app} people={people} pulse={pulse} dark={dark} size={320} />
        <div style={{ textAlign: "center", marginTop: 2 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{cap.main}</div>
          <div style={{ fontSize: 11.5, color: "var(--text-5)", lineHeight: 1.4, marginTop: 2 }}>{cap.sub}</div>
          {legend ? <div style={{ fontSize: 11, color: "var(--text-5)", lineHeight: 1.35, marginTop: 4, opacity: 0.85 }}>{legend}</div> : null}
        </div>
      </div>

      {/* «Подробнее» — тихой полноширинной кнопкой ПОД подписью/легендой (David: опустить вниз) */}
      <button onClick={open} className="tap" data-no-haptic style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, width: "100%", marginTop: 12, background: dark ? "rgba(255,255,255,0.06)" : "var(--surface-3)", color: "var(--text-3)", border: 0, borderRadius: 14, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Подробнее о балансе окружения {typeof I !== "undefined" && I.ChevronRight ? <I.ChevronRight size={15} /> : "›"}</button>

      {/* голос ИИ — реципрокность */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 14, padding: "12px 13px", borderRadius: 16, border: dark ? "0.5px solid rgba(255,255,255,0.08)" : "0.5px solid #e7ebf2", background: dark ? "rgba(255,255,255,0.04)" : "linear-gradient(180deg,#f7f9fc,#f2f5fa)" }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", background: "radial-gradient(circle at 38% 32%,#eaf2ff,#a9c6ee 70%,#5d7fae)", boxShadow: "0 2px 6px rgba(93,127,174,0.4)" }}>
          {typeof I !== "undefined" && I.Sparkles ? <I.Sparkles size={13} color="#fff" filled /> : <span style={{ color: "#fff", fontSize: 12 }}>✦</span>}
        </div>
        <div style={{ fontSize: 12.7, lineHeight: 1.5, color: "var(--text-2)" }}>
          {nudge.text}
          <div><button className="tap" onClick={nudge.on} style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, borderRadius: 999, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", border: 0, background: "#101828", color: "#fff" }}>{nudge.act}</button></div>
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: "var(--text-5)", lineHeight: 1.5, textAlign: "center", margin: "12px 8px 2px", fontStyle: "italic" }}>Отметил своё состояние — общий баланс окружения подрос.</div>
    </div>
  );
}

/* ═══════════ ЭКРАН env-balance — подробный ═══════════ */
// коллективное колесо баланса: доля окружения, вкладывающегося в каждую сферу
function bosEnvWheelData(people, app) {
  var per = {}; if (typeof BOS_SPHERES === "undefined") return [];
  BOS_SPHERES.forEach(function (s) { per[s.id] = 0; });
  var members = people.slice();
  var myHab = (app && app.habits || []).filter(function (h) { return h && !h.shelved && !h.goalOnly; }).map(function (h) { return { e: h.emoji }; });
  members.push({ habits: myHab });
  var total = members.length || 1;
  members.forEach(function (m) {
    var seen = {};
    (m.habits || []).forEach(function (h) {
      var id = (typeof bosSphereFor === "function") ? bosSphereFor({ emoji: (h.e || h.emoji || "✨"), name: "" }) : "body";
      if (!seen[id]) { seen[id] = 1; per[id] = (per[id] || 0) + 1; }
    });
  });
  return BOS_SPHERES.map(function (s) { return { id: s.id, e: s.e, l: s.l, v: Math.max(0.06, Math.min(1, per[s.id] / total)) }; });
}

function BosEnvBalanceFullLive() {
  var nav = (typeof useNav === "function") ? useNav() : { navigate: function () {} };
  var navigate = nav.navigate;
  var app = (typeof useApp === "function") ? useApp() : {};
  var sheet = (typeof useSheet === "function") ? useSheet() : { open: function () {} };
  var openSheet = sheet.open;
  var dark = app.themeOverride === "dark";
  var people = bosEnvUsePeople();
  var myLight = bosEnvMyLight(app);

  // «Чем могу быть полезен» (offer) — моё предложение помощи, которое видит круг. Прелоад из
  // localStorage (мгновенно + graceful до колонки); пишем в localStorage на ввод и в облако на blur.
  var offerSt = React.useState(function () { try { return localStorage.getItem("bos:myOffer") || ""; } catch (e) { return ""; } });
  var myOffer = offerSt[0], setMyOffer = offerSt[1];
  var onOfferChange = function (e) { var v = (e.target.value || "").slice(0, 200); setMyOffer(v); try { localStorage.setItem("bos:myOffer", v); } catch (er) {} };
  var onOfferBlur = function (e) { var v = (e.target.value || "").trim().slice(0, 200); try { localStorage.setItem("bos:myOffer", v); } catch (er) {} try { if (window.bosCloud && window.bosCloud.enabled && window.bosCloud.enabled() && window.bosCloud.saveOffer) window.bosCloud.saveOffer(v); } catch (er2) {} };

  var list = Array.isArray(people) ? people : [];
  var total = list.length;
  var pulse = bosEnvUsePulse(list);
  var meInF = false;
  try { var _tkF = (typeof bosTodayKey === "function") ? bosTodayKey() : null; meInF = !!(_tkF && app.dayMoods && app.dayMoods[_tkF] != null); } catch (e) {}
  var cap = bosEnvPulseCaption(pulse, total + 1, meInF);
  var legendF = bosEnvSceneLegend(pulse, Math.min(total, 7) + 1, meInF);

  // «Показывать меня в круге» — гибрид A+B: точка у лица (факт вливания), сам тон не виден никому.
  var pfSt = React.useState(function () { try { return localStorage.getItem("bos:pulseFaces") === "1"; } catch (e) { return false; } });
  var pulseFaces = pfSt[0], setPulseFaces = pfSt[1];
  var togglePulseFaces = function () {
    var on = !pulseFaces;
    setPulseFaces(on);
    try { localStorage.setItem("bos:pulseFaces", on ? "1" : "0"); } catch (e) {}
    try {
      var tk3 = (typeof bosTodayKey === "function") ? bosTodayKey() : null;
      var b3 = (tk3 && app.dayMoods) ? app.dayMoods[tk3] : null;
      if (b3 != null && window.bosCloud && window.bosCloud.enabled && window.bosCloud.enabled() && window.bosCloud.savePulse) window.bosCloud.savePulse(tk3, b3, on);
    } catch (e2) {}
  };
  var SPH = bosEnvWheelData(list, app);
  var lowSphere = SPH.slice().sort(function (a, b) { return a.v - b.v; })[0];

  var S = 210, c = S / 2, R = 74, N = SPH.length, TAU = Math.PI * 2;
  var ang = function (i) { return i / N * TAU - Math.PI / 2; };
  var pol = function (a, r) { return [c + Math.cos(a) * r, c + Math.sin(a) * r]; };
  var pt = function (i, v, rad) { return pol(ang(i), (rad == null ? R : rad) * v); };
  var poly = ""; for (var i = 0; i < N; i++) { var p = pt(i, Math.max(SPH[i].v, 0.05)); poly += (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1) + " "; } poly += "Z";
  var grid = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)";

  return (
    <div className="page-in" style={{ padding: "0 16px 28px" }}>
      {typeof PageHeader === "function" ? <PageHeader onBack={function () { navigate("ai"); }} title="Баланс окружения" /> : null}

      {/* герой: светило — общий тон круга (гибрид A+B) */}
      <div style={{ background: "var(--card)", borderRadius: 24, boxShadow: "var(--card-shadow)", padding: "18px 16px 15px" }}>
        <BosEnvSunLive app={app} people={list} pulse={pulse} dark={dark} size={340} />
        <div style={{ textAlign: "center", marginTop: 4 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{cap.main}</div>
          <div style={{ fontSize: 12, color: "var(--text-4)", lineHeight: 1.45, marginTop: 3, maxWidth: 300, marginLeft: "auto", marginRight: "auto" }}>{cap.sub}</div>
          {legendF ? <div style={{ fontSize: 11.5, color: "var(--text-5)", lineHeight: 1.35, marginTop: 5, opacity: 0.85 }}>{legendF}</div> : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, padding: "11px 13px", borderRadius: 14, background: "var(--surface-3)" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>Показывать меня в круге</div>
            <div style={{ fontSize: 11, color: "var(--text-5)", lineHeight: 1.35, marginTop: 2 }}>Точка у лица скажет своим, что ты сегодня влился. Сам тон не видит никто.</div>
          </div>
          {typeof Switch === "function" ? <Switch on={pulseFaces} onChange={togglePulseFaces} dark={dark} /> : null}
        </div>
      </div>

      {/* коллективное колесо баланса по сферам */}
      {total > 0 && (
        <div style={{ background: "var(--card)", borderRadius: 24, boxShadow: "var(--card-shadow)", padding: "16px 16px 14px", marginTop: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.2px", color: "var(--text)" }}>Где окружение сильно</div>
          <div style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.45, marginTop: 3 }}>По сферам жизни твоих близких — что держат вместе, а что просело.</div>
          <div style={{ display: "flex", justifyContent: "center", padding: "6px 0 2px" }}>
            <svg width={S} height={S} viewBox={"0 0 " + S + " " + S} style={{ overflow: "visible" }}>
              <defs><radialGradient id="envw" cx="50%" cy="46%" r="60%"><stop offset="0%" stopColor="#7EA8FF" stopOpacity="0.4" /><stop offset="100%" stopColor="#4d6f9e" stopOpacity="0.1" /></radialGradient></defs>
              {SPH.map(function (s, i) { var e = pt(i, 1); return <line key={"sp" + i} x1={c} y1={c} x2={e[0].toFixed(1)} y2={e[1].toFixed(1)} stroke={grid} strokeWidth="1" />; })}
              <circle cx={c} cy={c} r={R} fill="none" stroke={grid} strokeWidth="1" />
              <path d={poly} fill="url(#envw)" stroke="#5d7fae" strokeWidth="1.8" strokeLinejoin="round" />
              {SPH.map(function (s, i) { var q = pt(i, Math.max(s.v, 0.05)); return <circle key={"d" + i} cx={q[0].toFixed(1)} cy={q[1].toFixed(1)} r="2.6" fill={bosEnvZone(s.v * 100)} stroke={dark ? "#1c1c1e" : "#fff"} strokeWidth="1.2" />; })}
              {SPH.map(function (s, i) { var t2 = pol(ang(i), R + 18); return <text key={"e" + i} x={t2[0].toFixed(1)} y={t2[1].toFixed(1)} fontSize="15" textAnchor="middle" dominantBaseline="central">{s.e}</text>; })}
            </svg>
          </div>
          {lowSphere ? <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.5, textAlign: "center", marginTop: 6 }}>Слабее всего — <b style={{ color: "var(--text)" }}>{lowSphere.e} {lowSphere.l}</b>. Тут окружение можно поддержать вместе.</div> : null}
        </div>
      )}

      {/* люди окружения — с их состоянием */}
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", color: "var(--text-4)", padding: "0 4px 3px" }}>Твои близкие · {total}</div>
        <div style={{ fontSize: 11.5, color: "var(--text-5)", lineHeight: 1.4, padding: "0 4px 8px" }}>Полоска — насколько живёт их орбита{list.some(function (p) { var d = bosEnvStaleDays(p.lastActive); return d != null && d >= 3; }) ? "; 🌙 — кто затих" : ""}. Слабее сверху.</div>
        <div style={{ background: "var(--card)", borderRadius: 20, boxShadow: "var(--card-shadow)", overflow: "hidden" }}>
          {list.slice().sort(function (a, b) { return a.b - b.b; }).map(function (p, i, arr) {
            var pct = Math.round(p.b * 100);
            // Честная мета под полоской: если реально давно молчит (есть свежесть) → «давно тихо»;
            // иначе, если предлагает помощь → его offer. Без данных свежести — ничего не выдумываем.
            var staleDays = bosEnvStaleDays(p.lastActive);
            var quiet = staleDays != null && staleDays >= 3;
            var meta = quiet ? ("🌙 давно тихо · " + Math.round(staleDays) + " дн.") : (p.offer ? ("🤝 " + p.offer) : null);
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", borderBottom: i < arr.length - 1 ? "0.5px solid var(--line)" : "none" }}>
                {bosEnvNode(p.avatar, p.name, 38, dark, false)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name || "Близкий"}{p.inviter ? <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-5)" }}>  · позвал тебя</span> : null}</div>
                  <div style={{ height: 5, borderRadius: 3, background: "var(--surface-3)", marginTop: 5, overflow: "hidden" }}><i style={{ display: "block", height: "100%", width: pct + "%", borderRadius: 3, background: bosEnvZone(pct) }} /></div>
                  {meta ? <div style={{ fontSize: 11, color: quiet ? "var(--text-5)" : "var(--text-4)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.3 }}>{meta}</div> : null}
                </div>
                <button className="tap" onClick={function () { navigate("ai-chat", { prompt: "Как поддержать близкого (" + (p.name || "друга") + "), чтобы вернуть ему тонус?" }); }} style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, color: "var(--text-2)", background: "var(--surface-3)", border: 0, borderRadius: 999, padding: "6px 12px", cursor: "pointer" }}>Поддержать</button>
              </div>
            );
          })}
        </div>
      </div>

      {/* чем могу быть полезен + пригласить */}
      <div style={{ background: "var(--card)", borderRadius: 20, boxShadow: "var(--card-shadow)", padding: "15px 15px", marginTop: 12 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text)" }}>Расти вместе</div>
        <div style={{ fontSize: 12.7, color: "var(--text-3)", lineHeight: 1.5, marginTop: 4 }}>Ты в балансе — самое время нести добро. Поделись, чем ты силён, и позови ещё близких: чем крепче каждый, тем выше общий баланс.</div>
        {/* «Чем могу быть полезен» — короткое предложение помощи, которое увидят твои близкие. */}
        <div style={{ marginTop: 13 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Чем ты можешь быть полезен</div>
          <input value={myOffer} onChange={onOfferChange} onBlur={onOfferBlur} maxLength={200}
            placeholder="Напр.: помогу с английским · выслушаю · подскажу по спорту"
            style={{ width: "100%", boxSizing: "border-box", border: 0, outline: 0, background: "var(--surface-3)", borderRadius: 12, padding: "11px 13px", fontSize: 14, color: "var(--text)", fontFamily: "inherit" }} />
          <div style={{ fontSize: 11, color: "var(--text-5)", lineHeight: 1.4, marginTop: 6 }}>Увидят твои близкие в «Балансе окружения» — и заглянут, когда нужно.</div>
        </div>
        <button className="tap hit44" onClick={bosEnvInvite(openSheet, navigate, dark)} style={{ display: "block", width: "100%", marginTop: 14, background: dark ? "#f2f2f5" : "#101828", color: dark ? "#101828" : "#fff", fontSize: 14, fontWeight: 700, border: 0, borderRadius: 999, padding: "12px", cursor: "pointer" }}>＋ Позвать своего</button>
      </div>

      <div style={{ fontSize: 11.5, color: "var(--text-5)", lineHeight: 1.5, textAlign: "center", margin: "16px 8px 2px", fontStyle: "italic" }}>Ты сам создаёшь окружение — как только сам в балансе.</div>
    </div>
  );
}

/* ═══════════ БАЛАНС КРУГА — та же аналитика, но В РАМКАХ ЦЕЛИ ═══════════
   Тот же язык, что «Баланс окружения», но скоупнут на участников совместной цели:
   кольцо-состояние круга (средний темп по цели) + темп каждого + поддержи отстающего.
   Самодостаточный: TeamDetailLive кормит members [{id,name,avatar,you,pace 0..1}] +
   fallbackProgress (прогресс цели, если у цели нет дневных привычек). Только участники. */
function BosCircleBalanceLive(props) {
  var members = Array.isArray(props.members) ? props.members : [];
  var dark = !!props.dark;
  var navigate = props.navigate || function () {};
  var bare = !!props.bare; // внутри аккордеона цели: без своей карточки и без заголовка (его даёт секция)
  if (members.length < 2) return null;

  var paces = members.map(function (m) { return typeof m.pace === "number" ? Math.max(0, Math.min(1, m.pace)) : 0; });
  var avg = paces.reduce(function (s, v) { return s + v; }, 0) / (paces.length || 1);
  var anyPace = paces.some(function (v) { return v > 0; });
  var index = Math.round((anyPace ? avg : (props.fallbackProgress || 0)) * 100);
  var word = bosEnvWord(index);
  var total = members.length;

  var others = members.filter(function (m) { return !m.you; });
  var lag = others.reduce(function (m, n) { return (!m || (n.pace || 0) < (m.pace || 0)) ? n : m; }, null);
  var nudge = null;
  if (lag && (lag.pace || 0) < 0.4 && lag.name) {
    var lnm = lag.name;
    nudge = { text: <span><b>{lnm} сейчас отстаёт по цели.</b> Поддержи — и круг подтянется вместе.</span>, on: function () { navigate("ai-chat", { prompt: "Как по-доброму поддержать участника круга (" + lnm + "), который отстаёт по общей цели?" }); } };
  }

  var ordered = members.slice().sort(function (a, b) { return (a.pace || 0) - (b.pace || 0); });

  return (
    <div style={bare ? { padding: "2px 0 4px" } : { background: "var(--card)", borderRadius: 24, boxShadow: "var(--card-shadow)", padding: "16px 16px 14px", marginBottom: 12 }}>
      {!bare && <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.3px", color: "var(--text)" }}>Баланс круга</div>}
      {!bare && <div style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.45, marginTop: 3 }}>Как круг держит цель — темп каждого. Видно только участникам.</div>}

      <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 2px" }}>{bosEnvRing(index, word, total + " В КРУГЕ", 152, dark)}</div>

      <div style={{ marginTop: 8 }}>
        {ordered.map(function (m, i) {
          var pct = Math.round((m.pace || 0) * 100);
          return (
            <div key={m.id || i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 2px" }}>
              {bosEnvNode(m.avatar, m.name, 34, dark, !!m.you)}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.you ? "Ты" : (m.name || "Участник")}</div>
                <div style={{ height: 5, borderRadius: 3, background: "var(--surface-3)", marginTop: 5, overflow: "hidden" }}><i style={{ display: "block", height: "100%", width: Math.max(4, pct) + "%", borderRadius: 3, background: bosEnvZone(pct) }} /></div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", minWidth: 34, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{pct}%</div>
            </div>
          );
        })}
      </div>

      {nudge ? (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 10, padding: "12px 13px", borderRadius: 16, border: dark ? "0.5px solid rgba(255,255,255,0.08)" : "0.5px solid #e7ebf2", background: dark ? "rgba(255,255,255,0.04)" : "linear-gradient(180deg,#f7f9fc,#f2f5fa)" }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", background: "radial-gradient(circle at 38% 32%,#eaf2ff,#a9c6ee 70%,#5d7fae)", boxShadow: "0 2px 6px rgba(93,127,174,0.4)" }}>
            {typeof I !== "undefined" && I.Sparkles ? <I.Sparkles size={13} color="#fff" filled /> : <span style={{ color: "#fff", fontSize: 12 }}>✦</span>}
          </div>
          <div style={{ fontSize: 12.7, lineHeight: 1.5, color: "var(--text-2)" }}>
            {nudge.text}
            <div><button className="tap" onClick={nudge.on} style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, borderRadius: 999, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", border: 0, background: "#101828", color: "#fff" }}>Написать</button></div>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "var(--text-4)", textAlign: "center", marginTop: 6, fontStyle: "italic" }}>Круг держит ритм — так цель и берётся вместе.</div>
      )}
    </div>
  );
}

/* ═══════════ ПЕРЕКЛЮЧАТЕЛЬ «Баланс жизни ↔ Баланс окружения» (стр. ИИ) ═══════════
   David: объединить оба баланса в стеклянные пилюли-переключатель наверху, контент — под ним
   (заголовок = пилюля, внутренние заголовки скрыты через hideTitle). Выбор запоминается. */
function BosBalanceTabsLive(props) {
  var app = props.app, dark = !!props.dark, navigate = props.navigate, openSheet = props.openSheet, tint = props.tint;
  var st = React.useState(function () { try { return localStorage.getItem("bos:balTab") === "env" ? "env" : "life"; } catch (e) { return "life"; } });
  var tab = st[0], setTab = st[1];
  var pick = function (v) { setTab(v); try { localStorage.setItem("bos:balTab", v); } catch (e) {} };

  var pill = function (v, label) {
    var on = tab === v;
    return (
      <button onClick={function () { pick(v); }} className="tap" data-no-haptic aria-pressed={on} style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", border: 0, cursor: "pointer", whiteSpace: "nowrap",
        borderRadius: 999, padding: "9px 6px", fontSize: 12.5, fontWeight: 700, letterSpacing: "-0.3px",
        color: on ? "var(--text)" : "var(--text-4)",
        background: on ? (dark ? "rgba(255,255,255,0.15)" : "#fff") : "transparent",
        boxShadow: on ? (dark ? "0 1px 3px rgba(0,0,0,0.4)" : "0 1px 3px rgba(0,0,0,0.12), inset 0 0 0 0.5px rgba(0,0,0,0.04)") : "none",
        transition: "color .18s, background .18s, box-shadow .18s"
      }}><span>{label}</span></button>
    );
  };

  return (
    <div style={{ background: "var(--card)", borderRadius: 24, boxShadow: "var(--card-shadow)", padding: "12px 14px 14px" }}>
      {/* стеклянный сегмент-переключатель (две пилюли) — ЧАСТЬ карточки, наверху */}
      <div style={{ display: "flex", gap: 4, padding: 4, borderRadius: 999, background: dark ? "rgba(255,255,255,0.06)" : "var(--surface-3)", boxShadow: dark ? "none" : "inset 0 0 0 0.5px rgba(0,0,0,0.05)" }}>
        {pill("life", "Баланс жизни")}
        {pill("env", "Баланс окружения")}
      </div>
      <div style={{ marginTop: 6 }}>
        {tab === "life"
          ? (typeof BosBalanceWheelLive === "function" ? <BosBalanceWheelLive app={app} dark={dark} navigate={navigate} openSheet={openSheet} tint={tint} hideTitle={true} bare={true} /> : null)
          : <BosEnvBalanceLive app={app} dark={dark} navigate={navigate} openSheet={openSheet} tint={tint} hideTitle={true} bare={true} />}
      </div>
    </div>
  );
}

/* ═══════════ ВИДЖЕТ ГЛАВНОЙ — «Баланс окружения» компактной строкой ═══════════
   Мини-светило общего тона + честная подпись + точки «влились k из n». Тап → env-balance.
   ВЫКЛ по умолчанию (включается из галереи «+»), чтобы главная не перегружалась. */
function EnvPulseWidgetLive(props) {
  var navigate = props.navigate || function () {};
  var app = (typeof useApp === "function") ? useApp() : {};
  var dark = !!props.isDark;
  var people = bosEnvUsePeople() || [];
  var pulse = bosEnvUsePulse(people);
  var tk = (typeof bosTodayKey === "function") ? bosTodayKey() : null;
  var meIn = !!(tk && app.dayMoods && app.dayMoods[tk] != null);
  var total = people.length + 1;
  var cap = bosEnvPulseCaption(pulse, total, meIn);
  var avg = (pulse && pulse.avg != null) ? Number(pulse.avg) : null;
  var v = avg != null ? Math.max(0, Math.min(1, avg / 6)) : (meIn ? Math.max(0, Math.min(1, app.dayMoods[tk] / 6)) : null);
  var tint = null;
  try {
    if (v != null && typeof bosStateTintForV === "function") tint = bosStateTintForV(v);
    else if (typeof tintFromMood === "function") tint = tintFromMood(dark ? "#8b93a3" : "#b7bcc7");
  } catch (e) {}
  var Orb = window.StateOrb;
  var marked = pulse ? (pulse.marked || 0) : (meIn ? 1 : 0);
  var dots = [];
  for (var i = 0; i < Math.min(total, 7); i++) dots.push(i < marked);
  return (
    <button className="tap" onClick={function () { navigate("env-balance"); }}
      style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", background: "var(--card)", border: 0, borderRadius: 0, boxShadow: "none", padding: "13px 15px", cursor: "pointer" }}>
      <span style={{ width: 46, height: 46, flexShrink: 0, display: "grid", placeItems: "center" }}>
        {Orb ? <Orb size={46} tint={tint || undefined} intensity={0.95} /> : <span style={{ width: 34, height: 34, borderRadius: "50%", background: (tint && tint[1]) || "#b7bcc7" }} />}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.2px" }}>Баланс окружения</span>
        <span style={{ display: "block", fontSize: 12, color: "var(--text-4)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cap.main}</span>
      </span>
      <span style={{ display: "inline-flex", gap: 4, flexShrink: 0 }}>
        {dots.map(function (on, i) {
          return <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: on ? ((tint && tint[1]) || "#9aa1ad") : "transparent", boxShadow: on ? "none" : ("inset 0 0 0 1.2px " + (dark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.22)")) }} />;
        })}
      </span>
      {typeof I !== "undefined" && I.ChevronRight ? <I.ChevronRight size={16} color="var(--text-5)" /> : null}
    </button>
  );
}

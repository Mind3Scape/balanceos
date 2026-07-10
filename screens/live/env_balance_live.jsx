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

/* ═══════════ МОДЕЛЬ ОПОРЫ (David V2-финал) ═══════════
   Баланс окружения = не «сеть лиц», а СТРУКТУРА ПОДДЕРЖКИ: хватает ли опоры там, где
   тебе трудно. Всё из УЖЕ существующих данных, без бутафории:
   • потребность(сфера) = 1 − заполненность сферы из «Баланса жизни»; если сфера падает
     (тренд ▼) — потребность чуть выше.
   • опора(сфера) = сумма ЖИВЫХ каналов: совместная привычка (buddy по shareCode), круг
     с участниками, чат круга, предложения Нетворка (только с 10 ур.). Молчащий канал ×0.5.
   • хрупко = вся опора сферы упирается в ОДНОГО человека.
   • разрыв = потребность заметно выше опоры. */
var BOS_SUPPORT_CFG = {
  W_BUDDY: 0.45, W_CIRCLE: 0.35, W_CHAT: 0.15, W_OFFER: 0.25, // веса каналов (1 сильный ≈0.5, два разных ≈0.7–0.9)
  SILENT_MULT: 0.5,   // молчащий канал (нет отклика за LIVE_DAYS) весит вполовину
  LIVE_DAYS: 30,      // окно «живости» канала
  NEED_TREND_BOOST: 0.15, // сфера падает → потребность выше
  GAP_THRESH: 0.18,   // потребность − опора > этого = разрыв
  SUPPORT_OK: 0.66,   // «опора есть», если опора ≥ потребность×это (или опора > 0.3)
  MIN_LEVEL_ASK: 10,  // «Попросить о помощи» / «Ориентир» — честно под замком до 10 ур.
};
function _bosMaxDayFresh(days, now) { // минимальный возраст отметки (дней), null если пусто
  if (!days) return null; var min = null;
  for (var k in days) { if (!Object.prototype.hasOwnProperty.call(days, k) || !days[k]) continue; var t = Date.parse(k); if (isNaN(t)) continue; var a = (now - t) / 86400000; if (a < 0) a = 0; if (min == null || a < min) min = a; }
  return min;
}

// ЧИСТАЯ модель: (app + уже собранные каналы) → строки по 6 сферам. Тестируема без облака.
// channels: [{ kind:'buddy'|'circle'|'offer', sphereId, uids:[], alive:bool, hasChat?, chatAlive?, label? }]
function bosSupportModel(app, channels, cfg) {
  cfg = cfg || BOS_SUPPORT_CFG;
  var wd = (typeof bosWheelData === "function") ? bosWheelData(app) : { spheres: [] };
  var byId = {}; (wd.spheres || []).forEach(function (s) { byId[s.id] = s; });
  var chBySph = {}; BOS_SPHERES.forEach(function (s) { chBySph[s.id] = []; });
  (channels || []).forEach(function (c) { if (c && chBySph[c.sphereId]) chBySph[c.sphereId].push(c); });
  return BOS_SPHERES.map(function (sp) {
    var s = byId[sp.id] || { v: 0, tr: "eq" };
    var need = Math.max(0, Math.min(1, (1 - (s.v || 0)) + (s.tr === "dn" ? cfg.NEED_TREND_BOOST : 0)));
    var chans = chBySph[sp.id], sup = 0, uids = {};
    chans.forEach(function (c) {
      var w = c.kind === "buddy" ? cfg.W_BUDDY : c.kind === "circle" ? cfg.W_CIRCLE : c.kind === "offer" ? cfg.W_OFFER : 0;
      if (!c.alive && c.kind !== "offer") w *= cfg.SILENT_MULT; // предложения — стоящие, не «молчат»
      sup += w;
      if (c.kind === "circle" && c.hasChat) { var cw = cfg.W_CHAT; if (!c.chatAlive) cw *= cfg.SILENT_MULT; sup += cw; }
      (c.uids || []).forEach(function (u) { if (u) uids[u] = 1; });
    });
    sup = Math.min(1, sup);
    var uidList = Object.keys(uids);
    var supported = sup > 0.3 || (need > 0 && sup >= need * cfg.SUPPORT_OK && sup > 0.05);
    return {
      id: sp.id, e: sp.e, l: sp.l, v: s.v || 0, tr: s.tr || "eq",
      need: need, support: sup, uids: uidList,
      fragile: sup > 0 && uidList.length === 1,
      gap: (need - sup) > cfg.GAP_THRESH,
      supported: supported, diff: need - sup, channels: chans,
    };
  });
}

// Фраза-вывод (генерится из данных; David забраковал квадратики-счётчики).
function bosSupportPhrase(rows) {
  var okN = rows.filter(function (r) { return r.supported; }).length;
  var gaps = rows.filter(function (r) { return r.gap && r.need > 0.5; }).sort(function (a, b) { return b.diff - a.diff; });
  var frag = rows.filter(function (r) { return r.fragile; });
  var anyChan = rows.some(function (r) { return r.channels && r.channels.length; });
  if (!anyChan) return { main: "Опоры пока нет", sub: "Начни с совместной привычки — позови кого-то в сферу, где тебе сейчас труднее всего. Так появляется первая опора." };
  var main = "Опора есть в " + okN + " " + bosSupportPlural(okN) + " из 6";
  var parts = [];
  if (gaps.length) {
    var names = gaps.slice(0, 2).map(function (r) { return "«" + r.l + "»"; });
    parts.push("В " + names.join(" и ") + " опоры нет — а потребность там сейчас высокая.");
  }
  if (frag.length) parts.push("Опора «" + frag[0].l + "» держится на одном человеке — это хрупко.");
  if (!parts.length) parts.push("Разрывов нет — там, где трудно, рядом есть кто-то.");
  return { main: main, sub: parts.join(" ") };
}
function bosSupportPlural(n) { var a = n % 100, b = n % 10; if (a > 10 && a < 20) return "сферах"; if (b === 1) return "сфере"; if (b >= 2 && b <= 4) return "сферах"; return "сферах"; }

// ГИДРАЦИЯ каналов (как bosEnvUsePeople): мгновенный старт из модуль-кэша, догрузка в useEffect.
// Без облака (браузер-тест) остаётся []. Собирает buddy-привычки, круги+чаты, предложения (с 10 ур.).
var _bosSupportCache = null;
function bosSupportChannelsUse(app, level) {
  var st = React.useState(function () { return Array.isArray(_bosSupportCache) ? _bosSupportCache : []; });
  var channels = st[0], setChannels = st[1];
  var habits = (app && app.habits) || [], teams = (app && app.teams) || [];
  var sig = habits.filter(function (h) { return h && h.shareCode; }).map(function (h) { return h.shareCode; }).join(",") + "|" + teams.filter(function (t) { return t && t.cloudId; }).map(function (t) { return t.cloudId; }).join(",") + "|" + (level | 0);
  React.useEffect(function () {
    var on = true, C = window.bosCloud;
    if (!(C && C.enabled && C.enabled())) { setChannels([]); return; }
    var now = Date.now(), LIVE = BOS_SUPPORT_CFG.LIVE_DAYS;
    (async function () {
      var me = null; try { me = C.uid ? await C.uid() : null; } catch (e) {}
      var out = [];
      // (а) совместные привычки (buddy по shareCode)
      var shHabits = habits.filter(function (h) { return h && h.shareCode && !h.shelved; });
      await Promise.all(shHabits.map(async function (h) {
        var mem = null; try { mem = C.sharedHabitProgress ? await C.sharedHabitProgress(h.shareCode) : null; } catch (e) {}
        var members = (mem && mem.members) || [];
        var others = members.filter(function (m) { return m && m.id && m.id !== me; });
        if (!others.length) return;
        var alive = others.some(function (m) { var a = _bosMaxDayFresh(m.days, now); return a != null && a < LIVE; });
        out.push({ kind: "buddy", sphereId: bosSphereFor(h), uids: others.map(function (m) { return m.id; }), alive: alive, label: h.name || "совместная привычка", people: others.map(function (m) { return { id: m.id, name: m.name, avatar: m.avatar }; }) });
      }));
      // (б,в) круги с участниками + чат
      var cTeams = teams.filter(function (t) { return t && t.cloudId; });
      await Promise.all(cTeams.map(async function (t) {
        var members = null; try { members = C.teamMembers ? await C.teamMembers(t.cloudId) : null; } catch (e) {}
        members = members || [];
        var others = members.filter(function (m) { return m && m.id && m.id !== me; });
        if (members.length < 2) return; // круг из одного — не опора
        var msgs = null; try { msgs = C.loadMessages ? await C.loadMessages(t.cloudId) : null; } catch (e) {}
        msgs = Array.isArray(msgs) ? msgs : [];
        var lastMsg = null; msgs.forEach(function (r) { var t2 = r && r.created_at ? Date.parse(r.created_at) : NaN; if (!isNaN(t2) && (lastMsg == null || t2 > lastMsg)) lastMsg = t2; });
        var chatAlive = lastMsg != null && (now - lastMsg) / 86400000 < LIVE;
        // живость круга: есть свежий чат ИЛИ участник отметился (по общему пульсу — приблиз. через lastMsg)
        out.push({ kind: "circle", sphereId: bosSphereFor({ name: t.name, emoji: t.emblem }), uids: others.map(function (m) { return m.id; }), alive: chatAlive, hasChat: msgs.length > 0, chatAlive: chatAlive, label: t.name || "круг", people: others.map(function (m) { return { id: m.id, name: m.name, avatar: m.avatar }; }) });
      }));
      // (г) предложения Нетворка — ТОЛЬКО с 10 ур. (иначе честно не существуют для юзера)
      if ((level | 0) >= BOS_SUPPORT_CFG.MIN_LEVEL_ASK) {
        var offers = null; try { offers = C.netOffers ? await C.netOffers(200) : null; } catch (e) {}
        (Array.isArray(offers) ? offers : []).forEach(function (o) {
          if (!o || o.active === false || (me && o.owner_id === me)) return;
          out.push({ kind: "offer", sphereId: bosSphereFor({ emoji: o.emoji, name: o.title }), uids: o.owner_id ? [o.owner_id] : [], alive: true, label: o.title || "предложение" });
        });
      }
      if (!on) return;
      _bosSupportCache = out;
      setChannels(function (prev) { return JSON.stringify(prev) === JSON.stringify(out) ? prev : out; });
    })();
    return function () { on = false; };
  }, [sig]); // eslint-disable-line
  return channels;
}

// ШТОРКА-ЛУПА ОПОРЫ СФЕРЫ. props: { row, app, people, level, navigate }.
function BosSupportLupaSheetLive(props) {
  var row = props.row || {}, app = props.app || {}, people = props.people || [], level = props.level | 0;
  var navigate = props.navigate || function () {};
  var sheet = (typeof useSheet === "function") ? useSheet() : { open: function () {}, close: function () {} };
  var dark = (app && app.themeOverride === "dark");
  var lbl = row.l || "Сфера";
  var chans = row.channels || [];
  var together = chans.filter(function (c) { return c.kind === "buddy" || c.kind === "circle"; });
  var circles = chans.filter(function (c) { return c.kind === "circle"; });
  var offers = chans.filter(function (c) { return c.kind === "offer"; });
  var chatLive = circles.some(function (c) { return c.hasChat && c.chatAlive; });
  var chatQuiet = circles.some(function (c) { return c.hasChat && !c.chatAlive; });
  var locked = level < BOS_SUPPORT_CFG.MIN_LEVEL_ASK;
  // кого можно позвать: свои, у кого есть привычки в этой сфере (имена раскрываются ТОЛЬКО тут)
  var candidates = (people || []).filter(function (p) {
    return p && p.name && (p.habits || []).some(function (h) { return bosSphereFor({ emoji: (h.e || h.emoji || "✨"), name: "" }) === row.id; });
  });
  var preset = (typeof BOS_SPHERE_PRESET !== "undefined" && BOS_SPHERE_PRESET[row.id]) || { i: "✨", t: lbl };
  var proposeStep = function () { if (typeof HabitFormSheetLive === "function") sheet.open(<HabitFormSheetLive mode="create" preset={{ i: preset.i, t: preset.t, sphere: row.id }} navigate={navigate} />); };
  var status = function (kind, txt) {
    var st = { fontSize: 10.5, fontWeight: 800, borderRadius: 999, padding: "4px 9px", flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4 };
    if (kind === "ok") return <span style={Object.assign({}, st, { background: "#FEDE34", color: "#0a0a0a" })}>{txt}</span>;
    if (kind === "frag") return <span style={Object.assign({}, st, { background: "repeating-linear-gradient(-55deg,#FEDE34 0 4px,rgba(254,222,52,0.3) 4px 8px)", color: "#0a0a0a" })}>{txt}</span>;
    if (kind === "lock") return <span style={Object.assign({}, st, { background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: "var(--text-4)" })}><svg width="10" height="10" viewBox="0 0 24 24" fill={dark ? "#8e8e93" : "#9c9ca3"}><path d="M12 3.6c2.8 0 5 2.2 5 5v2h.4c1 0 1.8.8 1.8 1.8v6.8c0 1-.8 1.8-1.8 1.8H6.6c-1 0-1.8-.8-1.8-1.8v-6.8c0-1 .8-1.8 1.8-1.8H7v-2c0-2.8 2.2-5 5-5zm0 2.2a2.8 2.8 0 0 0-2.8 2.8v2h5.6v-2A2.8 2.8 0 0 0 12 5.8z" /></svg>{txt}</span>;
    return <span style={Object.assign({}, st, { background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: "var(--text-3)" })}>{txt}</span>;
  };
  var fnRow = function (icon, title, sub, statusEl, key) {
    return (
      <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 2px", borderTop: key ? "0.5px solid var(--line)" : "0" }}>
        <span style={{ width: 30, height: 30, borderRadius: "50%", background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", display: "grid", placeItems: "center", flexShrink: 0 }}>{icon}</span>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{title}<span style={{ display: "block", fontSize: 10.5, fontWeight: 600, color: "var(--text-4)", marginTop: 1 }}>{sub}</span></span>
        {statusEl}
      </div>
    );
  };
  var ic = function (path) { return <svg width="14" height="14" viewBox="0 0 24 24" fill={dark ? "#c8c8cf" : "#0a0a0a"}><path d={path} /></svg>; };
  return (
    <div style={{ padding: "0 16px 22px" }}>
      <div style={{ textAlign: "center", fontSize: 19, fontWeight: 800, letterSpacing: "-0.35px", color: "var(--text)", padding: "2px 0 2px" }}>Опора · {lbl}</div>
      <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--text-4)", paddingBottom: 12 }}>четыре формы поддержки — что есть, чего не хватает</div>
      <div style={{ background: "var(--card)", borderRadius: 20, boxShadow: "var(--card-shadow)", padding: "4px 14px", marginBottom: 10 }}>
        {fnRow(ic("M8.4 4.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4zM2.8 18.4c0-3 2.5-5.2 5.6-5.2s5.6 2.2 5.6 5.2c0 .74-.6 1.34-1.34 1.34H4.14c-.74 0-1.34-.6-1.34-1.34zM16.6 6.1a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"), "Сделать вместе", "совместная привычка или круг в сфере", together.length ? status(row.fragile ? "frag" : "ok", (row.fragile ? "хрупко · " : "есть · ") + together.length) : status("no", "нет"), 0)}
        {fnRow(ic("M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H9l-4 4a.6.6 0 0 1-1-.45V5.5z"), "Поговорить", "живой чат круга в этой сфере", chatLive ? status("ok", "есть чат") : (chatQuiet ? status("no", "тихо") : status("no", "нет")), 1)}
        {fnRow(ic("M12 2.2l2.4 7.4 7.4 2.4-7.4 2.4-2.4 7.4-2.4-7.4-7.4-2.4 7.4-2.4z"), "Попросить о помощи", "рынок пользы за ✦", locked ? status("lock", "с 10 ур.") : (offers.length ? status("ok", offers.length + " предл.") : status("no", "нет")), 2)}
        {fnRow(ic("M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm3.5 5.5l-2 5-5 2 2-5z"), "Получить ориентир", "наставники и разборы", locked ? status("lock", "с 10 ур.") : status("no", "скоро"), 3)}
      </div>
      <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "1.2px", color: "var(--text-4)", padding: "4px 4px 8px" }}>ПОЧЕМУ ТАК</div>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-2)", padding: "0 2px 12px" }}>Собрано из добровольных сигналов твоего круга за 30 дней: совместные отметки, круги и их чаты{level >= BOS_SUPPORT_CFG.MIN_LEVEL_ASK ? ", предложения Нетворка" : ""}. <b style={{ color: "var(--text)" }}>Имена скрыты</b> — откроются только по твоему нажатию ниже.</div>
      <button onClick={proposeStep} className="tap" style={{ width: "100%", border: 0, background: dark ? "#f2f2f5" : "#101828", color: dark ? "#101828" : "#fff", fontSize: 14, fontWeight: 700, borderRadius: 14, padding: 13, cursor: "pointer" }}>Предложить совместный шаг</button>
      {candidates.length ? (
        <div style={{ marginTop: 10, background: "var(--card)", borderRadius: 16, boxShadow: "var(--card-shadow)", padding: "10px 12px" }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 8 }}>Кого можно позвать в «{lbl}»</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {candidates.slice(0, 8).map(function (p, i) { return <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "var(--text-2)", background: dark ? "rgba(255,255,255,0.06)" : "#f4f5f7", border: "0.5px solid var(--line)", borderRadius: 999, padding: "5px 10px" }}>{bosEnvNode(p.avatar, p.name, 20, dark, false)}{p.name}</span>; })}
          </div>
        </div>
      ) : (
        <button onClick={props.onInvite} className="tap" style={{ width: "100%", border: 0, background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", color: "var(--text)", fontSize: 14, fontWeight: 700, borderRadius: 14, padding: 13, cursor: "pointer", marginTop: 8 }}>Кого можно позвать →</button>
      )}
    </div>
  );
}

/* ═══════════ БЛОК на странице ИИ — модель ОПОРЫ ═══════════ */
function BosEnvBalanceLive(props) {
  var app = props.app || {};
  var navigate = props.navigate || function () {};
  var openSheet = props.openSheet || function () {};
  var dark = !!props.dark;
  var hideTitle = !!props.hideTitle; // в переключателе «Жизнь/Окружение» заголовок = пилюля сверху
  var bare = !!props.bare;           // без своей карточки (внутри общей карточки переключателя)
  var wrapStyle = bare ? { padding: "0" } : { background: "var(--card)", borderRadius: 24, boxShadow: "var(--card-shadow)", padding: "16px 16px 14px" };
  var people = bosEnvUsePeople();
  var level = 1; try { if (typeof bosLiveXPLive === "function" && typeof bosLevelInfoLive === "function") level = bosLevelInfoLive(bosLiveXPLive(app)).level | 0; } catch (e) {}
  var channels = bosSupportChannelsUse(app, level);
  var rows = bosSupportModel(app, channels);
  var phrase = bosSupportPhrase(rows);
  var anyChan = (channels || []).length > 0;
  var open = function () { try { navigate("env-balance"); } catch (e) {} };
  var invite = bosEnvInvite(openSheet, navigate, dark);
  var openLupa = function (r) { openSheet(<BosSupportLupaSheetLive row={r} app={app} people={people || []} level={level} navigate={navigate} onInvite={invite} />); };
  // главный разрыв = максимум (потребность − опора); если разрывов нет — просто самая слабая по опоре
  var sortedByDiff = rows.slice().sort(function (a, b) { return b.diff - a.diff; });
  var mainGap = sortedByDiff.filter(function (r) { return r.gap; })[0] || sortedByDiff[0];

  var ink = dark ? "#f2f2f5" : "#0a0a0a";
  var trackBg = dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.055)";

  return (
    <div style={wrapStyle}>
      {hideTitle ? null : (
        <div style={{ marginBottom: 2 }}>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.3px", color: "var(--text)" }}>Баланс окружения</div>
        </div>
      )}
      {/* подпись-рамка: не люди, а структура поддержки */}
      <div style={{ fontSize: 11.5, color: "var(--text-4)", lineHeight: 1.45, padding: "2px 2px 0" }}>Показывает не людей, а <b style={{ color: "var(--text)" }}>структуру поддержки</b>: хватает ли опоры там, где тебе сейчас трудно.</div>

      {/* фраза-вывод (из данных, без квадратиков-счётчиков) */}
      <div style={{ marginTop: 12, padding: "12px 13px", background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", border: "0.5px solid " + (dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"), borderRadius: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.3px", color: "var(--text)" }}>{phrase.main}</div>
        <div style={{ fontSize: 11.5, color: "var(--text-4)", lineHeight: 1.45, marginTop: 3 }}>{phrase.sub}</div>
      </div>

      {/* потребность ✕ опора — 6 строк (те же сферы, что колесо) */}
      <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "1.2px", color: "var(--text-4)", padding: "14px 2px 4px" }}>ПОТРЕБНОСТЬ ✕ ОПОРА</div>
      <div>
        {rows.map(function (r, i) {
          var nm = (typeof BOS_SPHERE_ICON !== "undefined" && BOS_SPHERE_ICON[r.id]) || "Sparkles";
          // при полном отсутствии опоры не пугаем 6× «разрыв» — строки читаются как карта потребности
          var flag = !anyChan ? "" : (r.fragile ? "хрупко" : (r.gap ? "разрыв" : ""));
          return (
            <button key={r.id} onClick={function () { openLupa(r); }} className="tap" data-no-haptic
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 2px", borderTop: i ? "0.5px solid var(--line)" : "0", width: "100%", background: "transparent", border: 0, borderTopWidth: i ? "0.5px" : 0, cursor: "pointer", textAlign: "left" }}>
              <span style={{ width: 26, height: 26, borderRadius: "50%", background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.045)", display: "grid", placeItems: "center", flexShrink: 0 }}>{((typeof bosIconEl === "function") && bosIconEl(nm, { size: 14, color: dark ? "#c8c8cf" : "#0a0a0a" })) || r.e}</span>
              <span style={{ width: 52, fontSize: 12, fontWeight: 700, letterSpacing: "-0.2px", color: "var(--text)", flexShrink: 0 }}>{r.l}</span>
              <span style={{ flex: 1, position: "relative", height: 10, borderRadius: 99, background: trackBg }}>
                <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: Math.round(r.support * 100) + "%", borderRadius: 99, background: r.fragile ? "repeating-linear-gradient(-55deg,#FEDE34 0 4px,rgba(254,222,52,0.28) 4px 8px)" : "#FEDE34" }} />
                <span style={{ position: "absolute", top: -3, bottom: -3, left: "calc(" + Math.round(r.need * 100) + "% - 1.25px)", width: 2.5, borderRadius: 2, background: ink }} />
              </span>
              <span style={{ width: 44, textAlign: "right", flexShrink: 0 }}>{flag ? <span style={{ fontSize: 9, fontWeight: 800, color: "#0a0a0a", background: "#FEDE34", padding: "2px 6px", borderRadius: 99 }}>{flag}</span> : null}</span>
            </button>
          );
        })}
      </div>

      {/* легенда */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 9, padding: "0 2px" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: "var(--text-4)" }}><span style={{ width: 2.5, height: 12, borderRadius: 2, background: ink }} /> потребность</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: "var(--text-4)" }}><span style={{ width: 18, height: 8, borderRadius: 99, background: "#FEDE34" }} /> устойчивая опора</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: "var(--text-4)" }}><span style={{ width: 18, height: 8, borderRadius: 99, background: "repeating-linear-gradient(-55deg,#FEDE34 0 4px,rgba(254,222,52,0.28) 4px 8px)" }} /> хрупкая · один человек</span>
      </div>

      {/* главный разрыв ИЛИ (пусто) приглашение — без паники */}
      {anyChan && mainGap && mainGap.gap ? (
        <div style={{ marginTop: 12, background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", border: "0.5px solid " + (dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"), borderRadius: 18, padding: 13 }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "1.2px", color: "var(--text-4)" }}>ГЛАВНЫЙ РАЗРЫВ</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 800, letterSpacing: "-0.3px", color: "var(--text)", marginTop: 5 }}>
            <span style={{ width: 22, height: 22, display: "grid", placeItems: "center" }}>{((typeof bosIconEl === "function") && bosIconEl((typeof BOS_SPHERE_ICON !== "undefined" && BOS_SPHERE_ICON[mainGap.id]) || "Sparkles", { size: 17, color: dark ? "#f2f2f5" : "#0a0a0a" })) || mainGap.e}</span>
            {mainGap.l}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-4)", lineHeight: 1.45, marginTop: 4 }}>Потребность высокая (сфера заполнена на {Math.round(mainGap.v * 100)}%), а {mainGap.support > 0.05 ? "опоры мало" : "рядом — никого: ни совместной привычки, ни круга в этой сфере"}.</div>
          <button onClick={function () { openLupa(mainGap); }} className="tap" style={{ width: "100%", border: 0, background: dark ? "#f2f2f5" : "#101828", color: dark ? "#101828" : "#fff", fontSize: 14, fontWeight: 700, borderRadius: 14, padding: 12, cursor: "pointer", marginTop: 11 }}>Разобрать опору</button>
        </div>
      ) : (
        <div style={{ marginTop: 12, background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", border: "0.5px solid " + (dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"), borderRadius: 18, padding: 13 }}>
          <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>{anyChan ? "Разрывов нет — там, где трудно, рядом кто-то есть. Так держать." : "Опора начинается с одного совместного шага. Позови кого-то в сферу, где тебе труднее всего."}</div>
          {!anyChan ? <button onClick={mainGap ? function () { openLupa(mainGap); } : invite} className="tap" style={{ width: "100%", border: 0, background: dark ? "#f2f2f5" : "#101828", color: dark ? "#101828" : "#fff", fontSize: 14, fontWeight: 700, borderRadius: 14, padding: 12, cursor: "pointer", marginTop: 11 }}>Начать с совместной привычки</button> : null}
        </div>
      )}

      {/* приватность */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 11, fontSize: 10.5, fontWeight: 600, color: "var(--text-4)" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill={dark ? "#8e8e93" : "#9c9ca3"}><path d="M12 2l8 3.5v5.2c0 5-3.4 9.6-8 11.3-4.6-1.7-8-6.3-8-11.3V5.5L12 2z" /></svg>
        Без чужих оценок · только добровольные сигналы круга
      </div>

      {/* вход в подробный экран (оставлен) */}
      <button onClick={open} className="tap" data-no-haptic style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, width: "100%", marginTop: 12, background: dark ? "rgba(255,255,255,0.06)" : "var(--surface-3)", color: "var(--text-3)", border: 0, borderRadius: 14, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Подробнее о балансе окружения {typeof I !== "undefined" && I.ChevronRight ? <I.ChevronRight size={15} /> : "›"}</button>
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
        {/* «Чем могу быть полезен» — ЕДИНЫЙ вклад из «Сообщества» (network_offers), не отдельная
            локальная строка (Сообщество v2 §6): открывает ту же шторку «Добавить формат помощи». */}
        <div style={{ marginTop: 13 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Чем ты можешь быть полезен</div>
          <button className="tap" onClick={function () { if (typeof AddHelpFormatSheetLive === "function") openSheet(<AddHelpFormatSheetLive app={app} offer={null} onDone={function () {}} />); }}
            style={{ width: "100%", boxSizing: "border-box", border: 0, background: "var(--surface-3)", borderRadius: 12, padding: "12px 13px", fontSize: 14, color: "var(--text-2)", fontFamily: "inherit", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span>Добавить формат помощи для своих</span>
            <span style={{ color: "var(--text-4)", fontWeight: 700 }}>›</span>
          </button>
          <div style={{ fontSize: 11, color: "var(--text-5)", lineHeight: 1.4, marginTop: 6 }}>Единый вклад — тот же, что в «Сообществе». Круг подтвердит роль и увидит твою помощь.</div>
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

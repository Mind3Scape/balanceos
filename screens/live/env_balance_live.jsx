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

// глянцевый СТАНДАРТНЫЙ диск (как во Вселенной) + лицо (мемоджи→эмодзи→инициал→силуэт)
function bosEnvNode(avatar, name, size, dark, youRing) {
  var a = "" + (avatar || "");
  var plate = dark ? "linear-gradient(160deg,#464c58,#30353f)" : "linear-gradient(160deg,#eef1f6,#dadfe7)";
  var sh = youRing
    ? (dark ? "0 7px 18px rgba(43,143,243,0.4), inset 0 0 0 2px #2B8FF3" : "0 7px 18px rgba(43,143,243,0.32), inset 0 0 0 2px #2B8FF3, inset 0 1.5px 0.5px rgba(255,255,255,0.9)")
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
      <circle cx={c} cy={c} r={R} fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" strokeDasharray={dash + " " + (C - dash).toFixed(1)} transform={"rotate(-90 " + c + " " + c + ")"} />
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
          var out = base.map(function (p) { var s = stats[p.id] || {}; return { id: p.id, avatar: p.avatar, name: p.name, inviter: !!p.inviter, mine: !!p.mine, b: bosEnvBond(s), level: s.level || 0, habits: Array.isArray(s.habits) ? s.habits : [] }; });
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
  var people = bosEnvUsePeople();
  var myLight = bosEnvMyLight(app);
  if (people === null) return null;

  var open = function () { try { navigate("env-balance"); } catch (e) {} };

  // ПУСТОЕ
  if (!people.length) {
    return (
      <div style={{ background: "var(--card)", borderRadius: 24, boxShadow: "var(--card-shadow)", padding: "16px 16px 15px" }}>
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.3px", color: "var(--text)" }}>Баланс окружения</div>
        <div style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.45, marginTop: 4, marginBottom: 14 }}>Состояние, которое вы держите вместе. Пока в нём только ты — позови первого своего.</div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>{bosEnvNode(app.avatar, app.userName || "", 60, dark, true)}</div>
        <button className="tap hit44" onClick={bosEnvInvite(openSheet, navigate, dark)} style={{ display: "block", width: "100%", background: dark ? "#f2f2f5" : "#101828", color: dark ? "#101828" : "#fff", fontSize: 14, fontWeight: 700, border: 0, borderRadius: 999, padding: "12px", cursor: "pointer" }}>＋ Позвать своего</button>
      </div>
    );
  }

  var total = people.length;
  var index = bosEnvIndex(people, myLight);
  var word = bosEnvWord(index);
  var invitedCount = people.filter(function (p) { return p.mine; }).length;

  // хоровод: ТЫ + до 7 близких, ровно по кругу (ты — один из хоровода, не отдельный узел)
  var shown = people.slice(0, 7);
  var ringNodes = [{ you: true, avatar: app.avatar, name: app.userName || "Ты" }].concat(shown);
  var VW = 320, VH = 240, cx = 160, cy = 116, Rp = 98, N = ringNodes.length;
  var pos = ringNodes.map(function (p, i) { var a = (-90 + i * (360 / N)) * Math.PI / 180; return { x: cx + Math.cos(a) * Rp, y: cy + Math.sin(a) * Rp * 0.9, p: p }; });

  // подсказка ИИ — реципрокность (честно, по самому «просевшему»)
  var dim = shown.reduce(function (m, n) { return (!m || n.b < m.b) ? n : m; }, null);
  var nudge;
  if (dim && dim.b < 0.42 && dim.name) {
    var nm = dim.name;
    nudge = { text: <span><b>Ты сейчас в балансе — самое время делиться.</b> {nm} сейчас в спаде — поддержи, и общий баланс подрастёт. Так вы и растёте вместе.</span>, act: "💬 Поддержать", on: function () { navigate("ai-chat", { prompt: "Как по-доброму поддержать близкого (" + nm + "), у которого сейчас спад?" }); } };
  } else {
    nudge = { text: <span><b>Окружение держится на тебе.</b> Поделись, чем ты силён — кому-то это сейчас нужно, и вы вырастете вместе.</span>, act: "＋ Чем могу быть полезен", on: bosEnvInvite(openSheet, navigate, dark) };
  }

  return (
    <div style={{ background: "var(--card)", borderRadius: 24, boxShadow: "var(--card-shadow)", padding: "16px 16px 14px" }}>
      <button onClick={open} className="tap" data-no-haptic style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "transparent", border: 0, padding: 0, cursor: "pointer", textAlign: "left" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.3px", color: "var(--text)" }}>Баланс окружения</div>
          <div style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.45, marginTop: 3 }}>Состояние, которое вы держите вместе.</div>
        </div>
        <span style={{ flexShrink: 0, fontSize: 12.5, fontWeight: 600, color: "var(--text-4)", display: "inline-flex", alignItems: "center", gap: 2 }}>Подробнее {typeof I !== "undefined" && I.ChevronRight ? <I.ChevronRight size={15} /> : "›"}</span>
      </button>

      {/* кольцо-состояние + хоровод людей */}
      <div style={{ position: "relative", width: "100%", aspectRatio: VW + " / " + VH, margin: "8px 0 2px" }}>
        <svg viewBox={"0 0 " + VW + " " + VH} width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <circle cx={cx} cy={cy} r={Rp} fill="none" stroke={dark ? "rgba(214,220,232,0.10)" : "rgba(92,120,165,0.12)"} strokeWidth="1" />
        </svg>
        <div style={{ position: "absolute", left: (cx / VW * 100) + "%", top: (cy / VH * 100) + "%", transform: "translate(-50%,-50%)" }}>{bosEnvRing(index, word, total + " " + bosEnvPlural(total).toUpperCase(), 150, dark)}</div>
        {pos.map(function (n, i) {
          var p = n.p;
          return (
            <div key={"f" + i} style={{ position: "absolute", left: (n.x / VW * 100) + "%", top: (n.y / VH * 100) + "%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
              {bosEnvNode(p.avatar, p.name, 40, dark, !!p.you)}
              <div style={{ fontSize: 10, fontWeight: p.you ? 700 : 600, color: p.you ? "var(--text-2)" : "var(--text-3)", marginTop: 3, maxWidth: 64, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.you ? "Ты" : p.name}</div>
            </div>
          );
        })}
      </div>

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

  var list = Array.isArray(people) ? people : [];
  var total = list.length;
  var index = bosEnvIndex(list, myLight);
  var word = bosEnvWord(index);
  var invitedCount = list.filter(function (p) { return p.mine; }).length;
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

      {/* герой: большое кольцо-состояние */}
      <div style={{ background: "var(--card)", borderRadius: 24, boxShadow: "var(--card-shadow)", padding: "20px 16px 18px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {bosEnvRing(index, word, total + " " + bosEnvPlural(total).toUpperCase(), 176, dark)}
        <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-3)", textAlign: "center", marginTop: 12, maxWidth: 300 }}>
          {index >= 55 ? "Твоё окружение в хорошем тонусе — вы держите баланс вместе." : "Окружение затихло — самое время поддержать своих и вернуть тонус."} Твой баланс питает общий: ты сам создаёшь окружение.
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
        <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", color: "var(--text-4)", padding: "0 4px 8px" }}>Твои близкие · {total}</div>
        <div style={{ background: "var(--card)", borderRadius: 20, boxShadow: "var(--card-shadow)", overflow: "hidden" }}>
          {list.slice().sort(function (a, b) { return a.b - b.b; }).map(function (p, i, arr) {
            var pct = Math.round(p.b * 100);
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", borderBottom: i < arr.length - 1 ? "0.5px solid var(--line)" : "none" }}>
                {bosEnvNode(p.avatar, p.name, 38, dark, false)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name || "Близкий"}{p.inviter ? <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-5)" }}>  · позвал тебя</span> : null}</div>
                  <div style={{ height: 5, borderRadius: 3, background: "var(--surface-3)", marginTop: 5, overflow: "hidden" }}><i style={{ display: "block", height: "100%", width: pct + "%", borderRadius: 3, background: bosEnvZone(pct) }} /></div>
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
        <div style={{ fontSize: 12.7, color: "var(--text-3)", lineHeight: 1.5, marginTop: 4 }}>Ты в балансе — самое время нести добро. Позови ещё близких и поделись, чем ты силён: чем крепче каждый, тем выше общий баланс.</div>
        <button className="tap hit44" onClick={bosEnvInvite(openSheet, navigate, dark)} style={{ display: "block", width: "100%", marginTop: 12, background: dark ? "#f2f2f5" : "#101828", color: dark ? "#101828" : "#fff", fontSize: 14, fontWeight: 700, border: 0, borderRadius: 999, padding: "12px", cursor: "pointer" }}>＋ Позвать своего</button>
      </div>

      <div style={{ fontSize: 11.5, color: "var(--text-5)", lineHeight: 1.5, textAlign: "center", margin: "16px 8px 2px", fontStyle: "italic" }}>Ты сам создаёшь окружение — как только сам в балансе.</div>
    </div>
  );
}

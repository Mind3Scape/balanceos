/* ─────────────────────────────────────────────────────────────────────────────
   БАЛАНС ОКРУЖЕНИЯ — среднее кольцо «Ты → Окружение → Вселенная» на странице ИИ.
   (David 2026-07-06, вариант A. v603: СТРОГО как «Связи» во Вселенной — те же
   стеклянные диски + золотой бейдж уровня, тонкие серые нити, БЕЗ своей панели
   (плавает на светлом фоне карточки). Никаких кастомных серых дисков/градиентов.)

   Функциональный фокус — СОСТОЯНИЕ окружения: индекс + у каждого золотой бейдж
   его уровня (его «состояние»), толщина нити = крепость связи, вклад = кого позвал.

   ЖИВЫЕ данные: invitedPeople + myInviter → profilesPublic (level/lvlPct/habits/goals).
   Атомы диска/бейджа/нити взяты 1:1 из OrbitField / UniDiscLive / UniverseFieldLive.
   ───────────────────────────────────────────────────────────────────────────── */

var _bosEnvPeopleCache;

// та же матовая «плёнка», что BOS_TILE_SHEEN на дисках Вселенной/настроек
var BOS_ENV_SHEEN = "linear-gradient(165deg, rgba(255,255,255,0.55), rgba(255,255,255,0.12) 46%, rgba(255,255,255,0) 72%)";

function bosEnvBond(s) {
  if (!s) return 0.30;
  var lvl = Math.min(s.level || 0, 10), pct = Math.min(Math.max(s.lvlPct || 0, 0), 100);
  var hab = Math.min((s.habits && s.habits.length) || 0, 6), g = Math.min(s.goals || 0, 3);
  return Math.max(0.14, Math.min(1, 0.26 + lvl * 0.045 + (pct / 100) * 0.18 + hab * 0.035 + g * 0.03));
}
function bosEnvWord(v) { return v >= 72 ? "Крепкое" : v >= 56 ? "Живое" : v >= 40 ? "Ровное" : "Тихое"; }
function bosEnvNorm(b) { return Math.max(0, Math.min(1, (b - 0.14) / 0.86)); }

// УЗЕЛ = ТОТ ЖЕ глянцевый диск, что во Вселенной (BOS_TILE_SHEEN + серое стекло) + золотой
// бейдж уровня. Лицо НИКОГДА не пустое: мемоджи → эмодзи → инициал → силуэт I.Person.
function bosEnvNode(avatar, name, level, size, dark) {
  var a = "" + (avatar || "");
  var plate = dark ? "linear-gradient(160deg,#464c58,#30353f)" : "linear-gradient(160deg,#eef1f6,#dadfe7)";
  var sh = dark
    ? "0 7px 18px rgba(0,0,0,0.5), inset 0 0.5px 0.5px rgba(255,255,255,0.14), inset 0 0 0 0.7px rgba(255,255,255,0.06)"
    : "0 7px 18px rgba(24,34,64,0.18), inset 0 1.5px 0.5px rgba(255,255,255,0.92), inset 0 0 0 0.7px rgba(0,0,0,0.05)";
  var base = { position: "relative", width: size, height: size, borderRadius: "50%", flexShrink: 0, boxShadow: sh, display: "grid", placeItems: "center" };
  var content = null, bg;
  if (/^m\d+$/.test(a)) { bg = "url(./assets/people/" + a + ".png) center/cover no-repeat, " + BOS_ENV_SHEEN + ", " + plate; }
  else if (a.indexOf("emoji:") === 0) { bg = BOS_ENV_SHEEN + ", " + plate; content = <span style={{ fontSize: Math.round(size * 0.54), lineHeight: 1 }}>{a.slice(6)}</span>; }
  else {
    bg = BOS_ENV_SHEEN + ", " + plate;
    var initial = ("" + (name || "")).trim().charAt(0).toUpperCase();
    content = initial
      ? <span style={{ color: dark ? "#cfd5e1" : "#586274", fontWeight: 700, fontSize: Math.round(size * 0.42), fontFamily: "-apple-system, system-ui, sans-serif" }}>{initial}</span>
      : ((typeof I !== "undefined" && I.Person) ? <I.Person size={Math.round(size * 0.55)} color={dark ? "#aab1bf" : "#8a92a3"} /> : null);
  }
  return (
    <div style={Object.assign({}, base, { background: bg })}>
      {content}
      {level > 0 ? <span aria-hidden style={{ position: "absolute", right: -3, bottom: -3, minWidth: 18, height: 18, padding: "0 4px", borderRadius: 999, boxSizing: "border-box", background: "linear-gradient(180deg,#FFE777,#F4B72A)", color: "#4a3800", fontSize: 10.5, fontWeight: 800, lineHeight: "15px", textAlign: "center", border: "1.5px solid var(--card)", boxShadow: "0 1px 3px rgba(224,138,0,0.5), inset 0 1px 0.5px rgba(255,255,255,0.6)", fontFamily: "-apple-system, system-ui, sans-serif" }}>{level}</span> : null}
    </div>
  );
}

function BosEnvBalanceLive(props) {
  var app = props.app || {};
  var navigate = props.navigate || function () {};
  var openSheet = props.openSheet || function () {};
  var dark = !!props.dark;

  var ringCol = dark ? "186,210,248" : "92,120,165";
  var lineCol = dark ? "214,220,232" : "120,130,152";

  var _st = React.useState(function () {
    if (Array.isArray(_bosEnvPeopleCache)) return _bosEnvPeopleCache;
    try { var c = JSON.parse(localStorage.getItem("bos:cache:envPeople") || "null"); if (Array.isArray(c)) return c; } catch (e) {}
    return null;
  });
  var people = _st[0], setPeople = _st[1];

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
          var out = base.map(function (p) { var s = stats[p.id] || {}; return { id: p.id, avatar: p.avatar, name: p.name, inviter: !!p.inviter, mine: !!p.mine, b: bosEnvBond(s), level: s.level || 0 }; });
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

  var myLevel = 0, myLight = 0.6;
  try { if (typeof bosLiveXPLive === "function" && typeof bosLevelInfoLive === "function") { var li = bosLevelInfoLive(bosLiveXPLive(app)); myLevel = li.level || 0; } } catch (e) {}
  try { if (typeof bosWheelData === "function") { var wd = bosWheelData(app); if (wd && wd.overall != null) myLight = Math.max(0, Math.min(1, wd.overall / 100)); } } catch (e) {}

  if (people === null) return null;

  var pulseKF = "@keyframes bosEnvPulse{from{stroke-dashoffset:0.18}to{stroke-dashoffset:-1}}";
  var VW = 320, VH = 250, cx = 160, cy = 116;
  var pctX = function (v) { return (v / VW * 100).toFixed(2) + "%"; };
  var pctY = function (v) { return (v / VH * 100).toFixed(2) + "%"; };

  // ── ПУСТОЕ СОСТОЯНИЕ ──
  if (!people.length) {
    return (
      <div style={{ background: "var(--card)", borderRadius: 24, boxShadow: "var(--card-shadow)", padding: "16px 16px 15px" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", color: "var(--text-4)", padding: "1px 2px 0" }}>Окружение</div>
        <div style={{ position: "relative", width: "100%", height: 150, margin: "6px 0 8px" }}>
          <svg viewBox="0 0 320 150" width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <style>{pulseKF}</style>
            {[30, 52].map(function (r, i) { return <circle key={i} cx="160" cy="75" r={r} fill="none" stroke={"rgba(" + ringCol + ",0.10)"} strokeWidth="1" />; })}
            <line x1="160" y1="75" x2="238" y2="46" stroke={"rgba(" + lineCol + ",0.5)"} strokeWidth="1.4" strokeLinecap="round" strokeDasharray="3 6" />
            <line x1="160" y1="75" x2="238" y2="46" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4" strokeLinecap="round" pathLength="1" strokeDasharray="0.18 1" style={{ animation: "bosEnvPulse 3.2s ease-in-out infinite both" }} />
          </svg>
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}>{bosEnvNode(app.avatar, app.userName || "", myLevel, 54, dark)}</div>
          <div style={{ position: "absolute", left: "74.4%", top: "30.7%", transform: "translate(-50%,-50%)", width: 38, height: 38, borderRadius: "50%", border: "1.5px dashed " + "rgba(" + lineCol + ",0.55)", display: "grid", placeItems: "center", color: "var(--text-4)", fontSize: 18, fontWeight: 600 }}>＋</div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.2px" }}>Окружение пока пустое</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--text-4)", margin: "4px 0 13px" }}>Позови первого близкого — появится первая нить. Чем больше своих ты зовёшь и держишь рядом, тем плотнее сеть.</div>
        <button className="tap hit44" onClick={bosEnvInvite(openSheet, navigate, dark)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: dark ? "#f2f2f5" : "#101828", color: dark ? "#101828" : "#fff", fontSize: 13, fontWeight: 700, border: 0, borderRadius: 999, padding: "9px 17px", cursor: "pointer" }}>＋ Позвать своего</button>
      </div>
    );
  }

  // ── ЕСТЬ ЛЮДИ ──
  var total = people.length;
  var invitedCount = people.filter(function (p) { return p.mine; }).length;
  var avgB = people.reduce(function (s, p) { return s + p.b; }, 0) / total;
  var overall = Math.round((avgB * 0.7 + myLight * 0.3) * 100);
  var word = bosEnvWord(overall);

  var shown = people.slice().sort(function (a, b) { return b.b - a.b; });
  var extra = Math.max(0, shown.length - 8);
  shown = shown.slice(0, 8);
  var N = shown.length;
  var nodes = shown.map(function (p, i) {
    var a = (-90 + i * (360 / N)) * Math.PI / 180;
    var rad = 80 + (1 - p.b) * 42;
    return { x: cx + Math.cos(a) * rad * 1.14, y: cy + Math.sin(a) * rad * 0.9, p: p };
  });

  var thinnest = shown.reduce(function (m, n) { return (!m || n.b < m.b) ? n : m; }, null);
  var nudge;
  if (thinnest && thinnest.b < 0.42 && thinnest.name) {
    var nm = thinnest.name;
    nudge = { text: <span><b>{nm} — самая тонкая нить сейчас.</b> Короткое слово — и она окрепнет.</span>, act: "Написать", ghost: false, on: function () { navigate("ai-chat", { prompt: "Подскажи, как по-доброму поддержать близкого (" + nm + "), с которым связь ослабла." }); } };
  } else if (invitedCount < 3) {
    nudge = { text: <span><b>Ты в балансе — самое время расширить круг.</b> Позови близкого: сеть станет плотнее, и вы вырастете вместе.</span>, act: "Позвать своего", ghost: true, on: bosEnvInvite(openSheet, navigate, dark) };
  } else {
    nudge = { text: <span><b>Сеть крепкая.</b> Ты держишь круг своих рядом — так он и создаётся.</span>, act: "Позвать ещё", ghost: true, on: bosEnvInvite(openSheet, navigate, dark) };
  }

  return (
    <div style={{ background: "var(--card)", borderRadius: 24, boxShadow: "var(--card-shadow)", padding: "16px 16px 14px" }}>
      {/* индекс — монохром */}
      <div style={{ padding: "1px 2px 0" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", color: "var(--text-4)" }}>Окружение</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 9, marginTop: 3 }}>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-1px", lineHeight: 0.85, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{overall}</div>
          <div style={{ paddingBottom: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.2px" }}>{word}</div>
            <div style={{ fontSize: 11, color: "var(--text-5)", fontWeight: 600 }}>{total} {bosEnvPlural(total)} рядом</div>
          </div>
        </div>
      </div>

      {/* созвездие — плавает на фоне карточки (БЕЗ своей панели, как во Вселенной) */}
      <div style={{ position: "relative", width: "100%", aspectRatio: VW + " / " + VH, margin: "6px 0 2px" }}>
        <svg viewBox={"0 0 " + VW + " " + VH} width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <style>{pulseKF}</style>
          {/* тонкие концентрические орбиты вокруг тебя — как у центра во Вселенной */}
          {[30, 52, 74].map(function (r, i) { return <circle key={"r" + i} cx={cx} cy={cy} r={r} fill="none" stroke={"rgba(" + ringCol + "," + (0.14 - i * 0.04).toFixed(2) + ")"} strokeWidth="1" />; })}
          {/* тонкие серые нити (толщина = крепость), лёгкий пульс-блик */}
          {nodes.map(function (n, i) {
            var nb = bosEnvNorm(n.p.b), w = (1.1 + nb * 1.3).toFixed(1), op = (0.3 + nb * 0.3).toFixed(2), delay = (0.2 + i * 0.3).toFixed(2);
            return <g key={"t" + i}>
              <line x1={cx} y1={cy} x2={n.x.toFixed(1)} y2={n.y.toFixed(1)} stroke={"rgba(" + lineCol + "," + op + ")"} strokeWidth={w} strokeLinecap="round" />
              <line x1={cx} y1={cy} x2={n.x.toFixed(1)} y2={n.y.toFixed(1)} stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeLinecap="round" pathLength="1" strokeDasharray="0.18 1" style={{ animation: "bosEnvPulse 3.2s ease-in-out " + delay + "s infinite both" }} />
            </g>;
          })}
          {extra > 0 ? <text x={cx} y={VH - 4} fontSize="10.5" fontWeight="700" textAnchor="middle" fill={dark ? "#8a8f9c" : "#9aa1b2"}>и ещё {extra}</text> : null}
        </svg>

        {/* лица — глянцевые диски + золотой бейдж уровня (СОСТОЯНИЕ человека) */}
        {nodes.map(function (n, i) {
          var p = n.p, sz = Math.round(40 + bosEnvNorm(p.b) * 11);
          return (
            <div key={"f" + i} style={{ position: "absolute", left: pctX(n.x), top: pctY(n.y), transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
              {bosEnvNode(p.avatar, p.name, p.level, sz, dark)}
              {p.name ? <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-2)", marginTop: 4, maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div> : null}
            </div>
          );
        })}

        {/* ты — в центре, крупнее */}
        <div style={{ position: "absolute", left: pctX(cx), top: pctY(cy), transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
          {bosEnvNode(app.avatar, app.userName || "", myLevel, 60, dark)}
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-2)", marginTop: 4 }}>Ты</div>
        </div>
      </div>

      {/* твой вклад */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, padding: "0 2px" }}>
        <div style={{ fontSize: 12.5, color: "var(--text-3)", fontWeight: 600, flex: 1 }}>
          {invitedCount > 0 ? <span>Ты позвал <b style={{ color: "var(--text)" }}>{invitedCount}</b> из {total}</span> : <span>Рядом <b style={{ color: "var(--text)" }}>{total}</b> · позови первого своего</span>}
        </div>
        <div style={{ width: 78, height: 5, borderRadius: 3, background: "var(--surface-3)", overflow: "hidden", flexShrink: 0 }}>
          <i style={{ display: "block", height: "100%", borderRadius: 3, width: Math.round((total ? invitedCount / total : 0) * 100) + "%", background: dark ? "rgba(214,220,232,0.7)" : "rgba(112,123,146,0.85)" }} />
        </div>
      </div>

      {/* подсказка ИИ — холодное стекло, как строка колеса баланса */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 13, padding: "12px 13px", borderRadius: 16, border: dark ? "0.5px solid rgba(255,255,255,0.08)" : "0.5px solid #e7ebf2", background: dark ? "rgba(255,255,255,0.04)" : "linear-gradient(180deg,#f7f9fc,#f2f5fa)" }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", background: "radial-gradient(circle at 38% 32%,#eaf2ff,#a9c6ee 70%,#5d7fae)", boxShadow: "0 2px 6px rgba(93,127,174,0.4)" }}>
          {typeof I !== "undefined" && I.Sparkles ? <I.Sparkles size={13} color="#fff" filled /> : <span style={{ color: "#fff", fontSize: 12 }}>✦</span>}
        </div>
        <div style={{ fontSize: 12.7, lineHeight: 1.5, color: "var(--text-2)" }}>
          {nudge.text}
          <div><button className="tap" onClick={nudge.on} style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, borderRadius: 999, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", border: 0, background: nudge.ghost ? "var(--card)" : "#101828", color: nudge.ghost ? "var(--text)" : "#fff", boxShadow: nudge.ghost ? "inset 0 0 0 1px var(--line)" : "none" }}>{nudge.act}</button></div>
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: "var(--text-5)", lineHeight: 1.5, textAlign: "center", margin: "12px 8px 2px", fontStyle: "italic" }}>Ты сам создаёшь окружение — как только сам в балансе.</div>
    </div>
  );
}

function bosEnvInvite(openSheet, navigate, dark) {
  return function () {
    try { if (typeof ShareAppSheetLive === "function") { openSheet(<ShareAppSheetLive dark={dark} />); return; } } catch (e) {}
    try { navigate("home"); } catch (e2) {}
  };
}

function bosEnvPlural(n) {
  var a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return "близких";
  if (b === 1) return "близкий";
  if (b >= 2 && b <= 4) return "близких";
  return "близких";
}

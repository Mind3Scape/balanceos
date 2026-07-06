/* ─────────────────────────────────────────────────────────────────────────────
   БАЛАНС ОКРУЖЕНИЯ — среднее кольцо «Ты → Окружение → Вселенная» на странице ИИ.
   (David 2026-07-06, вариант A «Созвездие». Редизайн v599: строго в стиле «Связей»
   Вселенной — стеклянные нити (толщина = крепость связи, вечный пульс), холодный
   космический фон, никакого тёплого «свечения». Один язык со Вселенной.)

   Идея: твоё окружение = живая паутина связей с близкими. Чем крепче человек в игре,
   тем ТОЛЩЕ и ярче его стеклянная нить к тебе; вся сеть мягко пульсирует, как во
   Вселенной. Индекс окружения = крепость сети, приподнятая твоим балансом → «ты сам
   создаёшь окружение, как только сам в балансе».

   ЖИВЫЕ данные, без нового бэкенда: «твои люди» = кого позвал (invitedPeople) + кто
   позвал (myInviter); их «крепость» = их публичная орбита (profilesPublic по id).

   ИЗОЛЯЦИЯ: отдельный файл. Вызываем ГЛОБАЛЬНЫЕ BuddyFaceLive / bosWheelData /
   ShareAppSheetLive. Рецепт нитей — байт-в-байт как UniverseFieldLive «Связи».
   ───────────────────────────────────────────────────────────────────────────── */

var _bosEnvPeopleCache; // undefined = ещё не грузили; [] = точно нет людей; [...] = есть

// «Крепость связи» человека 0..1 из его публичной орбиты (уровень/прогресс/привычки/цели).
// БЕЗ сигнала свежести (его пока нет) — честно читается как «насколько человек в игре»,
// не как «давно ли заходил». Управляет ТОЛЩИНОЙ нити и размером диска — не цветом.
function bosEnvBond(s) {
  if (!s) return 0.30;
  var lvl = Math.min(s.level || 0, 10);
  var pct = Math.min(Math.max(s.lvlPct || 0, 0), 100);
  var hab = Math.min((s.habits && s.habits.length) || 0, 6);
  var g = Math.min(s.goals || 0, 3);
  var w = 0.26 + lvl * 0.045 + (pct / 100) * 0.18 + hab * 0.035 + g * 0.03;
  return Math.max(0.14, Math.min(1, w));
}
// Слова о КРЕПОСТИ сети (не о тепле): «крепкое/живое/ровное/тихое».
function bosEnvWord(v) { return v >= 72 ? "Крепкое" : v >= 56 ? "Живое" : v >= 40 ? "Ровное" : "Тихое"; }

function BosEnvBalanceLive(props) {
  var app = props.app || {};
  var navigate = props.navigate || function () {};
  var openSheet = props.openSheet || function () {};
  var dark = !!props.dark;

  // рецепт нитей — как во Вселенной (шелл «Связи»)
  var linkCore = dark ? "rgba(214,220,232,0.44)" : "rgba(146,153,167,0.55)";
  var linkHalo = dark ? "rgba(214,220,232,0.14)" : "rgba(170,177,191,0.20)";
  var linkShine = "rgba(255,255,255,0.62)";
  var stageBg = dark
    ? "radial-gradient(125% 95% at 50% 40%, #14161d 0%, #0b0c11 100%)"
    : "radial-gradient(125% 95% at 50% 40%, #fbfcff 0%, #eef1f8 54%, #e6eaf3 100%)";
  var discShadow = dark
    ? "inset 0 0 0 0.7px rgba(255,255,255,0.10), 0 2px 9px rgba(0,0,0,0.34)"
    : "inset 0 0 0 0.7px rgba(20,28,55,0.07), 0 3px 10px rgba(24,34,64,0.14)";

  // ── загрузка «моих людей» + их крепость ──────────────────────────────────────
  var _st = React.useState(function () {
    if (Array.isArray(_bosEnvPeopleCache)) return _bosEnvPeopleCache;
    try { var c = JSON.parse(localStorage.getItem("bos:cache:envPeople") || "null"); if (Array.isArray(c)) return c; } catch (e) {}
    return null; // null = «ещё не знаем» (НЕ путать с [] = «точно нет людей»)
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

        if (!base.length) { // «пусто=правда»: не затираем живой кэш обрывом
          var lp = _bosEnvPeopleCache;
          if (!lp) { try { lp = JSON.parse(localStorage.getItem("bos:cache:envPeople") || "null"); } catch (e) {} }
          if (Array.isArray(lp) && lp.length) return;
          _bosEnvPeopleCache = []; setPeople([]); return;
        }

        var finish = function (stats) {
          if (!on) return;
          stats = stats || {};
          var out = base.map(function (p) {
            return { id: p.id, avatar: p.avatar, name: p.name, inviter: !!p.inviter, mine: !!p.mine, b: bosEnvBond(stats[p.id]) };
          });
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

  var myLight = 0.6;
  try { if (typeof bosWheelData === "function") { var wd = bosWheelData(app); if (wd && wd.overall != null) myLight = Math.max(0, Math.min(1, wd.overall / 100)); } } catch (e) {}

  if (people === null) return null; // грузим — не мигаем

  var Face = function (avatar, name, size) { return (typeof BuddyFaceLive === "function") ? React.createElement(BuddyFaceLive, { avatar: avatar, name: name, size: size }) : null; };
  var pulseKF = "@keyframes bosEnvPulse{from{stroke-dashoffset:0.18}to{stroke-dashoffset:-1}}";

  // ── ПУСТОЕ СОСТОЯНИЕ: связей ещё нет → холодная стеклянная карточка + приглашение ──
  if (!people.length) {
    return (
      <div style={{ background: "var(--card)", borderRadius: 24, boxShadow: "var(--card-shadow)", padding: "16px 16px 15px", overflow: "hidden" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", color: "var(--text-4)", padding: "1px 2px 0" }}>Окружение</div>
        <div style={{ position: "relative", width: "100%", aspectRatio: "320 / 176", borderRadius: 18, overflow: "hidden", margin: "10px 0 12px", background: stageBg, boxShadow: discShadow }}>
          <svg viewBox="0 0 320 176" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
            <style>{pulseKF}</style>
            <line x1="160" y1="88" x2="236" y2="60" stroke={linkCore} strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.5" strokeDasharray="3 5" />
            <line x1="160" y1="88" x2="236" y2="60" stroke={linkShine} strokeWidth="2" strokeLinecap="round" pathLength="1" strokeDasharray="0.18 1" style={{ animation: "bosEnvPulse 3.2s ease-in-out infinite both" }} />
          </svg>
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 50, height: 50, borderRadius: "50%", background: dark ? "rgba(255,255,255,0.06)" : "#fff", boxShadow: discShadow, display: "grid", placeItems: "center" }}>{Face(app.avatar, app.userName || "", 50)}</div>
          <div style={{ position: "absolute", left: "73.7%", top: "34%", transform: "translate(-50%,-50%)", width: 34, height: 34, borderRadius: "50%", border: "1.5px dashed " + (dark ? "rgba(214,220,232,0.4)" : "rgba(120,130,152,0.5)"), display: "grid", placeItems: "center", color: "var(--text-4)", fontSize: 17, fontWeight: 600 }}>＋</div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.2px" }}>Окружение пока пустое</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--text-4)", margin: "4px 0 13px" }}>Позови первого близкого — появится первая нить. Чем больше своих ты зовёшь и держишь рядом, тем плотнее сеть.</div>
        <button className="tap hit44" onClick={bosEnvInvite(openSheet, navigate, dark)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: dark ? "#f2f2f5" : "#101828", color: dark ? "#101828" : "#fff", fontSize: 13, fontWeight: 700, border: 0, borderRadius: 999, padding: "9px 17px", cursor: "pointer" }}>＋ Позвать своего</button>
      </div>
    );
  }

  // ── ЕСТЬ ЛЮДИ: индекс + паутина связей + вклад + подсказка ────────────────────
  var total = people.length;
  var invitedCount = people.filter(function (p) { return p.mine; }).length;
  var avgB = people.reduce(function (s, p) { return s + p.b; }, 0) / total;
  var overall = Math.round((avgB * 0.7 + myLight * 0.3) * 100);
  var word = bosEnvWord(overall);

  // раскладка: крепче связь → ближе и толще нить; до 8 нарисованных
  var shown = people.slice().sort(function (a, b) { return b.b - a.b; });
  var extra = Math.max(0, shown.length - 8);
  shown = shown.slice(0, 8);
  var N = shown.length, cx = 160, cy = 128;
  var nodes = shown.map(function (p, i) {
    var a = (-90 + i * (360 / N)) * Math.PI / 180;
    var rad = 72 + (1 - p.b) * 52;
    return { x: cx + Math.cos(a) * rad * 1.16, y: cy + Math.sin(a) * rad * 0.92, p: p };
  });
  var pctX = function (v) { return (v / 320 * 100).toFixed(2) + "%"; };
  var pctY = function (v) { return (v / 256 * 100).toFixed(2) + "%"; };

  // подсказка — на метафоре НИТИ (честно, без ложной «свежести»): самая тонкая связь
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
    <div style={{ background: "var(--card)", borderRadius: 24, boxShadow: "var(--card-shadow)", padding: "16px 16px 14px", overflow: "hidden" }}>
      {/* индекс — монохром, как центр колеса баланса */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "1px 2px 0" }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", color: "var(--text-4)" }}>Окружение</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 9, marginTop: 3 }}>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-1px", lineHeight: 0.85, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{overall}</div>
            <div style={{ paddingBottom: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.2px" }}>{word}</div>
              <div style={{ fontSize: 11, color: "var(--text-5)", fontWeight: 600 }}>{total} {bosEnvPlural(total)} рядом</div>
            </div>
          </div>
        </div>
      </div>

      {/* паутина связей — «слой Связи» Вселенной в мини-виде */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "320 / 256", borderRadius: 20, overflow: "hidden", background: stageBg, boxShadow: discShadow, margin: "12px 0 4px" }}>
        <svg viewBox="0 0 320 256" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
          <style>{pulseKF}</style>
          <defs><filter id="bosEnvMatte" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="0.8" /></filter></defs>
          {/* редкие тусклые звёзды — фактура Вселенной */}
          {[[36,40],[286,52],[58,210],[276,206],[150,28],[300,140],[20,120],[168,232]].map(function (s, i) { return <circle key={"s" + i} cx={s[0]} cy={s[1]} r={i % 3 ? 0.9 : 1.3} fill={dark ? "#e6eaf3" : "#b8c0d4"} opacity={dark ? 0.5 : 0.55} />; })}
          {/* нити: толщина = крепость связи, вечный пульс каскадом */}
          {nodes.map(function (n, i) {
            var nb = Math.max(0, Math.min(1, (n.p.b - 0.14) / 0.86)); // нормируем: слабый→0, крепкий→1, чтобы разница ТОЛЩИНЫ читалась
            var w = 1.0 + nb * 3.5, op = (0.4 + nb * 0.42).toFixed(2), delay = (0.2 + i * 0.28).toFixed(2);
            return <g key={"t" + i}>
              <line x1={cx} y1={cy} x2={n.x.toFixed(1)} y2={n.y.toFixed(1)} stroke={linkHalo} strokeWidth={(w + 2).toFixed(1)} strokeLinecap="round" filter="url(#bosEnvMatte)" />
              <line x1={cx} y1={cy} x2={n.x.toFixed(1)} y2={n.y.toFixed(1)} stroke={linkCore} strokeWidth={w.toFixed(1)} strokeLinecap="round" strokeOpacity={op} />
              <line x1={cx} y1={cy} x2={n.x.toFixed(1)} y2={n.y.toFixed(1)} stroke={linkShine} strokeWidth={Math.max(1.6, w * 0.82).toFixed(1)} strokeLinecap="round" pathLength="1" strokeDasharray="0.18 1" style={{ animation: "bosEnvPulse 3.2s ease-in-out " + delay + "s infinite both" }} />
            </g>;
          })}
          {extra > 0 ? <text x={cx} y={248} fontSize="10.5" fontWeight="700" textAnchor="middle" fill={dark ? "#8a8f9c" : "#9aa1b2"}>и ещё {extra}</text> : null}
        </svg>

        {/* лица близких — мемоджи на стеклянных дисках, размер по крепости; НИКАКИХ цветных колец */}
        {nodes.map(function (n, i) {
          var p = n.p, nb = Math.max(0, Math.min(1, (p.b - 0.14) / 0.86)), sz = Math.round(31 + nb * 13);
          return (
            <div key={"f" + i} style={{ position: "absolute", left: pctX(n.x), top: pctY(n.y), transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
              <div style={{ width: sz, height: sz, borderRadius: "50%", background: dark ? "rgba(255,255,255,0.06)" : "#fff", boxShadow: discShadow, display: "grid", placeItems: "center", opacity: (0.66 + nb * 0.34).toFixed(2) }}>{Face(p.avatar, p.name, sz)}</div>
              {p.name ? <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-4)", marginTop: 3, maxWidth: 66, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: (0.58 + nb * 0.42).toFixed(2) }}>{p.name}</div> : null}
            </div>
          );
        })}

        {/* ты — в центре, чуть крупнее */}
        <div style={{ position: "absolute", left: pctX(cx), top: pctY(cy), transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: dark ? "rgba(255,255,255,0.08)" : "#fff", boxShadow: dark ? "inset 0 0 0 1px rgba(255,255,255,0.14), 0 4px 16px rgba(0,0,0,0.4)" : "inset 0 0 0 1px rgba(20,28,55,0.09), 0 5px 16px rgba(24,34,64,0.2)", display: "grid", placeItems: "center" }}>{Face(app.avatar, app.userName || "", 52)}</div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", marginTop: 3 }}>Ты</div>
        </div>
      </div>

      {/* твой вклад — монохром, тонкая линия */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, padding: "0 2px" }}>
        <div style={{ fontSize: 12.5, color: "var(--text-3)", fontWeight: 600, flex: 1 }}>
          {invitedCount > 0
            ? <span>Ты позвал <b style={{ color: "var(--text-2)" }}>{invitedCount}</b> из {total}</span>
            : <span>Рядом <b style={{ color: "var(--text-2)" }}>{total}</b> · позови первого своего</span>}
        </div>
        <div style={{ width: 78, height: 5, borderRadius: 3, background: "var(--surface-3)", overflow: "hidden", flexShrink: 0 }}>
          <i style={{ display: "block", height: "100%", borderRadius: 3, width: Math.round((total ? invitedCount / total : 0) * 100) + "%", background: dark ? "rgba(214,220,232,0.6)" : "rgba(120,130,152,0.75)" }} />
        </div>
      </div>

      {/* подсказка ИИ — холодное стекло, как строка-микс колеса баланса */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 13, padding: "12px 13px", borderRadius: 16, border: dark ? "0.5px solid rgba(255,255,255,0.08)" : "0.5px solid #e7ebf2", background: dark ? "rgba(255,255,255,0.04)" : "linear-gradient(180deg,#f7f9fc,#f2f5fa)" }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", background: "radial-gradient(circle at 38% 32%,#eaf2ff,#a9c6ee 70%,#5d7fae)", boxShadow: "0 2px 6px rgba(93,127,174,0.4)" }}>
          {typeof I !== "undefined" && I.Sparkles ? <I.Sparkles size={13} color="#fff" filled /> : <span style={{ color: "#fff", fontSize: 12 }}>✦</span>}
        </div>
        <div style={{ fontSize: 12.7, lineHeight: 1.5, color: "var(--text-2)" }}>
          {nudge.text}
          <div><button className="tap" onClick={nudge.on} style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, borderRadius: 999, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", border: 0, background: nudge.ghost ? "var(--card)" : "#101828", color: nudge.ghost ? "var(--text)" : "#fff", boxShadow: nudge.ghost ? "inset 0 0 0 1px var(--line)" : "none" }}>{nudge.act}</button></div>
        </div>
      </div>

      {/* мантра */}
      <div style={{ fontSize: 11.5, color: "var(--text-5)", lineHeight: 1.5, textAlign: "center", margin: "12px 8px 2px", fontStyle: "italic" }}>
        Ты сам создаёшь окружение — как только сам в балансе.
      </div>
    </div>
  );
}

// Открыть приглашение (единая шторка «Поделиться приложением»); мягкий фолбэк — на Главную.
function bosEnvInvite(openSheet, navigate, dark) {
  return function () {
    try { if (typeof ShareAppSheetLive === "function") { openSheet(<ShareAppSheetLive dark={dark} />); return; } } catch (e) {}
    try { navigate("home"); } catch (e2) {}
  };
}

// «близкий / близких» по числу.
function bosEnvPlural(n) {
  var a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return "близких";
  if (b === 1) return "близкий";
  if (b >= 2 && b <= 4) return "близких";
  return "близких";
}

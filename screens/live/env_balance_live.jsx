/* ─────────────────────────────────────────────────────────────────────────────
   БАЛАНС ОКРУЖЕНИЯ — среднее кольцо «Ты → Окружение → Вселенная» на странице ИИ.
   (David 2026-07-06, вариант A «Созвездие», макет 2026-07-06-баланс-окружения.html)

   Идея: твой свет не заканчивается на тебе — он греет близких, их свет греет тебя.
   Общее свечение = индекс окружения. Твой баланс ПРИПОДНИМАЕТ индекс → «ты сам
   создаёшь окружение, как только сам в балансе». Психология: запись состояния = вклад
   в общий свет своих → человек охотнее отмечается и охотнее заглядывает к тем, кто гаснет.

   ЖИВЫЕ данные, без нового бэкенда: «твои люди» = кого позвал (invitedPeople) + кто
   позвал тебя (myInviter); их «свет» = их публичная орбита (profilesPublic по id:
   level/lvlPct/habits/goals). Read-only — только показываем, ничего не пишем.

   ИЗОЛЯЦИЯ: отдельный файл (не трогаем shared_live.jsx, где идёт параллельная сессия
   ShareSheetLive). Вызываем ГЛОБАЛЬНЫЕ BuddyFaceLive / bosWheelData / ShareAppSheetLive.
   ───────────────────────────────────────────────────────────────────────────── */

// Сессионный кэш — мгновенная отрисовка при переключении вкладок (как bos:cache:orbitPeople).
var _bosEnvPeopleCache; // undefined = ещё не грузили; [] = точно нет людей; [...] = есть

// Палитра-запаска, если у человека ещё нет опубликованных цветных привычек.
var BOS_ENV_PALETTE = ["#FF6B6B", "#FFB020", "#5B8DEF", "#A78BFA", "#2DD4BF", "#34C759", "#F59E0B", "#EC4899"];

// «Свет» человека 0..1 из его публичной орбиты. Без сигнала свежести (пока нет lastActive)
// это ЧЕСТНО читается как «насколько развита/жива его орбита», не как «давно ли заходил».
function bosEnvWarmth(s) {
  if (!s) return 0.30;
  var lvl = Math.min(s.level || 0, 10);
  var pct = Math.min(Math.max(s.lvlPct || 0, 0), 100);
  var hab = Math.min((s.habits && s.habits.length) || 0, 6);
  var g = Math.min(s.goals || 0, 3);
  var w = 0.28 + lvl * 0.045 + (pct / 100) * 0.18 + hab * 0.035 + g * 0.03;
  return Math.max(0.15, Math.min(1, w));
}
// Тёплые НЕЙТРАЛЬНЫЕ слова (без «затихает» — это подразумевало бы свежесть, которой пока нет).
function bosEnvWord(v) { return v >= 70 ? "Оживает" : v >= 55 ? "Тёплое" : v >= 40 ? "Ровное" : "Тихое"; }

function BosEnvBalanceLive(props) {
  var app = props.app || {};
  var navigate = props.navigate || function () {};
  var openSheet = props.openSheet || function () {};
  var dark = !!props.dark;
  var tint = props.tint || ["#cfe1ff", "#7aa4d0", "#1a2c48"];

  // ── загрузка «моих людей» + их свет ──────────────────────────────────────────
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

        // «Пусто = правда»: при обрыве invitedPeople даёт [] (не отличить от «нет друзей»).
        // Если у нас УЖЕ есть живой кэш — не затираем его пустотой (обрыв). У нового юзера
        // кэша нет → пустой ответ проходит как настоящий «пока никого».
        if (!base.length) {
          var lp = _bosEnvPeopleCache;
          if (!lp) { try { lp = JSON.parse(localStorage.getItem("bos:cache:envPeople") || "null"); } catch (e) {} }
          if (Array.isArray(lp) && lp.length) return;
          _bosEnvPeopleCache = []; setPeople([]); return;
        }

        var finish = function (stats) {
          if (!on) return;
          stats = stats || {};
          var out = base.map(function (p, i) {
            var s = stats[p.id] || {};
            var color = (s.habits && s.habits[0] && s.habits[0].c) || BOS_ENV_PALETTE[i % BOS_ENV_PALETTE.length];
            return { id: p.id, avatar: p.avatar, name: p.name, inviter: !!p.inviter, mine: !!p.mine, w: bosEnvWarmth(s), color: color };
          });
          _bosEnvPeopleCache = out;
          try { localStorage.setItem("bos:cache:envPeople", JSON.stringify(out)); } catch (e) {}
          setPeople(function (prev) { return JSON.stringify(prev) === JSON.stringify(out) ? prev : out; });
        };

        var ids = base.map(function (p) { return p.id; });
        if (window.bosCloud.profilesPublic && ids.length) {
          window.bosCloud.profilesPublic(ids).then(finish).catch(function () { finish({}); });
        } else { finish({}); }
      }).catch(function () {});
    } catch (e) {}
    return function () { on = false; };
  }, []);

  // Мой собственный свет 0..1 — приподнимает индекс (из колеса баланса, если доступно).
  var myLight = 0.6;
  try { if (typeof bosWheelData === "function") { var wd = bosWheelData(app); if (wd && wd.overall != null) myLight = Math.max(0, Math.min(1, wd.overall / 100)); } } catch (e) {}

  // Пока грузим (нет ни кэша, ни ответа) — ничего не рисуем, чтобы не мигать.
  if (people === null) return null;

  // ── ПУСТОЕ СОСТОЯНИЕ: людей ещё нет → тёмная карточка + первый повод пригласить ──
  if (!people.length) {
    return (
      <div style={{
        borderRadius: 24, padding: "26px 20px 22px", textAlign: "center", color: "#fff", position: "relative", overflow: "hidden",
        background: "radial-gradient(125% 100% at 50% 30%, #20222b 0%, #14151b 60%, #0c0d12 100%)", boxShadow: "var(--card-shadow)",
      }}>
        <style>{"@keyframes bosEnvSpark{0%,100%{transform:scale(1);opacity:.92}50%{transform:scale(1.08);opacity:1}}"}</style>
        <div style={{
          width: 64, height: 64, borderRadius: "50%", margin: "0 auto 14px", animation: "bosEnvSpark 2.6s ease-in-out infinite",
          background: "radial-gradient(circle at 40% 34%,#fff 0%, #FFD98A 40%, #FF9F45 78%)", boxShadow: "0 0 34px 6px rgba(255,159,69,.5)",
        }} />
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-.2px" }}>Твоё окружение пока в темноте</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "#c7c9d4", maxWidth: 260, margin: "6px auto 16px" }}>
          Пригласи первого близкого — и здесь загорится свет. Чем больше своих ты зовёшь и поддерживаешь, тем ярче общее созвездие.
        </div>
        <button className="tap hit44" onClick={bosEnvInvite(openSheet, navigate, dark)} style={{
          display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", color: "#101828", fontSize: 13, fontWeight: 700,
          border: 0, borderRadius: 999, padding: "9px 18px", cursor: "pointer",
        }}>＋ Позвать своего</button>
      </div>
    );
  }

  // ── ЕСТЬ ЛЮДИ: индекс + созвездие + вклад + подсказка ────────────────────────
  var total = people.length;
  var invitedCount = people.filter(function (p) { return p.mine; }).length;
  var avgW = people.reduce(function (s, p) { return s + p.w; }, 0) / total;
  var overall = Math.round((avgW * 0.7 + myLight * 0.3) * 100);
  var word = bosEnvWord(overall);

  // Раскладка: до 8 нарисованных (ярчайшие вперёд), радиус по теплу (теплее → ближе).
  var shown = people.slice().sort(function (a, b) { return b.w - a.w; });
  var extra = Math.max(0, shown.length - 8);
  shown = shown.slice(0, 8);
  var N = shown.length, cx = 160, cy = 126;
  var nodes = shown.map(function (p, i) {
    var a = (-90 + i * (360 / N)) * Math.PI / 180;
    var rad = 71 + (1 - p.w) * 52;              // 71 (тёплый, близко) .. 123 (тусклый, далеко)
    return { x: cx + Math.cos(a) * rad * 1.16, y: cy + Math.sin(a) * rad * 0.94, p: p };
  });
  var pct = function (v, base) { return (v / base * 100).toFixed(2) + "%"; };

  // Подсказка ИИ — ЧЕСТНАЯ (без ложных «давно не заходил»): по самому тусклому свету.
  var dimmest = shown.reduce(function (m, n) { return (!m || n.w < m.w) ? n : m; }, null);
  var nudge;
  if (dimmest && dimmest.w < 0.45 && dimmest.name) {
    var nm = dimmest.name;
    nudge = {
      text: <span><b>{nm} сейчас светит тусклее всех.</b> Тёплое слово — и круг ярче.</span>,
      act: "💬 Поддержать", ghost: false,
      on: function () { navigate("ai-chat", { prompt: "Подскажи, как по-доброму поддержать близкого (" + nm + "), у которого сейчас мало сил." }); },
    };
  } else if (invitedCount < 3) {
    nudge = {
      text: <span><b>Ты в балансе — самое время делиться.</b> Позови ещё близких: вместе окружение ярче, и вы вырастете вместе.</span>,
      act: "＋ Позвать своего", ghost: true, on: bosEnvInvite(openSheet, navigate, dark),
    };
  } else {
    nudge = {
      text: <span><b>Твоё окружение светлое.</b> Ты держишь его тёплым — так и создаётся круг своих.</span>,
      act: "＋ Позвать ещё", ghost: true, on: bosEnvInvite(openSheet, navigate, dark),
    };
  }

  var warmThread = function (w) { return "rgba(255,184,118," + (0.30 + w * 0.42).toFixed(2) + ")"; };
  var warmCore = function (w) { return "rgba(255,228,192," + (0.40 + w * 0.45).toFixed(2) + ")"; };

  return (
    <div style={{ background: "var(--card)", borderRadius: 24, boxShadow: "var(--card-shadow)", padding: "16px 16px 14px", overflow: "hidden" }}>
      <style>{"@keyframes bosEnvFlow{0%{stroke-dashoffset:.2;opacity:.55}50%{opacity:1}100%{stroke-dashoffset:-1;opacity:.55}}@keyframes bosEnvBreathe{0%,100%{transform:scale(1)}50%{transform:scale(1.02)}}"}</style>

      {/* индекс */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, padding: "2px 2px 0" }}>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-1px", lineHeight: .9, fontVariantNumeric: "tabular-nums", background: "linear-gradient(160deg,#FFB020,#FF7A59)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{overall}</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", letterSpacing: "-.2px", marginBottom: 1 }}>{word}</div>
          <div style={{ fontSize: 11, color: "var(--text-4)", fontWeight: 600 }}>{total} {bosEnvPlural(total)} · твоё созвездие</div>
        </div>
      </div>

      {/* сцена: созвездие (SVG нити + ореол + HTML-лица), мягко дышит целиком */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "320 / 252", margin: "4px 0 2px", animation: "bosEnvBreathe 6.5s ease-in-out infinite", transformOrigin: "center" }}>
        <svg viewBox="0 0 320 252" width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <defs>
            <radialGradient id="bosEnvHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFC98A" stopOpacity="0.5" />
              <stop offset="55%" stopColor="#FF9F7A" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#FF9F7A" stopOpacity="0" />
            </radialGradient>
            <filter id="bosEnvSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.4" /></filter>
          </defs>
          <ellipse cx={cx} cy={cy} rx="150" ry="116" fill="url(#bosEnvHalo)" />
          {[128, 86].map(function (r, i) { return <ellipse key={"g" + i} cx={cx} cy={cy} rx={r} ry={(r * 0.8).toFixed(0)} fill="none" stroke={dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.045)"} strokeWidth="1" />; })}
          {/* нити — свечение + пульсирующая сердцевина */}
          {nodes.map(function (n, i) {
            return <g key={"t" + i}>
              <line x1={cx} y1={cy} x2={n.x.toFixed(1)} y2={n.y.toFixed(1)} stroke={warmThread(n.p.w)} strokeWidth="4.2" strokeLinecap="round" filter="url(#bosEnvSoft)" vectorEffect="non-scaling-stroke" />
              <line x1={cx} y1={cy} x2={n.x.toFixed(1)} y2={n.y.toFixed(1)} stroke={warmCore(n.p.w)} strokeWidth="2.1" strokeLinecap="round" pathLength="1" strokeDasharray="0.2 1" vectorEffect="non-scaling-stroke" style={{ animation: "bosEnvFlow 3.2s ease-in-out " + (i * 0.35) + "s infinite" }} />
            </g>;
          })}
          {/* мягкое свечение под тобой */}
          <circle cx={cx} cy={cy} r="34" fill={tint[1] || "#8fb2e8"} opacity="0.16" />
          {extra > 0 ? <text x={cx} y={244} fontSize="10.5" fontWeight="700" textAnchor="middle" fill={dark ? "#8a8f9c" : "#9f9fa9"}>и ещё {extra}</text> : null}
        </svg>

        {/* лица близких — реальные мемоджи (BuddyFaceLive), позиция по узлам */}
        {nodes.map(function (n, i) {
          var p = n.p, sz = Math.round(30 + p.w * 15), dim = p.w < 0.4;
          return (
            <div key={"f" + i} style={{ position: "absolute", left: pct(n.x, 320), top: pct(n.y, 252), transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
              <div style={{ width: sz, height: sz, borderRadius: "50%", display: "grid", placeItems: "center", boxShadow: "0 0 0 2px " + p.color + ", 0 6px 16px " + p.color + "55", opacity: (0.5 + p.w * 0.5).toFixed(2), filter: dim ? "grayscale(0.35)" : "none" }}>
                {typeof BuddyFaceLive === "function" ? <BuddyFaceLive avatar={p.avatar} name={p.name} size={sz} /> : null}
              </div>
              {p.name ? <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-4)", marginTop: 3, opacity: (0.5 + p.w * 0.5).toFixed(2), maxWidth: 64, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div> : null}
            </div>
          );
        })}

        {/* ты — в центре, ярче всех */}
        <div style={{ position: "absolute", left: pct(cx, 320), top: pct(cy, 252), transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
          <div style={{ width: 54, height: 54, borderRadius: "50%", display: "grid", placeItems: "center", boxShadow: "0 0 0 2.5px " + (tint[0] || "#cfe1ff") + ", 0 8px 22px " + (tint[1] || "#7aa4d0") + "66", background: "radial-gradient(circle at 38% 32%, " + (tint[0] || "#eaf2ff") + ", " + (tint[2] || "#26364f") + ")" }}>
            {typeof BuddyFaceLive === "function" ? <BuddyFaceLive avatar={app.avatar} name={app.userName || ""} size={54} /> : null}
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", marginTop: 3 }}>Ты</div>
        </div>
      </div>

      {/* твой вклад */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, padding: "0 2px" }}>
        <div style={{ fontSize: 12.5, color: "var(--text-3)", fontWeight: 600, flex: 1 }}>
          {invitedCount > 0
            ? <span>Ты позвал <b style={{ color: "var(--text-2)" }}>{invitedCount}</b> · рядом {total}</span>
            : <span>Рядом <b style={{ color: "var(--text-2)" }}>{total}</b> · позови первого своего</span>}
        </div>
        <div style={{ width: 76, height: 6, borderRadius: 4, background: "var(--surface-3)", overflow: "hidden", flexShrink: 0 }}>
          <i style={{ display: "block", height: "100%", borderRadius: 4, width: Math.round((total ? invitedCount / total : 0) * 100) + "%", background: "linear-gradient(90deg,#FFC24A,#FF7A59)" }} />
        </div>
      </div>

      {/* подсказка ИИ */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 14, padding: "12px 13px", borderRadius: 16, border: dark ? "0.5px solid rgba(255,180,100,0.18)" : "0.5px solid #f2e5d8", background: dark ? "rgba(255,170,90,0.10)" : "linear-gradient(180deg,#fff8f0,#fdf2e9)" }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", background: "radial-gradient(circle at 38% 32%,#FFE9C2,#FFB765 70%,#F59A3C)", boxShadow: "0 2px 6px rgba(245,154,60,.4)" }}>
          {typeof I !== "undefined" && I.Sparkles ? <I.Sparkles size={13} color="#fff" filled /> : <span style={{ color: "#fff", fontSize: 12 }}>✦</span>}
        </div>
        <div style={{ fontSize: 12.7, lineHeight: 1.5, color: "var(--text-2)" }}>
          {nudge.text}
          <div><button className="tap" onClick={nudge.on} style={{
            display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, borderRadius: 999, padding: "6px 13px", fontSize: 12, fontWeight: 600, cursor: "pointer", border: 0,
            background: nudge.ghost ? "var(--card)" : "#101828", color: nudge.ghost ? "var(--text)" : "#fff", boxShadow: nudge.ghost ? "inset 0 0 0 1px var(--line)" : "none",
          }}>{nudge.act}</button></div>
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
    try {
      if (typeof ShareAppSheetLive === "function") { openSheet(<ShareAppSheetLive dark={dark} />); return; }
    } catch (e) {}
    try { navigate("home"); } catch (e2) {}
  };
}

// «близкий / близких / близких» по числу.
function bosEnvPlural(n) {
  var a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return "близких";
  if (b === 1) return "близкий";
  if (b >= 2 && b <= 4) return "близких";
  return "близких";
}

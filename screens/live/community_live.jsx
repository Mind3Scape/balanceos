/* COMMUNITY — LIVE-only fork of CommunityScreen + TeamDetailScreen (real Telegram
   user, app.mode === "live" is ALWAYS true here). Giving the live user its OWN
   screen files keeps the two demo modes ('demo' / 'fresh') frozen — future live
   edits can never break the showcase.

   What the demo/fresh branches contributed (all stripped here):
   • CommunityLive — drops the fabricated Нетворк people list (YourImpactCard +
     the curated `network` array + their message/booking buttons) and the demo-only
     Партнёры marketplace tab + its `partners` array. Live Нетворк ALWAYS shows the
     honest NetworkLockedLive banner (real XP paths, no fake people); the secondary
     scope bar is just Нетворк + Курсы. Курсы are real (kept), with live cohort
     windows computed from today. Teams + cloud "Открытые команды рядом" discovery
     are kept.
   • TeamDetailLive — drops the demo team calendar, demo activity feed, demo chat
     line, the fabricated leaderboard (contribution %, 👑 leader, expandable
     per-member habit chips) and the DEFAULT_TEAM_HABITS seed. Live keeps the REAL
     cloud roster (window.bosCloud.teamMembers → BOS_TEAM_PALETTE colours + dark
     initials), real team habits (teamHabitsFull / toggleTeamHabitToday), owner
     join-request approvals, leave/delete, and the share-link sheet.

   Everything else reuses the shared core/ toolkit (BOS_TEAM_PALETTE, AvatarStack,
   ConfirmActionSheet, TeamShareSheet, TeamHabitSheet, TeamRing) +
   the live forks in shared_live.jsx (NetworkLockedLive, PeopleMonthCalendarLive,
   CloudTeamsDiscoverLive) +
   framework (BosAvatar, PageHeader, the icon object I, the bos* helpers, window.bosCloud,
   hooks useApp/useNav/useSheet, and useCS = React.useState). The ONLY new top-level
   declarations in this file are `function CommunityLive` and `function TeamDetailLive`. */

// LIVE team card — shows the REAL cloud roster (member count + real avatars) for a team you're
// in, not the stale local t.members (that mismatch was «3 снаружи / 0 внутри»). AvatarStack
// already caps at 5 faces + a «+N» overflow chip (iOS-style) and uses each member's real
// avatar. Local-only teams fall back to their own members; empty cloud team = honest «ты один».
function LiveTeamCard({ t, navigate, rhythm }) {
  // Карточка круга теперь БЕЛАЯ как привычки/цели (David: «в целях карточки того же цвета — единый
  // стиль»). Круги живут среди целей, поэтому делим единый белый вид; эмблема-watermark + чипы-стекло.
  const tgt = t.target || 0;
  const cur = t.current != null ? t.current : Math.round((t.progress || 0) * tgt);
  const gp = tgt > 0 ? Math.min(1, cur / tgt) : (t.progress || 0);
  const palette = (typeof BOS_TEAM_PALETTE !== "undefined") ? BOS_TEAM_PALETTE : ["#7FB3F2"];
  const _cloud = !!(t.cloudId && window.bosCloud && window.bosCloud.enabled() && window.bosCloud.teamMembers);
  // Ростер из ОБЩЕГО кэша круга (тот же bos:cache:team:roster:*, что ест деталь круга): лица видны
  // СРАЗУ, сеть ревалидирует фоном — карточка не показывает скелетон при каждом заходе на список.
  const [roster, setRoster] = React.useState(() => {
    const c = _cloud && typeof _bosTeamGet === "function" ? _bosTeamGet("roster:" + t.cloudId) : null;
    return Array.isArray(c) ? c : null;
  });
  React.useEffect(() => {
    if (!_cloud) return;
    let on = true;
    window.bosCloud.teamMembers(t.cloudId).then((mem) => {
      if (!on || !Array.isArray(mem)) return;
      // «Пусто = правда»-защита: teamMembers при обрыве возвращает [] → пустой ростер ПРИ ЖИВОМ КЭШЕ =
      // обрыв (в круге всегда есть хотя бы владелец) → не затираем общий кэш круга пустым.
      if (!mem.length) { const _c = typeof _bosTeamGet === "function" ? _bosTeamGet("roster:" + t.cloudId) : null; if (Array.isArray(_c) && _c.length) { setRoster(_c); return; } }
      // Пишем в общий кэш ТОТ ЖЕ формат и порядок (owner первым), что и деталь круга — один кэш, два едока.
      const sorted = mem.slice().sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0));
      const mapped = sorted.map((m, j) => ({ id: m.id, name: m.name || "Участник", avatar: m.avatar, role: m.role, initials: (m.name || "У").slice(0, 1).toUpperCase(), color: palette[j % palette.length] }));
      if (typeof _bosTeamPut === "function") _bosTeamPut("roster:" + t.cloudId, mapped);
      setRoster(mapped);
    }).catch(() => { if (on) setRoster([]); });
    return () => { on = false; };
  }, [t.cloudId]);
  // РИТМ СЕГОДНЯ (opt-in, для «Мои круги»): сколько РАЗНЫХ людей закрыли привычку круга сегодня
  // = объединение todayUsers по общим привычкам (честно из облака). 0/нет данных → чип не показан.
  const [rhythmN, setRhythmN] = React.useState(null);
  React.useEffect(() => {
    if (!rhythm || !_cloud || !window.bosCloud.teamHabitsFull) return;
    let on = true;
    window.bosCloud.teamHabitsFull(t.cloudId).then((hs) => {
      if (!on || !Array.isArray(hs)) return;
      const set = {};
      hs.forEach((h) => { if (h && Array.isArray(h.todayUsers)) h.todayUsers.forEach((u) => { set[u] = true; }); });
      setRhythmN(Object.keys(set).length);
    }).catch(() => {});
    return () => { on = false; };
  }, [rhythm, t.cloudId]);
  // Непрочитанные в чате круга → значок на ВНЕШНЕЙ карточке (David: «сразу видно, что в круге
   // новые сообщения»). Лёгкий count-only peek с кэшем 60с (bosTeamUnreadPeek).
  const [unreadN, setUnreadN] = React.useState(0);
  React.useEffect(() => {
    if (!(_cloud && typeof bosTeamUnreadPeek === "function")) return;
    let on = true;
    bosTeamUnreadPeek(t.cloudId).then((u) => { if (on && u) setUnreadN(u.count || 0); }).catch(() => {});
    return () => { on = false; };
  }, [t.cloudId]);
  const _loading = _cloud && roster === null; // cloud roster not back yet → skeleton, never «ты один»
  const members = _cloud ? (roster || []) : (t.members || []);
  const count = members.length;
  const ruPart = (n) => { const m = n % 10, h = n % 100; return (m === 1 && h !== 11) ? "участник" : (m >= 2 && m <= 4 && (h < 10 || h >= 20)) ? "участника" : "участников"; };
  // Инфо ЧИПАМИ, не строчками вразброс (David: «чипы для разной инфо вместо разброса»).
  const chipS = { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600, color: "var(--text-2)", ...bosChipGlass(false), padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" };
  // t.goal у ОБЛАЧНОГО круга — jsonb-ОБЪЕКТ {title,target,unit,type,stake,desc}, а не строка. Рендер
  // объекта как React-ребёнка = краш (error #31, «Мои круги»). Достаём безопасную подпись-строку.
  var _goalLabel0 = (typeof t.goal === "string") ? t.goal
    : (t.goal && typeof t.goal === "object" ? ((typeof t.goal.title === "string" ? t.goal.title : "") || (t.goal.target ? (t.goal.target + (typeof t.goal.unit === "string" && t.goal.unit ? " " + t.goal.unit : "")) : "")) : "");
  // Страховка: если в поле всё же затесалось «[object Object]» (из старого бага сохранения) — не
  // показываем мусор, строим подпись из числа цели (David: «в Сообществе показывает [object Object]»).
  const _goalLabel = (_goalLabel0 && _goalLabel0.indexOf("[object") < 0) ? _goalLabel0 : (tgt ? (tgt + " " + (typeof t.unit === "string" && t.unit ? t.unit : "раз")) : "");
  const _dateLabel = (typeof t.date === "string") ? t.date : "";
  const _unitLabel = (typeof t.unit === "string") ? t.unit : "";
  return (
    <div className="tap" onClick={() => navigate("team-detail", { team: t })} style={{ background: "var(--card)", boxShadow: "var(--card-shadow)", borderRadius: 22, padding: 18, position: "relative", overflow: "hidden", cursor: "pointer" }}>
      <div aria-hidden className="team-card__emblem" style={{ position: "absolute", top: -10, right: -6, fontSize: 110, lineHeight: 1, pointerEvents: "none", transform: "rotate(8deg)" }}>{bosIcon(t.emblem, 88, null)}</div>
      {unreadN > 0 && (
        <span aria-label={"новых сообщений: " + unreadN} style={{ position: "absolute", top: 12, right: 12, zIndex: 2, display: "inline-flex", alignItems: "center", gap: 4, background: "#FF3B30", color: "#fff", borderRadius: 999, padding: "3px 8px", fontSize: 11, fontWeight: 800, boxShadow: "0 2px 8px rgba(255,59,48,0.4)" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#fff"><path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V6a2 2 0 0 1 2-2z"/></svg>
          {unreadN > 99 ? "99+" : unreadN}
        </span>
      )}
      <div style={{ position: "relative" }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: "var(--text)", letterSpacing: "-0.4px" }}>{t.name}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {rhythm && rhythmN > 0 && <span style={{ ...chipS, color: "#1E8E4E", background: "rgba(52,199,89,0.13)", boxShadow: "none" }}>● сегодня {rhythmN} в ритме</span>}
          {_goalLabel && <span style={chipS}>🎯 {_goalLabel}</span>}
          {_dateLabel && <span style={chipS}>📅 {_dateLabel}</span>}
          {!_loading && count > 0 && <span style={chipS}>👥 {count}</span>}
          <span style={chipS}>{t.vis === "public" ? "🌐 Открытая" : "🔒 Приватная"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
          <span>{t.target ? "К цели" : "Прогресс цели"}</span>
          <span style={{ color: "var(--text)" }}>{t.target ? (cur + " / " + tgt + (_unitLabel ? " " + _unitLabel : "")) : Math.round(gp * 100) + "%"}</span>
        </div>
        <div style={{ marginTop: 6, height: 8, borderRadius: 999, background: "var(--card-track)", overflow: "hidden" }}>
          <span className="team-card__fill" style={{ display: "block", height: "100%", width: (gp * 100) + "%", borderRadius: 999 }} />
        </div>
        {/* Кнопка убрана — тап по всей карточке открывает круг (David). Лица (кружочки людей) СОХРАНЕНЫ. */}
        <div style={{ display: "flex", alignItems: "center", marginTop: 14, gap: 8 }}>
          {_loading
            ? <div style={{ display: "flex" }}>{[0, 1, 2].map((i) => (<span key={i} className="bos-skel" style={{ width: 28, height: 28, borderRadius: "50%", marginLeft: i ? -10 : 0, border: "2px solid var(--card)" }} />))}</div>
            : count > 0 ? <PeopleStackLive people={members} size={28} max={5} /> : <span style={{ fontSize: 12, color: "var(--text-4)" }}>Пока ты один — позови друзей</span>}
        </div>
      </div>
    </div>
  );
}

/* Заголовок секции ленты «Найти» (v526, по макету): компактный UPPERCASE-кикер, как у
   полок внутри витрин — один ритм на всю страницу; onAll → маленькая «Все ›» справа
   (паттерн App Store «See All»), которая переключает чип на полный раздел. */
function CommSectionHeadLive({ title, onAll }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, padding: "4px 4px 0" }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)" }}>{title}</span>
      {onAll && (
        <button onClick={onAll} className="tap" data-haptic="selection"
          style={{ border: 0, background: "transparent", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 1,
            fontSize: 12.5, fontWeight: 600, color: "var(--text-3)", padding: 0, flexShrink: 0 }}>
          Все <I.ChevronRight size={13} color="var(--text-4)" />
        </button>
      )}
    </div>
  );
}

/* Баннер «Как устроен Balance» на «Сообществе» → гид. Вынесен из ленты, чтобы жить
   отдельным атомом (и превьюиться в _devguide.html). David: иконки-шаги (состояние/день/
   свои/город) — «непонятно», палитра приложения = БЕЛЫЙ · ЧЁРНЫЙ · немного ЗОЛОТА. Теперь
   БЕЗ иконок: чёрная карта «звёздное небо» (белые + золотые звёзды, лёгкое золотое сияние),
   копия прежняя, золотой CTA. Тап → «Как устроен Balance». */
function CommunityGuideBannerLive({ navigate, isDark }) {
  // Фиксированное звёздное поле [left%, top%, размер, золотая?, прозрачность] — стабильно между
  // рендерами (без Math.random). Большинство белые, несколько золотых-акцентов.
  var stars = [
    [7, 22, 1.5, 0, 0.5], [14, 58, 1.8, 0, 0.65], [21, 33, 1.2, 0, 0.4], [27, 74, 1.6, 1, 0.9],
    [33, 15, 2.3, 1, 0.95], [39, 49, 1.3, 0, 0.5], [45, 80, 1.7, 0, 0.6], [51, 27, 1.4, 0, 0.55],
    [57, 63, 1.9, 1, 0.85], [62, 38, 1.3, 0, 0.5], [68, 72, 1.6, 0, 0.6], [73, 18, 2.1, 1, 0.9],
    [79, 52, 1.5, 0, 0.6], [84, 34, 1.3, 0, 0.5], [89, 68, 1.7, 0, 0.65], [93, 25, 1.4, 1, 0.85],
    [11, 84, 1.3, 0, 0.45], [37, 88, 1.5, 0, 0.5], [65, 86, 1.4, 0, 0.5], [95, 50, 1.6, 0, 0.55],
    [4, 44, 1.2, 0, 0.4], [18, 12, 1.4, 0, 0.5], [49, 9, 1.7, 1, 0.8], [82, 82, 1.3, 0, 0.45], [70, 55, 1.2, 0, 0.4],
  ];
  return (
    <button onClick={() => { if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } navigate("guide", { from: "community" }); }} className="tap"
      style={{ position: "relative", overflow: "hidden", width: "100%", border: 0, textAlign: "left", cursor: "pointer",
        background: "radial-gradient(120% 92% at 24% -8%, #1b1b24 0%, #101014 48%, #08080a 100%)",
        borderRadius: 24, boxShadow: "var(--card-shadow), inset 0 0 0 1px rgba(255,255,255,0.06)", padding: "19px 18px 16px" }}>
      {/* звёздное поле + мягкое золотое сияние-рассвет */}
      <span aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {stars.map(function (s, i) {
          return <span key={i} style={{ position: "absolute", left: s[0] + "%", top: s[1] + "%", width: s[2], height: s[2], borderRadius: "50%", background: s[3] ? "#FEDE34" : "#fff", opacity: s[4], boxShadow: s[3] ? "0 0 5px rgba(254,222,52,0.85)" : "0 0 3px rgba(255,255,255,0.5)" }} />;
        })}
        <span style={{ position: "absolute", right: "-14%", top: "-30%", width: "62%", height: "88%", background: "radial-gradient(circle, rgba(239,159,20,0.20), transparent 68%)" }} />
      </span>

      <div style={{ position: "relative" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>как это работает</div>
        <div style={{ fontSize: 21, fontWeight: 850, letterSpacing: "-0.55px", color: "#fff", marginTop: 7, lineHeight: 1.12, fontFamily: "var(--bos-title-font)" }}>Собери день — найди своих</div>
        <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)", marginTop: 8, lineHeight: 1.46, maxWidth: 305 }}>Отмечай состояние, закрывай привычки и цели — Balance покажет круги, людей и места по твоему ритму.</div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 17 }}>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, width: "100%", fontSize: 13.5, fontWeight: 800, color: "#0a0a0a", background: "linear-gradient(135deg,#FEDE34,#EF9F14)", borderRadius: 999, padding: "12px 16px", boxShadow: "0 8px 20px rgba(239,159,20,0.42)" }}>Как устроен Balance · 3 минуты ›</span>
        </div>
      </div>
    </button>
  );
}

/* ══════════ ЛЕНТА «ОТКРЫТИЙ» (v670) ══════════════════════════════════════════════
   David 2026-07-10 (макет design-mockups/2026-07-10-лента-открытий.html): единый гид
   РАСФОРМИРОВАН — вместо одного баннера-«книги» горизонтальная лента карточек-подсказок,
   и КАЖДАЯ открывает СВОЮ шторку про одну механику («как в игре»). Обложка «Суть» уходит,
   когда человек открыл все 6 шторок. Скрытие карточки крестиком — НАВСЕГДА: localStorage +
   облачный union-merge (через extras в shell.jsx, тем же путём, что claimedChallenges).
   Палитра хрома: белый · чёрный · золото. GuideLive пока НЕ трогаем (переезд позже). */
var BOS_GOLD = "#FEDE34";

/* Изоляция блоков «Сообщества»: если один блок падает на неожиданных данных, он ТИХО
   скрывается (или показывает fallback), а страница живёт дальше — вместо общего «Что-то
   сбилось». Имя блока пишется в консоль → точечная диагностика с устройства пользователя. */
var BosBlockBoundary = class extends React.Component {
  constructor(p) { super(p); this.state = { dead: false }; }
  static getDerivedStateFromError() { return { dead: true }; }
  componentDidCatch(err, info) { try { console.error("BalanceOS community block crash [" + (this.props.name || "?") + "]:", (err && (err.stack || err.message)) || err, info && info.componentStack); } catch (e) {} }
  render() { return this.state.dead ? (this.props.fallback || null) : this.props.children; }
};
function BosBlock(props) { return <BosBlockBoundary name={props.name} fallback={props.fallback || null}>{props.children}</BosBlockBoundary>; }
// Пороги «лесенки» замочков на странице — легко правимые (David ещё не уверен в точных цифрах).
var BOS_DISC_GATES = { showcase: 3, people: 10, map: 3 };
// Шторки колоды — обложка «прожита», когда открыты все.
var BOS_DISC_SHEETS = ["core", "xp", "together", "helpers", "ch", "partners", "people"];

function bosDiscBag(lsKey) { try { return JSON.parse(localStorage.getItem(lsKey) || "{}") || {}; } catch (e) { return {}; } }
function bosDiscMark(lsKey, id) {
  var bag = bosDiscBag(lsKey);
  if (bag[id]) return bag;
  bag[id] = 1;
  try { localStorage.setItem(lsKey, JSON.stringify(bag)); } catch (e) {}
  try { window.dispatchEvent(new Event("bos:discoveryChanged")); } catch (e) {}
  return bag;
}
function bosFmtXP(n) { return String(n | 0).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }

// ── общие атомы шторок-подсказок ──
var _dSTitle = { textAlign: "center", fontSize: 19, fontWeight: 800, letterSpacing: "-0.35px", padding: "6px 0 2px", color: "var(--text)" };
var _dSSub = { textAlign: "center", fontSize: 12.5, color: "var(--text-3)", paddingBottom: 12 };
var _dSCard = { background: "var(--card)", borderRadius: 20, padding: 14, boxShadow: "var(--card-shadow)", marginBottom: 10 };
var _dSKick = { fontSize: 10.5, fontWeight: 800, letterSpacing: 1.2, color: "var(--text-4)", padding: "4px 4px 8px" };
var _dSText = { fontSize: 13.5, lineHeight: 1.5, color: "var(--text-2)", padding: "0 2px 12px" };
var _dGbtn = { width: "100%", border: 0, background: "var(--cta, #0a0a0a)", color: "var(--cta-ink, #fff)", fontFamily: "inherit", fontSize: 15, fontWeight: 700, borderRadius: 16, padding: 14, cursor: "pointer" };
var _dGold = { fontSize: 12, fontWeight: 800, background: BOS_GOLD, color: "#0a0a0a", borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap", marginLeft: "auto" };

// строка таблицы «откуда опыт / вехи» (иконка слева опциональна, значение-пилюля справа)
function _dXRow({ icon, label, value, first, quiet }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 2px", borderTop: first ? 0 : "0.5px solid var(--line)", fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>
      {icon && <span style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--surface-3)", display: "grid", placeItems: "center", flexShrink: 0 }}>{icon}</span>}
      <span>{label}</span>
      <span style={{ ..._dGold, ...(quiet ? { background: "var(--surface-3)", color: "var(--text-2)", fontWeight: 800 } : null) }}>{value}</span>
    </div>
  );
}

// ═════ ШТОРКА 0 · СУТЬ ═════
function DiscoveryCoreSheetLive({ app, navigate, isDark }) {
  const { close } = (typeof useSheet === "function") ? useSheet() : { close: () => {} };
  const loopPill = (icon, txt) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--card)", border: "0.5px solid var(--line)", borderRadius: 999, padding: "8px 12px", fontSize: 12.5, fontWeight: 700, color: "var(--text)", boxShadow: "var(--card-shadow)" }}>{icon}{txt}</span>
  );
  const step = (n, t, d) => (
    <div><div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text)" }}>{n}</div><div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2, lineHeight: 1.3 }}>{d}</div></div>
  );
  return (
    <div className="bos-sheet-scroll" style={{ paddingTop: 2, paddingLeft: 16, paddingRight: 16, color: "var(--text)" }}>
      {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
      <div style={_dSTitle}>Как устроен Balance</div>
      <div style={_dSSub}>одна минута — и всё ясно</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "2px 0 12px", flexWrap: "wrap" }}>
        {loopPill(<svg width="13" height="13" viewBox="0 0 24 24" fill="var(--text)"><circle cx="12" cy="12" r="8" /></svg>, "Состояние")}
        <span style={{ color: "var(--text-4)", fontWeight: 800 }}>→</span>
        {loopPill(<svg width="13" height="13" viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="var(--text)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>, "Ход")}
        <span style={{ color: "var(--text-4)", fontWeight: 800 }}>→</span>
        {loopPill(<svg width="13" height="13" viewBox="0 0 24 24" fill="var(--text)"><path d="M4 20c8-1 12-5 14-13l2-3-3 2C9 8 5 12 4 20z" /></svg>, "Смысл")}
      </div>
      <div style={{ ..._dSText, textAlign: "center" }}>Отметь, как ты. Сделай ход по привычке. Запиши пару слов. <b style={{ color: "var(--text)" }}>День собран ✦</b> — опыт капает, уровень растёт.</div>
      <div style={{ ..._dSCard, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {step("1 · Собери себя", null, "состояние, привычки, день")}
        {step("2 · Найди своих", null, "круги и общие привычки")}
        {step("3 · Стань полезен", null, "помощь своим за опыт")}
        {step("4 · Выйди в жизнь", null, "практики и места рядом")}
      </div>
      <button className="tap" style={_dGbtn} onClick={() => { close(); navigate("habits"); }}>Сделать первый ход</button>
    </div>
  );
}

// ═════ ШТОРКА 1 · ОПЫТ И УРОВЕНЬ ═════
function DiscoveryXPSheetLive({ app, navigate, isDark }) {
  const { close } = (typeof useSheet === "function") ? useSheet() : { close: () => {} };
  const info = (typeof bosLevelInfoLive === "function" && typeof bosLiveXPLive === "function") ? bosLevelInfoLive(bosLiveXPLive(app)) : { level: 1, xp: 0, into: 0, span: 100 };
  const frac = info.span > 0 ? Math.max(0.02, Math.min(1, info.into / info.span)) : 0;
  const C = 182, off = C * (1 - frac), toNext = Math.max(0, (info.span | 0) - (info.into | 0));
  const rowIcon = {
    mark: <svg width="14" height="14" viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="var(--text)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    duo: <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--text)"><circle cx="8.4" cy="8" r="3.2" /><path d="M2.8 18.4c0-3 2.5-5.2 5.6-5.2s5.6 2.2 5.6 5.2c0 .74-.6 1.34-1.34 1.34H4.14c-.74 0-1.34-.6-1.34-1.34z" /><circle cx="16.6" cy="8.6" r="2.5" opacity=".45" /></svg>,
    state: <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--text)"><circle cx="12" cy="12" r="7" /></svg>,
    note: <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--text)"><path d="M4 20c8-1 12-5 14-13l2-3-3 2C9 8 5 12 4 20z" /></svg>,
    day: <svg width="14" height="14" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.6" fill="none" stroke="var(--text)" strokeWidth="2.6" /><path d="M8.6 12.3l2.3 2.3 4.5-5" fill="none" stroke="var(--text)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    week: <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--text)"><path d="M12 2c1.2 3.4-.8 4.6-.8 6.8a3 3 0 0 0 5.9.6C18.6 11 20 13.2 20 15.3A8 8 0 1 1 4 15.3c0-2.6 1.6-4.2 2.6-5.8.5 1.9 1.4 2.6 2.5 2.6C8 9 10 5.4 12 2z" /></svg>,
    friend: <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--text)"><circle cx="12" cy="8" r="3.6" /><path d="M4.8 20c.9-3.4 3.8-5.4 7.2-5.4s6.3 2 7.2 5.4" stroke="var(--text)" strokeWidth="2.2" fill="none" strokeLinecap="round" /></svg>,
  };
  return (
    <div className="bos-sheet-scroll" style={{ paddingTop: 2, paddingLeft: 16, paddingRight: 16, color: "var(--text)" }}>
      {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
      <div style={_dSTitle}>Опыт и уровень</div>
      <div style={_dSSub}>каждый ход — шаг по пути</div>
      <div style={{ ..._dSCard, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ position: "relative", width: 68, height: 68, flexShrink: 0 }}>
          <svg width="68" height="68" viewBox="0 0 68 68" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="34" cy="34" r="29" fill="none" stroke="var(--surface-3)" strokeWidth="7" />
            <circle cx="34" cy="34" r="29" fill="none" stroke={BOS_GOLD} strokeWidth="7" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} />
          </svg>
          <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{info.level}</span>
        </div>
        <div>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--text)" }}>Уровень {info.level} · {bosFmtXP(info.xp)} XP</div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3, lineHeight: 1.4 }}>До {info.level + 1} уровня — {bosFmtXP(toNext)} XP. Уровень <b style={{ color: "var(--text)" }}>не сгорает</b> и не тратится.</div>
        </div>
      </div>
      <div style={_dSKick}>ОТКУДА ОПЫТ</div>
      <div style={{ ..._dSCard, padding: "6px 14px" }}>
        {_dXRow({ icon: rowIcon.mark, label: "Отметка привычки", value: "+10", first: true })}
        {_dXRow({ icon: rowIcon.duo, label: "Отметка вместе", value: "+15" })}
        {_dXRow({ icon: rowIcon.state, label: "Состояние дня", value: "+5" })}
        {_dXRow({ icon: rowIcon.note, label: "Пара слов в дневник", value: "+10" })}
        {_dXRow({ icon: rowIcon.day, label: "Все привычки дня", value: "+30" })}
        {_dXRow({ icon: rowIcon.week, label: "Неделя состояния подряд", value: "+50" })}
        {_dXRow({ icon: rowIcon.friend, label: "Друг пришёл по ссылке", value: "+150" })}
      </div>
      <div style={_dSKick}>ДВЕ РОЛИ ОПЫТА</div>
      <div style={{ ..._dSCard, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div><div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>Уровень</div><div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 3, lineHeight: 1.4 }}>Путь. Только растёт, открывает двери — Люди, Нетворк.</div></div>
        <div><div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>Копилка ✦</div><div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 3, lineHeight: 1.4 }}>Топливо. Трать у партнёров и людей — уровень от траты не падает.</div></div>
      </div>
      <button className="tap" style={_dGbtn} onClick={() => { close(); navigate("home"); }}>Отметить сегодняшний ход</button>
    </div>
  );
}

// ═════ ШТОРКА 2 · ВМЕСТЕ ═════
function DiscoveryTogetherSheetLive({ app, navigate, isDark }) {
  const sheet = (typeof useSheet === "function") ? useSheet() : { open: () => {}, close: () => {} };
  const face = (bg, txt) => (
    <span style={{ width: 44, height: 44, borderRadius: "50%", border: "2.5px solid var(--card)", display: "grid", placeItems: "center", fontSize: 14, fontWeight: 800, color: "#fff", background: bg }}>{txt}</span>
  );
  return (
    <div className="bos-sheet-scroll" style={{ paddingTop: 2, paddingLeft: 16, paddingRight: 16, color: "var(--text)" }}>
      {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
      <div style={_dSTitle}>Вместе — больше</div>
      <div style={_dSSub}>совместные привычки и цели</div>
      <div style={{ ..._dSCard, display: "flex", alignItems: "center", gap: 13 }}>
        <span style={{ display: "flex", alignItems: "center" }}>{face("#0a0a0a", "Ты")}<span style={{ marginLeft: -10, display: "flex" }}>{face("#9c9ca3", "А")}</span></span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text)" }}>Пробежка · вдвоём</div>
          <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>каждый ведёт свою копию</div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, background: BOS_GOLD, color: "#0a0a0a", borderRadius: 999, padding: "5px 10px" }}>✦ +15</span>
      </div>
      <div style={_dSText}>Поделись привычкой или собери круг под цель. Отметка в совместной — <b style={{ color: "var(--text)" }}>+15 вместо +10</b>. Никто никого не тянет: у каждого своя копия, а рядом — живой пульс своих.</div>
      <div style={_dSKick}>ТВОИ ЛЮДИ — ТВОИ ВЕХИ</div>
      <div style={{ ..._dSCard, padding: "6px 14px" }}>
        {_dXRow({ label: "Друг пришёл по твоей ссылке", value: "+150", first: true })}
        {_dXRow({ label: "3 своих", value: "+300" })}
        {_dXRow({ label: "7 своих", value: "+700" })}
        {_dXRow({ label: "15 своих", value: "+1500" })}
        {_dXRow({ label: "30 своих", value: "+3000" })}
      </div>
      <button className="tap" style={_dGbtn} onClick={() => { if (typeof ShareSheetLive === "function") sheet.open(<ShareSheetLive kind="app" dark={isDark} />); }}>Позвать своего</button>
    </div>
  );
}

// ═════ ШТОРКА 3 · ЧЕЛЛЕНДЖИ ═════
function DiscoveryChSheetLive({ app, navigate, isDark }) {
  const sheet = (typeof useSheet === "function") ? useSheet() : { open: () => {}, close: () => {} };
  const starters = (typeof CHALLENGE_STARTERS !== "undefined") ? CHALLENGE_STARTERS.slice(0, 5) : [];
  const pick = (c) => {
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
    if (typeof ChallengeIntroSheet === "function") sheet.open(<ChallengeIntroSheet c={c} dark={isDark} onStart={() => bosCommitChallenge(app, c, { navigate, openSheet: sheet.open })} />);
  };
  return (
    <div className="bos-sheet-scroll" style={{ paddingTop: 2, paddingLeft: 16, paddingRight: 16, color: "var(--text)" }}>
      {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
      <div style={_dSTitle}>Челленджи</div>
      <div style={_dSSub}>готовая привычка с призом за серию</div>
      <div className="bos-hscroll" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "2px 2px 10px", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
        {starters.map((c) => (
          <button key={c.key} onClick={() => pick(c)} className="tap" data-no-haptic style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 7, background: "var(--card)", border: "0.5px solid var(--line)", boxShadow: "var(--card-shadow)", borderRadius: 999, padding: "8px 11px 8px 9px", fontSize: 13, fontWeight: 600, color: "var(--text)", cursor: "pointer" }}>
            <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--surface-3)", display: "grid", placeItems: "center" }}>{bosIcon(c.i, 14, "var(--text)")}</span>
            {c.t} <span style={{ fontSize: 10.5, fontWeight: 800, background: BOS_GOLD, color: "#0a0a0a", borderRadius: 999, padding: "2.5px 7px" }}>+{c.bonus}</span>
          </button>
        ))}
      </div>
      <div style={_dSCard}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 5, color: "var(--text)" }}>Правила простые</div>
        <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}>Держишь серию — забираешь приз: <b style={{ color: "var(--text)" }}>+30…75 ✦</b> к копилке. Пропустил день — серия начинается заново, но <b style={{ color: "var(--text)" }}>заработанное не сгорает</b>.</div>
      </div>
      <div style={{ ..._dSText, paddingTop: 8 }}>Челлендж — это обычная привычка, только с правилами и наградой: тап → правила → старт, она сама встаёт в твой список. Найдёшь их при создании привычки и здесь, в Сообществе.</div>
      <button className="tap" style={_dGbtn} onClick={() => { if (typeof CreatePickerSheetLive === "function") sheet.open(<CreatePickerSheetLive custom={false} navigate={navigate} />); }}>Выбрать челлендж</button>
    </div>
  );
}

// ═════ ШТОРКА 4 · ПАРТНЁРЫ ═════
// ─── QR-энкодер (vendored, MIT · Kazuhiko Arase, qrcode-generator@1.4.4, http://www.d-project.com/)
//     Встроен, чтобы билет партнёра нёс НАСТОЯЩИЙ сканируемый QR без внешних файлов/сети.
//     Экспорт: window.bosQRcode(typeNumber, ecLevel).addData(str).make() → getModuleCount()/isDark(r,c).
;(function(){ if (typeof window==="undefined" || window.bosQRcode) return;
var qrcode = function() {

  //---------------------------------------------------------------------
  // qrcode
  //---------------------------------------------------------------------

  /**
   * qrcode
   * @param typeNumber 1 to 40
   * @param errorCorrectionLevel 'L','M','Q','H'
   */
  var qrcode = function(typeNumber, errorCorrectionLevel) {

    var PAD0 = 0xEC;
    var PAD1 = 0x11;

    var _typeNumber = typeNumber;
    var _errorCorrectionLevel = QRErrorCorrectionLevel[errorCorrectionLevel];
    var _modules = null;
    var _moduleCount = 0;
    var _dataCache = null;
    var _dataList = [];

    var _this = {};

    var makeImpl = function(test, maskPattern) {

      _moduleCount = _typeNumber * 4 + 17;
      _modules = function(moduleCount) {
        var modules = new Array(moduleCount);
        for (var row = 0; row < moduleCount; row += 1) {
          modules[row] = new Array(moduleCount);
          for (var col = 0; col < moduleCount; col += 1) {
            modules[row][col] = null;
          }
        }
        return modules;
      }(_moduleCount);

      setupPositionProbePattern(0, 0);
      setupPositionProbePattern(_moduleCount - 7, 0);
      setupPositionProbePattern(0, _moduleCount - 7);
      setupPositionAdjustPattern();
      setupTimingPattern();
      setupTypeInfo(test, maskPattern);

      if (_typeNumber >= 7) {
        setupTypeNumber(test);
      }

      if (_dataCache == null) {
        _dataCache = createData(_typeNumber, _errorCorrectionLevel, _dataList);
      }

      mapData(_dataCache, maskPattern);
    };

    var setupPositionProbePattern = function(row, col) {

      for (var r = -1; r <= 7; r += 1) {

        if (row + r <= -1 || _moduleCount <= row + r) continue;

        for (var c = -1; c <= 7; c += 1) {

          if (col + c <= -1 || _moduleCount <= col + c) continue;

          if ( (0 <= r && r <= 6 && (c == 0 || c == 6) )
              || (0 <= c && c <= 6 && (r == 0 || r == 6) )
              || (2 <= r && r <= 4 && 2 <= c && c <= 4) ) {
            _modules[row + r][col + c] = true;
          } else {
            _modules[row + r][col + c] = false;
          }
        }
      }
    };

    var getBestMaskPattern = function() {

      var minLostPoint = 0;
      var pattern = 0;

      for (var i = 0; i < 8; i += 1) {

        makeImpl(true, i);

        var lostPoint = QRUtil.getLostPoint(_this);

        if (i == 0 || minLostPoint > lostPoint) {
          minLostPoint = lostPoint;
          pattern = i;
        }
      }

      return pattern;
    };

    var setupTimingPattern = function() {

      for (var r = 8; r < _moduleCount - 8; r += 1) {
        if (_modules[r][6] != null) {
          continue;
        }
        _modules[r][6] = (r % 2 == 0);
      }

      for (var c = 8; c < _moduleCount - 8; c += 1) {
        if (_modules[6][c] != null) {
          continue;
        }
        _modules[6][c] = (c % 2 == 0);
      }
    };

    var setupPositionAdjustPattern = function() {

      var pos = QRUtil.getPatternPosition(_typeNumber);

      for (var i = 0; i < pos.length; i += 1) {

        for (var j = 0; j < pos.length; j += 1) {

          var row = pos[i];
          var col = pos[j];

          if (_modules[row][col] != null) {
            continue;
          }

          for (var r = -2; r <= 2; r += 1) {

            for (var c = -2; c <= 2; c += 1) {

              if (r == -2 || r == 2 || c == -2 || c == 2
                  || (r == 0 && c == 0) ) {
                _modules[row + r][col + c] = true;
              } else {
                _modules[row + r][col + c] = false;
              }
            }
          }
        }
      }
    };

    var setupTypeNumber = function(test) {

      var bits = QRUtil.getBCHTypeNumber(_typeNumber);

      for (var i = 0; i < 18; i += 1) {
        var mod = (!test && ( (bits >> i) & 1) == 1);
        _modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod;
      }

      for (var i = 0; i < 18; i += 1) {
        var mod = (!test && ( (bits >> i) & 1) == 1);
        _modules[i % 3 + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
      }
    };

    var setupTypeInfo = function(test, maskPattern) {

      var data = (_errorCorrectionLevel << 3) | maskPattern;
      var bits = QRUtil.getBCHTypeInfo(data);

      // vertical
      for (var i = 0; i < 15; i += 1) {

        var mod = (!test && ( (bits >> i) & 1) == 1);

        if (i < 6) {
          _modules[i][8] = mod;
        } else if (i < 8) {
          _modules[i + 1][8] = mod;
        } else {
          _modules[_moduleCount - 15 + i][8] = mod;
        }
      }

      // horizontal
      for (var i = 0; i < 15; i += 1) {

        var mod = (!test && ( (bits >> i) & 1) == 1);

        if (i < 8) {
          _modules[8][_moduleCount - i - 1] = mod;
        } else if (i < 9) {
          _modules[8][15 - i - 1 + 1] = mod;
        } else {
          _modules[8][15 - i - 1] = mod;
        }
      }

      // fixed module
      _modules[_moduleCount - 8][8] = (!test);
    };

    var mapData = function(data, maskPattern) {

      var inc = -1;
      var row = _moduleCount - 1;
      var bitIndex = 7;
      var byteIndex = 0;
      var maskFunc = QRUtil.getMaskFunction(maskPattern);

      for (var col = _moduleCount - 1; col > 0; col -= 2) {

        if (col == 6) col -= 1;

        while (true) {

          for (var c = 0; c < 2; c += 1) {

            if (_modules[row][col - c] == null) {

              var dark = false;

              if (byteIndex < data.length) {
                dark = ( ( (data[byteIndex] >>> bitIndex) & 1) == 1);
              }

              var mask = maskFunc(row, col - c);

              if (mask) {
                dark = !dark;
              }

              _modules[row][col - c] = dark;
              bitIndex -= 1;

              if (bitIndex == -1) {
                byteIndex += 1;
                bitIndex = 7;
              }
            }
          }

          row += inc;

          if (row < 0 || _moduleCount <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    };

    var createBytes = function(buffer, rsBlocks) {

      var offset = 0;

      var maxDcCount = 0;
      var maxEcCount = 0;

      var dcdata = new Array(rsBlocks.length);
      var ecdata = new Array(rsBlocks.length);

      for (var r = 0; r < rsBlocks.length; r += 1) {

        var dcCount = rsBlocks[r].dataCount;
        var ecCount = rsBlocks[r].totalCount - dcCount;

        maxDcCount = Math.max(maxDcCount, dcCount);
        maxEcCount = Math.max(maxEcCount, ecCount);

        dcdata[r] = new Array(dcCount);

        for (var i = 0; i < dcdata[r].length; i += 1) {
          dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset];
        }
        offset += dcCount;

        var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
        var rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1);

        var modPoly = rawPoly.mod(rsPoly);
        ecdata[r] = new Array(rsPoly.getLength() - 1);
        for (var i = 0; i < ecdata[r].length; i += 1) {
          var modIndex = i + modPoly.getLength() - ecdata[r].length;
          ecdata[r][i] = (modIndex >= 0)? modPoly.getAt(modIndex) : 0;
        }
      }

      var totalCodeCount = 0;
      for (var i = 0; i < rsBlocks.length; i += 1) {
        totalCodeCount += rsBlocks[i].totalCount;
      }

      var data = new Array(totalCodeCount);
      var index = 0;

      for (var i = 0; i < maxDcCount; i += 1) {
        for (var r = 0; r < rsBlocks.length; r += 1) {
          if (i < dcdata[r].length) {
            data[index] = dcdata[r][i];
            index += 1;
          }
        }
      }

      for (var i = 0; i < maxEcCount; i += 1) {
        for (var r = 0; r < rsBlocks.length; r += 1) {
          if (i < ecdata[r].length) {
            data[index] = ecdata[r][i];
            index += 1;
          }
        }
      }

      return data;
    };

    var createData = function(typeNumber, errorCorrectionLevel, dataList) {

      var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectionLevel);

      var buffer = qrBitBuffer();

      for (var i = 0; i < dataList.length; i += 1) {
        var data = dataList[i];
        buffer.put(data.getMode(), 4);
        buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );
        data.write(buffer);
      }

      // calc num max data.
      var totalDataCount = 0;
      for (var i = 0; i < rsBlocks.length; i += 1) {
        totalDataCount += rsBlocks[i].dataCount;
      }

      if (buffer.getLengthInBits() > totalDataCount * 8) {
        throw 'code length overflow. ('
          + buffer.getLengthInBits()
          + '>'
          + totalDataCount * 8
          + ')';
      }

      // end code
      if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
        buffer.put(0, 4);
      }

      // padding
      while (buffer.getLengthInBits() % 8 != 0) {
        buffer.putBit(false);
      }

      // padding
      while (true) {

        if (buffer.getLengthInBits() >= totalDataCount * 8) {
          break;
        }
        buffer.put(PAD0, 8);

        if (buffer.getLengthInBits() >= totalDataCount * 8) {
          break;
        }
        buffer.put(PAD1, 8);
      }

      return createBytes(buffer, rsBlocks);
    };

    _this.addData = function(data, mode) {

      mode = mode || 'Byte';

      var newData = null;

      switch(mode) {
      case 'Numeric' :
        newData = qrNumber(data);
        break;
      case 'Alphanumeric' :
        newData = qrAlphaNum(data);
        break;
      case 'Byte' :
        newData = qr8BitByte(data);
        break;
      case 'Kanji' :
        newData = qrKanji(data);
        break;
      default :
        throw 'mode:' + mode;
      }

      _dataList.push(newData);
      _dataCache = null;
    };

    _this.isDark = function(row, col) {
      if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) {
        throw row + ',' + col;
      }
      return _modules[row][col];
    };

    _this.getModuleCount = function() {
      return _moduleCount;
    };

    _this.make = function() {
      if (_typeNumber < 1) {
        var typeNumber = 1;

        for (; typeNumber < 40; typeNumber++) {
          var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, _errorCorrectionLevel);
          var buffer = qrBitBuffer();

          for (var i = 0; i < _dataList.length; i++) {
            var data = _dataList[i];
            buffer.put(data.getMode(), 4);
            buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );
            data.write(buffer);
          }

          var totalDataCount = 0;
          for (var i = 0; i < rsBlocks.length; i++) {
            totalDataCount += rsBlocks[i].dataCount;
          }

          if (buffer.getLengthInBits() <= totalDataCount * 8) {
            break;
          }
        }

        _typeNumber = typeNumber;
      }

      makeImpl(false, getBestMaskPattern() );
    };

    _this.createTableTag = function(cellSize, margin) {

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      var qrHtml = '';

      qrHtml += '<table style="';
      qrHtml += ' border-width: 0px; border-style: none;';
      qrHtml += ' border-collapse: collapse;';
      qrHtml += ' padding: 0px; margin: ' + margin + 'px;';
      qrHtml += '">';
      qrHtml += '<tbody>';

      for (var r = 0; r < _this.getModuleCount(); r += 1) {

        qrHtml += '<tr>';

        for (var c = 0; c < _this.getModuleCount(); c += 1) {
          qrHtml += '<td style="';
          qrHtml += ' border-width: 0px; border-style: none;';
          qrHtml += ' border-collapse: collapse;';
          qrHtml += ' padding: 0px; margin: 0px;';
          qrHtml += ' width: ' + cellSize + 'px;';
          qrHtml += ' height: ' + cellSize + 'px;';
          qrHtml += ' background-color: ';
          qrHtml += _this.isDark(r, c)? '#000000' : '#ffffff';
          qrHtml += ';';
          qrHtml += '"/>';
        }

        qrHtml += '</tr>';
      }

      qrHtml += '</tbody>';
      qrHtml += '</table>';

      return qrHtml;
    };

    _this.createSvgTag = function(cellSize, margin, alt, title) {

      var opts = {};
      if (typeof arguments[0] == 'object') {
        // Called by options.
        opts = arguments[0];
        // overwrite cellSize and margin.
        cellSize = opts.cellSize;
        margin = opts.margin;
        alt = opts.alt;
        title = opts.title;
      }

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      // Compose alt property surrogate
      alt = (typeof alt === 'string') ? {text: alt} : alt || {};
      alt.text = alt.text || null;
      alt.id = (alt.text) ? alt.id || 'qrcode-description' : null;

      // Compose title property surrogate
      title = (typeof title === 'string') ? {text: title} : title || {};
      title.text = title.text || null;
      title.id = (title.text) ? title.id || 'qrcode-title' : null;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var c, mc, r, mr, qrSvg='', rect;

      rect = 'l' + cellSize + ',0 0,' + cellSize +
        ' -' + cellSize + ',0 0,-' + cellSize + 'z ';

      qrSvg += '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"';
      qrSvg += !opts.scalable ? ' width="' + size + 'px" height="' + size + 'px"' : '';
      qrSvg += ' viewBox="0 0 ' + size + ' ' + size + '" ';
      qrSvg += ' preserveAspectRatio="xMinYMin meet"';
      qrSvg += (title.text || alt.text) ? ' role="img" aria-labelledby="' +
          escapeXml([title.id, alt.id].join(' ').trim() ) + '"' : '';
      qrSvg += '>';
      qrSvg += (title.text) ? '<title id="' + escapeXml(title.id) + '">' +
          escapeXml(title.text) + '</title>' : '';
      qrSvg += (alt.text) ? '<description id="' + escapeXml(alt.id) + '">' +
          escapeXml(alt.text) + '</description>' : '';
      qrSvg += '<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>';
      qrSvg += '<path d="';

      for (r = 0; r < _this.getModuleCount(); r += 1) {
        mr = r * cellSize + margin;
        for (c = 0; c < _this.getModuleCount(); c += 1) {
          if (_this.isDark(r, c) ) {
            mc = c*cellSize+margin;
            qrSvg += 'M' + mc + ',' + mr + rect;
          }
        }
      }

      qrSvg += '" stroke="transparent" fill="black"/>';
      qrSvg += '</svg>';

      return qrSvg;
    };

    _this.createDataURL = function(cellSize, margin) {

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var min = margin;
      var max = size - margin;

      return createDataURL(size, size, function(x, y) {
        if (min <= x && x < max && min <= y && y < max) {
          var c = Math.floor( (x - min) / cellSize);
          var r = Math.floor( (y - min) / cellSize);
          return _this.isDark(r, c)? 0 : 1;
        } else {
          return 1;
        }
      } );
    };

    _this.createImgTag = function(cellSize, margin, alt) {

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;

      var img = '';
      img += '<img';
      img += '\u0020src="';
      img += _this.createDataURL(cellSize, margin);
      img += '"';
      img += '\u0020width="';
      img += size;
      img += '"';
      img += '\u0020height="';
      img += size;
      img += '"';
      if (alt) {
        img += '\u0020alt="';
        img += escapeXml(alt);
        img += '"';
      }
      img += '/>';

      return img;
    };

    var escapeXml = function(s) {
      var escaped = '';
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charAt(i);
        switch(c) {
        case '<': escaped += '&lt;'; break;
        case '>': escaped += '&gt;'; break;
        case '&': escaped += '&amp;'; break;
        case '"': escaped += '&quot;'; break;
        default : escaped += c; break;
        }
      }
      return escaped;
    };

    var _createHalfASCII = function(margin) {
      var cellSize = 1;
      margin = (typeof margin == 'undefined')? cellSize * 2 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var min = margin;
      var max = size - margin;

      var y, x, r1, r2, p;

      var blocks = {
        '██': '█',
        '█ ': '▀',
        ' █': '▄',
        '  ': ' '
      };

      var blocksLastLineNoMargin = {
        '██': '▀',
        '█ ': '▀',
        ' █': ' ',
        '  ': ' '
      };

      var ascii = '';
      for (y = 0; y < size; y += 2) {
        r1 = Math.floor((y - min) / cellSize);
        r2 = Math.floor((y + 1 - min) / cellSize);
        for (x = 0; x < size; x += 1) {
          p = '█';

          if (min <= x && x < max && min <= y && y < max && _this.isDark(r1, Math.floor((x - min) / cellSize))) {
            p = ' ';
          }

          if (min <= x && x < max && min <= y+1 && y+1 < max && _this.isDark(r2, Math.floor((x - min) / cellSize))) {
            p += ' ';
          }
          else {
            p += '█';
          }

          // Output 2 characters per pixel, to create full square. 1 character per pixels gives only half width of square.
          ascii += (margin < 1 && y+1 >= max) ? blocksLastLineNoMargin[p] : blocks[p];
        }

        ascii += '\n';
      }

      if (size % 2 && margin > 0) {
        return ascii.substring(0, ascii.length - size - 1) + Array(size+1).join('▀');
      }

      return ascii.substring(0, ascii.length-1);
    };

    _this.createASCII = function(cellSize, margin) {
      cellSize = cellSize || 1;

      if (cellSize < 2) {
        return _createHalfASCII(margin);
      }

      cellSize -= 1;
      margin = (typeof margin == 'undefined')? cellSize * 2 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var min = margin;
      var max = size - margin;

      var y, x, r, p;

      var white = Array(cellSize+1).join('██');
      var black = Array(cellSize+1).join('  ');

      var ascii = '';
      var line = '';
      for (y = 0; y < size; y += 1) {
        r = Math.floor( (y - min) / cellSize);
        line = '';
        for (x = 0; x < size; x += 1) {
          p = 1;

          if (min <= x && x < max && min <= y && y < max && _this.isDark(r, Math.floor((x - min) / cellSize))) {
            p = 0;
          }

          // Output 2 characters per pixel, to create full square. 1 character per pixels gives only half width of square.
          line += p ? white : black;
        }

        for (r = 0; r < cellSize; r += 1) {
          ascii += line + '\n';
        }
      }

      return ascii.substring(0, ascii.length-1);
    };

    _this.renderTo2dContext = function(context, cellSize) {
      cellSize = cellSize || 2;
      var length = _this.getModuleCount();
      for (var row = 0; row < length; row++) {
        for (var col = 0; col < length; col++) {
          context.fillStyle = _this.isDark(row, col) ? 'black' : 'white';
          context.fillRect(row * cellSize, col * cellSize, cellSize, cellSize);
        }
      }
    }

    return _this;
  };

  //---------------------------------------------------------------------
  // qrcode.stringToBytes
  //---------------------------------------------------------------------

  qrcode.stringToBytesFuncs = {
    'default' : function(s) {
      var bytes = [];
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charCodeAt(i);
        bytes.push(c & 0xff);
      }
      return bytes;
    }
  };

  qrcode.stringToBytes = qrcode.stringToBytesFuncs['default'];

  //---------------------------------------------------------------------
  // qrcode.createStringToBytes
  //---------------------------------------------------------------------

  /**
   * @param unicodeData base64 string of byte array.
   * [16bit Unicode],[16bit Bytes], ...
   * @param numChars
   */
  qrcode.createStringToBytes = function(unicodeData, numChars) {

    // create conversion map.

    var unicodeMap = function() {

      var bin = base64DecodeInputStream(unicodeData);
      var read = function() {
        var b = bin.read();
        if (b == -1) throw 'eof';
        return b;
      };

      var count = 0;
      var unicodeMap = {};
      while (true) {
        var b0 = bin.read();
        if (b0 == -1) break;
        var b1 = read();
        var b2 = read();
        var b3 = read();
        var k = String.fromCharCode( (b0 << 8) | b1);
        var v = (b2 << 8) | b3;
        unicodeMap[k] = v;
        count += 1;
      }
      if (count != numChars) {
        throw count + ' != ' + numChars;
      }

      return unicodeMap;
    }();

    var unknownChar = '?'.charCodeAt(0);

    return function(s) {
      var bytes = [];
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charCodeAt(i);
        if (c < 128) {
          bytes.push(c);
        } else {
          var b = unicodeMap[s.charAt(i)];
          if (typeof b == 'number') {
            if ( (b & 0xff) == b) {
              // 1byte
              bytes.push(b);
            } else {
              // 2bytes
              bytes.push(b >>> 8);
              bytes.push(b & 0xff);
            }
          } else {
            bytes.push(unknownChar);
          }
        }
      }
      return bytes;
    };
  };

  //---------------------------------------------------------------------
  // QRMode
  //---------------------------------------------------------------------

  var QRMode = {
    MODE_NUMBER :    1 << 0,
    MODE_ALPHA_NUM : 1 << 1,
    MODE_8BIT_BYTE : 1 << 2,
    MODE_KANJI :     1 << 3
  };

  //---------------------------------------------------------------------
  // QRErrorCorrectionLevel
  //---------------------------------------------------------------------

  var QRErrorCorrectionLevel = {
    L : 1,
    M : 0,
    Q : 3,
    H : 2
  };

  //---------------------------------------------------------------------
  // QRMaskPattern
  //---------------------------------------------------------------------

  var QRMaskPattern = {
    PATTERN000 : 0,
    PATTERN001 : 1,
    PATTERN010 : 2,
    PATTERN011 : 3,
    PATTERN100 : 4,
    PATTERN101 : 5,
    PATTERN110 : 6,
    PATTERN111 : 7
  };

  //---------------------------------------------------------------------
  // QRUtil
  //---------------------------------------------------------------------

  var QRUtil = function() {

    var PATTERN_POSITION_TABLE = [
      [],
      [6, 18],
      [6, 22],
      [6, 26],
      [6, 30],
      [6, 34],
      [6, 22, 38],
      [6, 24, 42],
      [6, 26, 46],
      [6, 28, 50],
      [6, 30, 54],
      [6, 32, 58],
      [6, 34, 62],
      [6, 26, 46, 66],
      [6, 26, 48, 70],
      [6, 26, 50, 74],
      [6, 30, 54, 78],
      [6, 30, 56, 82],
      [6, 30, 58, 86],
      [6, 34, 62, 90],
      [6, 28, 50, 72, 94],
      [6, 26, 50, 74, 98],
      [6, 30, 54, 78, 102],
      [6, 28, 54, 80, 106],
      [6, 32, 58, 84, 110],
      [6, 30, 58, 86, 114],
      [6, 34, 62, 90, 118],
      [6, 26, 50, 74, 98, 122],
      [6, 30, 54, 78, 102, 126],
      [6, 26, 52, 78, 104, 130],
      [6, 30, 56, 82, 108, 134],
      [6, 34, 60, 86, 112, 138],
      [6, 30, 58, 86, 114, 142],
      [6, 34, 62, 90, 118, 146],
      [6, 30, 54, 78, 102, 126, 150],
      [6, 24, 50, 76, 102, 128, 154],
      [6, 28, 54, 80, 106, 132, 158],
      [6, 32, 58, 84, 110, 136, 162],
      [6, 26, 54, 82, 110, 138, 166],
      [6, 30, 58, 86, 114, 142, 170]
    ];
    var G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
    var G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
    var G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

    var _this = {};

    var getBCHDigit = function(data) {
      var digit = 0;
      while (data != 0) {
        digit += 1;
        data >>>= 1;
      }
      return digit;
    };

    _this.getBCHTypeInfo = function(data) {
      var d = data << 10;
      while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
        d ^= (G15 << (getBCHDigit(d) - getBCHDigit(G15) ) );
      }
      return ( (data << 10) | d) ^ G15_MASK;
    };

    _this.getBCHTypeNumber = function(data) {
      var d = data << 12;
      while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
        d ^= (G18 << (getBCHDigit(d) - getBCHDigit(G18) ) );
      }
      return (data << 12) | d;
    };

    _this.getPatternPosition = function(typeNumber) {
      return PATTERN_POSITION_TABLE[typeNumber - 1];
    };

    _this.getMaskFunction = function(maskPattern) {

      switch (maskPattern) {

      case QRMaskPattern.PATTERN000 :
        return function(i, j) { return (i + j) % 2 == 0; };
      case QRMaskPattern.PATTERN001 :
        return function(i, j) { return i % 2 == 0; };
      case QRMaskPattern.PATTERN010 :
        return function(i, j) { return j % 3 == 0; };
      case QRMaskPattern.PATTERN011 :
        return function(i, j) { return (i + j) % 3 == 0; };
      case QRMaskPattern.PATTERN100 :
        return function(i, j) { return (Math.floor(i / 2) + Math.floor(j / 3) ) % 2 == 0; };
      case QRMaskPattern.PATTERN101 :
        return function(i, j) { return (i * j) % 2 + (i * j) % 3 == 0; };
      case QRMaskPattern.PATTERN110 :
        return function(i, j) { return ( (i * j) % 2 + (i * j) % 3) % 2 == 0; };
      case QRMaskPattern.PATTERN111 :
        return function(i, j) { return ( (i * j) % 3 + (i + j) % 2) % 2 == 0; };

      default :
        throw 'bad maskPattern:' + maskPattern;
      }
    };

    _this.getErrorCorrectPolynomial = function(errorCorrectLength) {
      var a = qrPolynomial([1], 0);
      for (var i = 0; i < errorCorrectLength; i += 1) {
        a = a.multiply(qrPolynomial([1, QRMath.gexp(i)], 0) );
      }
      return a;
    };

    _this.getLengthInBits = function(mode, type) {

      if (1 <= type && type < 10) {

        // 1 - 9

        switch(mode) {
        case QRMode.MODE_NUMBER    : return 10;
        case QRMode.MODE_ALPHA_NUM : return 9;
        case QRMode.MODE_8BIT_BYTE : return 8;
        case QRMode.MODE_KANJI     : return 8;
        default :
          throw 'mode:' + mode;
        }

      } else if (type < 27) {

        // 10 - 26

        switch(mode) {
        case QRMode.MODE_NUMBER    : return 12;
        case QRMode.MODE_ALPHA_NUM : return 11;
        case QRMode.MODE_8BIT_BYTE : return 16;
        case QRMode.MODE_KANJI     : return 10;
        default :
          throw 'mode:' + mode;
        }

      } else if (type < 41) {

        // 27 - 40

        switch(mode) {
        case QRMode.MODE_NUMBER    : return 14;
        case QRMode.MODE_ALPHA_NUM : return 13;
        case QRMode.MODE_8BIT_BYTE : return 16;
        case QRMode.MODE_KANJI     : return 12;
        default :
          throw 'mode:' + mode;
        }

      } else {
        throw 'type:' + type;
      }
    };

    _this.getLostPoint = function(qrcode) {

      var moduleCount = qrcode.getModuleCount();

      var lostPoint = 0;

      // LEVEL1

      for (var row = 0; row < moduleCount; row += 1) {
        for (var col = 0; col < moduleCount; col += 1) {

          var sameCount = 0;
          var dark = qrcode.isDark(row, col);

          for (var r = -1; r <= 1; r += 1) {

            if (row + r < 0 || moduleCount <= row + r) {
              continue;
            }

            for (var c = -1; c <= 1; c += 1) {

              if (col + c < 0 || moduleCount <= col + c) {
                continue;
              }

              if (r == 0 && c == 0) {
                continue;
              }

              if (dark == qrcode.isDark(row + r, col + c) ) {
                sameCount += 1;
              }
            }
          }

          if (sameCount > 5) {
            lostPoint += (3 + sameCount - 5);
          }
        }
      };

      // LEVEL2

      for (var row = 0; row < moduleCount - 1; row += 1) {
        for (var col = 0; col < moduleCount - 1; col += 1) {
          var count = 0;
          if (qrcode.isDark(row, col) ) count += 1;
          if (qrcode.isDark(row + 1, col) ) count += 1;
          if (qrcode.isDark(row, col + 1) ) count += 1;
          if (qrcode.isDark(row + 1, col + 1) ) count += 1;
          if (count == 0 || count == 4) {
            lostPoint += 3;
          }
        }
      }

      // LEVEL3

      for (var row = 0; row < moduleCount; row += 1) {
        for (var col = 0; col < moduleCount - 6; col += 1) {
          if (qrcode.isDark(row, col)
              && !qrcode.isDark(row, col + 1)
              &&  qrcode.isDark(row, col + 2)
              &&  qrcode.isDark(row, col + 3)
              &&  qrcode.isDark(row, col + 4)
              && !qrcode.isDark(row, col + 5)
              &&  qrcode.isDark(row, col + 6) ) {
            lostPoint += 40;
          }
        }
      }

      for (var col = 0; col < moduleCount; col += 1) {
        for (var row = 0; row < moduleCount - 6; row += 1) {
          if (qrcode.isDark(row, col)
              && !qrcode.isDark(row + 1, col)
              &&  qrcode.isDark(row + 2, col)
              &&  qrcode.isDark(row + 3, col)
              &&  qrcode.isDark(row + 4, col)
              && !qrcode.isDark(row + 5, col)
              &&  qrcode.isDark(row + 6, col) ) {
            lostPoint += 40;
          }
        }
      }

      // LEVEL4

      var darkCount = 0;

      for (var col = 0; col < moduleCount; col += 1) {
        for (var row = 0; row < moduleCount; row += 1) {
          if (qrcode.isDark(row, col) ) {
            darkCount += 1;
          }
        }
      }

      var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
      lostPoint += ratio * 10;

      return lostPoint;
    };

    return _this;
  }();

  //---------------------------------------------------------------------
  // QRMath
  //---------------------------------------------------------------------

  var QRMath = function() {

    var EXP_TABLE = new Array(256);
    var LOG_TABLE = new Array(256);

    // initialize tables
    for (var i = 0; i < 8; i += 1) {
      EXP_TABLE[i] = 1 << i;
    }
    for (var i = 8; i < 256; i += 1) {
      EXP_TABLE[i] = EXP_TABLE[i - 4]
        ^ EXP_TABLE[i - 5]
        ^ EXP_TABLE[i - 6]
        ^ EXP_TABLE[i - 8];
    }
    for (var i = 0; i < 255; i += 1) {
      LOG_TABLE[EXP_TABLE[i] ] = i;
    }

    var _this = {};

    _this.glog = function(n) {

      if (n < 1) {
        throw 'glog(' + n + ')';
      }

      return LOG_TABLE[n];
    };

    _this.gexp = function(n) {

      while (n < 0) {
        n += 255;
      }

      while (n >= 256) {
        n -= 255;
      }

      return EXP_TABLE[n];
    };

    return _this;
  }();

  //---------------------------------------------------------------------
  // qrPolynomial
  //---------------------------------------------------------------------

  function qrPolynomial(num, shift) {

    if (typeof num.length == 'undefined') {
      throw num.length + '/' + shift;
    }

    var _num = function() {
      var offset = 0;
      while (offset < num.length && num[offset] == 0) {
        offset += 1;
      }
      var _num = new Array(num.length - offset + shift);
      for (var i = 0; i < num.length - offset; i += 1) {
        _num[i] = num[i + offset];
      }
      return _num;
    }();

    var _this = {};

    _this.getAt = function(index) {
      return _num[index];
    };

    _this.getLength = function() {
      return _num.length;
    };

    _this.multiply = function(e) {

      var num = new Array(_this.getLength() + e.getLength() - 1);

      for (var i = 0; i < _this.getLength(); i += 1) {
        for (var j = 0; j < e.getLength(); j += 1) {
          num[i + j] ^= QRMath.gexp(QRMath.glog(_this.getAt(i) ) + QRMath.glog(e.getAt(j) ) );
        }
      }

      return qrPolynomial(num, 0);
    };

    _this.mod = function(e) {

      if (_this.getLength() - e.getLength() < 0) {
        return _this;
      }

      var ratio = QRMath.glog(_this.getAt(0) ) - QRMath.glog(e.getAt(0) );

      var num = new Array(_this.getLength() );
      for (var i = 0; i < _this.getLength(); i += 1) {
        num[i] = _this.getAt(i);
      }

      for (var i = 0; i < e.getLength(); i += 1) {
        num[i] ^= QRMath.gexp(QRMath.glog(e.getAt(i) ) + ratio);
      }

      // recursive call
      return qrPolynomial(num, 0).mod(e);
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // QRRSBlock
  //---------------------------------------------------------------------

  var QRRSBlock = function() {

    var RS_BLOCK_TABLE = [

      // L
      // M
      // Q
      // H

      // 1
      [1, 26, 19],
      [1, 26, 16],
      [1, 26, 13],
      [1, 26, 9],

      // 2
      [1, 44, 34],
      [1, 44, 28],
      [1, 44, 22],
      [1, 44, 16],

      // 3
      [1, 70, 55],
      [1, 70, 44],
      [2, 35, 17],
      [2, 35, 13],

      // 4
      [1, 100, 80],
      [2, 50, 32],
      [2, 50, 24],
      [4, 25, 9],

      // 5
      [1, 134, 108],
      [2, 67, 43],
      [2, 33, 15, 2, 34, 16],
      [2, 33, 11, 2, 34, 12],

      // 6
      [2, 86, 68],
      [4, 43, 27],
      [4, 43, 19],
      [4, 43, 15],

      // 7
      [2, 98, 78],
      [4, 49, 31],
      [2, 32, 14, 4, 33, 15],
      [4, 39, 13, 1, 40, 14],

      // 8
      [2, 121, 97],
      [2, 60, 38, 2, 61, 39],
      [4, 40, 18, 2, 41, 19],
      [4, 40, 14, 2, 41, 15],

      // 9
      [2, 146, 116],
      [3, 58, 36, 2, 59, 37],
      [4, 36, 16, 4, 37, 17],
      [4, 36, 12, 4, 37, 13],

      // 10
      [2, 86, 68, 2, 87, 69],
      [4, 69, 43, 1, 70, 44],
      [6, 43, 19, 2, 44, 20],
      [6, 43, 15, 2, 44, 16],

      // 11
      [4, 101, 81],
      [1, 80, 50, 4, 81, 51],
      [4, 50, 22, 4, 51, 23],
      [3, 36, 12, 8, 37, 13],

      // 12
      [2, 116, 92, 2, 117, 93],
      [6, 58, 36, 2, 59, 37],
      [4, 46, 20, 6, 47, 21],
      [7, 42, 14, 4, 43, 15],

      // 13
      [4, 133, 107],
      [8, 59, 37, 1, 60, 38],
      [8, 44, 20, 4, 45, 21],
      [12, 33, 11, 4, 34, 12],

      // 14
      [3, 145, 115, 1, 146, 116],
      [4, 64, 40, 5, 65, 41],
      [11, 36, 16, 5, 37, 17],
      [11, 36, 12, 5, 37, 13],

      // 15
      [5, 109, 87, 1, 110, 88],
      [5, 65, 41, 5, 66, 42],
      [5, 54, 24, 7, 55, 25],
      [11, 36, 12, 7, 37, 13],

      // 16
      [5, 122, 98, 1, 123, 99],
      [7, 73, 45, 3, 74, 46],
      [15, 43, 19, 2, 44, 20],
      [3, 45, 15, 13, 46, 16],

      // 17
      [1, 135, 107, 5, 136, 108],
      [10, 74, 46, 1, 75, 47],
      [1, 50, 22, 15, 51, 23],
      [2, 42, 14, 17, 43, 15],

      // 18
      [5, 150, 120, 1, 151, 121],
      [9, 69, 43, 4, 70, 44],
      [17, 50, 22, 1, 51, 23],
      [2, 42, 14, 19, 43, 15],

      // 19
      [3, 141, 113, 4, 142, 114],
      [3, 70, 44, 11, 71, 45],
      [17, 47, 21, 4, 48, 22],
      [9, 39, 13, 16, 40, 14],

      // 20
      [3, 135, 107, 5, 136, 108],
      [3, 67, 41, 13, 68, 42],
      [15, 54, 24, 5, 55, 25],
      [15, 43, 15, 10, 44, 16],

      // 21
      [4, 144, 116, 4, 145, 117],
      [17, 68, 42],
      [17, 50, 22, 6, 51, 23],
      [19, 46, 16, 6, 47, 17],

      // 22
      [2, 139, 111, 7, 140, 112],
      [17, 74, 46],
      [7, 54, 24, 16, 55, 25],
      [34, 37, 13],

      // 23
      [4, 151, 121, 5, 152, 122],
      [4, 75, 47, 14, 76, 48],
      [11, 54, 24, 14, 55, 25],
      [16, 45, 15, 14, 46, 16],

      // 24
      [6, 147, 117, 4, 148, 118],
      [6, 73, 45, 14, 74, 46],
      [11, 54, 24, 16, 55, 25],
      [30, 46, 16, 2, 47, 17],

      // 25
      [8, 132, 106, 4, 133, 107],
      [8, 75, 47, 13, 76, 48],
      [7, 54, 24, 22, 55, 25],
      [22, 45, 15, 13, 46, 16],

      // 26
      [10, 142, 114, 2, 143, 115],
      [19, 74, 46, 4, 75, 47],
      [28, 50, 22, 6, 51, 23],
      [33, 46, 16, 4, 47, 17],

      // 27
      [8, 152, 122, 4, 153, 123],
      [22, 73, 45, 3, 74, 46],
      [8, 53, 23, 26, 54, 24],
      [12, 45, 15, 28, 46, 16],

      // 28
      [3, 147, 117, 10, 148, 118],
      [3, 73, 45, 23, 74, 46],
      [4, 54, 24, 31, 55, 25],
      [11, 45, 15, 31, 46, 16],

      // 29
      [7, 146, 116, 7, 147, 117],
      [21, 73, 45, 7, 74, 46],
      [1, 53, 23, 37, 54, 24],
      [19, 45, 15, 26, 46, 16],

      // 30
      [5, 145, 115, 10, 146, 116],
      [19, 75, 47, 10, 76, 48],
      [15, 54, 24, 25, 55, 25],
      [23, 45, 15, 25, 46, 16],

      // 31
      [13, 145, 115, 3, 146, 116],
      [2, 74, 46, 29, 75, 47],
      [42, 54, 24, 1, 55, 25],
      [23, 45, 15, 28, 46, 16],

      // 32
      [17, 145, 115],
      [10, 74, 46, 23, 75, 47],
      [10, 54, 24, 35, 55, 25],
      [19, 45, 15, 35, 46, 16],

      // 33
      [17, 145, 115, 1, 146, 116],
      [14, 74, 46, 21, 75, 47],
      [29, 54, 24, 19, 55, 25],
      [11, 45, 15, 46, 46, 16],

      // 34
      [13, 145, 115, 6, 146, 116],
      [14, 74, 46, 23, 75, 47],
      [44, 54, 24, 7, 55, 25],
      [59, 46, 16, 1, 47, 17],

      // 35
      [12, 151, 121, 7, 152, 122],
      [12, 75, 47, 26, 76, 48],
      [39, 54, 24, 14, 55, 25],
      [22, 45, 15, 41, 46, 16],

      // 36
      [6, 151, 121, 14, 152, 122],
      [6, 75, 47, 34, 76, 48],
      [46, 54, 24, 10, 55, 25],
      [2, 45, 15, 64, 46, 16],

      // 37
      [17, 152, 122, 4, 153, 123],
      [29, 74, 46, 14, 75, 47],
      [49, 54, 24, 10, 55, 25],
      [24, 45, 15, 46, 46, 16],

      // 38
      [4, 152, 122, 18, 153, 123],
      [13, 74, 46, 32, 75, 47],
      [48, 54, 24, 14, 55, 25],
      [42, 45, 15, 32, 46, 16],

      // 39
      [20, 147, 117, 4, 148, 118],
      [40, 75, 47, 7, 76, 48],
      [43, 54, 24, 22, 55, 25],
      [10, 45, 15, 67, 46, 16],

      // 40
      [19, 148, 118, 6, 149, 119],
      [18, 75, 47, 31, 76, 48],
      [34, 54, 24, 34, 55, 25],
      [20, 45, 15, 61, 46, 16]
    ];

    var qrRSBlock = function(totalCount, dataCount) {
      var _this = {};
      _this.totalCount = totalCount;
      _this.dataCount = dataCount;
      return _this;
    };

    var _this = {};

    var getRsBlockTable = function(typeNumber, errorCorrectionLevel) {

      switch(errorCorrectionLevel) {
      case QRErrorCorrectionLevel.L :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
      case QRErrorCorrectionLevel.M :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
      case QRErrorCorrectionLevel.Q :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
      case QRErrorCorrectionLevel.H :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
      default :
        return undefined;
      }
    };

    _this.getRSBlocks = function(typeNumber, errorCorrectionLevel) {

      var rsBlock = getRsBlockTable(typeNumber, errorCorrectionLevel);

      if (typeof rsBlock == 'undefined') {
        throw 'bad rs block @ typeNumber:' + typeNumber +
            '/errorCorrectionLevel:' + errorCorrectionLevel;
      }

      var length = rsBlock.length / 3;

      var list = [];

      for (var i = 0; i < length; i += 1) {

        var count = rsBlock[i * 3 + 0];
        var totalCount = rsBlock[i * 3 + 1];
        var dataCount = rsBlock[i * 3 + 2];

        for (var j = 0; j < count; j += 1) {
          list.push(qrRSBlock(totalCount, dataCount) );
        }
      }

      return list;
    };

    return _this;
  }();

  //---------------------------------------------------------------------
  // qrBitBuffer
  //---------------------------------------------------------------------

  var qrBitBuffer = function() {

    var _buffer = [];
    var _length = 0;

    var _this = {};

    _this.getBuffer = function() {
      return _buffer;
    };

    _this.getAt = function(index) {
      var bufIndex = Math.floor(index / 8);
      return ( (_buffer[bufIndex] >>> (7 - index % 8) ) & 1) == 1;
    };

    _this.put = function(num, length) {
      for (var i = 0; i < length; i += 1) {
        _this.putBit( ( (num >>> (length - i - 1) ) & 1) == 1);
      }
    };

    _this.getLengthInBits = function() {
      return _length;
    };

    _this.putBit = function(bit) {

      var bufIndex = Math.floor(_length / 8);
      if (_buffer.length <= bufIndex) {
        _buffer.push(0);
      }

      if (bit) {
        _buffer[bufIndex] |= (0x80 >>> (_length % 8) );
      }

      _length += 1;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qrNumber
  //---------------------------------------------------------------------

  var qrNumber = function(data) {

    var _mode = QRMode.MODE_NUMBER;
    var _data = data;

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return _data.length;
    };

    _this.write = function(buffer) {

      var data = _data;

      var i = 0;

      while (i + 2 < data.length) {
        buffer.put(strToNum(data.substring(i, i + 3) ), 10);
        i += 3;
      }

      if (i < data.length) {
        if (data.length - i == 1) {
          buffer.put(strToNum(data.substring(i, i + 1) ), 4);
        } else if (data.length - i == 2) {
          buffer.put(strToNum(data.substring(i, i + 2) ), 7);
        }
      }
    };

    var strToNum = function(s) {
      var num = 0;
      for (var i = 0; i < s.length; i += 1) {
        num = num * 10 + chatToNum(s.charAt(i) );
      }
      return num;
    };

    var chatToNum = function(c) {
      if ('0' <= c && c <= '9') {
        return c.charCodeAt(0) - '0'.charCodeAt(0);
      }
      throw 'illegal char :' + c;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qrAlphaNum
  //---------------------------------------------------------------------

  var qrAlphaNum = function(data) {

    var _mode = QRMode.MODE_ALPHA_NUM;
    var _data = data;

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return _data.length;
    };

    _this.write = function(buffer) {

      var s = _data;

      var i = 0;

      while (i + 1 < s.length) {
        buffer.put(
          getCode(s.charAt(i) ) * 45 +
          getCode(s.charAt(i + 1) ), 11);
        i += 2;
      }

      if (i < s.length) {
        buffer.put(getCode(s.charAt(i) ), 6);
      }
    };

    var getCode = function(c) {

      if ('0' <= c && c <= '9') {
        return c.charCodeAt(0) - '0'.charCodeAt(0);
      } else if ('A' <= c && c <= 'Z') {
        return c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
      } else {
        switch (c) {
        case ' ' : return 36;
        case '$' : return 37;
        case '%' : return 38;
        case '*' : return 39;
        case '+' : return 40;
        case '-' : return 41;
        case '.' : return 42;
        case '/' : return 43;
        case ':' : return 44;
        default :
          throw 'illegal char :' + c;
        }
      }
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qr8BitByte
  //---------------------------------------------------------------------

  var qr8BitByte = function(data) {

    var _mode = QRMode.MODE_8BIT_BYTE;
    var _data = data;
    var _bytes = qrcode.stringToBytes(data);

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return _bytes.length;
    };

    _this.write = function(buffer) {
      for (var i = 0; i < _bytes.length; i += 1) {
        buffer.put(_bytes[i], 8);
      }
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qrKanji
  //---------------------------------------------------------------------

  var qrKanji = function(data) {

    var _mode = QRMode.MODE_KANJI;
    var _data = data;

    var stringToBytes = qrcode.stringToBytesFuncs['SJIS'];
    if (!stringToBytes) {
      throw 'sjis not supported.';
    }
    !function(c, code) {
      // self test for sjis support.
      var test = stringToBytes(c);
      if (test.length != 2 || ( (test[0] << 8) | test[1]) != code) {
        throw 'sjis not supported.';
      }
    }('\u53cb', 0x9746);

    var _bytes = stringToBytes(data);

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return ~~(_bytes.length / 2);
    };

    _this.write = function(buffer) {

      var data = _bytes;

      var i = 0;

      while (i + 1 < data.length) {

        var c = ( (0xff & data[i]) << 8) | (0xff & data[i + 1]);

        if (0x8140 <= c && c <= 0x9FFC) {
          c -= 0x8140;
        } else if (0xE040 <= c && c <= 0xEBBF) {
          c -= 0xC140;
        } else {
          throw 'illegal char at ' + (i + 1) + '/' + c;
        }

        c = ( (c >>> 8) & 0xff) * 0xC0 + (c & 0xff);

        buffer.put(c, 13);

        i += 2;
      }

      if (i < data.length) {
        throw 'illegal char at ' + (i + 1);
      }
    };

    return _this;
  };

  //=====================================================================
  // GIF Support etc.
  //

  //---------------------------------------------------------------------
  // byteArrayOutputStream
  //---------------------------------------------------------------------

  var byteArrayOutputStream = function() {

    var _bytes = [];

    var _this = {};

    _this.writeByte = function(b) {
      _bytes.push(b & 0xff);
    };

    _this.writeShort = function(i) {
      _this.writeByte(i);
      _this.writeByte(i >>> 8);
    };

    _this.writeBytes = function(b, off, len) {
      off = off || 0;
      len = len || b.length;
      for (var i = 0; i < len; i += 1) {
        _this.writeByte(b[i + off]);
      }
    };

    _this.writeString = function(s) {
      for (var i = 0; i < s.length; i += 1) {
        _this.writeByte(s.charCodeAt(i) );
      }
    };

    _this.toByteArray = function() {
      return _bytes;
    };

    _this.toString = function() {
      var s = '';
      s += '[';
      for (var i = 0; i < _bytes.length; i += 1) {
        if (i > 0) {
          s += ',';
        }
        s += _bytes[i];
      }
      s += ']';
      return s;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // base64EncodeOutputStream
  //---------------------------------------------------------------------

  var base64EncodeOutputStream = function() {

    var _buffer = 0;
    var _buflen = 0;
    var _length = 0;
    var _base64 = '';

    var _this = {};

    var writeEncoded = function(b) {
      _base64 += String.fromCharCode(encode(b & 0x3f) );
    };

    var encode = function(n) {
      if (n < 0) {
        // error.
      } else if (n < 26) {
        return 0x41 + n;
      } else if (n < 52) {
        return 0x61 + (n - 26);
      } else if (n < 62) {
        return 0x30 + (n - 52);
      } else if (n == 62) {
        return 0x2b;
      } else if (n == 63) {
        return 0x2f;
      }
      throw 'n:' + n;
    };

    _this.writeByte = function(n) {

      _buffer = (_buffer << 8) | (n & 0xff);
      _buflen += 8;
      _length += 1;

      while (_buflen >= 6) {
        writeEncoded(_buffer >>> (_buflen - 6) );
        _buflen -= 6;
      }
    };

    _this.flush = function() {

      if (_buflen > 0) {
        writeEncoded(_buffer << (6 - _buflen) );
        _buffer = 0;
        _buflen = 0;
      }

      if (_length % 3 != 0) {
        // padding
        var padlen = 3 - _length % 3;
        for (var i = 0; i < padlen; i += 1) {
          _base64 += '=';
        }
      }
    };

    _this.toString = function() {
      return _base64;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // base64DecodeInputStream
  //---------------------------------------------------------------------

  var base64DecodeInputStream = function(str) {

    var _str = str;
    var _pos = 0;
    var _buffer = 0;
    var _buflen = 0;

    var _this = {};

    _this.read = function() {

      while (_buflen < 8) {

        if (_pos >= _str.length) {
          if (_buflen == 0) {
            return -1;
          }
          throw 'unexpected end of file./' + _buflen;
        }

        var c = _str.charAt(_pos);
        _pos += 1;

        if (c == '=') {
          _buflen = 0;
          return -1;
        } else if (c.match(/^\s$/) ) {
          // ignore if whitespace.
          continue;
        }

        _buffer = (_buffer << 6) | decode(c.charCodeAt(0) );
        _buflen += 6;
      }

      var n = (_buffer >>> (_buflen - 8) ) & 0xff;
      _buflen -= 8;
      return n;
    };

    var decode = function(c) {
      if (0x41 <= c && c <= 0x5a) {
        return c - 0x41;
      } else if (0x61 <= c && c <= 0x7a) {
        return c - 0x61 + 26;
      } else if (0x30 <= c && c <= 0x39) {
        return c - 0x30 + 52;
      } else if (c == 0x2b) {
        return 62;
      } else if (c == 0x2f) {
        return 63;
      } else {
        throw 'c:' + c;
      }
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // gifImage (B/W)
  //---------------------------------------------------------------------

  var gifImage = function(width, height) {

    var _width = width;
    var _height = height;
    var _data = new Array(width * height);

    var _this = {};

    _this.setPixel = function(x, y, pixel) {
      _data[y * _width + x] = pixel;
    };

    _this.write = function(out) {

      //---------------------------------
      // GIF Signature

      out.writeString('GIF87a');

      //---------------------------------
      // Screen Descriptor

      out.writeShort(_width);
      out.writeShort(_height);

      out.writeByte(0x80); // 2bit
      out.writeByte(0);
      out.writeByte(0);

      //---------------------------------
      // Global Color Map

      // black
      out.writeByte(0x00);
      out.writeByte(0x00);
      out.writeByte(0x00);

      // white
      out.writeByte(0xff);
      out.writeByte(0xff);
      out.writeByte(0xff);

      //---------------------------------
      // Image Descriptor

      out.writeString(',');
      out.writeShort(0);
      out.writeShort(0);
      out.writeShort(_width);
      out.writeShort(_height);
      out.writeByte(0);

      //---------------------------------
      // Local Color Map

      //---------------------------------
      // Raster Data

      var lzwMinCodeSize = 2;
      var raster = getLZWRaster(lzwMinCodeSize);

      out.writeByte(lzwMinCodeSize);

      var offset = 0;

      while (raster.length - offset > 255) {
        out.writeByte(255);
        out.writeBytes(raster, offset, 255);
        offset += 255;
      }

      out.writeByte(raster.length - offset);
      out.writeBytes(raster, offset, raster.length - offset);
      out.writeByte(0x00);

      //---------------------------------
      // GIF Terminator
      out.writeString(';');
    };

    var bitOutputStream = function(out) {

      var _out = out;
      var _bitLength = 0;
      var _bitBuffer = 0;

      var _this = {};

      _this.write = function(data, length) {

        if ( (data >>> length) != 0) {
          throw 'length over';
        }

        while (_bitLength + length >= 8) {
          _out.writeByte(0xff & ( (data << _bitLength) | _bitBuffer) );
          length -= (8 - _bitLength);
          data >>>= (8 - _bitLength);
          _bitBuffer = 0;
          _bitLength = 0;
        }

        _bitBuffer = (data << _bitLength) | _bitBuffer;
        _bitLength = _bitLength + length;
      };

      _this.flush = function() {
        if (_bitLength > 0) {
          _out.writeByte(_bitBuffer);
        }
      };

      return _this;
    };

    var getLZWRaster = function(lzwMinCodeSize) {

      var clearCode = 1 << lzwMinCodeSize;
      var endCode = (1 << lzwMinCodeSize) + 1;
      var bitLength = lzwMinCodeSize + 1;

      // Setup LZWTable
      var table = lzwTable();

      for (var i = 0; i < clearCode; i += 1) {
        table.add(String.fromCharCode(i) );
      }
      table.add(String.fromCharCode(clearCode) );
      table.add(String.fromCharCode(endCode) );

      var byteOut = byteArrayOutputStream();
      var bitOut = bitOutputStream(byteOut);

      // clear code
      bitOut.write(clearCode, bitLength);

      var dataIndex = 0;

      var s = String.fromCharCode(_data[dataIndex]);
      dataIndex += 1;

      while (dataIndex < _data.length) {

        var c = String.fromCharCode(_data[dataIndex]);
        dataIndex += 1;

        if (table.contains(s + c) ) {

          s = s + c;

        } else {

          bitOut.write(table.indexOf(s), bitLength);

          if (table.size() < 0xfff) {

            if (table.size() == (1 << bitLength) ) {
              bitLength += 1;
            }

            table.add(s + c);
          }

          s = c;
        }
      }

      bitOut.write(table.indexOf(s), bitLength);

      // end code
      bitOut.write(endCode, bitLength);

      bitOut.flush();

      return byteOut.toByteArray();
    };

    var lzwTable = function() {

      var _map = {};
      var _size = 0;

      var _this = {};

      _this.add = function(key) {
        if (_this.contains(key) ) {
          throw 'dup key:' + key;
        }
        _map[key] = _size;
        _size += 1;
      };

      _this.size = function() {
        return _size;
      };

      _this.indexOf = function(key) {
        return _map[key];
      };

      _this.contains = function(key) {
        return typeof _map[key] != 'undefined';
      };

      return _this;
    };

    return _this;
  };

  var createDataURL = function(width, height, getPixel) {
    var gif = gifImage(width, height);
    for (var y = 0; y < height; y += 1) {
      for (var x = 0; x < width; x += 1) {
        gif.setPixel(x, y, getPixel(x, y) );
      }
    }

    var b = byteArrayOutputStream();
    gif.write(b);

    var base64 = base64EncodeOutputStream();
    var bytes = b.toByteArray();
    for (var i = 0; i < bytes.length; i += 1) {
      base64.writeByte(bytes[i]);
    }
    base64.flush();

    return 'data:image/gif;base64,' + base64;
  };

  //---------------------------------------------------------------------
  // returns qrcode function.

  return qrcode;
}();

// multibyte support
!function() {

  qrcode.stringToBytesFuncs['UTF-8'] = function(s) {
    // http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
    function toUTF8Array(str) {
      var utf8 = [];
      for (var i=0; i < str.length; i++) {
        var charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
          utf8.push(0xc0 | (charcode >> 6),
              0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
          utf8.push(0xe0 | (charcode >> 12),
              0x80 | ((charcode>>6) & 0x3f),
              0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
          i++;
          // UTF-16 encodes 0x10000-0x10FFFF by
          // subtracting 0x10000 and splitting the
          // 20 bits of 0x0-0xFFFFF into two halves
          charcode = 0x10000 + (((charcode & 0x3ff)<<10)
            | (str.charCodeAt(i) & 0x3ff));
          utf8.push(0xf0 | (charcode >>18),
              0x80 | ((charcode>>12) & 0x3f),
              0x80 | ((charcode>>6) & 0x3f),
              0x80 | (charcode & 0x3f));
        }
      }
      return utf8;
    }
    return toUTF8Array(s);
  };

}();
window.bosQRcode = qrcode;
})();

// ── линейная иконка категории впечатления (тренировки/йога/бачата/…) ──
function _partnerFactIcon(kind) {
  const p = {
    gym: <path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" />,
    zen: <g><circle cx="12" cy="6" r="2.4" /><path d="M12 10.5c-4 2-6.5 4-6.5 6.5h13c0-2.5-2.5-4.5-6.5-6.5z" /></g>,
    dance: <path d="M9 18a2.2 2.2 0 1 1-2.2-2.2M9 18V7l9-2.2v9M18 13.8a2.2 2.2 0 1 1-2.2-2.2" />,
    spa: <path d="M12 20c0-5-3.5-8-8-8 0 5 3.5 8 8 8zM12 20c0-5 3.5-8 8-8 0 5-3.5 8-8 8zM12 20V9" />,
    climb: <path d="M3 20l6-11 4 6 3-4 5 9z" />,
    surf: <path d="M3 17c3 0 3-2 6-2s3 2 6 2 3-2 6-2M4 13c2.5-6 9-9 16-9-2 7-6 11-12 12z" />,
  };
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>{p[kind] || null}</svg>;
}

// ── НАСТОЯЩИЙ QR (vendored энкодер выше) → чёткий SVG на белом. Целочисленные модули +
//    crispEdges = ровные клетки (старый CSS-грид 13-в-38px давал «кривой» QR). ──
function _partnerQR(text, px) {
  const size = px || 60;
  let mat = null, n = 0;
  try {
    if (typeof window !== "undefined" && window.bosQRcode) {
      const q = window.bosQRcode(0, "M");
      q.addData(text || "https://t.me/BalanceOS8_bot");
      q.make();
      n = q.getModuleCount();
      mat = q;
    }
  } catch (e) { mat = null; n = 0; }
  const quiet = 2, total = n ? n + quiet * 2 : 1;
  const rects = [];
  if (mat) {
    for (let r = 0; r < n; r++) { for (let c = 0; c < n; c++) { if (mat.isDark(r, c)) rects.push(<rect key={r + "_" + c} x={c + quiet} y={r + quiet} width="1" height="1" fill="#1d1400" />); } }
  }
  return (
    <span style={{ display: "block", width: size, height: size, background: "#fff", borderRadius: 8, padding: 4, boxShadow: "inset 0 0 0 1px rgba(58,42,0,0.12)" }}>
      {mat
        ? <svg width="100%" height="100%" viewBox={"0 0 " + total + " " + total} shapeRendering="crispEdges" style={{ display: "block" }}>{rects}</svg>
        : <span aria-hidden style={{ display: "block", width: "100%", height: "100%" }} />}
    </span>
  );
}

// ── золотой партнёрский билет с настоящим QR ──
function _partnerTicket(qrText) {
  // Вырезы-полукруги на линии отрыва = НАСТОЯЩИЕ дырки через CSS-маску: сквозь них виден фон
  // шторки (звёздный градиент), а не тёмный кружок поверх золота. Круги на разрыве у корешка
  // (100px справа), по одному сверху и снизу билета. viewBox тянется на весь билет (maskSize 100%).
  var notchMask = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 112' preserveAspectRatio='none'%3E%3Cpath fill='black' fill-rule='evenodd' d='M0,0 H300 V112 H0 Z M189,0 a11,11 0 1,0 22,0 a11,11 0 1,0 -22,0 Z M189,112 a11,11 0 1,0 22,0 a11,11 0 1,0 -22,0 Z'/%3E%3C/svg%3E\")";
  return (
    <div style={{ position: "relative", width: "100%", borderRadius: 18, overflow: "hidden", display: "flex",
      background: "linear-gradient(135deg,#FEDE34 0%,#F5BE22 55%,#EF9F14 100%)",
      boxShadow: "inset 0 1px 0.5px rgba(255,255,255,0.65),inset 0 -1px 2px rgba(140,80,0,0.25)",
      WebkitMaskImage: notchMask, WebkitMaskSize: "100% 100%", WebkitMaskRepeat: "no-repeat",
      maskImage: notchMask, maskSize: "100% 100%", maskRepeat: "no-repeat" }}>
      <span aria-hidden style={{ position: "absolute", top: "-40%", bottom: "-40%", width: 52, background: "linear-gradient(105deg,transparent,rgba(255,255,255,0.45),transparent)", animation: "bosPartnerShine 2.8s ease-in-out 1.1s infinite", pointerEvents: "none" }} />
      <div style={{ flex: 1, minWidth: 0, padding: "15px 14px", textAlign: "left" }}>
        <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: 1.6, color: "rgba(58,42,0,0.55)" }}>ПАРТНЁРСКИЙ БИЛЕТ</div>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.3px", color: "#1d1400", marginTop: 5, lineHeight: 1.2 }}>Тренировка<br />в зале рядом</div>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: "rgba(58,42,0,0.6)", marginTop: 6 }}>покажи билет на входе</div>
      </div>
      <div style={{ width: 100, flexShrink: 0, borderLeft: "2px dashed rgba(58,42,0,0.35)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 9px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 18, fontWeight: 800, color: "#1d1400", lineHeight: 1 }}>100<svg width="13" height="13" viewBox="0 0 24 24" fill="#1d1400" style={{ flexShrink: 0 }}><path d="M12 2.2l2.4 7.4 7.4 2.4-7.4 2.4-2.4 7.4-2.4-7.4-7.4-2.4 7.4-2.4z" /></svg></div>
        {_partnerQR(qrText, 62)}
      </div>
    </div>
  );
}

// ═════ ШТОРКА · ПАРТНЁРЫ — тёмная «звёздная» с золотым билетом (макет Claude Design) ═════
function DiscoveryPartnersSheetLive({ app, navigate, isDark }) {
  const { close } = (typeof useSheet === "function") ? useSheet() : { close: () => {} };
  const goPartners = () => {
    close();
    try { app && app.setCommunityView && app.setCommunityView({ filter: "partners", section: "community", commTab: "network" }); } catch (e) {}
  };
  // Настоящая ссылка для QR — инвайт-линк (или бот). Билет реально сканируется.
  const qrText = (typeof bosInviteLink === "function") ? bosInviteLink(null) : "https://t.me/BalanceOS8_bot";

  const stars = React.useMemo(() => {
    const a = [];
    for (let i = 0; i < 26; i++) {
      const x = (i * 61.8) % 100, y = ((i * 37.7) + 13) % 100;
      const s = 1.2 + ((i * 7) % 12) / 10, gold = (i % 7 === 3), o = 0.3 + ((i * 11) % 45) / 100;
      a.push(<span key={i} aria-hidden style={{ position: "absolute", left: x.toFixed(1) + "%", top: y.toFixed(1) + "%", width: s, height: s, borderRadius: "50%", background: gold ? BOS_GOLD : "#fff", boxShadow: gold ? "0 0 5px rgba(254,222,52,0.85)" : "none", opacity: o }} />);
    }
    return a;
  }, []);

  const facts = [["gym", "тренировки"], ["zen", "йога и медитация"], ["dance", "бачата"], ["spa", "массаж и спа"], ["climb", "скалодром"], ["surf", "сёрф"]];
  const rise = (d) => ({ animation: "bosPartnerRise 0.7s cubic-bezier(0.22,0.8,0.32,1) both", animationDelay: d + "s" });

  return (
    <div data-sheet-partner className="bos-sheet-scroll" style={{ position: "relative", minHeight: "100%", paddingTop: 6, paddingLeft: 20, paddingRight: 20, color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", overflowX: "hidden" }}>
      {/* фолбэк тёмного фона для webview без :has() */}
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: -1, background: "radial-gradient(130% 100% at 30% -10%,#1b1b24 0%,#101014 52%,#08080a 100%)" }} />
      {/* звёзды + золотой рассвет */}
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {stars}
        <div style={{ position: "absolute", right: "-22%", top: "-8%", width: "76%", height: "46%", background: "radial-gradient(circle,rgba(239,159,20,0.18),transparent 66%)" }} />
      </div>
      {/* мягкое затухание у верхней кромки: тёмное сверху → прозрачное вниз, чтобы градиент
          не «обрезался» резко на краю шторки (David 2026-07-12). */}
      <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 140, borderRadius: "32px 32px 0 0", pointerEvents: "none", background: "linear-gradient(to bottom, #0a0a0d 0%, rgba(10,10,13,0.72) 42%, rgba(10,10,13,0) 100%)" }} />

      <div style={{ ...rise(0.05), fontSize: 10.5, fontWeight: 800, letterSpacing: "2.6px", color: "#EF9F14", textTransform: "uppercase", marginTop: 6 }}>Мир</div>
      <div style={{ ...rise(0.15), fontSize: 26, fontWeight: 800, letterSpacing: "-0.7px", color: "#fff", marginTop: 10, lineHeight: 1.15 }}>Твой опыт<br />открывает мир</div>

      {/* внешнее золотое свечение — на ОБЁРТКЕ, чтобы маска вырезов на билете его не срезала */}
      <div style={{ ...rise(0.25), position: "relative", width: "100%", maxWidth: 300, margin: "20px 0 4px", borderRadius: 18, boxShadow: "0 20px 50px rgba(239,159,20,0.42)" }}>{_partnerTicket(qrText)}</div>

      <div style={{ ...rise(0.25), fontSize: 14, lineHeight: 1.55, color: "rgba(255,255,255,0.55)", marginTop: 14, maxWidth: 290 }}>
        Всё, что ты делаешь в Balance, превращается в <b style={{ color: "#fff", fontWeight: 700 }}>реальные впечатления</b> — тренировки, практики и новые места у партнёров рядом.
      </div>

      <div style={{ ...rise(0.4), display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "center", marginTop: 16, marginBottom: 22 }}>
        {facts.map((f, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.07)", borderRadius: 999, padding: "8px 13px", boxShadow: "inset 0 1px 0.5px rgba(255,255,255,0.12)" }}>
            {_partnerFactIcon(f[0])}{f[1]}
          </span>
        ))}
      </div>

      <button className="tap" onClick={goPartners} style={{ ...rise(0.55), border: 0, cursor: "pointer", width: "100%", marginTop: "auto", borderRadius: 999, padding: 16, fontSize: 15.5, fontWeight: 700, color: "#0a0a0a", background: "linear-gradient(135deg,#FEDE34,#EF9F14)", boxShadow: "inset 0 1px 0.5px rgba(255,255,255,0.7),0 12px 30px rgba(239,159,20,0.45)" }}>Найти места рядом</button>
      <div style={{ height: "max(12px, var(--tg-bottom-inset, 0px))" }} />
    </div>
  );
}

// ═════ ШТОРКА 5 · ЛЮДИ ═════
function DiscoveryPeopleSheetLive({ app, navigate, isDark }) {
  const sheet = (typeof useSheet === "function") ? useSheet() : { open: () => {} };
  const info = (typeof bosLevelInfoLive === "function" && typeof bosLiveXPLive === "function") ? bosLevelInfoLive(bosLiveXPLive(app)) : { level: 1, xp: 0, into: 0, span: 100 };
  const lvl = info.level || 1, left = Math.max(0, 10 - lvl), toNext = Math.max(0, (info.span | 0) - (info.into | 0));
  const barW = Math.max(4, Math.min(100, (lvl / 10) * 100));
  // Лестница пути (L1/3/5/8/10/15·20) — по макету; NOW-строка встаёт на позицию текущего уровня.
  const mets = [
    { lvl: 1, t: "Партнёры рядом", d: "впечатления за опыт — с первого дня" },
    { lvl: 3, t: "Разбор привычек", d: "твоя первая публикация" },
    { lvl: 5, t: "Практика для группы", d: "собери людей на своё" },
    { lvl: 8, t: "Поддержка по темпу", d: "держи кого-то в ритме" },
    { lvl: 10, t: "Люди", d: "рынок пользы · наставники · встречи", lock: true, big: true },
    { lvl: 15, t: "Наставничество · Собрать своих", d: "веди других · живая встреча под твоим флагом", lock: true },
  ];
  const knot = (state) => (
    <span style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", zIndex: 1,
      background: state === "done" ? BOS_GOLD : state === "now" ? "var(--cta, #0a0a0a)" : "var(--card)",
      border: state === "future" ? "1.5px solid var(--line)" : "1.5px solid transparent",
      boxShadow: state === "now" ? "0 0 0 5px rgba(10,10,10,0.08)" : "none" }}>
      {state === "done" && <svg width="13" height="13" viewBox="0 0 14 14"><path d="M2.8 7.4l2.9 2.9 5.5-6" fill="none" stroke="#0a0a0a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      {state === "now" && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
      {state === "future" && <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--text-4)"><path d="M12 3.6c2.8 0 5 2.2 5 5v2h.4c1 0 1.8.8 1.8 1.8v6.8c0 1-.8 1.8-1.8 1.8H6.6c-1 0-1.8-.8-1.8-1.8v-6.8c0-1 .8-1.8 1.8-1.8H7v-2c0-2.8 2.2-5 5-5zm0 2.2a2.8 2.8 0 0 0-2.8 2.8v2h5.6v-2A2.8 2.8 0 0 0 12 5.8z" /></svg>}
    </span>
  );
  const stepRow = (key, state, lvlLabel, title, desc, big, last) => (
    <div key={key} style={{ display: "flex", gap: 12, position: "relative", paddingBottom: last ? 2 : 18 }}>
      {!last && <span style={{ position: "absolute", left: 15, top: 32, bottom: 0, width: 2, background: state === "done" ? BOS_GOLD : "var(--line)" }} />}
      {knot(state)}
      <div style={{ opacity: state === "future" && !big ? 0.6 : 1 }}>
        <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.6, color: "var(--text-4)" }}>{lvlLabel}</div>
        {big ? (
          <div style={{ background: "var(--card)", border: "1px solid " + BOS_GOLD, borderRadius: 14, padding: "10px 12px", marginTop: 3, boxShadow: "0 6px 18px rgba(254,222,52,0.25)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.2px", color: "var(--text)" }}>{title}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 1, lineHeight: 1.35 }}>{desc}</div>
          </div>
        ) : (
          <React.Fragment>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.2px", marginTop: 1, display: "flex", alignItems: "center", gap: 6, color: "var(--text)" }}>{title}{state === "now" && <span style={{ fontSize: 9.5, fontWeight: 800, background: "var(--cta, #0a0a0a)", color: "var(--cta-ink, #fff)", borderRadius: 999, padding: "2px 7px" }}>{bosFmtXP(info.xp)} XP</span>}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 1, lineHeight: 1.35 }}>{desc}</div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
  const rows = [];
  let nowPut = false;
  mets.forEach((m, i) => {
    if (!nowPut && lvl < m.lvl) { rows.push(stepRow("now", "now", "УРОВЕНЬ " + lvl, "Ты здесь", "до " + (lvl + 1) + " уровня — " + bosFmtXP(toNext) + " ✦", false, false)); nowPut = true; }
    rows.push(stepRow("m" + m.lvl, lvl >= m.lvl ? "done" : "future", "УРОВЕНЬ " + m.lvl + (m.big ? " · ГЛАВНАЯ ДВЕРЬ" : ""), m.t, m.d, m.big, false));
  });
  if (!nowPut) rows.push(stepRow("now", "now", "УРОВЕНЬ " + lvl, "Ты здесь", "до " + (lvl + 1) + " уровня — " + bosFmtXP(toNext) + " ✦", false, true));
  return (
    <div className="bos-sheet-scroll" style={{ paddingTop: 2, paddingLeft: 16, paddingRight: 16, color: "var(--text)" }}>
      {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
      <div style={_dSTitle}>Люди</div>
      <div style={_dSSub}>закрытый круг своих — с 10 уровня</div>
      <div style={_dSCard}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "var(--text-3)" }}><span>Уровень {lvl}</span><span>10</span></div>
        <div style={{ height: 6, borderRadius: 99, background: "var(--surface-3)", overflow: "hidden", margin: "6px 0" }}><span style={{ display: "block", height: "100%", width: barW + "%", background: BOS_GOLD, borderRadius: 99 }} /></div>
        <div style={{ fontSize: 11.5, color: "var(--text-4)", fontWeight: 600 }}>Осталось {left} {left === 1 ? "уровень" : (left >= 2 && left <= 4 ? "уровня" : "уровней")}. Вход не покупается — его проходят.</div>
      </div>
      <div style={_dSText}>Внутри — <b style={{ color: "var(--text)" }}>рынок пользы</b>: услуги за ✦, наставники, живые встречи с людьми твоего города. Без случайных людей: сюда доходят те, кто держит свой ритм.</div>
      <div style={_dSKick}>ЧТО ОТКРЫВАЕТСЯ ПО ПУТИ</div>
      <div style={{ padding: "2px 2px 4px" }}>{rows}</div>
      <button className="tap" style={_dGbtn} onClick={() => sheet.open(<DiscoveryXPSheetLive app={app} navigate={navigate} isDark={isDark} />)}>Как копить быстрее</button>
    </div>
  );
}

// ═════ ШТОРКА · ПОМОГАЙ СВОИМ (валидация окружением — соц. подтверждение) ═════
function DiscoveryHelpersSheetLive({ app, navigate, isDark }) {
  const sheet = (typeof useSheet === "function") ? useSheet() : { open: () => {}, close: () => {} };
  const step = (n, t, d) => (
    <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
      <span style={{ width: 24, height: 24, borderRadius: "50%", background: BOS_GOLD, color: "#0a0a0a", fontSize: 12, fontWeight: 800, display: "grid", placeItems: "center", flexShrink: 0 }}>{n}</span>
      <div><div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{t}</div><div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1, lineHeight: 1.4 }}>{d}</div></div>
    </div>
  );
  return (
    <div className="bos-sheet-scroll" style={{ paddingTop: 2, paddingLeft: 16, paddingRight: 16, color: "var(--text)" }}>
      {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
      <div style={_dSTitle}>Помогай своим</div>
      <div style={_dSSub}>роль подтверждает твоё окружение — не модерация сверху</div>
      <div style={{ ..._dSText, textAlign: "center" }}>Любой становится помощником через <b style={{ color: "var(--text)" }}>своё окружение</b>: люди из твоих кругов знают тебя в этом деле — они и подтверждают роль.</div>
      <div style={{ ..._dSCard, display: "flex", flexDirection: "column", gap: 12 }}>
        {step("1", "Вклад", "Выбери формат из безопасного каталога — что даёшь своим.")}
        {step("2", "Подтверждение", "2 человека из круга подтверждают, что знают тебя в этой роли.")}
        {step("3", "Просьба", "Круг просит — ты откликаешься. Первое дело у своих.")}
        {step("4", "След пользы", "«Спасибо»-свет от тех, кому помог. Без звёзд-рейтингов.")}
      </div>
      <button className="tap" style={_dGbtn} onClick={() => { if (typeof AddHelpFormatSheetLive === "function") sheet.open(<AddHelpFormatSheetLive app={app} offer={null} onDone={() => {}} />); }}>Добавить формат помощи</button>
    </div>
  );
}

// Открывает нужную шторку по id (для колоды и перекрёстных ссылок).
function bosDiscSheetNode(id, app, navigate, isDark) {
  if (id === "helpers") return <DiscoveryHelpersSheetLive app={app} navigate={navigate} isDark={isDark} />;
  if (id === "core") return <DiscoveryCoreSheetLive app={app} navigate={navigate} isDark={isDark} />;
  if (id === "xp") return <DiscoveryXPSheetLive app={app} navigate={navigate} isDark={isDark} />;
  if (id === "together") return <DiscoveryTogetherSheetLive app={app} navigate={navigate} isDark={isDark} />;
  if (id === "ch") return <DiscoveryChSheetLive app={app} navigate={navigate} isDark={isDark} />;
  if (id === "partners") return <DiscoveryPartnersSheetLive app={app} navigate={navigate} isDark={isDark} />;
  if (id === "people") return <DiscoveryPeopleSheetLive app={app} navigate={navigate} isDark={isDark} />;
  return null;
}

// ── маленький крестик карточки: 26 видимых / 44 тап-зона ──
// ── крестик карточки: БЕЗ кружка (David: не привлекать внимание), тап-зона 44 ──
function _DiscX({ onClick, color }) {
  return (
    <button onClick={onClick} className="tap" aria-label="Скрыть навсегда" style={{ position: "absolute", top: 0, right: 0, width: 44, height: 44, border: 0, background: "transparent", display: "grid", placeItems: "center", cursor: "pointer", zIndex: 3 }}>
      <svg width="13" height="13" viewBox="0 0 12 12"><path d="M2 2l8 8M10 2l-8 8" stroke={color || "var(--text-4)"} strokeWidth="1.7" strokeLinecap="round" /></svg>
    </button>
  );
}

// ── крупные заливные иконки карточек (David: крупнее + свой цвет + анимация) ──
function _discIcon(key, size, color) {
  // Заливные монохромные глифы, перерисованы по макету «Guide Cards V1 Refined» (David
  // 2026-07-14): ничего не режется от края, сердце/пламя/кубок узнаваемы, «вместе» — две
  // фигуры с полупрозрачным вторым планом.
  var body = {
    xp: <path d="M12 2.2l2.4 7.4 7.4 2.4-7.4 2.4-2.4 7.4-2.4-7.4-7.4-2.4 7.4-2.4z" />,
    together: <g><circle cx="9" cy="8.2" r="3.2" /><path d="M3.2 18.6c0-3 2.6-5.1 5.8-5.1s5.8 2.1 5.8 5.1c0 .66-.54 1.2-1.2 1.2H4.4c-.66 0-1.2-.54-1.2-1.2z" /><circle cx="16.8" cy="9" r="2.4" opacity="0.45" /><path d="M15 14.6c.6-.2 1.3-.32 2-.32 2.3 0 4.1 1.75 4.1 4 0 .5-.4.9-.9.9h-3.1c.1-.36.15-.74.15-1.14 0-1.3-.85-2.6-2.25-3.44z" opacity="0.45" /></g>,
    ch: <path d="M13.1 2.6c.35-.3.88-.06.9.4.08 2.06.77 3.3 2.02 4.72 1.35 1.54 2.78 3.28 2.78 6.08 0 4.14-3.06 7.4-6.8 7.4s-6.8-3.26-6.8-7.4c0-2.06 1.02-4.13 2.42-5.55.32-.33.87-.14.92.32.09.83.35 1.6.85 2.13C10.6 8.2 10.2 5.1 13.1 2.6zM12 18.9c1.5 0 2.7-1.25 2.7-2.9 0-1.2-.68-2.03-1.36-2.86-.3-.37-.87-.35-1.16.03-.6.8-1.88 1.66-1.88 2.98 0 1.5 1.2 2.75 1.7 2.75z" />,
    partners: <path d="M20 8.9V6.8c0-.94-.76-1.7-1.7-1.7H5.7c-.94 0-1.7.76-1.7 1.7v2.1a3.1 3.1 0 0 1 0 6.2v2.1c0 .94.76 1.7 1.7 1.7h12.6c.94 0 1.7-.76 1.7-1.7v-2.1a3.1 3.1 0 0 1 0-6.2zM13.8 15.1L12 13.9l-1.8 1.2.55-2.1-1.65-1.35 2.1-.18.8-2 .8 2 2.1.18-1.65 1.35z" />,
    people: <g><circle cx="10" cy="8" r="3.6" /><path d="M3.6 19.6c0-3.6 2.9-6 6.4-6 1.1 0 2.2.25 3.1.72a4.7 4.7 0 0 0-1.2 3.1v2.8H5.1c-.9 0-1.5-.6-1.5-.62z" /><path d="M17.5 12.8a3 3 0 0 0-3 3v.6h-.1c-.7 0-1.3.6-1.3 1.3v2.9c0 .7.6 1.3 1.3 1.3h6.2c.7 0 1.3-.6 1.3-1.3v-2.9c0-.7-.6-1.3-1.3-1.3h-.1v-.6a3 3 0 0 0-3-3zm0 1.6c.8 0 1.4.6 1.4 1.4v.6h-2.8v-.6c0-.8.6-1.4 1.4-1.4z" /></g>,
    help: <path d="M12 20.4l-1.3-1.18C6.1 15.06 3.2 12.4 3.2 9.15 3.2 6.5 5.28 4.4 7.93 4.4c1.5 0 2.94.7 3.87 1.8l.2.24.2-.24c.93-1.1 2.37-1.8 3.87-1.8 2.65 0 4.73 2.1 4.73 4.75 0 3.25-2.9 5.91-7.5 10.07z" />,
    lock: <path d="M12 3.8c2.65 0 4.8 2.15 4.8 4.8v1.9h.5c.94 0 1.7.76 1.7 1.7v6.5c0 .94-.76 1.7-1.7 1.7H6.7c-.94 0-1.7-.76-1.7-1.7v-6.5c0-.94.76-1.7 1.7-1.7h.5V8.6c0-2.65 2.15-4.8 4.8-4.8zm0 2.1a2.7 2.7 0 0 0-2.7 2.7v1.9h5.4V8.6A2.7 2.7 0 0 0 12 5.9z" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>{body[key] || null}</svg>;
}

// ── карточка колоды по макету «Guide Cards V1 Refined» (David 2026-07-14): хром бел·чёрн·золото.
//    Белая карточка, номер сверху, серебристая плашка-глиф 48px с монохромным чёрным глифом,
//    заголовок+подпись прижаты вниз. Открытая карточка (шторку уже смотрели) — золотое кольцо
//    вокруг глифа + золотой чип «ОТКРЫТО ✓», номер прячется. Закрытая «Люди» (до 10 ур.) —
//    чёрная плашка с золотым замком. Цветных акцентов больше нет. ──
function _DiscCard({ num, iconKey, title, desc, onOpen, onDismiss, isDark, open, locked }) {
  var GOLD = BOS_GOLD, GOLD2 = "#EF9F14";
  var plateBg = locked
    ? "#0a0a0a"
    : (isDark ? "linear-gradient(180deg,#2a2a30,#1e1e24)" : "linear-gradient(180deg,#f4f4f4,#e9e9e9)");
  var plateShadow = locked
    ? "none"
    : (isDark
        ? "inset 0 1px 0 rgba(255,255,255,0.10),inset 0 -1px 2px rgba(0,0,0,0.4)"
        : "inset 0 1px 0 rgba(255,255,255,0.9),inset 0 -1px 2px rgba(0,0,0,0.05)");
  if (open && !locked) plateShadow = plateShadow + ",0 0 0 2px " + GOLD;
  var iconInk = locked ? GOLD : (isDark ? "#f0f0f0" : "#0a0a0a");
  return (
    <button onClick={onOpen} className="tap" style={{ position: "relative", flexShrink: 0, scrollSnapAlign: "start", width: 152, height: 180, borderRadius: 22, background: "var(--card)", boxShadow: "var(--card-shadow)", border: 0, padding: "14px 13px 13px", display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", cursor: "pointer", overflow: "hidden", color: "var(--text)", fontFamily: "inherit", opacity: locked ? 0.92 : 1 }}>
      {onDismiss && !locked && <_DiscX onClick={onDismiss} color={isDark ? "var(--text-4)" : "#b3b3b3"} />}
      {open && !locked && (
        <span style={{ position: "absolute", left: 13, top: 13, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 800, letterSpacing: 0.6, color: "#7a6205", background: "linear-gradient(180deg,#FFE96A," + GOLD + ")", borderRadius: 99, padding: "3px 7px", boxShadow: "0 1px 3px rgba(239,159,20,0.35)", zIndex: 2 }}>
          <svg width="8" height="8" viewBox="0 0 14 14"><path d="M2.8 7.4l2.9 2.9 5.5-6" fill="none" stroke="#7a6205" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>ОТКРЫТО
        </span>
      )}
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: "var(--text-4)", visibility: (open && !locked) ? "hidden" : "visible" }}>{num}</span>
      <span style={{ width: 48, height: 48, borderRadius: "50%", background: plateBg, boxShadow: plateShadow, display: "grid", placeItems: "center", margin: "10px 0" }}>{_discIcon(iconKey, locked ? 19 : 24, iconInk)}</span>
      <span style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: "-0.2px", lineHeight: 1.18, marginTop: "auto" }}>{title}</span>
      <span style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.35, marginTop: 4 }}>{desc}</span>
    </button>
  );
}

// ═════ ЛЕНТА ═════
// Что открывается на уровне — для празднующей карточки level-up (fixes «уровень не празднуется»).
var BOS_LEVEL_UNLOCKS = { 3: "Первая публикация · Разбор привычек", 5: "Карточка «Люди» в ленте", 10: "Нетворк · рынок пользы" };

// обложка «Суть» → шторка «Суть». Макет «Guide Cards V1 Refined» (David 2026-07-14): тёмная
// карточка со сдержанной золотой дугой-«горизонтом» сверху (звёздное небо убрано) и живой
// золотой кнопкой «начать →». Без крестика — вход в гид не прячем.
function DiscoveryCoverCard({ onOpen }) {
  var GOLD = BOS_GOLD;
  return (
    <button onClick={onOpen} className="tap" style={{ position: "relative", flexShrink: 0, scrollSnapAlign: "start", width: 152, height: 180, borderRadius: 22, border: 0, padding: "14px 13px 13px", display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", cursor: "pointer", overflow: "hidden", color: "#fff", fontFamily: "inherit", background: "linear-gradient(180deg,#161619 0%,#0a0a0c 100%)" }}>
      <span aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <span style={{ position: "absolute", left: "50%", top: "-46%", width: "150%", height: "100%", transform: "translateX(-50%)", borderRadius: "50%", boxShadow: "0 0 0 1px rgba(254,222,52,0.22),0 10px 30px rgba(254,222,52,0.10)" }} />
        <span style={{ position: "absolute", left: "50%", top: "-46%", width: "150%", height: "100%", transform: "translateX(-50%)", borderRadius: "50%", background: "radial-gradient(ellipse at 50% 100%,rgba(239,159,20,0.14),transparent 60%)" }} />
      </span>
      <span style={{ position: "relative", fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: "rgba(255,255,255,0.45)" }}>СУТЬ</span>
      <span style={{ position: "relative", fontSize: 16, fontWeight: 700, letterSpacing: "-0.2px", lineHeight: 1.18, marginTop: "auto" }}>Как устроен Balance</span>
      <span style={{ position: "relative", fontSize: 11.5, color: "rgba(255,255,255,0.62)", lineHeight: 1.35, marginTop: 4 }}>одна минута — и всё ясно</span>
      <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 5, marginTop: 9, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.4, color: "#0a0a0a", background: "linear-gradient(180deg,#FFE96A," + GOLD + ")", borderRadius: 99, padding: "5px 10px", boxShadow: "0 2px 8px rgba(254,222,52,0.35)" }}>начать
        <svg width="9" height="9" viewBox="0 0 10 10"><path d="M2 5h6M5.4 2.4L8 5 5.4 7.6" fill="none" stroke="#0a0a0a" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    </button>
  );
}

// золотая карточка «Открылось: …» при переходе на новый уровень (разово, dismissible)
function DiscoveryLevelUpCard({ level, unlock, onOpen, onDismiss }) {
  return (
    <button onClick={onOpen} className="tap" style={{ position: "relative", flexShrink: 0, scrollSnapAlign: "start", width: 152, height: 172, borderRadius: 22, border: 0, padding: "13px 12px 12px", display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", cursor: "pointer", overflow: "hidden", color: "#0a0a0a", fontFamily: "inherit", background: "linear-gradient(150deg, #FEDE34, #E8C21E)" }}>
      <button onClick={onDismiss} className="tap" aria-label="Скрыть" style={{ position: "absolute", top: 2, right: 2, width: 44, height: 44, border: 0, background: "transparent", display: "grid", placeItems: "center", cursor: "pointer", zIndex: 3 }}>
        <span style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,0.14)", display: "grid", placeItems: "center" }}><svg width="11" height="11" viewBox="0 0 11 11"><path d="M2 2l7 7M9 2l-7 7" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round" /></svg></span>
      </button>
      <span style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.12)", display: "grid", placeItems: "center", marginBottom: 9 }}><svg width="19" height="19" viewBox="0 0 24 24" fill="#0a0a0a"><path d="M12 2.2l2.4 7.4 7.4 2.4-7.4 2.4-2.4 7.4-2.4-7.4-7.4-2.4 7.4-2.4z" /></svg></span>
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, opacity: 0.6 }}>ОТКРЫЛОСЬ</span>
      <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.2px", lineHeight: 1.15, marginTop: 2 }}>Уровень {level}</span>
      <span style={{ fontSize: 11.5, lineHeight: 1.3, marginTop: 4, opacity: 0.82 }}>{unlock || "Ты вырос — так держать"}</span>
      <span style={{ marginTop: "auto", fontSize: 11, fontWeight: 800, background: "#0a0a0a", color: "#fff", borderRadius: 999, padding: "3.5px 9px" }}>Посмотреть ›</span>
    </button>
  );
}

// Карточки «Основатель» УДАЛЕНЫ (brief 2026-07-11, Слой 0): само-объявление себя Основателем
// с прыжком на L10 — обход лестницы доверия (уровень открывал публикацию «всем»). Бейдж у тех,
// кто уже забрал подарок, остаётся (bos:founder в localStorage).

// ═════ ЛЕНТА — живая колода (Б2): появление/уход по уровню и прожитости, кап ≤6 ═════
function DiscoveryFeedLive({ app, navigate, isDark }) {
  const sheet = (typeof useSheet === "function") ? useSheet() : { open: () => {} };
  const _t = React.useState(0), setTick = _t[1];
  React.useEffect(() => {
    const f = () => setTick((n) => n + 1);
    window.addEventListener("bos:discoveryChanged", f);
    return () => window.removeEventListener("bos:discoveryChanged", f);
  }, []);
  const dismissed = bosDiscBag("bos:discoveryDismissed");
  const info = (typeof bosLevelInfoLive === "function" && typeof bosLiveXPLive === "function") ? bosLevelInfoLive(bosLiveXPLive(app)) : { level: 1 };
  const userLevel = info.level || 1;

  // сигналы «прожитости» — карточка уходит, когда механика уже вошла в жизнь
  const hasTogether = ((app && app.teams) || []).length > 0 || ((app && app.habits) || []).some((h) => h && (h.shareCode || h.teamHabitId));
  const hasChallenge = ((app && app.habits) || []).some((h) => h && h.challenge) || ((app && app.goals) || []).some((g) => g && g.challenge) || ((app && app.teams) || []).some((t) => t && t.challenge);
  const hasSpent = ((app && app.spentXP) | 0) > 0;

  // level-up: празднуем достижение уровня. Для существующих юзеров init = текущий (без ложной карточки).
  const _lvlSeenRaw = (function () { try { return localStorage.getItem("bos:discoveryLevelSeen"); } catch (e) { return null; } })();
  const lastSeenLevel = _lvlSeenRaw != null ? (parseInt(_lvlSeenRaw, 10) || 0) : userLevel;
  React.useEffect(() => { if (_lvlSeenRaw == null) { try { localStorage.setItem("bos:discoveryLevelSeen", String(userLevel)); } catch (e) {} } }, []);
  const showLevelUp = userLevel > lastSeenLevel;
  const ackLevel = () => { try { localStorage.setItem("bos:discoveryLevelSeen", String(userLevel)); } catch (e) {} try { window.dispatchEvent(new Event("bos:discoveryChanged")); } catch (e) {} };

  const openDisc = (id) => {
    bosDiscMark("bos:discoverySeen", id);
    if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} }
    sheet.open(bosDiscSheetNode(id, app, navigate, isDark));
  };
  const doDismiss = (ev, key) => {
    ev.stopPropagation();
    bosDiscMark("bos:discoveryDismissed", key);
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
  };

  // «прожита» ли карточка (шторку уже открывали) — для золотого статуса «ОТКРЫТО» по макету.
  const seen = bosDiscBag("bos:discoverySeen");

  // колода по правилам: стартовые с L1, «Люди» с L5; уход по прожитости. Хром бел·чёрн·золото
  // (макет «Guide Cards V1 Refined»): цвет живёт только в золотом статусе, глифы монохромные.
  const deckDefs = [
    { key: "xp", id: "xp", iconKey: "xp", title: "Опыт и уровень", desc: "Каждый ход — шаг по пути", show: true },
    { key: "together", id: "together", iconKey: "together", title: "Вместе — больше", desc: "Совместные привычки и цели", show: !hasTogether },
    { key: "helpers", id: "helpers", iconKey: "help", title: "Помогай своим", desc: "Круг подтверждает твою роль", show: true },
    { key: "ch", id: "ch", iconKey: "ch", title: "Челленджи", desc: "Готовая привычка с призом", show: !hasChallenge },
    // «Партнёры» — постоянная дверь в мир впечатлений (David 2026-07-12: не прятать). pin: не
    // уходит после траты XP и несмахиваема (крестика нет), но остаётся на своём месте в ряду.
    { key: "partners", id: "partners", iconKey: "partners", title: "Партнёры", desc: "Впечатления за твой опыт", show: true, pin: true },
    // «Люди» до 10 уровня — закрытый круг: чёрная плашка + золотой замок (макет).
    { key: "people", id: "people", iconKey: userLevel < 10 ? "lock" : "people", title: "Люди", desc: "Закрытый круг — с 10 уровня", show: userLevel >= 5, locked: userLevel < 10 },
  ];
  // Механики, реально попадающие в ряд (кап ≤6) — нумеруем позиционно 01…06, прогресс «N из M».
  const mech = deckDefs.filter((c) => c.show && (c.pin || !dismissed[c.key])).slice(0, 6);
  const total = mech.length;
  const openCount = mech.filter((c) => !!seen[c.id]).length;

  const mechCards = mech.map((c, i) => (
    <_DiscCard key={c.key} num={c.locked ? (("0" + (i + 1)).slice(-2) + " · С 10 УРОВНЯ") : ("0" + (i + 1)).slice(-2)}
      iconKey={c.iconKey} title={c.title} desc={c.desc} isDark={isDark} open={!!seen[c.id]} locked={c.locked}
      onOpen={() => openDisc(c.id)} onDismiss={(c.pin || c.locked) ? undefined : (ev) => doDismiss(ev, c.key)} />
  ));

  // Ряд по макету: обложка «Суть» → (празднование уровня, если есть) → карточки механик.
  // Обложка «Как устроен Balance» открывает НАСТОЯЩИЙ гид (GuideLive), а не мини-шторку «core»
  // (David 2026-07-14: «пусть всплывает наш гайд, а не заглушка»). Гид ушёл из настроек — тут его дом.
  const rail = [<DiscoveryCoverCard key="cover" onOpen={() => { bosDiscMark("bos:discoverySeen", "core"); if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } navigate("guide", { from: "community" }); }} />];
  if (showLevelUp) rail.push(<DiscoveryLevelUpCard key={"lvl" + userLevel} level={userLevel} unlock={BOS_LEVEL_UNLOCKS[userLevel]} onOpen={() => { ackLevel(); openDisc("xp"); }} onDismiss={(ev) => { ev.stopPropagation(); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } ackLevel(); }} />);
  mechCards.forEach((n) => rail.push(n));

  return (
    <div>
      {/* Заголовок ленты по макету: «Открой Balance» + точки-прогресс «N из M». */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "0 4px 10px" }}>
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.3px" }}>Открой Balance</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "var(--text-3)" }}>
          <span style={{ display: "inline-flex", gap: 3 }}>
            {Array.from({ length: total }).map((_, i) => (
              <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: i < openCount ? "#EF9F14" : (isDark ? "#4a4a4a" : "#d6d6d6") }} />
            ))}
          </span>
          {openCount} из {total}
        </span>
      </div>
      <div className="bos-hscroll" style={{ display: "flex", gap: 10, overflowX: "auto", padding: "4px 12px 12px 4px", margin: "0 -12px 0 0", scrollSnapType: "x proximity", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
        {rail}
      </div>
    </div>
  );
}

// ── мягкая вуаль-замок над секцией (лесенка раскрытия по уровню) ──
function DiscoveryVeil({ gate, level, label, isDark, children }) {
  if ((level || 1) >= gate) return children;
  return (
    <div style={{ position: "relative", borderRadius: 22, overflow: "hidden" }}>
      <div aria-hidden style={{ pointerEvents: "none" }}>{children}</div>
      <div style={{ position: "absolute", inset: 0, background: isDark ? "rgba(18,18,22,0.5)" : "rgba(242,242,244,0.55)", backdropFilter: "blur(5px)", WebkitBackdropFilter: "blur(5px)", display: "grid", placeItems: "center" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "var(--card)", border: "0.5px solid var(--line)", boxShadow: "var(--card-shadow)", borderRadius: 999, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, color: "var(--text)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--text)"><path d="M12 3.6c2.8 0 5 2.2 5 5v2h.4c1 0 1.8.8 1.8 1.8v6.8c0 1-.8 1.8-1.8 1.8H6.6c-1 0-1.8-.8-1.8-1.8v-6.8c0-1 .8-1.8 1.8-1.8H7v-2c0-2.8 2.2-5 5-5zm0 2.2a2.8 2.8 0 0 0-2.8 2.8v2h5.6v-2A2.8 2.8 0 0 0 12 5.8z" /></svg>
          {label}
        </span>
      </div>
    </div>
  );
}

/* ═══════════ СООБЩЕСТВО v2 · Э1 «Одно окно» ══════════════════════════════════════
   Блоки главной «Все», собранные из ЖИВЫХ данных (арх. community-architecture-v2.md):
   • Подходит сейчас — рекомендация из ПУБЛИЧНЫХ кругов (нет публичных → блок скрыт);
   • Мои круги — карточки твоих кругов + сводка ритма «сегодня N в ритме»;
   • Помощь круга — вклады людей ИЗ ТВОИХ КРУГОВ (свои — без замка L10), с лицами и именами;
   • Мой вклад — статус-карточка (нет → добавить · есть → форматы/места).
   Принцип «без бутафории»: ноль выдуманных людей/цифр, пусто = блок скрыт. Ноль новых таблиц. */

// RU-склонение «место/места/мест» и «формат/формата/форматов».
function bosSlotsWord(n) { var a = n % 10, b = n % 100; return (a === 1 && b !== 11) ? "место" : ((a >= 2 && a <= 4 && (b < 12 || b > 14)) ? "места" : "мест"); }
function bosFormatsWord(n) { var a = n % 10, b = n % 100; return (a === 1 && b !== 11) ? "формат" : ((a >= 2 && a <= 4 && (b < 12 || b > 14)) ? "формата" : "форматов"); }

// Хук: карта участников моих кругов (owner_id → {name, avatar, teamName}) + мой cloud-id.
// Один проход по teamMembers всех моих облачных кругов; пусто/оффлайн → {} (без вспышки).
function bosUseCircleMembers(app) {
  var teams = ((app && app.teams) || []).filter(function (t) { return t && t.cloudId; });
  var _r = React.useState(0), rev = _r[0], setRev = _r[1];
  var uidHint = null; try { uidHint = window.bosCloud && window.bosCloud.uidSync && window.bosCloud.uidSync(); } catch (e) {}
  var sig = teams.map(function (t) { return [t.cloudId, t.name || ""].join(":"); }).join(",") + "|" + (uidHint || "") + "|" + rev;
  var _s = React.useState({ status: "loading", map: null, meId: null, key: null }), state = _s[0], setState = _s[1];
  React.useEffect(function () {
    if (!teams.length) { setState({ status: "ready", map: {}, meId: uidHint || null, key: sig }); return; }
    if (!(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.teamMembersStrict)) { setState({ status: "error", map: {}, meId: null, key: sig }); return; }
    var on = true;
    setState({ status: "loading", map: null, meId: uidHint || null, key: sig });
    Promise.all([
      window.bosCloud.uid().catch(function () { return null; }),
      Promise.all(teams.map(function (t) { return window.bosCloud.teamMembersStrict(t.cloudId).then(function (r) { return { t: t, status: r && r.status, mem: (r && r.people) || [] }; }).catch(function () { return { t: t, status: "error", mem: [] }; }); }))
    ]).then(function (all) {
        if (!on) return;
        var meId = all[0] || null, res = all[1] || [], m = {}, failed = 0;
        if (!meId) { setState({ status: "error", map: {}, meId: null, key: sig }); return; }
        res.forEach(function (r) {
          if (r.status !== "ready") failed++;
          r.mem.forEach(function (p) { if (p && p.id && p.id !== meId && !m[p.id]) m[p.id] = { name: p.name || "Участник", avatar: p.avatar, teamName: r.t.name }; });
        });
        setState({ status: failed === 0 ? "ready" : (failed < res.length ? "partial" : "error"), map: m, meId: meId, key: sig });
      });
    return function () { on = false; };
  }, [sig]);
  var safe = state.key === sig ? state : { status: "loading", map: null, meId: uidHint || null };
  return { status: safe.status, map: safe.map, meId: safe.meId, refresh: function () { setRev(function (n) { return n + 1; }); } };
}

// ── «ПОДХОДИТ СЕЙЧАС» — рекомендация из публичных кругов, ВСЕГДА с причиной ──
// Двигатель Э1: первый публичный круг, в котором тебя ещё нет. Причина — из реальных данных
// (твой ритм сегодня). Нет публичных кругов → return null (блок скрыт, не заглушка).
// Умный подбор по состоянию/времени — Э4; здесь честный минимум с настоящей строкой «почему».
function CommunitySuggestLive({ app, navigate, isDark, onOpen }) {
  var _p = React.useState(null), pub = _p[0], setPub = _p[1];
  React.useEffect(function () {
    if (!(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.discoverTeams)) { setPub([]); return; }
    var on = true;
    window.bosCloud.discoverTeams().then(function (ts) { if (on) setPub(Array.isArray(ts) ? ts : []); }).catch(function () { if (on) setPub([]); });
    return function () { on = false; };
  }, []);
  if (pub === null) return null;
  var mineIds = {}; ((app && app.teams) || []).forEach(function (t) { if (t && t.cloudId) mineIds[t.cloudId] = 1; });
  var cand = pub.filter(function (t) { return t && !mineIds[t.id]; })[0];
  if (!cand) return null;
  var habits = ((app && app.habits) || []).filter(function (h) { return h && !h.shelved && !h.goalOnly; });
  var todayK = (typeof bosTodayKey === "function") ? bosTodayKey() : new Date().toISOString().slice(0, 10);
  var doneT = habits.filter(function (h) { return h.log && h.log[todayK]; }).length;
  var why = habits.length ? ("вечер · ты сегодня в ритме " + doneT + " из " + habits.length) : "открытый круг рядом";
  return (
    <div>
      <CommSectionHeadLive title="✨ Подходит сейчас" onAll={null} />
      <div style={{ marginTop: 10, background: "var(--card)", borderRadius: 22, padding: "14px 15px", boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#FEDE34,#EF9F14)", display: "grid", placeItems: "center", fontSize: 21, flexShrink: 0, boxShadow: "0 4px 12px rgba(239,159,20,0.28)" }}>{bosIcon(cand.emblem || "🌙", 21, "#0a0a0a")}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cand.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>Открытый круг · {cand.members || 0} участ.</div>
          </div>
          <button onClick={onOpen} className="tap" data-haptic="selection" style={{ flexShrink: 0, background: "var(--cta, #0a0a0a)", color: "var(--cta-ink, #fff)", border: 0, borderRadius: 999, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Смотреть</button>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 11, background: "var(--surface-3)", borderRadius: 999, padding: "6px 11px", fontSize: 11.5, fontWeight: 600, color: "var(--text-3)" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" /></svg>
          {why}
        </div>
      </div>
    </div>
  );
}

// ── «МОИ КРУГИ» — твои круги карточками + сводка ритма (в LiveTeamCard rhythm) ──
function MyCirclesLive({ app, navigate, isDark, onAll }) {
  var teams = ((app && app.teams) || []).filter(function (t) { return t && (t.cloudId || (t.members && t.members.length) || t.seedId); });
  if (!teams.length) return null;
  return (
    <div>
      <CommSectionHeadLive title="🫂 Мои круги" onAll={onAll} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 10 }}>
        {teams.map(function (t) { return <LiveTeamCard key={t._id || t.cloudId} t={t} navigate={navigate} rhythm />; })}
      </div>
    </div>
  );
}

// ── «ПОМОЩЬ ОТ СВОИХ» — общие круги + прямые друзья, лица + имена ──
// netOffers уже ограничен серверным RLS; здесь тот же owner-scope, что в Балансе
// окружения, поэтому найденная там помощь не исчезает после перехода.
// Факты доверия ✓подтверждения/✦следы появятся в Э2/Э4 — пока показываем ТОЛЬКО реальное
// (время/онлайн, места, «показана: круг …»), без выдуманных чисел. Пусто → блок скрыт.
function CircleHelpLive({ app, navigate, isDark }) {
  var cm = bosUseCircleMembers(app), directState = bosEnvUsePeople(), meId = cm.meId;
  var map = null;
  if (cm.map || Array.isArray(directState.people)) {
    map = {};
    (Array.isArray(directState.people) ? directState.people : []).forEach(function (p) { if (p && p.id) map[p.id] = { name: p.name || "Друг", avatar: p.avatar, teamName: null, direct: true }; });
    Object.keys(cm.map || {}).forEach(function (id) { map[id] = cm.map[id]; });
  }
  var focusOwners = app && app.communityView && Array.isArray(app.communityView.helpOwnerIds) ? app.communityView.helpOwnerIds : null;
  var focusOffers = app && app.communityView && Array.isArray(app.communityView.helpOfferIds) ? app.communityView.helpOfferIds : null;
  var focusSig = (focusOwners || []).join(",") + "|" + (focusOffers || []).join(",");
  var focusCircleOwners = (focusOwners || []).filter(function (id) { return cm.map && cm.map[id]; });
  var circleSig = focusCircleOwners.join(",");
  var _o = React.useState(null), offers = _o[0], setOffers = _o[1];
  var _cf = React.useState({}), confs = _cf[0], setConfs = _cf[1]; // offerId -> { n, mine }
  var _mt = React.useState({}), meta = _mt[0], setMeta = _mt[1];   // offerId -> { thanksN, booked, thanked, week }
  var s = (typeof useSheet === "function") ? useSheet() : { open: function () {} };
  var _t = React.useState(0), tick = _t[0], setTick = _t[1];
  React.useEffect(function () {
    if (!(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.netOffers)) { setOffers([]); return; }
    var on = true;
    var load = focusOwners && focusOwners.length && window.bosCloud.netConfirmedOffersByOwners
      ? window.bosCloud.netConfirmedOffersByOwners(focusOwners, focusCircleOwners).then(function (r) { return (r && r.offers) || []; })
      : window.bosCloud.netOffers(200);
    load.then(function (all) { if (on) setOffers(Array.isArray(all) ? all : []); }).catch(function () { if (on) setOffers([]); });
    return function () { on = false; };
  }, [tick, focusSig, circleSig]);
  var shown = (map && offers) ? offers.filter(function (o) { return o && o.owner_id && o.owner_id !== meId && map[o.owner_id] && o.active !== false && (!focusOffers || !focusOffers.length || focusOffers.indexOf(o.id) >= 0); }).slice(0, focusOffers && focusOffers.length ? 6 : 3) : [];
  var shownSig = shown.map(function (o) { return o.id; }).join(",");
  React.useEffect(function () {
    if (!shown.length || !(window.bosCloud && window.bosCloud.netRoleConfirmations)) return;
    var on = true;
    Promise.all(shown.map(function (o) { return window.bosCloud.netRoleConfirmations(o.id).then(function (rc) { rc = rc || []; return { id: o.id, n: rc.length, mine: meId ? rc.some(function (x) { return x.confirmer_id === meId; }) : false }; }).catch(function () { return { id: o.id, n: 0, mine: false }; }); }))
      .then(function (res) { if (!on) return; var m = {}; res.forEach(function (r) { m[r.id] = { n: r.n, mine: r.mine }; }); setConfs(m); });
    return function () { on = false; };
  }, [shownSig, meId, tick]);
  // следы пользы (✦) + мои брони: показать «✦ N» и кнопку «Спасибо ✦» тому, кого я бронировал.
  React.useEffect(function () {
    if (!shown.length) return;
    var on = true;
    var bookedWk = {};
    (window.bosCloud && window.bosCloud.netMyBookings ? window.bosCloud.netMyBookings() : Promise.resolve([]))
      .then(function (bk) {
        (bk || []).forEach(function (b) { if (b && b.offer_id) bookedWk[b.offer_id] = b.week; });
        return Promise.all(shown.map(function (o) { return (window.bosCloud.netOfferThanks ? window.bosCloud.netOfferThanks(o.id) : Promise.resolve({ n: 0, mine: false })).then(function (th) { return { id: o.id, thanksN: (th && th.n) || 0, thanked: !!(th && th.mine), booked: !!bookedWk[o.id], week: bookedWk[o.id] || null }; }).catch(function () { return { id: o.id, thanksN: 0, thanked: false, booked: false, week: null }; }); }));
      })
      .then(function (res) { if (!on) return; var m = {}; res.forEach(function (r) { m[r.id] = r; }); setMeta(m); }).catch(function () {});
    return function () { on = false; };
  }, [shownSig, tick]);
  if (!map || offers === null) return null;
  if (!shown.length) return null;
  var confirmRole = function (o) {
    if (!window.bosCloud || !window.bosCloud.netConfirmRole) return;
    setConfs(function (m) { var n = Object.assign({}, m); var cur = n[o.id] || { n: 0, mine: false }; n[o.id] = { n: cur.n + 1, mine: true }; return n; }); // оптимистично
    if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
    window.bosCloud.netConfirmRole(o.id).then(function () { setTick(function (n) { return n + 1; }); });
  };
  return (
    <div data-community-section="circle-help" style={{ scrollMarginTop: 12 }}>
      <CommSectionHeadLive title="Помощь от своих" onAll={null} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
        {shown.map(function (o) {
          var p = map[o.owner_id];
          var slots = Math.max(1, o.slots_week || 1);
          var person = { ownerId: o.owner_id, avatar: p.avatar, level: null, offers: [o] };
          var cf = confs[o.id] || { n: 0, mine: false };
          var mt = meta[o.id] || { thanksN: 0, booked: false, thanked: false };
          var isDraft = o.status === "draft";
          var canConfirm = isDraft && !cf.mine;
          var canThank = mt.booked && !mt.thanked; // я бронировал и ещё не оставил след
          var facts = [o.when_text, slots + " " + bosSlotsWord(slots)];
          if (cf.n > 0) facts.push("✓ " + cf.n);
          if (mt.thanksN > 0) facts.push("✦ " + mt.thanksN);
          return (
            <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--card)", borderRadius: 22, padding: "13px 14px", boxShadow: "var(--card-shadow)", color: "var(--text)" }}>
              <button onClick={function () { if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } if (o.kind === "skill_offer") navigate("net-person", { person: { ownerId: o.owner_id, name: p.name, avatar: p.avatar, level: null, offers: [o] } }); else navigate("contact-detail", { person: { id: o.owner_id, name: p.name, avatar: p.avatar, teamName: p.teamName, from: "community" } }); }} className="tap" style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12, border: 0, background: "transparent", textAlign: "left", cursor: "pointer", color: "var(--text)", padding: 0 }}>
                <BuddyFaceLive avatar={p.avatar} name={p.name} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(p.name || "").split(" ")[0]} · {typeof bosHelpOfferTitleText === "function" ? bosHelpOfferTitleText(o) : o.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>{facts.filter(Boolean).join(" · ")}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 2 }}>{p.teamName ? ("Общий круг · «" + p.teamName + "»") : "Прямой контакт"}{isDraft ? " · черновик" : ""}</div>
                </div>
              </button>
              {canConfirm
                ? <button onClick={function () { confirmRole(o); }} className="tap" style={{ flexShrink: 0, background: "linear-gradient(135deg,#FEDE34,#EF9F14)", color: "#0a0a0a", border: 0, borderRadius: 999, padding: "8px 13px", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>Подтвердить</button>
                : isDraft
                  ? <span style={{ flexShrink: 0, background: "var(--surface-3)", color: "var(--text-4)", borderRadius: 999, padding: "8px 12px", fontSize: 11.5, fontWeight: 700 }}>{cf.mine ? "Ты подтвердил" : "Ждёт подтверждений"}</span>
                : o.kind === "skill_offer"
                  ? <button onClick={function () { if (typeof NetworkRequestSheetLive === "function") s.open(<NetworkRequestSheetLive person={{ ownerId: o.owner_id, name: p.name, avatar: p.avatar }} offer={o} />); }} className="tap" style={{ flexShrink: 0, background: "#0a0a0a", color: "#fff", border: 0, borderRadius: 999, padding: "8px 13px", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>Запросить</button>
                  : canThank
                  ? <button onClick={function () { s.open(<ThanksSheetLive offerId={o.id} toId={o.owner_id} toName={p.name} week={mt.week} onDone={function () { setTick(function (n) { return n + 1; }); }} />); }} className="tap" style={{ flexShrink: 0, background: "linear-gradient(135deg,#FEDE34,#EF9F14)", color: "#0a0a0a", border: 0, borderRadius: 999, padding: "8px 13px", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>Спасибо ✦</button>
                  : <button onClick={function () { if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } navigate("contact-detail", { person: { id: o.owner_id, name: p.name, avatar: p.avatar, teamName: p.teamName, from: "community" } }); }} className="tap" style={{ flexShrink: 0, background: "var(--surface-3)", color: "var(--text-2)", border: 0, borderRadius: 999, padding: "8px 13px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Попросить</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── «МОЙ ВКЛАД» — статус-карточка пути помощника (нет → добавить · черновик N/2 · открыт). ──
// Все уровни (свои — без замка). Открывает шторку «Добавить формат помощи» (Э2, каталог+подтверждения).
function MyContributionStatusLive({ app, navigate, isDark }) {
  var s = (typeof useSheet === "function") ? useSheet() : { open: function () {} };
  var _o = React.useState(null), offers = _o[0], setOffers = _o[1];
  var _cn = React.useState(null), confN = _cn[0], setConfN = _cn[1];
  var _th = React.useState(0), thanksN = _th[0], setThanksN = _th[1];
  var _t = React.useState(0), tick = _t[0], setTick = _t[1];
  React.useEffect(function () {
    if (!(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.netMyOffers)) { setOffers([]); return; }
    var on = true;
    window.bosCloud.netMyOffers().then(function (mine) {
      if (!on) return; mine = (Array.isArray(mine) ? mine : []).filter(function (o) { return !o.kind || o.kind === "circle_support"; }); setOffers(mine);
      var first = mine.filter(function (o) { return o && o.active !== false; })[0];
      if (first && window.bosCloud.netRoleConfirmations) window.bosCloud.netRoleConfirmations(first.id).then(function (rc) { if (on) setConfN((rc || []).length); }); else setConfN(0);
      if (first && window.bosCloud.netOfferThanks) window.bosCloud.netOfferThanks(first.id).then(function (th) { if (on) setThanksN((th && th.n) || 0); });
    }).catch(function () { if (on) { setOffers([]); setConfN(0); } });
    return function () { on = false; };
  }, [tick]);
  if (offers === null) return null;
  var refreshed = function () { setTick(function (n) { return n + 1; }); };
  var open = function (offer) { if (typeof AddHelpFormatSheetLive === "function") s.open(<AddHelpFormatSheetLive app={app} offer={offer} onDone={refreshed} />); };
  var active = offers.filter(function (o) { return o && o.active !== false; });
  var goldCard = { background: "var(--card)", borderRadius: 22, padding: "14px 15px", boxShadow: "var(--card-shadow)", border: "1px solid rgba(239,159,20,0.35)" };
  var shield = <svg width="12" height="12" viewBox="0 0 24 24" fill="#EF9F14"><path d="M12 2l8 3.5v5.2c0 5-3.4 9.6-8 11.3-4.6-1.7-8-6.3-8-11.3V5.5L12 2z" /></svg>;
  if (!active.length) {
    return (
      <div style={goldCard}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.8, color: "#9a6800", textTransform: "uppercase" }}>{shield} Мой вклад</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginTop: 7, letterSpacing: "-0.2px" }}>Стань помощником своим</div>
        <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 3, lineHeight: 1.4 }}>Выбери формат из безопасного каталога — круг подтвердит роль.</div>
        <button onClick={function () { open(null); }} className="tap" data-haptic="selection" style={{ width: "100%", marginTop: 12, border: 0, background: "linear-gradient(135deg,#FEDE34,#EF9F14)", color: "#0a0a0a", fontSize: 14, fontWeight: 800, borderRadius: 14, padding: "12px 16px", cursor: "pointer", boxShadow: "0 4px 12px rgba(239,159,20,0.3)" }}>Добавить формат помощи</button>
      </div>
    );
  }
  var first = active[0];
  var n = confN == null ? 0 : confN;
  var confirmed = first.status === "confirmed" || n >= 2;
  var statusKick = confirmed ? "Мой вклад · подтверждён" : "Мой вклад · черновик для общих кругов";
  var traces = thanksN > 0 ? (" · ✦ " + thanksN + " " + (thanksN === 1 ? "след пользы" : (thanksN < 5 ? "следа пользы" : "следов пользы"))) : "";
  var sub = (confirmed ? "Роль подтверждена · дальше: первое дело у своих" : (n + " из 2 подтверждений · дальше: первое дело у своих")) + traces;
  return (
    <div style={goldCard}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: 0.5, color: "#9a6800", textTransform: "uppercase" }}>{shield} {statusKick}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{typeof bosHelpOfferTitleText === "function" ? bosHelpOfferTitleText(first) : first.title}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 3 }}>{sub}{active.length > 1 ? (" · ещё " + (active.length - 1)) : ""}</div>
        </div>
        <button onClick={function () { active.length > 1 && typeof HelpFormatsManageSheetLive === "function" ? s.open(<HelpFormatsManageSheetLive app={app} offers={active} onDone={refreshed} />) : open(first); }} className="tap" data-haptic="selection" style={{ flexShrink: 0, background: "var(--surface-3)", color: "var(--text-2)", border: 0, borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{active.length > 1 ? "Управлять" : "Изменить"}</button>
      </div>
    </div>
  );
}

// ═════ Э2 · ШТОРКА «Добавить формат помощи» (валидация окружением) ═════════════════
// Безопасный каталог + границы + круг потенциальных подтверждающих → сохранить черновик.
// Никакого фиктивного «запроса»: участники сами подтверждают только знакомую им роль.
var BOS_HELP_CATALOG = [
  { key: "habit",   i: "🌱", icon: "Leaf",     t: "Поддержать привычку" },
  { key: "walk",    i: "🚶", icon: "Foot",     t: "Позвать на прогулку" },
  { key: "return",  i: "🔄", icon: "Refresh",  t: "Помочь вернуться в ритм" },
  { key: "workout", i: "🏃", icon: "Dumbbell", t: "Провести первую тренировку" },
  { key: "breath",  i: "🧘", icon: "Moon",     t: "Провести дыхание или медитацию" },
  { key: "week",    i: "🗓️", icon: "Calendar", t: "Разобрать неделю" },
  { key: "meet",    i: "🤝", icon: "Users",    t: "Собрать маленькую встречу" },
  { key: "skill",   i: "💡", icon: "Bulb",     t: "Показать навык на практике" },
  { key: "focus",   i: "⏱️", icon: "Clock",    t: "Провести совместный фокус-час" },
  { key: "task",    i: "🎯", icon: "Target",   t: "Разобрать конкретную задачу" },
];
// «Показать навык» оставлен только для редактирования legacy-строк. Новый навык создаётся
// отдельно в «Мои навыки»: круговая поддержка и профессиональная способность больше не смешаны.
var BOS_CIRCLE_SUPPORT_CATALOG = BOS_HELP_CATALOG.filter(function (c) { return c.key !== "skill"; });
var BOS_HELP_SKILL_PRESETS = ["Медитация", "Бег", "Силовые тренировки", "Планирование", "Фокус и работа", "Публичные выступления", "Дизайн", "Языковая практика"];
function bosHelpDraftUuid() {
  try { if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 3 | 8); return v.toString(16); });
}

function AddHelpFormatSheetLive({ app, offer, onDone }) {
  var s = (typeof useSheet === "function") ? useSheet() : { close: function () {} };
  var editing = !!(offer && offer.id);
  var cm = bosUseCircleMembers(app);
  var members = (cm.map ? Object.keys(cm.map) : []).filter(function (id) { return id !== cm.meId; }).map(function (id) { return { id: id, name: cm.map[id].name, avatar: cm.map[id].avatar }; });
  var initCat = BOS_HELP_CATALOG.filter(function (c) { return offer && c.t === offer.title; })[0];
  var initMins = offer && parseInt(offer.when_text, 10); if ([15, 20, 30].indexOf(initMins) < 0) initMins = 20;
  var initPlace = offer && ("" + (offer.when_text || "")).toLowerCase().indexOf("рядом") >= 0 ? "рядом" : "онлайн";
  var initSlots = offer && parseInt(offer.slots_week, 10); if ([1, 2, 3].indexOf(initSlots) < 0) initSlots = 2;
  var initSkill = "Медитация";
  if (offer && offer.descr) { var sd = ("" + offer.descr).replace(/^Навык\s*·\s*/, ""); if (BOS_HELP_SKILL_PRESETS.indexOf(sd) >= 0) initSkill = sd; }
  var _c = React.useState(initCat ? initCat.key : (editing ? "legacy" : "habit")); var catKey = _c[0], setCatKey = _c[1];
  var _di = React.useState(function () { return (offer && offer.id) || bosHelpDraftUuid(); }); var draftId = _di[0];
  var _m = React.useState(initMins); var mins = _m[0], setMins = _m[1];
  var _p = React.useState(initPlace); var place = _p[0], setPlace = _p[1];
  var _sl = React.useState(initSlots); var slots = _sl[0], setSlots = _sl[1];
  var _sk = React.useState(initSkill); var skillName = _sk[0], setSkillName = _sk[1];
  var _b = React.useState(false); var busy = _b[0], setBusy = _b[1];
  var _er = React.useState(""); var saveError = _er[0], setSaveError = _er[1];
  var cat = BOS_HELP_CATALOG.filter(function (c) { return c.key === catKey; })[0]
    || (editing ? { key: "legacy", i: offer.emoji || "✨", icon: "Heart", t: offer.title || "Формат помощи" } : null);
  var confirmed = !!(offer && offer.status === "confirmed");
  var save = async function () {
    if (!cat || busy) return; setBusy(true); setSaveError("");
    var when = mins + " мин · " + place, row = null;
    // min_level=1: вклад для СВОИХ — без замка L10 на бронь (помощь своим не рынок). Рынок «всех»
    // (visibility='all') гейтит уровень публикации отдельно, а не эту запись.
    var descr = cat.key === "skill" ? ("Навык · " + skillName) : "";
    try { if (window.bosCloud && window.bosCloud.netUpsertOffer) row = await window.bosCloud.netUpsertOffer({ id: draftId, existing: editing, emoji: cat.i, title: cat.t, descr: descr, price_xp: 0, slots_week: slots, when_text: when, min_level: 1, visibility: (offer && offer.visibility) || "circles", status: (offer && offer.status) || "draft", active: true }); } catch (e) {}
    if (!row) {
      setBusy(false); setSaveError("Не удалось сохранить. Проверь соединение и попробуй ещё раз.");
      if (window.tgHaptic) { try { window.tgHaptic("error"); } catch (e) {} }
      return;
    }
    setBusy(false); if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} } if (onDone) onDone(row); s.close();
  };
  var kick = { fontSize: 11, fontWeight: 800, letterSpacing: 0.6, color: "var(--text-4)", textTransform: "uppercase", padding: "16px 2px 8px" };
  var boundaryChoice = function (on) { return { minHeight: 44, flex: 1, border: on ? "1px solid #EF9F14" : "1px solid transparent", background: on ? "rgba(254,222,52,0.24)" : "var(--surface-3)", color: on ? "var(--text)" : "var(--text-3)", borderRadius: 13, padding: "8px 7px", fontSize: 12.5, fontWeight: on ? 750 : 600, cursor: "pointer" }; };
  var CurrentIcon = cat && typeof I !== "undefined" && I[cat.icon];
  return (
    <div className="bos-sheet-scroll" style={{ paddingTop: 2, paddingLeft: 16, paddingRight: 16, color: "var(--text)" }}>
      {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
      <div style={_dSTitle}>{editing ? "Настроить поддержку" : "Как ты поддержишь своих"}</div>
      <div style={_dSSub}>коротко, бесплатно и только для людей из общих кругов</div>

      <div style={kick}>Что ты готов делать</div>
      <div role={editing ? undefined : "radiogroup"} aria-label="Формат помощи" style={{ background: "var(--card)", borderRadius: 18, boxShadow: "var(--card-shadow)", overflow: "hidden" }}>
        {editing ? (
          <div style={{ minHeight: 56, display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
            <span style={{ width: 30, height: 30, borderRadius: 10, background: "var(--surface-3)", display: "grid", placeItems: "center", flexShrink: 0 }}>{CurrentIcon ? <CurrentIcon size={16} color="var(--text-2)" /> : null}</span>
            <span style={{ flex: 1 }}><span style={{ display: "block", fontSize: 14.5, fontWeight: 700 }}>{cat.t}</span><span style={{ display: "block", fontSize: 11, color: "var(--text-4)", marginTop: 2 }}>Другой навык или роль — отдельный формат</span></span>
          </div>
        ) : BOS_CIRCLE_SUPPORT_CATALOG.map(function (c, i) {
          var on = c.key === catKey;
          var CatIcon = typeof I !== "undefined" && I[c.icon];
          return (
            <button key={c.key} role="radio" aria-checked={on} onClick={function () { setCatKey(c.key); if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } }} className="tap hit44" style={{ minHeight: 54, width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: 0, borderTop: i ? "0.5px solid var(--line)" : 0, background: "transparent", textAlign: "left", cursor: "pointer", color: on ? "var(--text)" : "var(--text-3)", fontWeight: on ? 700 : 600 }}>
              <span style={{ width: 30, height: 30, borderRadius: 10, background: "var(--surface-3)", display: "grid", placeItems: "center", flexShrink: 0 }}>{CatIcon ? <CatIcon size={16} color="var(--text-2)" /> : null}</span>
              <span style={{ flex: 1, fontSize: 14.5 }}>{c.t}</span>
              <span style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", background: on ? "#FEDE34" : "transparent", border: on ? "1px solid #EF9F14" : "1.5px solid var(--line)" }}>{on && <svg width="12" height="12" viewBox="0 0 14 14"><path d="M2.8 7.4l2.9 2.9 5.5-6" fill="none" stroke="#0a0a0a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}</span>
            </button>
          );
        })}
      </div>

      {cat && cat.key === "skill" ? (
        <React.Fragment>
          <div style={kick}>Какой навык</div>
          {editing ? <div style={{ minHeight: 48, display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", borderRadius: 15, background: "var(--card)", boxShadow: "var(--card-shadow)", color: "var(--text)" }}>{typeof I !== "undefined" && I.Bulb ? <I.Bulb size={17} color="var(--text-2)" /> : null}<span style={{ fontSize: 13.5, fontWeight: 700 }}>{skillName}</span></div>
            : <div role="radiogroup" aria-label="Навык" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {BOS_HELP_SKILL_PRESETS.map(function (name) { var on = skillName === name; return <button key={name} role="radio" aria-checked={on} onClick={function () { setSkillName(name); }} className="tap hit44" style={{ minHeight: 44, border: on ? "1px solid #EF9F14" : "1px solid transparent", borderRadius: 13, background: on ? "rgba(254,222,52,0.24)" : "var(--card)", color: on ? "var(--text)" : "var(--text-3)", boxShadow: "var(--card-shadow)", padding: "8px 9px", fontSize: 12, fontWeight: on ? 750 : 600, textAlign: "left", cursor: "pointer" }}>{name}</button>; })}
            </div>}
        </React.Fragment>
      ) : null}

      <div style={kick}>Границы формата</div>
      <div style={{ background: "var(--card)", borderRadius: 18, boxShadow: "var(--card-shadow)", padding: 12 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 7 }}>Длительность</div>
        <div style={{ display: "flex", gap: 6 }}>
          {[15, 20, 30].map(function (v) { return <button key={v} onClick={function () { setMins(v); }} className="tap hit44" aria-pressed={mins === v} style={boundaryChoice(mins === v)}>{v} мин</button>; })}
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", margin: "12px 0 7px" }}>Где</div>
        <div style={{ display: "flex", gap: 6 }}>
          {["онлайн", "рядом"].map(function (v) { return <button key={v} onClick={function () { setPlace(v); }} className="tap hit44" aria-pressed={place === v} style={boundaryChoice(place === v)}>{v === "онлайн" ? "Онлайн" : "Рядом"}</button>; })}
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", margin: "12px 0 7px" }}>Мест в неделю</div>
        <div style={{ display: "flex", gap: 6 }}>
          {[1, 2, 3].map(function (v) { return <button key={v} onClick={function () { setSlots(v); }} className="tap hit44" aria-pressed={slots === v} style={boundaryChoice(slots === v)}>{v}</button>; })}
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--text-4)", lineHeight: 1.45, padding: "9px 2px 0" }}>Это не объявление об услуге и не доказательство навыка. Формат видят только общие круги; без медицины, терапии, финансов и обещаний результата.</div>

      <div style={kick}>Кто сможет подтвердить роль</div>
      {cm.status === "loading" ? (
        <div style={{ minHeight: 44, display: "flex", alignItems: "center", gap: 8, color: "var(--text-4)", fontSize: 12.5 }}>{typeof I !== "undefined" && I.Refresh ? <I.Refresh size={14} color="var(--text-4)" /> : null}Проверяем общие круги…</div>
      ) : cm.status === "error" ? (
        <div style={{ padding: "10px 12px", borderRadius: 14, background: "var(--surface-3)" }}>
          <div style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.4 }}>Не удалось обновить круги. Черновик сохранить можно, но список подтверждающих пока неизвестен.</div>
          <button onClick={cm.refresh} className="tap hit44" style={{ minHeight: 44, marginTop: 6, padding: 0, border: 0, background: "transparent", color: "var(--text-2)", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Попробовать ещё раз</button>
        </div>
      ) : members.length ? (
        <div className="bos-hscroll" style={{ display: "flex", gap: 10, overflowX: "auto", padding: "2px 2px 4px" }}>
          {members.slice(0, 10).map(function (p) {
            return (
              <div key={p.id} style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, width: 56 }}>
                <span style={{ position: "relative", borderRadius: "50%" }}>
                  <BuddyFaceLive avatar={p.avatar} name={p.name} size={44} />
                </span>
                <span style={{ fontSize: 11, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 56, textAlign: "center" }}>{(p.name || "").split(" ")[0]}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.45, padding: "0 2px" }}>Появится, когда у тебя будут круги с людьми — они и подтвердят роль. Пока можно сохранить черновик.</div>
      )}
      <div style={{ fontSize: 11.5, color: "var(--text-4)", lineHeight: 1.45, padding: "8px 2px 0" }}>{cm.status === "partial" ? "Показаны не все круги. " : ""}Участник общего круга подтверждает, что знает тебя в этой роли. Сейчас никому ничего не отправляем.</div>

      <div style={{ marginTop: 14, background: "var(--card)", border: "1px solid rgba(239,159,20,0.35)", borderRadius: 16, padding: 13, display: "flex", alignItems: "center", gap: 11 }}>
        <span style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#FEDE34,#EF9F14)", display: "grid", placeItems: "center", flexShrink: 0 }}>{typeof I !== "undefined" && I.Moon ? <I.Moon size={17} color="#0a0a0a" /> : null}</span>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{confirmed ? "Поддержка подтверждена кругом" : "Черновик для общих кругов"}</div>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 1, lineHeight: 1.35 }}>{confirmed ? "После дела обе стороны отметят, что оно состоялось" : "Два участника подтверждают, что ты действительно готов так помогать"}</div>
        </div>
      </div>

      {saveError ? <div role="alert" style={{ marginTop: 12, padding: "10px 12px", borderRadius: 13, background: "rgba(255,59,48,0.09)", color: "#D14338", fontSize: 12, lineHeight: 1.4 }}>{saveError}</div> : null}
      <button onClick={save} disabled={!cat || busy} aria-busy={busy} className="tap hit44" style={{ minHeight: 48, width: "100%", marginTop: 14, marginBottom: 8, border: 0, background: cat ? "linear-gradient(135deg,#FEDE34,#EF9F14)" : "var(--surface-3)", color: cat ? "#0a0a0a" : "var(--text-4)", fontSize: 15, fontWeight: 800, borderRadius: 16, padding: 14, cursor: cat ? "pointer" : "default", boxShadow: cat ? "0 6px 16px rgba(239,159,20,0.32)" : "none" }}>{busy ? "Сохраняем…" : editing ? "Сохранить поддержку" : "Сохранить для своих"}</button>
    </div>
  );
}

// Несколько ролей не прячем за общей лентой: это короткий личный менеджер.
// Каждая строка открывает тот же безопасный редактор; новая роль создаётся отдельно,
// поэтому уже собранные подтверждения никогда не переносятся на другой навык.
function HelpFormatsManageSheetLive({ app, offers, onDone }) {
  var s = (typeof useSheet === "function") ? useSheet() : { open: function () {} };
  var active = (Array.isArray(offers) ? offers : []).filter(function (o) { return o && o.active !== false; });
  var edit = function (offer) {
    if (typeof AddHelpFormatSheetLive !== "function") return;
    s.open(<AddHelpFormatSheetLive app={app} offer={offer || null} onDone={onDone} />);
  };
  return (
    <div className="bos-sheet-scroll" style={{ paddingTop: 2, paddingLeft: 16, paddingRight: 16, color: "var(--text)" }}>
      {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
      <div style={_dSTitle}>Твои форматы помощи</div>
      <div style={_dSSub}>каждая роль — отдельный понятный формат для общих кругов</div>
      <div style={{ marginTop: 16, background: "var(--card)", borderRadius: 18, boxShadow: "var(--card-shadow)", overflow: "hidden" }}>
        {active.map(function (o, i) {
          var title = typeof bosHelpOfferTitleText === "function" ? bosHelpOfferTitleText(o) : o.title;
          var sub = [o.status === "confirmed" ? "подтверждён" : "черновик", o.when_text, (o.slots_week || 1) + " " + bosSlotsWord(Math.max(1, o.slots_week || 1))].filter(Boolean).join(" · ");
          return (
            <button key={o.id || i} onClick={function () { edit(o); }} className="tap hit44" style={{ minHeight: 64, width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "10px 13px", border: 0, borderTop: i ? "0.5px solid var(--line)" : 0, background: "transparent", textAlign: "left", color: "var(--text)", cursor: "pointer" }}>
              <span style={{ width: 36, height: 36, borderRadius: 12, display: "grid", placeItems: "center", flexShrink: 0, background: "var(--surface-3)" }}>{typeof BosHelpOfferIconLive === "function" ? <BosHelpOfferIconLive offer={o} size={18} /> : null}</span>
              <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span><span style={{ display: "block", fontSize: 11, color: "var(--text-4)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</span></span>
              {typeof I !== "undefined" && I.ChevronRight ? <I.ChevronRight size={16} color="var(--text-4)" /> : null}
            </button>
          );
        })}
      </div>
      <button onClick={function () { edit(null); }} className="tap hit44" style={{ minHeight: 48, width: "100%", marginTop: 12, marginBottom: 8, border: 0, borderRadius: 16, background: "linear-gradient(135deg,#FEDE34,#EF9F14)", color: "#0a0a0a", fontSize: 14.5, fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 16px rgba(239,159,20,0.28)" }}>Добавить ещё один формат</button>
    </div>
  );
}

// ── «ТВОЙ ПУТЬ ПОМОЩНИКА» — лесенка надёжности для своих ──
// Поддержка не превращается в «услугу» автоматически. Она даёт опыт реальных дел;
// если дело связано с отдельным навыком, оно становится доказательством этого навыка.
function HelperPathLive({ app, navigate, isDark }) {
  var s = (typeof useSheet === "function") ? useSheet() : { open: function () {} };
  var cm = bosUseCircleMembers(app);
  var _o = React.useState(null), offers = _o[0], setOffers = _o[1];
  var _rc = React.useState([]), confIds = _rc[0], setConfIds = _rc[1];
  var _th = React.useState(0), thanksN = _th[0], setThanksN = _th[1];
  var _t = React.useState(0), tick = _t[0], setTick = _t[1];
  React.useEffect(function () {
    if (!(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.netMyOffers)) { setOffers([]); return; }
    var on = true;
    window.bosCloud.netMyOffers().then(function (mine) {
      if (!on) return; mine = (Array.isArray(mine) ? mine : []).filter(function (o) { return !o.kind || o.kind === "circle_support"; }); setOffers(mine);
      var first = mine.filter(function (o) { return o && o.active !== false; })[0];
      if (first && window.bosCloud.netRoleConfirmations) window.bosCloud.netRoleConfirmations(first.id).then(function (rc) { if (on) setConfIds((rc || []).map(function (x) { return x.confirmer_id; })); });
      if (first && window.bosCloud.netOfferThanks) window.bosCloud.netOfferThanks(first.id).then(function (th) { if (on) setThanksN((th && th.n) || 0); });
    }).catch(function () { if (on) setOffers([]); });
    return function () { on = false; };
  }, [tick]);
  if (offers === null) return null;
  var lvl = (typeof bosLiveXPLive === "function" && typeof bosLevelInfoLive === "function") ? (bosLevelInfoLive(bosLiveXPLive(app)).level || 1) : 1;
  var first = offers.filter(function (o) { return o && o.active !== false; })[0] || null;
  var confN = confIds.length;
  var confirmed = !!(first && (first.status === "confirmed" || confN >= 2));
  var open = function () { if (typeof AddHelpFormatSheetLive === "function") s.open(<AddHelpFormatSheetLive app={app} offer={first} onDone={function () { setTick(function (n) { return n + 1; }); }} />); };
  var confFaces = confIds.map(function (id) { return cm.map && cm.map[id]; }).filter(Boolean);
  var asked = []; try { if (first) asked = JSON.parse(localStorage.getItem("bos:offerAsked:" + first.id) || "[]") || []; } catch (e) {}
  var waitFaces = asked.filter(function (id) { return confIds.indexOf(id) === -1; }).map(function (id) { return cm.map && cm.map[id]; }).filter(Boolean);
  var fn = function (f) { return (f && f.name || "").split(" ")[0]; };
  var confSub = !first ? "2 человека из круга подтвердят роль"
    : (confN + " из 2" + (confFaces.length ? " · " + confFaces.map(fn).join(", ") + " подтвердил" + (confFaces.length > 1 ? "и" : "а") : "") + (waitFaces.length ? " · ждём " + waitFaces.map(fn).join(", ") : ""));
  var steps = [
    { st: first ? "done" : "now", t: "Формат выбран", d: first ? ((typeof bosHelpOfferTitleText === "function" ? bosHelpOfferTitleText(first) : first.title) + " · черновик для общих кругов") : "Выбери формат из безопасного каталога", cta: !first },
    { st: !first ? "future" : (confirmed ? "done" : "now"), t: "Подтверждения круга", d: confSub, badge: (first && !confirmed) ? (confN + "/2") : null, faces: confFaces.concat(waitFaces.map(function (f) { return { _w: 1, avatar: f.avatar, name: f.name }; })) },
    { st: confirmed ? "now" : "future", t: "Первое дело у своих", d: "Просьбы из общих кругов придут сюда" },
    { st: thanksN > 0 ? "done" : "future", t: "Следы пользы", d: thanksN > 0 ? ("✦ " + thanksN + " " + (thanksN === 1 ? "след" : (thanksN < 5 ? "следа" : "следов")) + " пользы") : "«Спасибо» от тех, кому помог" },
    { st: thanksN > 0 ? "done" : "future", t: "Надёжность растёт", d: "Состоявшиеся дела укрепляют профиль; навык ведётся отдельно", lock: false },
  ];
  var knot = function (st, lock, badge) {
    return (
      <span style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", zIndex: 1, position: "relative",
        background: st === "done" ? BOS_GOLD : st === "now" ? "var(--cta, #0a0a0a)" : "var(--card)",
        border: st === "future" ? "1.5px solid var(--line)" : "1.5px solid transparent",
        boxShadow: st === "now" ? "0 0 0 5px rgba(10,10,10,0.07)" : "none" }}>
        {st === "done" && <svg width="13" height="13" viewBox="0 0 14 14"><path d="M2.8 7.4l2.9 2.9 5.5-6" fill="none" stroke="#0a0a0a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        {st === "now" && (badge ? <span style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>{badge}</span> : <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />)}
        {st === "future" && (lock ? <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--text-4)"><path d="M12 3.6c2.8 0 5 2.2 5 5v2h.4c1 0 1.8.8 1.8 1.8v6.8c0 1-.8 1.8-1.8 1.8H6.6c-1 0-1.8-.8-1.8-1.8v-6.8c0-1 .8-1.8 1.8-1.8H7v-2c0-2.8 2.2-5 5-5z" /></svg> : <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--text-5, var(--text-4))" }} />)}
      </span>
    );
  };
  return (
    <div style={{ background: "var(--card)", borderRadius: 22, padding: "14px 15px", boxShadow: "var(--card-shadow)" }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, color: "var(--text-4)", textTransform: "uppercase", paddingBottom: 12 }}>Твой путь помощника</div>
      {steps.map(function (m, i) {
        var last = i === steps.length - 1;
        return (
          <div key={i} style={{ display: "flex", gap: 12, position: "relative", paddingBottom: last ? 0 : 16 }}>
            {!last && <span style={{ position: "absolute", left: 14, top: 30, bottom: 0, width: 2, background: m.st === "done" ? BOS_GOLD : "var(--line)" }} />}
            {knot(m.st, m.lock, m.badge)}
            <div style={{ flex: 1, minWidth: 0, opacity: m.st === "future" ? 0.65 : 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.2px" }}>{m.t}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 1, lineHeight: 1.35 }}>{m.d}</div>
              {m.faces && m.faces.length > 0 && (
                <div style={{ display: "flex", marginTop: 7 }}>
                  {m.faces.slice(0, 4).map(function (f, fi) { return <span key={fi} style={{ marginLeft: fi ? -8 : 0, borderRadius: "50%", boxShadow: "0 0 0 2px var(--card)", filter: f._w ? "grayscale(1)" : "none", opacity: f._w ? 0.5 : 1 }}><BuddyFaceLive avatar={f.avatar} name={f.name} size={26} /></span>; })}
                </div>
              )}
              {m.cta && <button onClick={open} className="tap" data-haptic="selection" style={{ marginTop: 8, border: 0, background: "linear-gradient(135deg,#FEDE34,#EF9F14)", color: "#0a0a0a", fontSize: 12.5, fontWeight: 800, borderRadius: 999, padding: "7px 14px", cursor: "pointer" }}>Выбрать формат</button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═════ Э3 · ШТОРКА «Отклик» на просьбу круга ═════════════════════════════════════
function RespondRequestSheetLive({ text, teamName, onConfirm }) {
  var s = (typeof useSheet === "function") ? useSheet() : { close: function () {} };
  var heart = <svg width="20" height="20" viewBox="0 0 24 24" fill="#EF9F14"><path d="M12 21s-7-4.35-9.3-8.2C1.2 10.1 2.2 6.5 5.5 6.5c1.9 0 3.1 1.1 3.9 2.2l.6.9.6-.9c.8-1.1 2-2.2 3.9-2.2 3.3 0 4.3 3.6 2.8 6.3C19 16.65 12 21 12 21z" /></svg>;
  return (
    <div className="bos-sheet-scroll" style={{ paddingTop: 2, paddingLeft: 16, paddingRight: 16, color: "var(--text)" }}>
      {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
      <div style={_dSTitle}>Откликнуться</div>
      <div style={_dSSub}>просьба — дело круга, которое берёт один</div>
      <div style={{ ..._dSCard, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(254,222,52,0.22)", display: "grid", placeItems: "center", flexShrink: 0 }}>{heart}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{text}</div>
          <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>Круг «{teamName}»</div>
        </div>
      </div>
      <div style={_dSText}>Круг увидит, что просьбу взял ты. Договоритесь в чате круга — он для этого и есть.</div>
      <button onClick={function () { if (onConfirm) onConfirm(); s.close(); }} className="tap" style={{ width: "100%", border: 0, background: "linear-gradient(135deg,#FEDE34,#EF9F14)", color: "#0a0a0a", fontSize: 15, fontWeight: 800, borderRadius: 16, padding: 14, cursor: "pointer", boxShadow: "0 6px 16px rgba(239,159,20,0.32)" }}>Откликнуться</button>
      <button onClick={function () { s.close(); }} className="tap" style={{ width: "100%", marginTop: 8, background: "transparent", color: "var(--text-4)", border: 0, borderRadius: 14, padding: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Позже</button>
    </div>
  );
}

// ═════ Э4 · ШТОРКА «След пользы» — «спасибо»-свет (1 тап + 1 строка, БЕЗ звёзд) ═════
function ThanksSheetLive({ offerId, toId, toName, week, onDone }) {
  var s = (typeof useSheet === "function") ? useSheet() : { close: function () {} };
  var _n = React.useState(""); var note = _n[0], setNote = _n[1];
  var _b = React.useState(false); var busy = _b[0], setBusy = _b[1];
  var wk = week || ((typeof bosNetWeek === "function") ? bosNetWeek() : "");
  var send = async function () {
    if (busy) return; setBusy(true);
    try { await window.bosCloud.netThank(offerId, toId, wk, note.trim()); } catch (e) {}
    setBusy(false); if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} } if (onDone) onDone(); s.close();
  };
  var first = (toName || "").split(" ")[0] || "";
  return (
    <div className="bos-sheet-scroll" style={{ paddingTop: 2, paddingLeft: 16, paddingRight: 16, color: "var(--text)" }}>
      {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
      <div style={_dSTitle}>Спасибо{first ? (" " + first) : ""}</div>
      <div style={_dSSub}>{first ? ("звезда " + first) : "звезда"} станет ярче — это и есть след пользы</div>
      <div style={{ display: "grid", placeItems: "center", padding: "16px 0 8px" }}>
        <div style={{ width: 96, height: 96, borderRadius: "50%", display: "grid", placeItems: "center", background: "radial-gradient(circle at 50% 42%, #FEDE34 0%, #EF9F14 54%, rgba(239,159,20,0.14) 100%)", boxShadow: "0 0 42px rgba(254,222,52,0.6), 0 0 82px rgba(239,159,20,0.32)" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#0a0a0a"><path d="M12 2.2l2.4 7.4 7.4 2.4-7.4 2.4-2.4 7.4-2.4-7.4-7.4-2.4 7.4-2.4z" /></svg>
        </div>
      </div>
      <div style={{ ..._dSText, textAlign: "center", paddingBottom: 8 }}>Один тап — не анкета из четырёх вопросов.</div>
      <input value={note} onChange={function (e) { setNote(e.target.value); }} maxLength={140} placeholder="Что изменилось? Одна строка · необязательно" style={{ width: "100%", boxSizing: "border-box", border: 0, outline: 0, background: "var(--surface-3)", borderRadius: 13, padding: "13px 14px", fontSize: 15, color: "var(--text)", fontFamily: "inherit" }} />
      <button onClick={send} disabled={busy} className="tap" style={{ width: "100%", marginTop: 12, marginBottom: 8, border: 0, background: "linear-gradient(135deg,#FEDE34,#EF9F14)", color: "#0a0a0a", fontSize: 15, fontWeight: 800, borderRadius: 16, padding: 14, cursor: "pointer", boxShadow: "0 6px 16px rgba(239,159,20,0.32)" }}>Спасибо ✨</button>
    </div>
  );
}

// ── «ОТКРЫТЫЕ КРУГИ» — карусель под гидом на «Все» (David 2026-07-14) ──────────────────────
// Заменила «Просьбы твоих кругов». Показывает НАСТОЯЩИЕ публичные круги из облака (тот, что уже
// живёт, + новые) первыми, затем — заготовленные ПОПУЛЯРНЫЕ шаблоны (POPULAR_OPEN_CIRCLES): тап
// заводит ТВОЙ публичный круг, который тут же виден другим. Без бутафорских участников. «Все →»
// ведёт на полный список (чип «Круги»). Пусто/оффлайн → остаются заготовки, раздел не мёртвый.
function OpenCirclesRailLive({ app, navigate, isDark, onAll }) {
  var s = (typeof useSheet === "function") ? useSheet() : { open: function () {} };
  var _l = React.useState(null), list = _l[0], setList = _l[1];   // реальные публичные круги (null=грузим)
  var _b = React.useState({}), busy = _b[0], setBusy = _b[1];
  var _rq = React.useState({}), reqd = _rq[0], setReqd = _rq[1];
  React.useEffect(function () {
    var on = true;
    try {
      if (window.bosCloud && window.bosCloud.enabled() && window.bosCloud.discoverTeams) {
        window.bosCloud.discoverTeams().then(function (ts) { if (on) setList(Array.isArray(ts) ? ts : []); }).catch(function () { if (on) setList([]); });
      } else setList([]);
    } catch (e) { setList([]); }
    return function () { on = false; };
  }, []);
  // круги, где я уже состою/владею — не показываем (это витрина чужого/нового)
  var mineById = {}; ((app && app.teams) || []).forEach(function (t) { if (t && t.cloudId) mineById[t.cloudId] = t; });
  var real = (list || []).filter(function (t) { return t && !mineById[t.id]; });
  // какие популярные шаблоны я уже завёл (по seedId) — помечаем «Ты в деле»
  var mineSeed = {}; ((app && app.teams) || []).forEach(function (t) { if (t && t.seedId) mineSeed[t.seedId] = t; });
  var join = function (t) {
    if (busy[t.id] || reqd[t.id]) return;
    setBusy(function (b) { return Object.assign({}, b, { [t.id]: true }); });
    try {
      window.bosCloud.requestJoin(t.id).then(function (res) {
        setBusy(function (b) { return Object.assign({}, b, { [t.id]: false }); });
        if (!res) return;
        if (res.pending) { setReqd(function (r) { return Object.assign({}, r, { [t.id]: true }); }); return; }
        // мгновенное вступление (до системы одобрения) — уводим в деталь круга
        navigate("team-detail", { team: { cloudId: t.id, name: t.name, emblem: t.emblem || "✨", vis: t.vis, joined: true, members: [] }, from: "community" });
      });
    } catch (e) { setBusy(function (b) { return Object.assign({}, b, { [t.id]: false }); }); }
  };
  var startSeed = function (seed) {
    var mine = mineSeed[seed.id];
    if (mine) { navigate("team-detail", { team: mine, from: "community" }); return; }
    s.open(<ChallengeStartSheetLive seed={seed} openCircle={true} onStart={function () { bosStartSeedCircleLive(app, navigate, seed, "public"); }} />);
  };
  var CARD = { position: "relative", flexShrink: 0, scrollSnapAlign: "start", width: 158, borderRadius: 20, background: "var(--card)", boxShadow: "var(--card-shadow)", border: 0, padding: 14, display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", cursor: "pointer", color: "var(--text)", fontFamily: "inherit" };
  var TILE = { width: 44, height: 44, borderRadius: 14, background: "linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.06)", display: "grid", placeItems: "center", fontSize: 23, flexShrink: 0 };
  var chip = function (txt, live) { return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, color: live ? "#B4820A" : "var(--text-4)", background: live ? "rgba(240,195,10,0.14)" : "var(--surface-3)", borderRadius: 999, padding: "3px 8px", marginTop: 9 }}>{txt}</span>; };
  // Возраст круга «🔥 живёт N дней» (David 2026-07-15). Это ЖИВОЙ факт, а не украшение: он растёт
  // сам от даты рождения круга и отвечает на вопрос «а это вообще всерьёз или заброшено вчера».
  // Огонёк — ЗАЛИВНОЙ SVG (I.Flame), не эмодзи: эмодзи рисует система, и в чужой теме он чужой.
  // Дата приезжает из cloud.discoverTeams (created_at добавлен в селект специально ради этого);
  // у заготовок-семян её нет → bosCircleDays вернёт null и чип просто не появится.
  var ageChip = function (since) {
    var d = (typeof bosCircleDays === "function") ? bosCircleDays(since) : null;
    if (!d) return null;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10.5, fontWeight: 700, color: "#B4820A", background: "rgba(240,195,10,0.14)", borderRadius: 999, padding: "3px 8px" }}>
        <I.Flame size={11} color="#EF9F14" filled strokeWidth={1.6} />живёт {d} {typeof bosRuDays === "function" ? bosRuDays(d) : "дн."}
      </span>
    );
  };
  var cards = [];
  // 1) реальные открытые круги — «живые»
  real.slice(0, 6).forEach(function (t) {
    var pending = !!reqd[t.id];
    cards.push(
      <div key={"real:" + t.id} style={CARD}>
        <span style={TILE}>{typeof bosIcon === "function" ? bosIcon(t.emblem || "✨", 23, null) : (t.emblem || "✨")}</span>
        <span style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: "-0.2px", lineHeight: 1.2, marginTop: 11 }}>{t.name}</span>
        {/* Чипы переносятся: на карточке 158px «участники» и «живёт N дней» в одну строку не
            всегда влезают, а обрезать живой факт многоточием — хуже, чем перенести. */}
        <span style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 9 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, color: "#B4820A", background: "rgba(240,195,10,0.14)", borderRadius: 999, padding: "3px 8px" }}>🌐 {(t.members || 0)} участ.</span>
          {ageChip(t.createdAt)}
        </span>
        <button onClick={function () { join(t); }} disabled={busy[t.id] || pending} className="tap" data-haptic="selection"
          style={{ marginTop: 12, width: "100%", border: 0, borderRadius: 999, padding: "9px 0", fontSize: 12.5, fontWeight: 700, cursor: "pointer", background: pending ? "var(--surface-3)" : "var(--cta, #0a0a0a)", color: pending ? "var(--text-3)" : "var(--cta-ink, #fff)" }}>{pending ? "Заявка отправлена" : busy[t.id] ? "…" : "Вступить"}</button>
      </div>
    );
  });
  // 2) заготовленные популярные — «заведи открытый»
  POPULAR_OPEN_CIRCLES.forEach(function (seed) {
    var joined = !!mineSeed[seed.id];
    cards.push(
      <button key={"seed:" + seed.id} onClick={function () { startSeed(seed); }} className="tap" style={CARD}>
        <span style={TILE}>{typeof bosIcon === "function" ? bosIcon(seed.emblem, 23, null) : seed.emblem}</span>
        <span style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: "-0.2px", lineHeight: 1.2, marginTop: 11 }}>{seed.name}</span>
        <span style={{ fontSize: 11.5, color: "var(--text-4)", lineHeight: 1.35, marginTop: 4, minHeight: 30 }}>{seed.hook}</span>
        {chip(joined ? "Ты в деле ✓" : (seed.goalText + " · +" + seed.reward + " XP"), false)}
      </button>
    );
  });
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "0 4px 2px" }}>
        {/* Заголовок носил эмодзи 🌐 — глобус, а не круг (David 2026-07-15: «там тоже должна быть
            иконка кругов»). Теперь тот же BosCircleIcon, что на пилюле и в меню «+». */}
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.3px", display: "inline-flex", alignItems: "center", gap: 7 }}>
          <BosCircleIcon size={17} strokeWidth={1.9} color="var(--text)" />Открытые круги
        </span>
        {onAll && (
          <button onClick={onAll} className="tap" data-haptic="selection" style={{ border: 0, background: "transparent", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 1, fontSize: 12.5, fontWeight: 600, color: "var(--text-3)", padding: 0 }}>
            Все <I.ChevronRight size={13} color="var(--text-4)" />
          </button>
        )}
      </div>
      <div className="bos-hscroll" style={{ display: "flex", gap: 10, overflowX: "auto", padding: "10px 12px 4px 4px", margin: "0 -12px 0 0", scrollSnapType: "x proximity", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
        {cards}
      </div>
    </div>
  );
}

// ── «ПРОСЬБЫ ТВОИХ КРУГОВ» — открытые просьбы (kind='request', без отклика) на главной ──
// АРХИВ (David 2026-07-14): убрана с «Все» — периодически всплывала, пользы мало. Компонент жив,
// но нигде не смонтирован. Вернуть = снова поставить <CircleRequestsLive/> в ленту.
function CircleRequestsLive({ app, navigate, isDark }) {
  var s = (typeof useSheet === "function") ? useSheet() : { open: function () {} };
  var teams = ((app && app.teams) || []).filter(function (t) { return t && t.cloudId; });
  var sig = teams.map(function (t) { return t.cloudId; }).join(",");
  var _r = React.useState(null), reqs = _r[0], setReqs = _r[1];
  React.useEffect(function () {
    if (!(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.teamTasks) || !teams.length) { setReqs([]); return; }
    var on = true;
    Promise.all(teams.map(function (t) { return window.bosCloud.teamTasks(t.cloudId).then(function (d) { return { t: t, tasks: (d && d.tasks) || [] }; }).catch(function () { return { t: t, tasks: [] }; }); }))
      .then(function (res) { if (!on) return; var out = []; res.forEach(function (r) { r.tasks.forEach(function (tk) { if (tk.kind === "request" && !tk.volunteerId) out.push({ task: tk, team: r.t }); }); }); setReqs(out); });
    return function () { on = false; };
  }, [sig]);
  if (!reqs || !reqs.length) return null;
  var respond = function (item) {
    var claim = function () { setReqs(function (list) { return (list || []).filter(function (x) { return x.task.id !== item.task.id; }); }); if (window.bosCloud.claimTeamRequest) window.bosCloud.claimTeamRequest(item.task.id, true); };
    s.open(<RespondRequestSheetLive text={item.task.text} teamName={item.team.name} onConfirm={claim} />);
  };
  return (
    <div>
      <CommSectionHeadLive title="🙌 Просьбы твоих кругов" onAll={null} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
        {reqs.slice(0, 3).map(function (item) {
          return (
            <div key={item.task.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--card)", borderRadius: 22, padding: "12px 14px", boxShadow: "var(--card-shadow)", border: "1px solid rgba(239,159,20,0.35)" }}>
              <span style={{ width: 34, height: 34, borderRadius: 11, background: "rgba(254,222,52,0.22)", display: "grid", placeItems: "center", flexShrink: 0 }}><svg width="17" height="17" viewBox="0 0 24 24" fill="#EF9F14"><path d="M12 21s-7-4.35-9.3-8.2C1.2 10.1 2.2 6.5 5.5 6.5c1.9 0 3.1 1.1 3.9 2.2l.6.9.6-.9c.8-1.1 2-2.2 3.9-2.2 3.3 0 4.3 3.6 2.8 6.3C19 16.65 12 21 12 21z" /></svg></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.task.text}</div>
                <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>Просьба круга «{item.team.name}»</div>
              </div>
              <button onClick={function () { respond(item); }} className="tap" data-haptic="selection" style={{ flexShrink: 0, background: "linear-gradient(135deg,#FEDE34,#EF9F14)", color: "#0a0a0a", border: 0, borderRadius: 999, padding: "8px 13px", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>Откликнуться</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CommunityLive() {
  const { navigate } = useNav();
  const app = useApp();
  // View-state (section / sub-tabs / network unlock) lives in the shared store so
  // it survives navigating into a detail screen and back (the screen remounts).
  const cv = app?.communityView || { section: "discover", discTab: "teams", commTab: "network", networkUnlocked: false };
  const { section, discTab, commTab } = cv;
  const setView = (patch) => app?.setCommunityView(patch);
  const resolve = (v, cur) => (typeof v === "function" ? v(cur) : v);
  const setSection = (v) => setView({ section: resolve(v, section) });
  const setCommTab = (v) => setView({ commTab: resolve(v, commTab) });

  // LIVE has no Партнёры tab — if a stale view left commTab on "partners" (e.g. it was
  // selected before, or carried from another mode), fall back to "network" so the
  // content area is never blank.
  const commTabEff = (commTab === "partners") ? "network" : commTab;
  // ── ОДНА ЛЕНТА С ЧИПАМИ (David: «двойное меню точно не вариант; самое элегантное?») ──
  // Вместо двух рядов вкладок — чипы-фильтры ОДНОЙ ленты: Все · Круги · Люди · Партнёры.
  // Совместимость: тур и онбординг-пилюли пишут старые section/commTab — если они
  // расходятся с сохранённым filter (их только что сменили извне), верим им; чипы пишут
  // ОБА представления согласованно. courses→Партнёры, network→Люди, discover→Все.
  // «Тренинги» ОТДЕЛЬНЫЙ чип (David: «тренинги может отдельно от партнёров выделить»):
  // партнёры = живые впечатления за XP, тренинги = бывшие «программы партнёров» (courses).
  const _pairFor = { all: "discover", nearby: "discover", circles: "discover", partners: "community", people: "community", training: "community" };
  const _legacyFilter = section === "community" ? (commTabEff === "courses" ? "training" : "people") : "all";
  const _fOk = cv.filter && _pairFor[cv.filter] === section
    && (section !== "community" || (cv.filter === "training") === (commTabEff === "courses"));
  let filter = _fOk ? cv.filter : _legacyFilter;
  // David: «Рядом» слит в «Партнёры» (карта+сетка одним блоком). «Курсы» ВЕРНУЛИ отдельным чипом
  // (David: «верни вкладку Курсы с 3мя курсами»). Старое «nearby» аккуратно переводим в «partners».
  if (filter === "nearby") filter = "partners";
  const setFilter = (f) => setView({ filter: f, section: _pairFor[f] || "discover", commTab: f === "training" ? "courses" : "network", helpOwnerIds: null, helpOfferIds: null });
  const isDark = app?.themeOverride === "dark";
  const { open: _openSheet } = (typeof useSheet === "function") ? useSheet() : { open: () => {} };

  // Переход с «Баланса окружения» ведёт не просто на вкладку, а к реальному блоку
  // помощи. Данные приходят асинхронно, поэтому коротко ждём появления блока.
  React.useEffect(() => {
    if (!cv.focus) return undefined;
    let stopped = false, tries = 0, timer = 0;
    const seek = () => {
      if (stopped) return;
      const safe = String(cv.focus).replace(/[^a-z0-9_-]/gi, "");
      const el = safe ? document.querySelector('[data-community-section="' + safe + '"]') : null;
      if (el) {
        try { el.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) { el.scrollIntoView(); }
        setView({ focus: null });
        return;
      }
      if (++tries < 40) timer = window.setTimeout(seek, 120);
      else setView({ focus: null });
    };
    timer = window.setTimeout(seek, 60);
    return () => { stopped = true; if (timer) window.clearTimeout(timer); };
  }, [cv.focus, cv.focusNonce]);

  // ── ПОИСК по ленте (Э2 редизайна): круги (облако + живые витрины) · партнёры · программы.
  // Дебаунс 350мс бережёт облако; от 2 символов. Пока ищем — чипы и лента уступают результатам.
  const [q, setQ] = React.useState("");
  const [qDeb, setQDeb] = React.useState("");
  const [cloudHits, setCloudHits] = React.useState(null); // null = ждём облако (для пустышки)
  React.useEffect(() => { const t = setTimeout(() => { setQDeb(q.trim()); setCloudHits(null); }, 350); return () => clearTimeout(t); }, [q]);
  const searching = qDeb.length >= 2;
  const _qq = qDeb.toLowerCase();
  const _hit = (...fs) => fs.some((f) => ("" + (f || "")).toLowerCase().indexOf(_qq) !== -1);
  // Круги ищутся ТОЛЬКО в облаке (CloudTeamsDiscoverLive) — настоящий поиск публичных кругов,
  // без бутафорных примеров.
  const pHits = searching && typeof BOS_PARTNERS !== "undefined"
    ? BOS_PARTNERS.filter((p) => _hit(p.name, p.what, (p.tags || []).join(" "))) : [];

  // ── «Сейчас N человек держат практики» (VISION: живая строка вместо ленты) — честное
  // число из RPC bos_active_today; кэш на полчаса против моргания; 0/нет патча → скрыта.
  const [pulseN, setPulseN] = React.useState(() => {
    try { const v = JSON.parse(localStorage.getItem("bos:cache:pulseToday") || "null"); return (v && Date.now() - v.ts < 1800e3) ? v.n : null; } catch (e) { return null; }
  });
  React.useEffect(() => {
    let on = true;
    try {
      if (window.bosCloud && window.bosCloud.enabled() && window.bosCloud.activeToday) {
        window.bosCloud.activeToday().then((n) => {
          if (!on || typeof n !== "number") return;
          setPulseN(n);
          try { localStorage.setItem("bos:cache:pulseToday", JSON.stringify({ n, ts: Date.now() })); } catch (e) {}
        }).catch(() => {});
      }
    } catch (e) {}
    return () => { on = false; };
  }, []);
  const _pulseWord = (n) => { const a = n % 10, b = n % 100; return (a === 1 && b !== 11) ? "человек в потоке" : (a >= 2 && a <= 4 && (b < 12 || b > 14)) ? "человека в потоке" : "человек в потоке"; };

  // Real level for the live user — never the demo's curated 8/1240/2000. The
  // typeof guard keeps this safe if the XP helpers aren't loaded yet.
  const _commLvl = (typeof bosLiveXPLive === "function" && typeof bosLevelInfoLive === "function") ? bosLevelInfoLive(bosLiveXPLive(app)) : null;
  const userLevel = _commLvl ? _commLvl.level : 1;
  // Локальный QA-флаг показывает зрелый Нетворк на чистом аккаунте, не меняя XP и не
  // открывая его в production. Нужен для проверки условных карточек до появления данных.
  const networkPreview = (() => { try { return /^(127\.0\.0\.1|localhost)$/.test(location.hostname) && new URLSearchParams(location.search).get("networkPreview") === "1"; } catch (e) { return false; } })();
  const xpInLevel = _commLvl ? _commLvl.into : 0;
  const xpForNext = _commLvl ? _commLvl.span : 2000;
  const levelsLeft = Math.max(0, 10 - userLevel);
  const weeksToUnlock = Math.max(1, levelsLeft);

  const teams = app?.teams || []; // shared store — "Создать команду" adds here

  // Upcoming cohort window: a "D — D MMM" range that starts `startIn` days from the
  // REAL today and runs `days` long, so dates are never stale.
  const _ruMon = ["янв","фев","мар","апр","мая","июн","июл","авг","сен","окт","ноя","дек"];
  const _cohortWindow = (startIn, days) => {
    const a = new Date(); a.setHours(0, 0, 0, 0); a.setDate(a.getDate() + startIn);
    const b = new Date(a); b.setDate(b.getDate() + (days - 1));
    return a.getMonth() === b.getMonth()
      ? a.getDate() + " — " + b.getDate() + " " + _ruMon[b.getMonth()]
      : a.getDate() + " " + _ruMon[a.getMonth()] + " — " + b.getDate() + " " + _ruMon[b.getMonth()];
  };
  const courses = [
    { id: "overload",     i: "⚡",    accent: "#fef3c7", t: "Перегрузка",      d: "Перенастрой мышление и очисти негативные убеждения.", price: "110 000 ₽", lvl: "Интенсив",   length: "3 дня", cohort: _cohortWindow(12, 3) },
    { id: "breakthrough", i: "🚀",    accent: "#dbe9ff", t: "Прорыв",  d: "Открой новые пути и преодолей пределы.",            price: "110 000 ₽", lvl: "Продвинутый",    length: "7 дней", cohort: _cohortWindow(33, 7) },
    { id: "marathon",     i: "🏃🏼‍♀️", accent: "#d6f3df", t: "Марафон",      d: "21-дневная программа устойчивых привычек.",                price: "110 000 ₽", lvl: "Базовый",  length: "21 день", cohort: _cohortWindow(54, 21) },
  ];
  // Хиты программ считаются ЗДЕСЬ (courses объявлен строкой выше — обращение раньше уронило бы TDZ).
  const cHits = searching ? courses.filter((c) => _hit(c.t, c.d, c.lvl)) : [];
  const nothingFound = searching && cloudHits === 0 && !pHits.length && !cHits.length;

  return (
    <div className="page-in" style={{ padding: "0 12px 24px" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 4px 12px" }}>
        <div style={{ flex: 1, fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)" }}>Сообщество</div>
        {/* Живой пульс (VISION): сколько разных людей отметились сегодня. Раньше стоял отдельной
            строкой под пилюлями — увёл наверх вправо, напротив заголовка (David 2026-07-12),
            чтобы лента шла сразу под фильтрами без лишнего отступа. */}
        {!searching && pulseN > 0 && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: "#34C759", boxShadow: "0 0 0 3px rgba(52,199,89,0.16)", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "var(--text-3)", whiteSpace: "nowrap" }}>{pulseN} {_pulseWord(pulseN)}</span>
          </span>
        )}
      </div>

      {/* ПОИСК по всей ленте: круги (живые + облачные) · партнёры · программы. */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, background: "var(--card, #fff)", borderRadius: 999, padding: "10px 15px", boxShadow: "var(--card-shadow)", margin: "0 2px 10px" }}>
        <I.Search size={16} strokeWidth={2} color="var(--text-4)" style={{ flexShrink: 0 }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Найти круг или партнёра" aria-label="Поиск по сообществу"
          style={{ flex: 1, minWidth: 0, border: 0, outline: "none", background: "transparent", fontSize: 14.5, color: "var(--text)" }} />
        {q && (
          <button onClick={() => setQ("")} className="tap" aria-label="Очистить" style={{ border: 0, background: "var(--surface-3)", borderRadius: 999, width: 22, height: 22, display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0, color: "var(--text-3)" }}>
            <I.X size={12} strokeWidth={2.6} />
          </button>
        )}
      </div>

      {/* ЧИПЫ-ФИЛЬТРЫ одной ленты (вместо двух рядов вкладок — David: «двойное меню не
          вариант»). Активный — CTA-пилюля, остальные — стеклянные чипы. Чип не комната,
          а фокус той же ленты: «Все» показывает всё подряд. Во время поиска уступают
          месту результатам. */}
      {!searching && (
      /* Full-bleed (David: «карточки должны обрезаться самим экраном»): лента выезжает за
         паддинг страницы (12px) и режется физическим краем — как в iOS, без масок. */
      <div className="bos-hscroll" style={{ display: "flex", gap: 7, padding: "2px 14px 0", margin: "0 -12px", overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}>
        {/* Чип «Рядом» (David) — режим КАРТЫ партнёров города, сразу после «Все». Пока город один
            (Москва) — карта живёт и на обзоре «Все» героем, и крупно тут. */}
        {/* Иконки у категорий (David: «svg-иконок не хватает, чтобы чётче отличать»).
            «Круги» носили I.Group — двух человечков, почти неотличимых от I.Users у «Людей»
            (David 2026-07-15: «там одинаковые иконки»). Теперь это BosCircleIcon — НАШ символ
            круга, тот же, что в меню «+» на главной: у знака появился один смысл во всём
            приложении, а «Круги» и «Люди» перестали быть двумя картинками про людей. */}
        {[["all", "Все", I.Globe], ["circles", "Круги", BosCircleIcon], ["people", "Люди", I.Users], ["partners", "Партнёры", I.Heart], ["training", "Курсы", I.Bolt]].map(([id, t, Ic]) => {
          const on = filter === id;
          const glass = (!on && typeof bosChipGlass === "function") ? bosChipGlass(isDark) : {};
          return (
            <button key={id} onClick={() => setFilter(id)} className="tap" data-haptic="selection"
              data-tour={id === "people" ? "network" : undefined}
              style={{ border: 0, cursor: "pointer", borderRadius: 999, padding: "8px 13px", fontSize: 13.5, fontWeight: 600, flexShrink: 0,
                display: "inline-flex", alignItems: "center", gap: 6,
                transition: "background 0.2s, color 0.2s", ...glass,
                background: on ? "var(--cta, #0a0a0a)" : glass.background,
                color: on ? "var(--cta-ink, #fff)" : "var(--text-2)" }}>
              <Ic size={14} strokeWidth={2.1} color={on ? "var(--cta-ink, #fff)" : "var(--text-3)"} />{t}
            </button>
          );
        })}
      </div>
      )}

      {/* Живой пульс переехал в шапку (вправо от «Сообщество») — отдельной строки под пилюлями больше нет. */}

      {/* РЕЗУЛЬТАТЫ ПОИСКА — те же карточки, что в ленте; тап ведёт туда же. */}
      {searching && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
          <CloudTeamsDiscoverLive app={app} navigate={navigate} query={qDeb} onCount={setCloudHits} />
          {pHits.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)", padding: "4px 4px 8px" }}>🎁 Партнёры</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pHits.map((p) => (
                  <button key={p.id} onClick={() => { if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } navigate("partner-detail", { partner: p, from: "community" }); }} className="tap"
                    style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--card)", borderRadius: 22, padding: 14, boxShadow: "var(--card-shadow)", border: 0, textAlign: "left", width: "100%", cursor: "pointer", color: "var(--text)" }}>
                    <span style={{ width: 44, height: 44, borderRadius: 14, background: (typeof bosMixHex === "function" && isDark) ? bosMixHex(p.accent, "#101014", 0.48) : p.accent, display: "grid", placeItems: "center", fontSize: 24, flexShrink: 0 }}>{bosIcon(p.emblem, 24, null)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15.5, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.what} · {p.cost} XP</div>
                    </div>
                    <I.ChevronRight size={16} color="var(--text-4)" style={{ flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </div>
          )}
          {cHits.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)", padding: "4px 4px 8px" }}>🎓 Курсы</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {cHits.map((c) => (
                  <button key={c.id} onClick={() => { if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } navigate("course-detail", { course: c }); }} className="tap"
                    style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--card)", borderRadius: 22, padding: 14, boxShadow: "var(--card-shadow)", border: 0, textAlign: "left", width: "100%", cursor: "pointer", color: "var(--text)" }}>
                    <span style={{ width: 44, height: 44, borderRadius: 14, background: c.accent, display: "grid", placeItems: "center", fontSize: 24, flexShrink: 0 }}>{c.i}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15.5, fontWeight: 600 }}>{c.t}</div>
                      <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.lvl} · {c.price}</div>
                    </div>
                    <I.ChevronRight size={16} color="var(--text-4)" style={{ flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </div>
          )}
          {nothingFound && (
            <div style={{ background: "var(--card)", borderRadius: 22, padding: "26px 18px", boxShadow: "var(--card-shadow)", textAlign: "center" }}>
              <div style={{ fontSize: 30, lineHeight: 1 }}>🔭</div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)", marginTop: 9 }}>Ничего не нашлось</div>
              <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 5, lineHeight: 1.45 }}>Попробуй другое слово — или собери свой круг на «Привычках» через «+».</div>
            </div>
          )}
        </div>
      )}

      {/* ЛЕНТА — секции живут вместе; чип просто сужает её. Порядок «Все»: партнёры
          (ради чего копишь XP — решение David «на самом верху») → круги → люди →
          программы партнёров. Во время поиска лента уступает результатам. */}
      {!searching && (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
        {filter === "all" && (
          <React.Fragment>
            {/* ЛЕНТА «ОТКРЫТИЙ» вместо баннера гида (David 2026-07-10): свайп-карточки, каждая
                открывает СВОЮ шторку про механику. Гид (GuideLive) пока жив, но здесь его баннер
                (CommunityGuideBannerLive) заменён лентой. Кромка ленты — по общей сетке страницы. */}
            <BosBlock name="discovery"><DiscoveryFeedLive app={app} navigate={navigate} isDark={isDark} /></BosBlock>
            {/* ── СООБЩЕСТВО v2 · Э1 «Одно окно» (ЖИВЫЕ данные, пусто = скрыто): Подходит сейчас →
                Мои круги → Помощь круга → Мой вклад. Каждый блок изолирован BosBlock — сбой одного
                не роняет страницу. Ставятся под лентой открытий, партнёры/круги остаются ниже. */}
            <BosBlock name="suggest"><CommunitySuggestLive app={app} navigate={navigate} isDark={isDark} onOpen={() => setFilter("circles")} /></BosBlock>
            {/* «Мои круги» УБРАНЫ (David 2026-07-11: «круги и так на Главной, тут не нужны»). Свои
                публичные круги теперь видны в «Открытых» (фильтр «Круги», раздел «Твои открытые»). */}
            {/* Под гидом — карусель ОТКРЫТЫХ кругов (David 2026-07-14): реальные публичные круги +
                заготовленные популярные шаблоны. Заменила «Просьбы твоих кругов» (в архив). */}
            <BosBlock name="open-circles"><OpenCirclesRailLive app={app} navigate={navigate} isDark={isDark} onAll={() => setFilter("circles")} /></BosBlock>
            {/* СКРЫТО (David 2026-07-12): «Помощь от своих» (circle-help) и «Мой вклад ·
                черновик для общих кругов» (my-contribution) убраны с «Все». Компоненты живы —
                вернуть = раскомментировать.
            <BosBlock name="circle-help"><CircleHelpLive app={app} navigate={navigate} isDark={isDark} /></BosBlock>
            <BosBlock name="my-contribution"><MyContributionStatusLive app={app} navigate={navigate} isDark={isDark} /></BosBlock>
            */}
            {/* ПАРТНЁРЫ убраны с «Все» (David 2026-07-12): карусель дублировала вкладку «Партнёры»,
                где уже есть карта + полная сетка. Партнёры живут только на своём чипе. */}
            {/* СКРЫТО (David 2026-07-12): футер-подсказка «Как работает сообщество» (Круг → Дело →
                Спасибо) убрана с «Все». Вернуть = раскомментировать.
            <BosBlock name="how-works">
              <button onClick={() => { if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } if (typeof DiscoveryHelpersSheetLive === "function") _openSheet(<DiscoveryHelpersSheetLive app={app} navigate={navigate} isDark={isDark} />); }} className="tap"
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "var(--card)", borderRadius: 22, padding: "14px 15px", boxShadow: "var(--card-shadow)", border: 0, textAlign: "left", cursor: "pointer", color: "var(--text)" }}>
                <span style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--surface-3)", display: "grid", placeItems: "center", flexShrink: 0 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="#EF9F14"><path d="M12 21s-7-4.35-9.3-8.2C1.2 10.1 2.2 6.5 5.5 6.5c1.9 0 3.1 1.1 3.9 2.2l.6.9.6-.9c.8-1.1 2-2.2 3.9-2.2 3.3 0 4.3 3.6 2.8 6.3C19 16.65 12 21 12 21z" /></svg></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.2px" }}>Как работает сообщество</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2 }}>Круг → Дело → Спасибо</div>
                </div>
                <I.ChevronRight size={18} color="var(--text-4)" style={{ flexShrink: 0 }} />
              </button>
            </BosBlock>
            */}
          </React.Fragment>
        )}
        {filter === "partners" && (
          <React.Fragment>
            {/* КАРТА + СЕТКА партнёров ОДНИМ блоком (David: «карта и партнёры аккуратнее в одном
                блоке»): крупная карта Москвы сверху → под ней все партнёры сеткой. */}
            {typeof PartnersMapLive === "function" && <PartnersMapLive app={app} navigate={navigate} from="community" />}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "4px 4px 0" }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)" }}>🎁 Партнёры · потратить XP</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 700, color: "var(--text)" }}>🪙 {(typeof bosLiveSpendableXPLive === "function") ? bosLiveSpendableXPLive(app) : 0}</span>
            </div>
            {typeof PartnersGridLive === "function" && <PartnersGridLive app={app} navigate={navigate} from="community" />}
          </React.Fragment>
        )}
        {/* Чип «Круги» — ОДНА реальная категория «Открытые круги» (это и есть «живые»: одно и то
            же, не две подписи). Никакой бутафории/примеров — только настоящие публичные круги из
            облака. Ниже — челленджи-шаблоны и «Собери свой» (старт создаёт ТВОЙ настоящий круг). */}
        {filter === "circles" && (
          <React.Fragment>
            <CloudTeamsDiscoverLive app={app} navigate={navigate} />
            <CirclesMosaicLive kicker="🔥 Челленджи">
              {SEED_CIRCLES.map((s) => {
                const mine = (app?.teams || []).find((t) => t.seedId === s.id);
                return (
                  <CircleTileLive key={s.id} emoji={s.emblem} title={s.name} meta={s.goalText + " · +" + s.reward + " XP"} joined={!!mine}
                    onTap={() => {
                      if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} }
                      if (mine) { navigate("team-detail", { team: mine, from: "community" }); return; }
                      _openSheet(<ChallengeStartSheetLive seed={s} onStart={() => bosStartSeedCircleLive(app, navigate, s)} />);
                    }} />
                );
              })}
            </CirclesMosaicLive>
            <CirclesMosaicLive kicker="🤝 Собери свой">
              {CIRCLE_STARTERS.map((s) => (
                <CircleTileLive key={s.t} emoji={s.i} title={s.t} meta={s.target + " " + s.unit + " · " + (s.goalType === "streak" ? "серия вместе" : "счёт общий")}
                  onTap={() => { if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } _openSheet(<GoalFormSheetLive mode="create" circleOn={true} preset={s} navigate={navigate} />); }} />
              ))}
            </CirclesMosaicLive>
            {/* Позови своих — родной выбор контактов Telegram (реферал), только на «Круги». */}
            {typeof InviteFriendsCardLive === "function" && <InviteFriendsCardLive isDark={isDark} />}
          </React.Fragment>
        )}

        {filter === "people" && (
          <div style={{ marginTop: 0 }}>
            {userLevel >= 10 || networkPreview ? (
              // НАСТОЯЩИЙ Нетворк: твоя карточка + реальные дошедшие (без выдуманных людей).
              <NetworkLive navigate={navigate} app={app} level={userLevel} isDark={isDark} />
            ) : (
              <React.Fragment>
                {/* Э2 · «Твой путь помощника» — валидация видна ДО L10 (свои — без замка): формат →
                    подтверждения круга → первое дело → следы → Нетворк L10. */}
                <BosBlock name="helper-path"><div style={{ marginBottom: 12 }}><HelperPathLive app={app} navigate={navigate} isDark={isDark} /></div></BosBlock>
                {/* Навыки начинают подтверждаться ДО открытия Нетворка. Уровень открывает витрину,
                    но никогда не подменяет доказанные дела. */}
                {typeof SkillsWorkbenchLive === "function" ? <BosBlock name="skills-workbench"><div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}><SkillsWorkbenchLive app={app} level={userLevel} /></div></BosBlock> : null}
                {/* «Основатель» (прыжок на 10) убран — brief 2026-07-11: уровень не покупает доверие. */}
                {/* Честный замок — реальные пути XP, без выдуманных людей. */}
                <NetworkLockedLive
                  navigate={navigate}
                  live={true}
                  level={userLevel}
                  xp={xpInLevel}
                  xpMax={xpForNext}
                  levelsLeft={levelsLeft}
                  weeks={weeksToUnlock}
                  onUnlock={() => {}}
                  onSwitchToCommunity={() => setFilter("partners")}
                />
              </React.Fragment>
            )}
          </div>
        )}

        {filter === "training" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
          {/* КУРСЫ (вернули отдельным чипом — David: «верни вкладку Курсы с 3мя курсами»):
              голд-баннер «зачем» + полные карточки → course-detail (запись роняет практику+круг). */}
          <CommSectionHeadLive title="🎓 Курсы" />
          <div style={{ position: "relative", overflow: "hidden", borderRadius: 22, padding: "16px 18px",
            background: "linear-gradient(135deg, #FEDE34, #EF9F14)",
            boxShadow: "0 8px 22px rgba(239,159,20,0.32)" }}>
            <div aria-hidden style={{ position: "absolute", top: -46, right: -28, width: 168, height: 168, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.5), transparent 66%)", pointerEvents: "none" }} />
            <div aria-hidden style={{ position: "absolute", top: 15, right: 17, fontSize: 38, lineHeight: 1, pointerEvents: "none" }}>🏆</div>
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "rgba(58,42,0,0.6)" }}>Зачем проходить курсы</div>
              <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.4px", color: "#3a2a00", marginTop: 4, maxWidth: 220, lineHeight: 1.2 }}>Каждый курс — целый уровень</div>
              <div style={{ fontSize: 13, color: "rgba(58,42,0,0.8)", marginTop: 6, lineHeight: 1.42, maxWidth: 244 }}>Ачивка, большой опыт и доступ к новым людям. Самый быстрый рост.</div>
              <div style={{ display: "flex", gap: 7, marginTop: 13, flexWrap: "wrap" }}>
                {[["🏆", "+Уровень"], ["🎖️", "Ачивка"], ["⚡", "+2000 XP"]].map(([e, l], i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.55)", borderRadius: 999, padding: "6px 11px", fontSize: 12.5, fontWeight: 700, color: "#3a2a00" }}>
                    <span style={{ fontSize: 13, lineHeight: 1 }}>{e}</span>{l}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {courses.map((c, i) => (
            <button key={i} data-tour={i === 0 ? "course" : undefined} onClick={() => { if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } navigate("course-detail", { course: c }); }} className="tap"
              style={{ background: "var(--card)", borderRadius: 22, padding: 16, boxShadow: "var(--card-shadow)", border: 0, textAlign: "left", color: "var(--text)", display: "block", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 17, color: "var(--text)", letterSpacing: "-0.3px" }}>{c.t}</span>
                    <span style={{ fontSize: 10, padding: "2px 8px", background: "var(--card-2)", borderRadius: 999, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>{c.lvl}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 6, lineHeight: 1.45 }}>{c.d}</div>
                  <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 6, display: "flex", gap: 10 }}>
                    <span>⏱ {c.length}</span>
                    <span>·</span>
                    <span>📅 {c.cohort}</span>
                  </div>
                </div>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: c.accent, display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>{c.i}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Стоимость</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2, color: "var(--text)" }}>{c.price}</div>
                </div>
                <span style={{ background: "var(--cta, #0a0a0a)", color: "var(--cta-ink, #fff)", borderRadius: 999, padding: "10px 18px", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500 }}>
                  О курсе <I.ChevronRight size={14} />
                </span>
              </div>
            </button>
          ))}
        </div>
        )}


        {/* «Позови своих» убран с «Все» (не по макету) — живёт на чипе «Круги». */}
      </div>
      )}
    </div>
  );
}

/* Per-team stale-while-revalidate cache (roster / habits / anchor-progress / goal) so
   re-opening a team renders INSTANTLY from the last-known data instead of flashing through
   a skeleton every time (David: «каждый раз вижу обновление экрана, дёргать не нравится»).
   Keyed by cloudId; the effects below still revalidate in the background.
   ПЕРЕЖИВАЕТ ПЕРЕЗАПУСК: write-through в localStorage (David: «при переходе всё двигается,
   скачок интерфейса» — раньше кэш жил только в памяти и после рестарта Telegram каждый
   первый вход дёргался). Событие bos:teamCacheChanged — плитка команды на «Привычках»
   ест ТОТ ЖЕ кэш и обновляется вслед за деталью. */
var _bosTeamCache = {};
function _bosTeamGet(k) {
  if (!k) return null;
  if (_bosTeamCache[k] !== undefined) return _bosTeamCache[k];
  var v = null;
  try { v = JSON.parse(localStorage.getItem("bos:cache:team:" + k) || "null"); } catch (e) { v = null; }
  _bosTeamCache[k] = v;
  return v;
}
function _bosTeamPut(k, v) {
  if (k) {
    _bosTeamCache[k] = v;
    try { localStorage.setItem("bos:cache:team:" + k, JSON.stringify(v)); } catch (e) {}
    try { window.dispatchEvent(new Event("bos:teamCacheChanged")); } catch (e) {}
  }
  return v;
}

/* ОРБИТА КРУГА — герой комнаты команды. ЕДИНЫЙ космос со страницей «Я»: переиспользуем тот же
   общий OrbitField (один стандарт, одна логика расстановки — David: «должно быть едино и целостно,
   там стандарт»). Для круга: центр = ЭМБЛЕМА (без карандаша, editable=false); планеты = люди;
   активные сегодня идут на ВНУТРЕННЕЕ кольцо и ГОРЯТ (✓), неактивные приглушены — зеркалит «сильнейшая
   привычка ближе к центру» на «Я» (та же логика «кто куда зачем»). Кольца множатся с ростом числа
   людей — это уже встроено в OrbitField (пояса 6/12/18 → «+N»). */
function TeamOrbitLive({ emblem, faces, isDark }) {
  var list = Array.isArray(faces) ? faces : [];
  var anyActive = list.some(function (f) { return f && f.done; });
  // active-first → самые включённые ближе к центру (зеркалит сортировку привычек по силе на «Я»).
  // lit передаём ТОЛЬКО когда есть хоть один активный, иначе все полные (нейтральный покой, не серость).
  var people = list.slice()
    .sort(function (a, b) { return ((b && b.done) ? 1 : 0) - ((a && a.done) ? 1 : 0); })
    .map(function (f) { return { avatar: f && f.avatar, name: f && f.name, lit: anyActive ? !!(f && f.done) : undefined }; });
  return (
    <OrbitField
      avatar={emblem ? ("emoji:" + emblem) : "default"}
      name=""
      habits={[]}
      people={people}
      moodC={null}
      dark={isDark}
      hideLevelArc={true}
      editable={false}
    />
  );
}

/* СООБЩЕСТВО v2 · экран круга — ЛЮДИ + КАЛЕНДАРЬ единым блоком наверху (David fork 3):
   слайдер Memoji-лиц (роль + «Ты») → тап переключает → под ним КАЛЕНДАРЬ выбранного
   человека кольцами-заполнения (bosDayRing внутри PeopleMonthCalendarLive), «кто когда
   отметился» + подпись «Имя · N дней в ритме» + «Профиль ›» на экран человека. */
function TeamPeopleCalendarLive({ mainProg, members, meId, navigate, teamName, isDark, onInvite, accent }) {
  var base = (Array.isArray(mainProg) && mainProg.length) ? mainProg : (members || []).map(function (m) { return { id: m.id, name: m.name, avatar: m.avatar, me: m.id === meId, days: {} }; });
  var _s = React.useState(function () { var mi = base.findIndex(function (p) { return p.me; }); return mi >= 0 ? mi : 0; });
  var sel = _s[0], setSel = _s[1];
  // Уровни участников (L-бейдж на лице) — из публичных профилей (тот же источник, что «Друзья»).
  var _lv = React.useState({}), levels = _lv[0], setLevels = _lv[1];
  var idsSig = base.map(function (p) { return p.id; }).filter(Boolean).join(",");
  React.useEffect(function () {
    var ids = base.map(function (p) { return p.id; }).filter(Boolean);
    if (!ids.length || !(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.profilesPublic)) return;
    var on = true;
    window.bosCloud.profilesPublic(ids).then(function (pub) { if (!on || !pub) return; var m = {}; Object.keys(pub).forEach(function (id) { if (pub[id] && pub[id].level) m[id] = pub[id].level; }); setLevels(m); }).catch(function () {});
    return function () { on = false; };
  }, [idsSig]);
  if (!base.length) return null;
  var roleById = {}; (members || []).forEach(function (m) { if (m) roleById[m.id] = m.role; });
  var roleLabel = function (p) {
    if (roleById[p.id] === "owner") return "Организатор";
    var last = ("" + (p.name || "")).trim().slice(-1).toLowerCase();
    return (last === "а" || last === "я") ? "Участница" : "Участник"; // лёгкая эвристика рода по имени
  };
  var selP = base[sel] || base[0];
  var marks = (selP && selP.days) ? Object.keys(selP.days).filter(function (k) { return selP.days[k]; }).length : 0;
  var dayWord = function (n) { return (n % 10 === 1 && n % 100 !== 11) ? "день" : ((n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? "дня" : "дней"); };
  var calPeople = base.map(function (p) { return { name: p.me ? "Ты" : p.name, color: accent, you: !!p.me, avatar: p.avatar }; });
  var _tCalKey = function (d, mi) { var y = new Date().getFullYear(); return y + "-" + String(mi + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0"); };
  return (
    <div style={{ background: "var(--card)", borderRadius: 22, boxShadow: "var(--card-shadow)", padding: "14px 14px 6px", marginTop: 12 }}>
      {/* Слайдер лиц — L-бейдж + роль. Вертикальный воздух в скролле, чтобы кольцо выбора и L-бейдж НЕ обрезались. */}
      <div className="bos-hscroll" style={{ display: "flex", gap: 12, overflowX: "auto", padding: "6px 4px 10px", margin: "-4px -2px 0", scrollbarWidth: "none" }}>
        {base.map(function (p, i) {
          var on = i === sel;
          var lvl = p.id ? levels[p.id] : null;
          return (
            <button key={p.id || i} onClick={function () { setSel(i); if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } }} className="tap" data-no-haptic style={{ flexShrink: 0, border: 0, background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 62 }}>
              <span style={{ position: "relative", borderRadius: "50%", boxShadow: on ? ("0 0 0 2px var(--card), 0 0 0 4px " + (accent || "#0a0a0a")) : "none", transition: "box-shadow 0.15s" }}>
                <BuddyFaceLive avatar={p.avatar} name={p.name} size={48} />
                {lvl ? <span style={{ position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)", background: "#0a0a0a", color: "#FEDE34", fontSize: 9, fontWeight: 800, borderRadius: 999, padding: "1px 6px", border: "1.5px solid var(--card)", whiteSpace: "nowrap" }}>L{lvl}</span> : null}
              </span>
              <span style={{ fontSize: 11.5, fontWeight: on ? 700 : 600, color: on ? "var(--text)" : "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 62, textAlign: "center" }}>{p.me ? "Ты" : (p.name || "").split(" ")[0]}</span>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-4)" }}>{roleLabel(p)}</span>
            </button>
          );
        })}
      </div>
      {/* Подпись выбранного + Профиль */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "6px 2px 2px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{selP.me ? "Ты" : selP.name} · {marks} {dayWord(marks)} в ритме</div>
        {!selP.me && <button onClick={function () { navigate("contact-detail", { person: { id: selP.id, name: selP.name, avatar: selP.avatar, level: levels[selP.id] || null, teamName: teamName, from: "team-detail" } }); }} className="tap" data-haptic="selection" style={{ border: 0, background: "var(--surface-3)", color: "var(--text-2)", borderRadius: 999, padding: "6px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 2, flexShrink: 0 }}>Профиль <I.ChevronRight size={13} /></button>}
      </div>
      {/* Календарь выбранного — кольца-заполнения (bosDayRing); внутренний пикер СКРЫТ (людей выбираем слайдером выше — не дублируем). */}
      <PeopleMonthCalendarLive bare hidePicker label="" people={calPeople} selPerson={sel} onSelPerson={setSel}
        dayFrac={function (pi, d, mi) { return (base[pi] && base[pi].days && base[pi].days[_tCalKey(d, mi)]) ? 1 : 0; }} />
      <button onClick={onInvite} className="tap" style={{ width: "100%", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px", border: 0, background: "transparent", color: "var(--text-2)", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
        <span style={{ width: 26, height: 26, borderRadius: "50%", display: "grid", placeItems: "center", border: "1.5px dashed " + (isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.18)") }}><I.Plus size={14} strokeWidth={2.4} color={isDark ? "#fff" : "var(--text-2)"} /></span>
        Позвать людей
      </button>
    </div>
  );
}

/* День-статистика по карте отметок {"YYYY-MM-DD":true}: текущая серия · лучшая · всего.
   Всё честно из реальных дней участника (никаких выдуманных чисел). */
function _bosDaysStats(days) {
  var keys = Object.keys(days || {}).filter(function (k) { return days[k]; });
  var total = keys.length;
  if (!total) return { streak: 0, best: 0, total: 0 };
  var set = {}; keys.forEach(function (k) { set[k] = true; });
  var toDate = function (k) { var p = k.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); };
  var dayKey = function (d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  var sorted = keys.slice().sort();
  var best = 1, run = 1;
  for (var i = 1; i < sorted.length; i++) {
    var diff = Math.round((toDate(sorted[i]) - toDate(sorted[i - 1])) / 86400000);
    if (diff === 1) { run++; if (run > best) best = run; } else if (diff !== 0) run = 1;
  }
  var cur = new Date(); cur.setHours(0, 0, 0, 0);
  if (!set[dayKey(cur)]) cur.setDate(cur.getDate() - 1); // «сегодня ещё не отметился» серию не рвёт
  var streak = 0;
  while (set[dayKey(cur)]) { streak++; cur.setDate(cur.getDate() - 1); }
  return { streak: streak, best: best, total: total };
}

/* ЛЮДИ + КАЛЕНДАРЬ круга по макету «Цель с табами» Ц2 — ДВА отдельных блока:
   (1) лица-селектор «Все · Ты · …» с L-бейджами и кольцом выбора + строка о выбранном;
   (2) календарь выбранного: тепло-карта года (точки) / месяц (squircle) + серия·лучшая·всего.
   Тап по лицу фильтрует календарь и статы на человека (или «Все» = объединение круга). */
function CirclePeopleCalendarBlockLive({ members, mainProg, meId, navigate, teamName, isDark, accent }) {
  var base = (Array.isArray(mainProg) && mainProg.length)
    ? mainProg
    : (members || []).map(function (m) { return { id: m.id, name: m.name, avatar: m.avatar, me: m.id === meId, days: {} }; });
  var roleById = {}; (members || []).forEach(function (m) { if (m) roleById[m.id] = m.role; });
  var _s = React.useState("me"); var selKey = _s[0], setSelKey = _s[1]; // "all" | "me" | <member id>
  var _cm = React.useState("year"); var calMode = _cm[0], setCalMode = _cm[1];
  var _lv = React.useState({}); var levels = _lv[0], setLevels = _lv[1];
  var idsSig = base.map(function (p) { return p.id; }).filter(Boolean).join(",");
  React.useEffect(function () {
    var ids = base.map(function (p) { return p.id; }).filter(Boolean);
    if (!ids.length || !(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.profilesPublic)) return;
    var on = true;
    window.bosCloud.profilesPublic(ids).then(function (pub) { if (!on || !pub) return; var m = {}; Object.keys(pub).forEach(function (id) { if (pub[id] && pub[id].level) m[id] = pub[id].level; }); setLevels(m); }).catch(function () {});
    return function () { on = false; };
  }, [idsSig]);
  if (!base.length) return null;

  // Дни выбранного: конкретный человек → его days; «Все» → объединение с долей круга за день.
  var meP = base.find(function (p) { return p.me; }) || base[0];
  var selP = selKey === "all" ? null : (selKey === "me" ? meP : (base.find(function (p) { return p.id === selKey; }) || meP));
  var allFrac = {}; // dateKey -> доля круга, что отметилась (для «Все»)
  if (selKey === "all") {
    var n = base.length || 1;
    base.forEach(function (p) { Object.keys(p.days || {}).forEach(function (k) { if (p.days[k]) allFrac[k] = (allFrac[k] || 0) + 1 / n; }); });
  }
  var selDays = selKey === "all"
    ? (function () { var d = {}; Object.keys(allFrac).forEach(function (k) { d[k] = true; }); return d; })()
    : (selP && selP.days) || {};
  var stats = _bosDaysStats(selDays);
  var dayWord = function (n) { return (n % 10 === 1 && n % 100 !== 11) ? "день" : ((n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? "дня" : "дней"); };
  var roleLabel = function (p) {
    if (roleById[p.id] === "owner") return "Организатор";
    var last = ("" + (p.name || "")).trim().slice(-1).toLowerCase();
    return (last === "а" || last === "я") ? "Участница" : "Участник";
  };
  var dayKey = function (d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var todayK = dayKey(today);

  var card = { background: "var(--card)", borderRadius: 22, boxShadow: "var(--card-shadow)" };
  var lit = accent || (isDark ? "#e6e6ea" : "#0a0a0a");

  // ── лица ──
  var faceBtn = function (key, avatar, name, lvl, isYou, roleP) {
    var on = selKey === key;
    return (
      <button key={key} onClick={function () { setSelKey(key); if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } }} className="tap" data-no-haptic
        style={{ flexShrink: 0, border: 0, background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 60 }}>
        <span style={{ position: "relative", borderRadius: "50%", boxShadow: on ? ("0 0 0 2px var(--card), 0 0 0 4px " + lit) : "none", transition: "box-shadow 0.15s", opacity: on ? 1 : 0.9 }}>
          {avatar === "__all__"
            ? <span style={{ width: 46, height: 46, borderRadius: "50%", background: "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 20 }}>👥</span>
            : <BuddyFaceLive avatar={avatar} name={name} size={46} />}
          {lvl ? <span style={{ position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)", background: "#0a0a0a", color: "#FEDE34", fontSize: 9, fontWeight: 800, borderRadius: 999, padding: "1px 6px", border: "1.5px solid var(--card)", whiteSpace: "nowrap" }}>{lvl}</span> : null}
        </span>
        <span style={{ fontSize: 11.5, fontWeight: on ? 700 : 600, color: on ? "var(--text)" : "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 60, textAlign: "center" }}>{name}</span>
      </button>
    );
  };

  // ── тепло-карта года (26 недель × 7) ──
  var weekdayMon = (today.getDay() + 6) % 7;
  var start = new Date(today); start.setDate(start.getDate() - (25 * 7 + weekdayMon));
  var cols = [];
  for (var c = 0; c < 26; c++) {
    var colCells = [];
    for (var r = 0; r < 7; r++) {
      var d = new Date(start); d.setDate(start.getDate() + c * 7 + r);
      var k = dayKey(d);
      var future = d > today;
      var frac = selKey === "all" ? (allFrac[k] || 0) : (selDays[k] ? 1 : 0);
      var cls = future ? "future" : (frac >= 0.99 ? "l4" : frac >= 0.66 ? "l3" : frac >= 0.34 ? "l2" : frac > 0 ? "l1" : "");
      colCells.push({ k: k, cls: cls, today: k === todayK });
    }
    cols.push(colCells);
  }
  var hmColor = { "": (isDark ? "rgba(255,255,255,0.07)" : "#ececec"), l1: "#c9c9c9", l2: "#8f8f8f", l3: "#4a4a4a", l4: "#111", future: "transparent" };

  // ── месяц (squircle) ──
  var mToday = today, mY = mToday.getFullYear(), mM = mToday.getMonth();
  var first = new Date(mY, mM, 1);
  var lead = (first.getDay() + 6) % 7; // пн-первый
  var daysInMonth = new Date(mY, mM + 1, 0).getDate();
  var monthCells = [];
  for (var g = 0; g < lead; g++) monthCells.push(null);
  for (var dd = 1; dd <= daysInMonth; dd++) {
    var dk = mY + "-" + String(mM + 1).padStart(2, "0") + "-" + String(dd).padStart(2, "0");
    var dDate = new Date(mY, mM, dd);
    var fut = dDate > today;
    var f = selKey === "all" ? (allFrac[dk] || 0) : (selDays[dk] ? 1 : 0);
    monthCells.push({ d: dd, k: dk, frac: f, future: fut, today: dk === todayK });
  }
  var monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  var cdFill = function (frac, isToday, future) {
    if (future) return { background: "transparent", boxShadow: "inset 0 0 0 0.7px var(--line)", color: "var(--text-5)" };
    var bg = frac >= 0.99 ? "#0a0a0a" : frac >= 0.5 ? "#9a9aa2" : frac > 0 ? "#d9d9de" : (isDark ? "rgba(255,255,255,0.06)" : "#eef0f4");
    var col = frac >= 0.5 ? "#fff" : "var(--text-3)";
    var s = { background: bg, color: col };
    if (isToday) s.boxShadow = "inset 0 0 0 2px #FEDE34";
    return s;
  };

  var seg = function (label, val) {
    var on = calMode === val;
    return <button onClick={function () { setCalMode(val); }} className="tap" data-no-haptic
      style={{ border: 0, borderRadius: 999, padding: "5px 12px", fontSize: 12, fontWeight: on ? 700 : 600, cursor: "pointer",
        background: on ? "var(--card)" : "transparent", color: on ? "var(--text)" : "var(--text-4)", boxShadow: on ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>{label}</button>;
  };

  return (
    <>
      {/* (1) ЛЮДИ — отдельный блок */}
      <div style={{ ...card, padding: "14px 14px 16px", marginTop: 12 }}>
        <div className="bos-hscroll" style={{ display: "flex", gap: 10, overflowX: "auto", padding: "6px 2px 8px", margin: "-4px -2px 0", scrollbarWidth: "none" }}>
          {faceBtn("all", "__all__", "Все", null, false, null)}
          {base.map(function (p) {
            return faceBtn(p.me ? "me" : p.id, p.avatar, p.me ? "Ты" : ("" + (p.name || "")).split(" ")[0], p.id ? levels[p.id] : null, p.me, p);
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 2px 0" }}>
          <div style={{ fontSize: 13.5, color: "var(--text-3)", lineHeight: 1.4, minWidth: 0 }}>
            {selKey === "all"
              ? <span><b style={{ color: "var(--text)" }}>Весь круг</b> · {stats.total} {dayWord(stats.total)} отмечено вместе</span>
              : <span><b style={{ color: "var(--text)" }}>{selP && selP.me ? "Ты" : (selP && selP.name)}{selP && !selP.me && selP.id && levels[selP.id] ? " · уровень " + levels[selP.id] : ""}</b> · серия {stats.streak} {dayWord(stats.streak)}{selP ? " · " + roleLabel(selP).toLowerCase() : ""}</span>}
          </div>
          {selKey !== "all" && selP && !selP.me && <button onClick={function () { navigate("contact-detail", { person: { id: selP.id, name: selP.name, avatar: selP.avatar, level: levels[selP.id] || null, teamName: teamName, from: "team-detail" } }); }} className="tap" data-haptic="selection" style={{ border: 0, background: "var(--surface-3)", color: "var(--text-2)", borderRadius: 999, padding: "6px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 2, flexShrink: 0 }}>Профиль <I.ChevronRight size={13} /></button>}
        </div>
      </div>

      {/* (2) КАЛЕНДАРЬ — отдельный блок: год-теплокарта / месяц + серия·лучшая·всего */}
      <div style={{ ...card, padding: "16px 16px 14px", marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.2px", color: "var(--text)" }}>{calMode === "year" ? mY : (monthNames[mM] + " " + mY)}</div>
          <div style={{ display: "inline-flex", background: "var(--surface-3)", borderRadius: 999, padding: 4, gap: 2 }}>{seg("Месяц", "month")}{seg("Год", "year")}</div>
        </div>

        {calMode === "year" ? (
          <div style={{ overflowX: "auto", scrollbarWidth: "none" }}>
            <div style={{ display: "grid", gridAutoFlow: "column", gridTemplateRows: "repeat(7, 10px)", gap: 3, width: "max-content", margin: "0 auto" }}>
              {cols.map(function (col, ci) { return col.map(function (cell, ri) {
                return <span key={ci + "-" + ri} title={cell.k} style={{ width: 10, height: 10, borderRadius: "50%", background: hmColor[cell.cls], boxShadow: cell.today ? "inset 0 0 0 1.5px #FEDE34" : (cell.cls === "future" ? "inset 0 0 0 0.7px " + (isDark ? "rgba(255,255,255,0.12)" : "#e3e3e3") : "none") }} />;
              }); })}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5, padding: "0 1px 5px" }}>
              {["пн", "вт", "ср", "чт", "пт", "сб", "вс"].map(function (w) { return <span key={w} style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, color: "var(--text-5)", textAlign: "center", textTransform: "uppercase" }}>{w}</span>; })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5 }}>
              {monthCells.map(function (cell, i) {
                if (!cell) return <span key={"g" + i} />;
                var s = cdFill(cell.frac, cell.today, cell.future);
                return <span key={cell.k} style={{ aspectRatio: "1", borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 11, fontWeight: cell.today ? 800 : 600, ...s }}>{cell.d}</span>;
              })}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", marginTop: 14, borderTop: "1px solid var(--line)" }}>
          {[["серия", stats.streak, "д"], ["лучшая", stats.best, "д"], ["всего", stats.total, ""]].map(function (s, i) {
            return (
              <div key={i} style={{ textAlign: "center", padding: "14px 6px 4px", position: "relative", boxShadow: i ? "inset 1px 0 0 var(--line)" : "none" }}>
                <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: "-0.5px", color: "var(--text)" }}>{s[1]}{s[2] ? <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-4)" }}>{s[2]}</span> : null}</div>
                <div style={{ fontSize: 11, letterSpacing: 1.2, color: "var(--text-5)", textTransform: "uppercase", marginTop: 2, fontWeight: 600 }}>{s[0]}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function TeamDetailLive() {
  const { navigate, params } = useNav();
  const app = useApp();
  const { open: openSheet } = useSheet();
  const passed = params?.team || { _id: "seed-1", name: "Команда создателей", emblem: "✨", accent: "#fef3c7", goal: "50 добрых дел за месяц", date: "1 — 31 дек", progress: 0, members: [] };
  // Откуда пришли в комнату круга — «Назад» и выход возвращают ИМЕННО туда (David: «после выхода
  // из команды кидает не обратно, а на Найти»). Дефолт "community" сохраняет прежнее поведение.
  const from = params?.from || "community";
  // Read the LIVE team from the store so a just-added habit appears immediately.
  const t = (app?.teams || []).find(x => x._id === passed._id) || passed;
  // ЦВЕТА ПОКА ВЫКЛ (David): единое ЕДВА-серое СТЕКЛО для комнаты круга; включим позже.
  const accent = "#EAEAEF";
  const isDark = app?.themeOverride === "dark";
  // The goal MODE — shown as a chip so the team's rule (общий счёт / серия / гонка) is ALWAYS
  // visible, not hidden behind the async cloud progress (David: «не вижу их отражение»).
  const teamModeMeta = ({ collective: { e: "🌊", t: "Общий счёт" }, streak: { e: "🔥", t: "Серия у каждого" }, race: { e: "🏁", t: "Гонка" } })[t.type || "collective"];
  // LIVE = real user: honest data or empty, NEVER fake standings/activity/calendar —
  // even for a team without a cloud link yet.

  // Real team-chat preview + unread badge for LIVE cloud teams. Guarded on the cloud
  // being enabled AND the team having a cloudId — a freshly-created local team has
  // neither yet, so this stays inert until it syncs.
  const _chatLive = !!(window.bosCloud && window.bosCloud.enabled() && t.cloudId);
  const _readKey = t.cloudId ? "bos:chatread:" + t.cloudId : null;
  const [chatPeek, setChatPeek] = React.useState(null); // { last, unread } for live teams
  React.useEffect(() => {
    if (!_chatLive) return;
    let on = true;
    (async () => {
      try {
        const me = await window.bosCloud.uid();
        const rows = await window.bosCloud.loadMessages(t.cloudId);
        if (!on || !Array.isArray(rows)) return;
        // Compare each message's server created_at to the stored read-marker created_at —
        // SAME time base on both sides (a device clock drifts vs the server, so on skewed
        // phones a Date.now() compare would stick or never show the badge).
        const lastReadRaw = (_readKey && localStorage.getItem(_readKey)) || 0;
        const lastReadMs = lastReadRaw ? new Date(lastReadRaw).getTime() : 0;
        const last = rows.length ? rows[rows.length - 1] : null;
        const lastText = last ? (last.text || (last.image_url ? "📷 Фото" : "")) : "";
        const unread = rows.filter((r) => r && r.user_id !== me && new Date(r.created_at).getTime() > lastReadMs).length;
        // Carry the last message's created_at so markChatRead can store it as the read marker
        // (same time base as messages). No messages yet → null → everything counts as read.
        setChatPeek({ last: lastText, unread: unread, lastAt: last ? last.created_at : null });
      } catch (e) {}
    })();
    return () => { on = false; };
  }, [_chatLive, t.cloudId]);
  const markChatRead = () => {
    // Store the LAST loaded message's created_at (server time base) — NOT Date.now() (device
    // clock). If nothing was loaded yet, store "" so the next compare treats all as read.
    try { if (_readKey) localStorage.setItem(_readKey, (chatPeek && chatPeek.lastAt) ? String(chatPeek.lastAt) : ""); } catch (e) {}
    setChatPeek((p) => p ? { ...p, unread: 0 } : p);
    // Погасим значок и на ВНЕШНЕЙ плитке круга (сброс общего кэша непрочитанного).
    try { if (t.cloudId && typeof bosTeamUnreadClear === "function") bosTeamUnreadClear(t.cloudId); } catch (e) {}
  };

  // LIVE teams: load the REAL roster (real names + avatars + roles) from the cloud, so the
  // member list is honest — real teammates, no fabricated standings until real progress exists.
  const _rosterLive = !!(window.bosCloud && window.bosCloud.enabled() && t.cloudId);
  const [cloudRoster, setCloudRoster] = React.useState(() => _bosTeamGet("roster:" + t.cloudId));
  const [meId, setMeId] = React.useState(null); // current user's cloud id — to find myself in the roster
  const [rosterTick, setRosterTick] = React.useState(0);
  React.useEffect(() => {
    if (!_rosterLive) { setMeId(null); return; }
    let on = true;
    window.bosCloud.uid().then((id) => { if (on) setMeId(id || null); }).catch(() => {});
    return () => { on = false; };
  }, [_rosterLive, t.cloudId]);
  // «Баланс круга» — опт-аут владельцем (teams.circle_balance_on). По умолчанию ВКЛ; читаем ЖИВОЕ
  // облачное значение, чтобы участники видели ту же настройку, что выставил владелец (локальная копия
  // владельца тоже несёт t.circleBalanceOn мгновенно). До patch_circle_balance_toggle.sql teamById
  // вернёт undefined → `!== false` → раздел показывается (прежнее поведение, graceful).
  const [circleBalOn, setCircleBalOn] = React.useState(t.circleBalanceOn !== false);
  React.useEffect(() => {
    setCircleBalOn(t.circleBalanceOn !== false);
    if (!(window.bosCloud && window.bosCloud.enabled() && t.cloudId && window.bosCloud.teamById)) return;
    let on = true;
    window.bosCloud.teamById(t.cloudId).then((row) => { if (on && row) setCircleBalOn(row.circleBalanceOn !== false); }).catch(() => {});
    return () => { on = false; };
  }, [t.cloudId, t.circleBalanceOn]);
  React.useEffect(() => {
    if (!_rosterLive) return;
    let on = true;
    window.bosCloud.teamMembers(t.cloudId).then((mem) => {
      if (!on || !Array.isArray(mem)) return;
      var palette = BOS_TEAM_PALETTE;
      // owner first, then members, in join order
      var sorted = mem.slice().sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0));
      setCloudRoster(_bosTeamPut("roster:" + t.cloudId, sorted.map((m, i) => ({ id: m.id, name: m.name || "Участник", avatar: m.avatar, role: m.role, initials: (m.name || "У").slice(0, 1).toUpperCase(), color: palette[i % palette.length] }))));
    }).catch(() => {});
    return () => { on = false; };
  }, [_rosterLive, t.cloudId, rosterTick]);
  // E: the CREATOR sees pending join requests here and approves / rejects them.
  // Derive ownership from the REAL roster role, so a creator opening their team on a
  // second device (where t.joined may be truthy after cloud hydration) still gets the
  // gear + approval panel. Fall back to the old !t.joined heuristic only until the
  // roster + my id have loaded.
  const _meMember = (meId && Array.isArray(cloudRoster)) ? cloudRoster.find((m) => m.id === meId) : null;
  const _isOwner = _meMember ? (_meMember.role === "owner") : !t.joined;
  const [pending, setPending] = React.useState([]);
  React.useEffect(() => {
    if (!(_rosterLive && _isOwner) || !window.bosCloud.pendingRequests) return;
    let on = true;
    window.bosCloud.pendingRequests(t.cloudId).then((p) => { if (on) setPending(Array.isArray(p) ? p : []); }).catch(() => {});
    return () => { on = false; };
  }, [_rosterLive, _isOwner, t.cloudId, rosterTick]);
  const approveReq = (uid) => { window.bosCloud.approveMember(t.cloudId, uid).then((ok) => { if (ok) { setPending((p) => p.filter((x) => x.id !== uid)); setRosterTick((n) => n + 1); } }); };
  const rejectReq = (uid) => { window.bosCloud.rejectMember(t.cloudId, uid).then((ok) => { if (ok) setPending((p) => p.filter((x) => x.id !== uid)); }); };

  // REAL shared team habits for live teams (from the cloud): real names + per-member completion.
  const [liveTeamHabits, setLiveTeamHabits] = React.useState(() => _bosTeamGet("habits:" + t.cloudId));
  const [habitsTick, setHabitsTick] = React.useState(0);
  const [mainProg, setMainProg] = React.useState(() => _bosTeamGet("mainprog:" + t.cloudId)); // per-member day-map for the anchor habit (who did which day)
  const [goalProg, setGoalProg] = React.useState(() => _bosTeamGet("goal:" + t.cloudId)); // team-goal progress COMPUTED from habit marks (current + per-member contribution)
  const [settlements, setSettlements] = React.useState(null); // { user_id: {xp, won} } — team-goal XP payouts (cloud ledger)
  const settledRef = React.useRef(false);                      // settle-once guard (per mount per reached goal)
  React.useEffect(() => {
    if (!_rosterLive || !window.bosCloud.teamHabitsFull) return;
    let on = true;
    window.bosCloud.teamHabitsFull(t.cloudId).then((hs) => { if (on) setLiveTeamHabits(_bosTeamPut("habits:" + t.cloudId, Array.isArray(hs) ? hs : [])); }).catch(() => {});
    return () => { on = false; };
  }, [_rosterLive, t.cloudId, habitsTick]);
  const toggleMyTeamHabit = (h) => {
    if (!h || !h.id) return;
    // Derive the next state INSIDE the updater from the CURRENT item x (not the captured
    // outer h) so a fast double-tap can't double-count, and clamp doneToday to [0, total].
    setLiveTeamHabits((list) => (list || []).map((x) => {
      if (x.id !== h.id) return x;
      const next = !x.doneByMe;
      const cap = Number.isFinite(x.total) ? x.total : (x.doneToday + 1);
      const doneToday = Math.max(0, Math.min(cap, x.doneToday + (next ? 1 : -1)));
      return { ...x, doneByMe: next, doneToday: doneToday };
    }));
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
    const _wantOn = !h.doneByMe;
    window.bosCloud.toggleTeamHabitToday(h.id, _wantOn).then((ok) => {
      // Аудит #8: сервер отклонил запись → откатываем оптимистичную отметку, чтобы галочка не
      // «врала» (стоит, а на сервере пусто). При успехе — просто освежаем с сервера.
      if (ok === false) {
        setLiveTeamHabits((list) => (list || []).map((x) => {
          if (x.id !== h.id) return x;
          const cap = Number.isFinite(x.total) ? x.total : (x.doneToday + 1);
          const doneToday = Math.max(0, Math.min(cap, x.doneToday + (_wantOn ? -1 : 1)));
          return { ...x, doneByMe: !_wantOn, doneToday: doneToday };
        }));
        if (window.tgHaptic) { try { window.tgHaptic("error"); } catch (e) {} }
      }
      setHabitsTick((n) => n + 1);
    });
  };
  const addTeamHabitCloud = (h) => { var first = !(liveTeamHabits && liveTeamHabits.length); window.bosCloud.addTeamHabit(t.cloudId, { ...h, isMain: (h && h.isMain) || first }).then(() => setHabitsTick((n) => n + 1)); };

  // ── «ДЕЛА» СОВМЕСТНОЙ ЦЕЛИ (David: «Дела в совместных целях») ──────────────────
  // Автор (владелец) ставит задания; участник отмечает СВОЁ выполнение + видит «кто уже сделал».
  // Кросс-участниковая синхронизация через облако (patch_team_tasks.sql). Пока таблиц нет →
  // teamTasks() вернёт null → _teamTasksAvail=false → раздел ПРЯЧЕТСЯ (живое не ломается).
  const [teamTaskData, setTeamTaskData] = React.useState(() => _bosTeamGet("tasks:" + t.cloudId));
  const [tasksTick, setTasksTick] = React.useState(0);
  const [newTeamTask, setNewTeamTask] = React.useState("");
  React.useEffect(() => {
    if (!_rosterLive || !window.bosCloud.teamTasks) return;
    let on = true;
    window.bosCloud.teamTasks(t.cloudId).then((d) => { if (on && d) setTeamTaskData(_bosTeamPut("tasks:" + t.cloudId, d)); }).catch(() => {});
    return () => { on = false; };
  }, [_rosterLive, t.cloudId, tasksTick]);
  const _teamTasks = (teamTaskData && Array.isArray(teamTaskData.tasks)) ? teamTaskData.tasks : [];
  const _teamTasksAvail = !!(teamTaskData && Array.isArray(teamTaskData.tasks)); // облако вернуло валидную структуру → таблицы есть
  const _teamTasksTotal = (teamTaskData && teamTaskData.total) || 1; // total приходит из teamTasks(); members определён ниже
  const _teamTasksMine = _teamTasks.filter((x) => x.doneByMe).length;
  const toggleMyTeamTask = (tk) => {
    if (!tk || !tk.id) return;
    const next = !tk.doneByMe;
    setTeamTaskData((d) => (d ? { ...d, tasks: (d.tasks || []).map((x) => (x.id === tk.id ? { ...x, doneByMe: next, doneCount: Math.max(0, (x.doneCount || 0) + (next ? 1 : -1)) } : x)) } : d));
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
    window.bosCloud.toggleTeamTaskMine(tk.id, next).then((ok) => {
      if (ok === false) { setTeamTaskData((d) => (d ? { ...d, tasks: (d.tasks || []).map((x) => (x.id === tk.id ? { ...x, doneByMe: !next, doneCount: Math.max(0, (x.doneCount || 0) + (next ? -1 : 1)) } : x)) } : d)); if (window.tgHaptic) { try { window.tgHaptic("error"); } catch (e) {} } }
      setTasksTick((n) => n + 1);
    });
  };
  const addTeamTaskCloud = () => { const tx = newTeamTask.trim(); if (!tx || !window.bosCloud.addTeamTask) return; setNewTeamTask(""); window.bosCloud.addTeamTask(t.cloudId, tx).then(() => setTasksTick((n) => n + 1)); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } };
  const removeTeamTaskCloud = (id) => { if (!window.bosCloud.removeTeamTask) return; setTeamTaskData((d) => (d ? { ...d, tasks: (d.tasks || []).filter((x) => x.id !== id) } : d)); window.bosCloud.removeTeamTask(id).then(() => setTasksTick((n) => n + 1)); };
  // ── Э3 · ПРОСЬБЫ круга: дело с kind='request', на которое откликаются (volunteer_id). ──
  const _plainTasks = _teamTasks.filter((x) => (x.kind || "task") !== "request");
  const _requests = _teamTasks.filter((x) => x.kind === "request");
  const [newTeamRequest, setNewTeamRequest] = React.useState("");
  const addTeamRequestCloud = () => {
    const tx = newTeamRequest.trim(); if (!tx || !window.bosCloud.addTeamTask) return; setNewTeamRequest("");
    window.bosCloud.addTeamTask(t.cloudId, tx, "request").then(() => setTasksTick((n) => n + 1));
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
  };
  const claimRequest = (tk, on) => {
    if (!tk || !tk.id || !window.bosCloud.claimTeamRequest) return;
    setTeamTaskData((d) => (d ? { ...d, tasks: (d.tasks || []).map((x) => (x.id === tk.id ? { ...x, volunteerMe: on, volunteerId: on ? (meId || "me") : null, volunteerName: on ? "Ты" : null } : x)) } : d));
    if (window.tgHaptic) { try { window.tgHaptic(on ? "success" : "light"); } catch (e) {} }
    window.bosCloud.claimTeamRequest(tk.id, on).then((ok) => { if (ok === false) setTasksTick((n) => n + 1); else setTasksTick((n) => n + 1); });
  };
  // A CLOUD team's roster lives in the cloud; the passed-in t.members is a STALE local
  // cache (the «3 снаружи / 0 внутри» mismatch). Until the real roster loads we show a
  // skeleton — NEVER the stale members, which used to flash phantom people for a beat
  // (David: «проскакивает заполненный демо-вариант»). Mirrors the teamHabits gate below.
  const _rosterLoading = _rosterLive && cloudRoster === null;
  const members = _rosterLive ? (cloudRoster || []) : (t.members?.length ? t.members : []);
  const ranked = members; // live: roster order (owner first), no contribution sort
  // Live: real cloud habits when synced, else the team's own habits, else empty.
  const teamHabits = _rosterLive ? (liveTeamHabits || []) : (Array.isArray(t.habits) ? t.habits : []);
  const main = teamHabits.find(h => h.isMain);
  const others = teamHabits.filter(h => !h.isMain);
  // ADOPT — «приходит как личная» (David): командная привычка становится твоей ЛИЧНОЙ (своё
  // время/значок), отмечаешь её на «Привычки», отметка зеркалится в командный счёт (toggleHabit →
  // toggleTeamHabitToday). Линк = поле teamHabitId. ЭТАП 2: дедуп — если уже ведёшь такую, предложить
  // ПРИВЯЗАТЬ существующую (без дубля, серия/время сохранятся). ЕДИНАЯ отметка: адаптированная
  // привычка отмечается через её личную копию (один источник) — никакого прямого team-write.
  const myHabits = app?.habits || [];
  const _todayK = (typeof bosTodayKey === "function") ? bosTodayKey() : new Date().toISOString().slice(0, 10); // ЛОКАЛЬНЫЙ день (совпадает с личным логом + командным слоем; был UTC → «врал» ночью)
  const adoptedFor = (h) => (h && h.id != null) ? myHabits.find((x) => x.teamHabitId === h.id) : null; // id-guard: у офлайн-команды привычки без id — undefined===undefined ложно матчил первую попавшуюся
  const _dupeFor = (h) => h && myHabits.find((x) => !x.teamHabitId && (x.name || "").trim().toLowerCase() === (h.name || "").trim().toLowerCase());
  const _createLinkedHabit = (h) => { app?.addHabit({ name: h.name, emoji: h.emoji, color: h.color || null, teamId: t.cloudId, teamHabitId: h.id, log: {}, days: [1, 1, 1, 1, 1, 1, 1], goalPerDay: (h.goalPerDay || 1), reminder: { on: false, time: "09:00" } }); if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} } };
  const adoptTeamHabit = (h) => {
    if (!h || !h.id || adoptedFor(h)) return;
    const dupe = _dupeFor(h);
    if (dupe) {
      openSheet(<TeamAdoptChoiceLive dupeName={(dupe.name || "").trim()}
        onLink={() => { app?.updateHabit(dupe.id, { teamId: t.cloudId, teamHabitId: h.id }); }}
        onCreate={() => _createLinkedHabit(h)} />);
    } else { _createLinkedHabit(h); }
  };
  // Mark an ADOPTED team habit = toggle its personal copy (single source → mirrors to team_habit_logs).
  const markAdopted = (h) => { const a = adoptedFor(h); if (!a) return; app?.toggleHabit(a.id); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } setHabitsTick((n) => n + 1); };
  const myDone = (h) => { const a = adoptedFor(h); return a ? !!(a.log && a.log[_todayK]) : !!(h && h.doneByMe); };
  // Per-person "who did which day" for the team ANCHOR habit → feeds the SAME month calendar
  // the personal/shared habits use (data already per-user in team_habit_logs). Light poll.
  const _tCalKey = (d, mi) => { const y = new Date().getFullYear(); return y + "-" + String(mi + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0"); };
  const _mainId = main && main.id;
  React.useEffect(() => {
    let on = true;
    if (!_rosterLive || !_mainId || !window.bosCloud.teamHabitProgress) { setMainProg(null); return; }
    const load = () => window.bosCloud.teamHabitProgress(t.cloudId, _mainId).then((d) => { if (on && d && d.members) setMainProg(_bosTeamPut("mainprog:" + t.cloudId, d.members)); }).catch(() => {});
    load(); const iv = setInterval(load, 20000);
    return () => { on = false; clearInterval(iv); };
  }, [_rosterLive, t.cloudId, _mainId, habitsTick]);
  // Team GOAL progress — computed from the habit marks per mode (collective/streak/race).
  React.useEffect(() => {
    let on = true;
    if (!_rosterLive || !t.cloudId || !window.bosCloud.teamGoalProgress) { setGoalProg(null); return; }
    const load = () => window.bosCloud.teamGoalProgress(t.cloudId).then((d) => { if (on && d) setGoalProg(_bosTeamPut("goal:" + t.cloudId, d)); }).catch(() => {});
    load(); const iv = setInterval(load, 20000);
    return () => { on = false; clearInterval(iv); };
  }, [_rosterLive, t.cloudId, habitsTick]);
  // «НЕБО-НИТЬ»: времена сегодняшних отметок (created_at из team_habit_logs — писался всегда,
  // читается впервые) + возраст круга для «N-й день». Тот же лёгкий полл, что и у прогресса.
  const [skyT, setSkyT] = React.useState(() => _bosTeamGet("sky:" + t.cloudId));
  React.useEffect(() => {
    let on = true;
    if (!_rosterLive || !t.cloudId || !window.bosCloud.teamTodayTimes) { setSkyT(null); return; }
    const load = () => window.bosCloud.teamTodayTimes(t.cloudId).then((d) => { if (on && d) setSkyT(_bosTeamPut("sky:" + t.cloudId, d)); }).catch(() => {});
    load(); const iv = setInterval(load, 25000);
    return () => { on = false; clearInterval(iv); };
  }, [_rosterLive, t.cloudId, habitsTick]);
  // Лица на нить: участник появляется в момент своей ПЕРВОЙ отметки за сегодня.
  // МОЁ присутствие ведётся ЛОКАЛЬНОЙ галочкой (doneByMe), не облаком: отметил любую привычку круга
  // → появляюсь СРАЗУ (fresh=pop, пока облако не доехало); снял галочку → исчезаю в реалтайме, даже
  // если облако ещё держит старую метку (David: «нестабильно появлялась/исчезала»).
  const _iDidCircle = (liveTeamHabits || []).some((h) => h.doneByMe);
  const skyMarks = React.useMemo(() => {
    if (!Array.isArray(members)) return [];
    const _t = (skyT && skyT.times) || {};
    const _pt = (x) => (typeof bosParseTs === "function" ? bosParseTs(x) : new Date(x));
    // Все, кроме меня — из облака (первая отметка за сегодня).
    const out = members.filter((m) => m.id !== meId && _t[m.id]).map((m) => ({ id: m.id, name: m.name, avatar: m.avatar, me: false, ts: _pt(_t[m.id]) }));
    const meM = members.find((m) => m.id === meId);
    if (_iDidCircle && meM) {
      const cloudTs = _t[meId];
      out.push({ id: meM.id, name: meM.name, avatar: meM.avatar, me: true, ts: cloudTs ? _pt(cloudTs) : new Date(), fresh: !cloudTs });
    }
    return out;
  }, [skyT, members, meId, _iDidCircle]);
  // «Живёт N-й день» — возраст круга от created_at (стрейк-механика огня — позже).
  const circleAgeDays = (skyT && skyT.createdAt) ? Math.max(1, Math.floor((Date.now() - new Date(skyT.createdAt).getTime()) / 86400000) + 1) : null;
  // PAYOUT — when a STAKED goal is reached, OPEN the bank: idempotently settle MY row (co-op:
  // +stake; race: leader +bank), refresh the global team-goal XP so the level lifts, then read
  // everyone's payouts for the card. Settle runs once per mount (settledRef); the read re-runs on
  // each goalProg poll so other members' payouts appear as they open the team. Unlock-only —
  // nothing is ever deducted, so missing the goal just means the bank never opened.
  React.useEffect(() => {
    if (!_rosterLive || !t.cloudId || !window.bosCloud.settleTeamGoal) return;
    if (!goalProg || !goalProg.done || !(goalProg.stake > 0)) return;
    let on = true;
    const loadSettle = () => window.bosCloud.teamSettlements(t.cloudId).then((s) => { if (on) setSettlements(s || {}); }).catch(() => {});
    if (settledRef.current) { loadSettle(); }
    else {
      settledRef.current = true;
      window.bosCloud.settleTeamGoal(t.cloudId).then((res) => { if (!on) return; loadSettle(); if (res && res.settled && app && app.refreshTeamGoalXP) app.refreshTeamGoalXP(); }).catch(loadSettle);
    }
    return () => { on = false; };
  }, [_rosterLive, t.cloudId, goalProg]);
  // C+D (David): создание/правка общей привычки = ТА ЖЕ полная форма HabitFormSheetLive (teamFor),
  // а не урезанный TeamHabitSheetLive. onSave(data, editId): editId → updateTeamHabit (прогресс НЕ
  // трогаем — логи по team_habit_id), иначе addTeamHabit. onDelete → removeTeamHabit.
  const saveTeamHabit = (data, editId) => {
    if (editId != null) {
      setLiveTeamHabits((list) => (list || []).map((x) => x.id === editId ? Object.assign({}, x, { name: data.name, emoji: data.emoji, color: data.color, goalPerDay: data.goalPerDay, isMain: data.isMain }) : x));
      if (_rosterLive && window.bosCloud && window.bosCloud.updateTeamHabit) {
        window.bosCloud.updateTeamHabit(editId, data).then((ok) => {
          setHabitsTick((n) => n + 1);   // всегда перечитываем: на экране должна быть правда сервера
          // Молчаливый откат — худшее из поведений (David: «поменял иконку, а она через секунду
          // сама вернулась — как странно»). Если сервер правку не принял, так и говорим.
          if (!ok && typeof InfoSheet === "function") {
            openSheet(<InfoSheet title="Правка не сохранилась" dark={isDark} cta="Понятно"
              body="База не приняла изменение общей привычки, поэтому она осталась прежней. Обычно это нехватка прав на правку в круге — сообщи, и мы поправим." />);
          }
        });
      }
      return;
    }
    if (_rosterLive) addTeamHabitCloud(data); else app?.addTeamHabit(t._id, data);
  };
  const removeTeamHabitH = (id) => {
    setLiveTeamHabits((list) => (list || []).filter((x) => x.id !== id));
    if (_rosterLive && window.bosCloud && window.bosCloud.removeTeamHabit) window.bosCloud.removeTeamHabit(id).then(() => setHabitsTick((n) => n + 1));
  };
  const openAddHabit = () => openSheet(<HabitFormSheetLive mode="create" navigate={navigate} teamFor={{ team: t, suggestMain: !(teamHabits && teamHabits.length), onSave: saveTeamHabit, onDelete: removeTeamHabitH }} />);
  const openEditTeamHabit = (h) => openSheet(<HabitFormSheetLive mode="edit" navigate={navigate} habit={{ id: h.id, name: h.name, emoji: h.emoji, color: h.color || null, goalPerDay: h.goalPerDay || 1, duration: 0, isMain: !!h.isMain }} teamFor={{ team: t, onSave: saveTeamHabit, onDelete: removeTeamHabitH }} />);
  // КТО СЕГОДНЯ В ПОТОКЕ — отметившие якорь сегодня (per-member из mainProg) + я, если отметил.
  // Кормит орбиту (планеты загораются) и честный стат «Сегодня».
  const flowSet = {}; (mainProg || []).forEach((m) => { if (m.days && m.days[_todayK]) flowSet[m.id] = true; });
  if (meId && main && main.doneByMe) flowSet[meId] = true;
  const orbitFaces = (Array.isArray(members) ? members : []).map((m) => ({ id: m.id, avatar: m.avatar, name: m.name, done: !!flowSet[m.id] }));
  const inFlowToday = (Array.isArray(members) ? members : []).filter((m) => flowSet[m.id]).length;
  // ПУЛЬС 2.0 (David): кольцо ЧЕЛОВЕКА на орбите = его зона ответственности — доля закрытых
  // ИМ сегодня привычек круга (2 из 5 → 40% дуги), а центральное кольцо = общий счёт команды.
  // Данные бесплатные: teamHabitsFull уже несёт todayUsers (см. cloud.js). Себя считаем
  // ЛОКАЛЬНО (myDone) — кольцо отвечает на отметку мгновенно, без ожидания опроса.
  const _pulseTotal = teamHabits.length || 0;
  const _pulseFor = (f) => {
    if (!_pulseTotal) return null;
    if (meId && f.id === meId) return teamHabits.filter((h) => myDone(h)).length / _pulseTotal;
    if (!teamHabits.some((h) => Array.isArray(h.todayUsers))) return null; // старый кэш/оффлайн → active-фолбэк
    return teamHabits.filter((h) => Array.isArray(h.todayUsers) && h.todayUsers.indexOf(f.id) !== -1).length / _pulseTotal;
  };
  // ── ЕДИНАЯ СТРАНИЦА ЦЕЛИ (David: «команда = та же цель + блок людей») ──
  // Всё, что ниже, — расчёты для вёрстки-близнеца GoalDetailLive: прогресс/банк/выплаты
  // подняты из бывшей мега-карточки, сами данные и опросы выше НЕ менялись.
  const gpd = goalProg;
  const gUnit = (gpd && gpd.unit) || t.unit || "";
  const gTgt = (gpd && gpd.target) || t.target || 0;
  const gCur = gpd ? gpd.current : (t.current != null ? t.current : Math.round((t.progress || 0) * gTgt));
  const gDone = gTgt > 0 && gCur >= gTgt;
  const gp = gTgt > 0 ? Math.min(1, gCur / gTgt) : (t.progress || 0);
  const gRemaining = Math.max(0, gTgt - gCur);
  const gType = (gpd && gpd.type) || t.type || "collective";
  const modeLabel = ({ streak: "Серия у каждого", race: "Гонка — лидер", collective: "Общий счёт" })[gType] || "Общий счёт";
  const contrib = (gpd && Array.isArray(gpd.members)) ? gpd.members : [];
  const isRace = gType === "race";
  const stake = (gpd && gpd.stake) || t.stake || 0;
  const bank = (gpd && gpd.bank) || (stake * Math.max(1, contrib.length || members.length));
  const payFor = (m, i) => {
    if (!gDone || stake <= 0) return 0;
    if (settlements && settlements[m.id]) return settlements[m.id].xp || 0;
    return isRace ? (i === 0 ? bank : 0) : stake;
  };
  const myPay = (gDone && stake > 0) ? contrib.reduce((acc, m, i) => acc + (m.me ? payFor(m, i) : 0), 0) : 0;
  const gStyle = (typeof bosLoadGoalStyle === "function") ? bosLoadGoalStyle() : { orbits: true };
  // Реальный цвет команды красит кольцо/чеки (как g.color у личной); нейтральный → графит.
  const teamColor = (t.accent && ("" + t.accent).toLowerCase() !== "#0a0a0a" && t.accent !== "#8E8E93" && t.accent !== "#EAEAEF") ? t.accent : null;
  const ringInk = teamColor || (isDark ? "#e6e6ea" : "#0a0a0a");
  const card = isDark
    ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }
    : { background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" };
  const CountC = (typeof Count === "function") ? Count : function (p) { return p.value; };
  // David-редизайн детали общей цели: инфа под орбитой → ЧИПЫ; hero тянется до самого верха (как у
  // партнёра), правка/позвать/ЧАТ стеклом справа В hero. desc = заметка создателя (синкается всем
  // через goal.desc), aiChips = 1-2 честных наблюдения по реальному состоянию цели.
  const desc = (gpd && gpd.desc) || t.desc || "";
  const modeMeta = ({ collective: { e: "🌊", t: "Общий счёт" }, streak: { e: "🔥", t: "Серия у каждого" }, race: { e: "🏁", t: "Гонка" } })[gType] || { e: "🌊", t: "Общий счёт" };
  // ЧИПЫ ОБЩЕЙ ЦЕЛИ (David: прогресс НЕ дублируем — его видно по орбите; показываем ПУЛЬС и важные
  // данные круга): сегодня в деле · лидер/топ-вкладчик · банк · люди. gDone → празднуем. Пусто → зов.
  const _peopleWord = function (n) { return (n % 10 === 1 && n % 100 !== 11) ? "человек" : ((n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? "человека" : "человек"); };
  const teamChips = (function () {
    if (gDone) return [{ t: "🎉 Цель достигнута", hot: true }];
    var out = [];
    if (inFlowToday > 0) out.push({ t: "🔥 сегодня " + inFlowToday + " в деле", hot: true });
    var top = null; (contrib || []).forEach(function (m) { if (m && (top === null || m.value > top.value)) top = m; });
    if (top && top.value > 0) out.push({ t: (isRace ? "🏆 лидер " : "⭐ ") + (top.me ? "Ты" : ("" + (top.name || "")).split(" ")[0]) + " · " + top.value + (gUnit ? " " + gUnit : "") });
    if (stake > 0) out.push({ t: "🪙 банк " + bank + " XP" });
    if (!_rosterLoading) out.push({ t: "👥 " + members.length + " " + _peopleWord(members.length) });
    if (!out.length) out.push({ t: "✨ Позовите людей и начните", hot: true });
    return out.slice(0, 4);
  })();
  const H = bosGoalHero(teamColor, isDark);
  const heroBtn = { width: 38, height: 38, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", cursor: "pointer", background: H.btnBg, color: H.btnInk, flexShrink: 0 };
  const heroChip = { display: "inline-flex", alignItems: "center", gap: 4, background: H.chipBg, borderRadius: 999, padding: "5px 11px", fontSize: 12, fontWeight: 600, color: H.chipInk, whiteSpace: "nowrap" };
  const heroChipAI = Object.assign({}, heroChip, { background: H.chipAiBg, color: H.chipAiInk, boxShadow: H.onDark ? "none" : "0 1px 4px rgba(40,60,110,0.12)" });
  const _threadOff = t.threadOff === true || (t.goal && typeof t.goal === "object" && t.goal.threadOff === true);
  const editGoalLike = { _id: t._id, id: t.id, cloudId: t.cloudId, __isTeam: true, __team: t, name: t.name, emoji: t.emblem, color: t.accent, target: t.target, unit: t.unit, deadline: t.date || t.deadline || "", circle: true, type: t.type, vis: t.vis, stake: t.stake, goal: t.goal, desc: desc, joined: t.joined, circleBalanceOn: circleBalOn, threadOff: _threadOff, habitIds: [] };
  // Сводки для свёрнутых секций единого блока (David: «краткая сводка на каждом»).
  const _myDoneCount = teamHabits.filter((h) => myDone(h)).length;
  const _habitWordT = (n) => (n % 10 === 1 && n % 100 !== 11) ? "привычка" : ((n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? "привычки" : "привычек");

  // ── ДЕНЬ КРУГА ЗАКРЫТ → конфетти ────────────────────────────────────────────
  // Считаем ПО СЕБЕ (_myDoneCount), а не по всем участникам: это праздник моего вклада, а не
  // отчёт за круг. Ловит обе ветки отметки — и «прижитую» привычку (через app.toggleHabit), и
  // прямую запись в облако: обе приземляются в _myDoneCount.
  // Празднуем только РОСТ до полного при открытом экране: облачный опрос на каждом входе заново
  // приносит уже закрытый день, и без этого салют бахал бы при каждом заходе в круг.
  const _teamDoneRef = React.useRef(null);
  React.useEffect(() => {
    const prev = _teamDoneRef.current;
    _teamDoneRef.current = _myDoneCount;
    if (prev == null) return;
    if (_myDoneCount <= prev) return;
    if (!teamHabits.length || _myDoneCount !== teamHabits.length) return;
    if (typeof window.bosCelebrateScope !== "function") return;
    if (!window.bosCelebrateScope("circle:" + (app?.persistId || "") + ":" + (t.cloudId || t._id || t.id))) return;
    // «+30 идеальный день» — ТЕМ ЖЕ ключом дня, что и у главной доски: подарок один на день,
    // какую бы доску ты ни закрыл первой (grantBonusXP идемпотентен по ключу).
    if (app?.grantBonusXP && typeof bosTodayKey === "function") app.grantBonusXP("perfectday:" + bosTodayKey(), 30);
  }, [_myDoneCount, teamHabits.length]);
  // ── ЦЕЛЬ С ТАБАМИ (макет «Цель с табами», David) ──────────────────────────────
  // Одна страница, три состояния: Обзор · Привычки · Чат. Шапка (кольцо-заряд + имя +
  // строка «прогресс · огонь · люди») постоянна; тумблер живёт в блоке содержимого.
  const [tab, setTab] = React.useState("habits"); // David: открываем сразу на «Привычки»
  const chatMode = tab === "chat";
  const unread = (_chatLive && chatPeek && chatPeek.unread) ? chatPeek.unread : 0;
  const pct = Math.round(gp * 100);
  // «огонь» = доля круга, что уже отметилась сегодня (живая, из потока), а не выдуманный %.
  const firePct = (members.length && !_rosterLoading) ? Math.round((inFlowToday / members.length) * 100) : null;
  const headParts = [pct + "%"]
    .concat(firePct != null ? ["огонь " + firePct + "%"] : [])
    .concat(!_rosterLoading ? [members.length + " " + _peopleWord(members.length)] : []);
  const ringCirc = 2 * Math.PI * 26;
  const ringColor = teamColor || "#EF9F14"; // золото-оранж (палитра chrome: бел/чёрн/золото)
  // Круглые стеклянные кнопки чрома (правка/позвать) — настоящий frosted-glass, как остальной хром.
  const _glass = (typeof bosGlassChrome === "function") ? bosGlassChrome(isDark) : {};
  const navBtn = { ..._glass, width: 42, height: 42, borderRadius: 999, border: 0, display: "grid", placeItems: "center", color: isDark ? "#fff" : "#0a0a0a", cursor: "pointer", flexShrink: 0 };
  const _inTG = (typeof window !== "undefined" && window.__TG); // в Telegram есть родная «назад» — свою прячем
  const tabItem = (on) => ({ flex: 1, textAlign: "center", borderRadius: 999, padding: "9px 0", fontSize: 14, fontWeight: on ? 700 : 600, color: on ? "var(--text)" : "var(--text-4)", background: on ? (isDark ? "rgba(255,255,255,0.14)" : "#fff") : "transparent", boxShadow: on ? "0 1px 2px rgba(35,44,93,.06), 0 1px 1px rgba(0,0,0,.04)" : "none", cursor: "pointer", border: 0, fontFamily: "inherit", transition: "background .15s, color .15s" });
  const contentCard = { ...card, borderRadius: 22, padding: 16, marginTop: 12 };
  // Одна строка привычки (макет Ц2): значок + имя/подпись слева, ЧЕКБОКС-отметка СПРАВА.
  // «Вести у себя»/усыновление временно убрано (David: воскресим позже) — тут только отметка круга.
  const renderHabitRow = (h, i) => {
    const done = myDone(h);
    const adopted = adoptedFor(h);
    const markInTeam = () => (adopted ? markAdopted(h) : toggleMyTeamHabit(h));
    return (
      <div key={h.id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 2px", borderTop: i ? "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "var(--line)") : 0 }}>
        <span style={{ width: 34, height: 34, borderRadius: 12, background: h.color ? h.color + "26" : (isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)"), display: "grid", placeItems: "center", fontSize: 17, flexShrink: 0 }}>{bosIcon(h.emoji, 18, h.color)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, color: "var(--text)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}{adopted && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-4)", marginLeft: 7 }}>· у себя</span>}</div>
          <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 1 }}>
            {h.isMain && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginRight: 7 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#EF9F14", display: "inline-block" }} />Якорь</span>}
            {(h.doneToday != null && h.total != null) ? (h.doneToday + " из " + h.total + " сегодня") : "общая привычка"}
          </div>
        </div>
        {_isOwner && (
          <button onClick={() => openEditTeamHabit(h)} className="tap" data-haptic="selection" aria-label="Изменить общую привычку" style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 999, border: 0, background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)", display: "grid", placeItems: "center", color: "var(--text-3)", cursor: "pointer" }}><I.Pencil size={14} strokeWidth={2} /></button>
        )}
        {/* ЧЕКБОКС-отметка — справа (макет). Локальный круг без облака: неактивный кружок. */}
        {_rosterLive ? (
          <button onClick={markInTeam} className="tap" aria-label="Отметить сегодня"
            style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, border: 0, display: "grid", placeItems: "center", cursor: "pointer",
              background: done ? (h.color || ringInk) : (isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)"),
              boxShadow: done ? "none" : "inset 0 0 0 1.5px " + (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.16)") }}>
            {done && <I.Check size={15} strokeWidth={3} color="#fff" />}
          </button>
        ) : (
          <span aria-hidden style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)", boxShadow: "inset 0 0 0 1.5px " + (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.16)") }} />
        )}
      </div>
    );
  };

  return (
    // На вкладке «Чат» страница = полноэкранная flex-колонка (как чат ИИ): низ-композер сам
    // прилипает к клавиатуре. Bleed'им ТОЛЬКО нижние 30px дизайн-паддинга (как AIChatLive),
    // но НЕ safe-area — иначе композер уезжает под home-indicator/клавиатуру и обрезается (David).
    <div className="page-in" style={chatMode ? { padding: "0 16px", height: "calc(100% + 30px)", marginBottom: "-30px", display: "flex", flexDirection: "column", overflow: "hidden" } : { padding: "0 16px 24px" }}>
      {/* НАВИГАЦИЯ: только действия справа — правка(владелец) + позвать. «Назад» не рисуем:
          в Telegram есть родная кнопка (David); в браузере/PWA даём запасную стеклянную слева. */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, minHeight: 42, flexShrink: 0 }}>
        {_inTG
          ? <span />
          : <button onClick={() => navigate(from)} className="tap" aria-label="Назад" style={navBtn}><I.ChevronLeft size={20} strokeWidth={2.4} /></button>}
        <div style={{ display: "flex", gap: 8 }}>
          {_isOwner && <button onClick={() => openSheet(<GoalFormSheetLive mode="edit" circleOn={true} navigate={navigate} returnTo={from} goal={editGoalLike} />)} className="tap" data-haptic="selection" aria-label="Настройки цели" style={navBtn}><I.Pencil size={16} strokeWidth={2} /></button>}
          <button onClick={() => openSheet(<TeamShareSheetLive team={t} />)} className="tap" data-haptic="selection" aria-label="Позвать в круг" style={navBtn}><I.Share size={16} strokeWidth={2} /></button>
        </div>
      </div>

      {/* ШАПКА — постоянна. На «Чате» — КОМПАКТНАЯ строка (маленькое кольцо + имя), чтобы чат
          получил почти весь экран как чат ИИ и не «сжимался» при клавиатуре (David). */}
      {chatMode ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 2px 8px", flexShrink: 0 }}>
          <div style={{ position: "relative", width: 34, height: 34, flexShrink: 0 }}>
            <svg width="34" height="34" viewBox="0 0 58 58">
              <circle cx="29" cy="29" r="26" fill="none" stroke={isDark ? "rgba(255,255,255,0.12)" : "#efefef"} strokeWidth="5" />
              {gp > 0 && <circle cx="29" cy="29" r="26" fill="none" stroke={ringColor} strokeWidth="5" strokeLinecap="round" strokeDasharray={(gp * ringCirc) + " " + ringCirc} transform="rotate(-90 29 29)" />}
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 15, lineHeight: 1 }}>{bosIcon(t.emblem || "👥", 15, null)}</div>
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.3px", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
        </div>
      ) : (
        <div style={{ ...card, borderRadius: 22, padding: 18, display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <div style={{ position: "relative", width: 58, height: 58, flexShrink: 0 }}>
            <svg width="58" height="58" viewBox="0 0 58 58">
              <circle cx="29" cy="29" r="26" fill="none" stroke={isDark ? "rgba(255,255,255,0.12)" : "#efefef"} strokeWidth="4" />
              {gp > 0 && <circle cx="29" cy="29" r="26" fill="none" stroke={ringColor} strokeWidth="4" strokeLinecap="round" strokeDasharray={(gp * ringCirc) + " " + ringCirc} transform="rotate(-90 29 29)" style={{ transition: "stroke-dasharray .6s ease", ...(gDone ? { filter: "drop-shadow(0 0 5px " + ringColor + "80)" } : {}) }} />}
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 24, lineHeight: 1 }}>{bosIcon(t.emblem || "👥", 24, null)}</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.5px", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
            <div style={{ fontSize: 13, color: "var(--text-4)", marginTop: 2 }}>{headParts.join(" · ")}</div>
          </div>
        </div>
      )}

      {/* СОДЕРЖИМОЕ + ТУМБЛЕР: табы живут внутри блока (макет). На «Чате» блок тянется на всю
          оставшуюся высоту (flex:1), чтобы лента заполняла экран, а композер сел на низ.
          Bleed нижнего паддинга страницы (−30) — чтобы отыграть ещё высоты под ленту. */}
      <div style={chatMode ? { ...contentCard, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", marginTop: 0, paddingBottom: 8 } : contentCard}>
        <div style={{ display: "flex", background: isDark ? "rgba(255,255,255,0.06)" : "#efefef", borderRadius: 999, padding: 5, gap: 4, flexShrink: 0 }}>
          <button style={tabItem(tab === "overview")} onClick={() => setTab("overview")} className="tap" data-haptic="selection">Обзор</button>
          <button style={tabItem(tab === "habits")} onClick={() => setTab("habits")} className="tap" data-haptic="selection">Привычки</button>
          <button style={tabItem(tab === "chat")} onClick={() => { setTab("chat"); markChatRead(); }} className="tap" data-haptic="selection">{unread ? "Чат · " + unread : "Чат"}</button>
        </div>

        {/* ── ОБЗОР — орбита + контекст + описание. Коробка ЗАМЕТНО больше самой орбиты, чтобы
            спутники-лица помещались целиком и НЕ обрезались тумблером сверху / текстом снизу
            (David: «увеличь блок, чтобы орбиты помещались хорошо»). Без overflow-обрезки. ── */}
        {tab === "overview" && (
          <div style={{ textAlign: "center", paddingTop: 22 }}>
            {gStyle.orbits ? (
              <div style={{ width: 236, height: 236, margin: "15px auto 15px", display: "grid", placeItems: "center" }}>
                <GoalOrbitMini centerEmoji={t.emblem || "👥"} centerColor={teamColor}
                  habits={teamHabits.map((h) => ({ emoji: h.emoji, color: h.color, done: myDone(h) }))}
                  people={orbitFaces.map((f) => ({ avatar: f.avatar, name: f.name, active: f.done, progress: _pulseFor(f) }))}
                  size={200} dark={isDark} progress={gp} />
              </div>
            ) : (
              <div style={{ position: "relative", width: 150, height: 150, margin: "0 auto" }}>
                <svg width="150" height="150" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="70" cy="70" r="54" fill="none" stroke={isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.08)"} strokeWidth="13" />
                  {gp > 0 && <circle cx="70" cy="70" r="54" fill="none" stroke={ringInk} strokeWidth="13" strokeLinecap="round" strokeDasharray={2 * Math.PI * 54} strokeDashoffset={2 * Math.PI * 54 * (1 - gp)} style={{ transition: "stroke-dashoffset 0.6s ease" }} />}
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 36, lineHeight: 1 }}>{bosIcon(t.emblem || "👥", 34, null)}</div>
              </div>
            )}
            <div style={{ fontSize: 13.5, color: "var(--text-4)", marginTop: 18 }}>{modeMeta.e} {modeMeta.t} · {t.vis === "public" ? "🌐 Открытая" : "🔒 Приватная"}{circleAgeDays ? " · живёт " + circleAgeDays + "-й день" : ""}</div>
            {desc ? <div style={{ fontSize: 14.5, color: "var(--text-3)", lineHeight: 1.5, margin: "10px auto 2px", maxWidth: 300 }}>{desc}</div> : null}
          </div>
        )}

        {/* ── ПРИВЫЧКИ — список привычек круга (люди + календарь идут отдельными блоками ниже) ── */}
        {tab === "habits" && (
          <div style={{ marginTop: 6 }}>
            {[main].concat(others).filter(Boolean).map((h, i) => renderHabitRow(h, i))}
            {teamHabits.length === 0 && (
              <div style={{ padding: "14px 2px 2px", fontSize: 13, color: "var(--text-4)", lineHeight: 1.5 }}>{_isOwner ? "Пока нет общих привычек. Добавь первую — она станет якорем цели." : "Пока нет общих привычек — их добавляет создатель цели."}</div>
            )}
            {_isOwner && (
              <button className="tap" onClick={openAddHabit}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 2px", borderTop: teamHabits.length ? "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "var(--line)") : 0, background: "transparent", border: 0, color: "var(--text-2)", cursor: "pointer" }}>
                <span style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", border: "1.5px dashed " + (isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.18)") }}><I.Plus size={15} strokeWidth={2.4} color={isDark ? "#fff" : "var(--text-2)"} /></span>
                <span style={{ fontSize: 14.5, fontWeight: 600 }}>Привычка для этой цели</span>
              </button>
            )}
          </div>
        )}

        {/* ── ЧАТ — лента круга прямо тут. Держим СМОНТИРОВАННЫМ всегда (display), чтобы при
            возврате на вкладку не мигало «пусто → прогрузка» и блок не скакал (David).
            На активной вкладке — flex:1, чтобы лента заполнила экран, композер сел на низ. ── */}
        <div style={{ marginTop: 12, display: chatMode ? "flex" : "none", flexDirection: "column", flex: chatMode ? 1 : "none", minHeight: 0 }}>
          {typeof TeamChatLive === "function"
            ? <TeamChatLive embed active={chatMode} team={t}
                sysEvents={[].concat(
                  (skyT && skyT.createdAt) ? [{ kind: "created", ts: new Date(skyT.createdAt).getTime() }] : [],
                  (skyMarks || []).map((m) => ({ kind: "mark", ts: (m.ts instanceof Date ? m.ts.getTime() : new Date(m.ts).getTime()), name: m.me ? "Ты" : ("" + (m.name || "")).split(" ")[0], me: !!m.me })))} />
            : <div style={{ padding: "20px 2px", fontSize: 13, color: "var(--text-4)", textAlign: "center" }}>Чат недоступен</div>}
        </div>
      </div>

      {/* Люди + календарь — отдельный блок под табами (только на вкладке «Привычки», макет Ц2).
          Тап по лицу фильтрует календарь на человека. Живёт только у облачных кругов. */}
      {tab === "habits" && _rosterLive && (
        <BosBlock name="team-people-calendar">
          {/* Заявки на вступление — владельцу, только когда есть ожидающие (иначе экран = макет). */}
          {_isOwner && pending.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div className="section-label">Заявки на вступление ({pending.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {pending.map((p) => (
                  <div key={p.id} style={{ ...card, borderRadius: 22, padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
                    <BuddyFaceLive avatar={p.avatar} name={p.name} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{p.name || "Гость"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 1 }}>хочет вступить</div>
                    </div>
                    <button onClick={() => approveReq(p.id)} className="tap" style={{ flexShrink: 0, background: "var(--cta, #0a0a0a)", color: "var(--cta-ink, #fff)", border: 0, borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 600 }}>Принять</button>
                    <button onClick={() => rejectReq(p.id)} className="tap" aria-label="Отклонить" style={{ flexShrink: 0, background: "var(--surface-3)", color: "var(--text-3)", border: 0, borderRadius: 999, width: 34, height: 34, fontSize: 16, lineHeight: 1 }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <CirclePeopleCalendarBlockLive mainProg={mainProg} members={members} meId={meId} navigate={navigate}
            teamName={t.name} isDark={isDark} accent={ringInk} />
          {/* Позвать людей — один спокойный CTA под блоками (макет «КРУГ — идеал»). */}
          <button onClick={() => openSheet(<TeamShareSheetLive team={t} />)} className="tap" style={{ width: "100%", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", border: 0, borderRadius: 22, background: "var(--card)", boxShadow: "var(--card-shadow)", color: "var(--text-2)", cursor: "pointer", fontSize: 14.5, fontWeight: 600 }}>
            <span style={{ width: 26, height: 26, borderRadius: "50%", display: "grid", placeItems: "center", border: "1.5px dashed " + (isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.18)") }}><I.Plus size={14} strokeWidth={2.4} color={isDark ? "#fff" : "var(--text-2)"} /></span>
            Позвать людей
          </button>
        </BosBlock>
      )}

      {/* «Покинуть цель» убрана (David): выйти = зажать круг на главной и удалить у себя —
          это и есть покидание. Отдельная красная кнопка внутри не нужна. */}
    </div>
  );
}

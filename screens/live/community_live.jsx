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
  // Та же пара ушей, что у карточки на главной (BosCircleCardLive) — иначе бейдж «Вместе»
  // жил своей жизнью: не гас после прочтения (см. bos:chatunread) и не загорался в реалтайме.
  React.useEffect(() => {
    if (!(_cloud && t.cloudId)) return;
    const ck = t.cloudId;
    let me = null; try { me = window.bosCloud && window.bosCloud.uidSync && window.bosCloud.uidSync(); } catch (e) {}
    if (!me && window.bosCloud && window.bosCloud.uid) { try { window.bosCloud.uid().then((u) => { if (u) me = u; }).catch(() => {}); } catch (e) {} }
    let unsub = function () {};
    try {
      if (window.bosCloud && window.bosCloud.enabled() && window.bosCloud.subscribeMessages) {
        unsub = window.bosCloud.subscribeMessages(ck, (row) => {
          if (!row || !row.user_id || row.user_id === me || !me) return;
          setUnreadN((u) => (u || 0) + 1);
        });
      }
    } catch (e) {}
    const onClear = (ev) => { if (ev && ev.detail && ev.detail.cloudId === ck) setUnreadN(ev.detail.count || 0); };
    window.addEventListener("bos:chatunread", onClear);
    return () => { try { unsub(); } catch (e) {} window.removeEventListener("bos:chatunread", onClear); };
  }, [t.cloudId]);
  /* СТОЛБЦЫ АКТИВНОСТИ КРУГА (David 2026-08-01: «на маленьких карточках кругов и целей тоже
     должны быть столбцы активности»). Две недели: сколько РАЗНЫХ людей закрыли привычки круга
     в каждый день, делённое на размер круга. Один запрос на карточку, ответ живёт 10 минут в
     общем кэше — список кругов не начинает молотить сеть. */
  const [actDays, setActDays] = React.useState(function () {
    var c = (typeof _bosTeamGet === "function" && t.cloudId) ? _bosTeamGet("act14:" + t.cloudId) : null;
    return Array.isArray(c) ? c : null;
  });
  React.useEffect(() => {
    if (!_cloud || !window.bosCloud.teamLogsRange) return;
    var c = (typeof _bosTeamGet === "function") ? _bosTeamGet("act14:" + t.cloudId) : null;
    if (Array.isArray(c)) { setActDays(c); return; }
    let on = true;
    window.bosCloud.teamLogsRange(t.cloudId, 14).then((d) => {
      if (!on || !d || !Array.isArray(d.rows)) return;
      var byDay = {};
      d.rows.forEach((r) => { if (!r || !r.day) return; (byDay[r.day] = byDay[r.day] || {})[r.u] = 1; });
      var out = [], base = new Date(); base.setHours(0, 0, 0, 0);
      var den = Math.max(1, (roster && roster.length) || (t.members && t.members.length) || 1), any = false;
      for (var i = 13; i >= 0; i--) {
        var dt = new Date(base); dt.setDate(base.getDate() - i);
        var k = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
        var n = byDay[k] ? Object.keys(byDay[k]).length : 0;
        if (n) any = true;
        out.push(Math.min(1, n / den));
      }
      var res = any ? out : [];
      if (typeof _bosTeamPut === "function") _bosTeamPut("act14:" + t.cloudId, res);
      setActDays(res);
    }).catch(() => {});
    return () => { on = false; };
  }, [t.cloudId, _cloud, roster && roster.length]);
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
      <div aria-hidden className="team-card__emblem" style={{ position: "absolute", top: -10, right: -6, fontSize: 110, lineHeight: 1, pointerEvents: "none", transform: "rotate(8deg)" }}>{bosIconOf(t, 88, null)}</div>
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
        {actDays && actDays.length > 0 && typeof BosMiniBarsLive === "function" && (
          <div style={{ marginTop: 14 }}><BosMiniBarsLive vals={actDays} h={22} isDark={false} /></div>
        )}
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
function CommSectionHeadLive({ title, desc, note, onAll }) {
  // РЕДИЗАЙН Figma: секция подписывается не микро-лейблом капсом, а нормальным
  // заголовком 20/700 (в макете Header 48 = заголовок 28 + поля 10/10; с описанием — 70).
  // Хвост справа — не всегда «Все»: в макете там счёт («12 групп») со стрелкой.
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, padding: "10px 4px 8px" }}>
      <span onClick={onAll || undefined} className={onAll ? "tap" : undefined}
        style={{ minWidth: 0, cursor: onAll ? "pointer" : "default" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px", color: "var(--text)" }}>
          {title}{onAll && <I.ChevronRight size={17} color="var(--text-3)" />}
        </span>
        {desc && <span style={{ display: "block", fontSize: 15, color: "var(--text-2)", marginTop: 1 }}>{desc}</span>}
      </span>
      {note && (
        <span style={{ fontSize: 15, color: "var(--text-2)", padding: "3px 0 0", flexShrink: 0, whiteSpace: "nowrap" }}>{note}</span>
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
var BOS_DISC_GATES = { showcase: 3, people: 1, map: 3 };   // «Люди» открыты всем (v868)
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
    { lvl: 10, t: "Поручиться за место", d: "твой голос публикует партнёров", lock: true, big: true },
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
      <div style={_dSText}>Внутри — <b style={{ color: "var(--text)" }}>вклад людей друг в друга</b>: каждый называет одну-две вещи, которые готов сделать для другого, и берёт за это XP. Доверие тут набирается состоявшимися делами и живыми впечатлениями, а не уровнем.</div>
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
      {onDismiss && <_DiscX onClick={onDismiss} color={isDark ? "var(--text-4)" : "#b3b3b3"} />}
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
var BOS_LEVEL_UNLOCKS = { 3: "Первая публикация · Разбор привычек", 5: "Карточка «Люди» в ленте", 10: "Голос за партнёров" };

// обложка «Суть» → шторка «Суть». Макет «Guide Cards V1 Refined» (David 2026-07-14): тёмная
// карточка со сдержанной золотой дугой-«горизонтом» сверху и живой золотой кнопкой «начать →».
// Крестик ЕСТЬ (David 2026-07-17: «на всех карточках-гайдах должен быть крестик»).
function DiscoveryCoverCard({ onOpen, onDismiss }) {
  var GOLD = BOS_GOLD;
  return (
    <button onClick={onOpen} className="tap" style={{ position: "relative", flexShrink: 0, scrollSnapAlign: "start", width: 152, height: 180, borderRadius: 22, border: 0, padding: "14px 13px 13px", display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", cursor: "pointer", overflow: "hidden", color: "#fff", fontFamily: "inherit", background: "linear-gradient(180deg,#161619 0%,#0a0a0c 100%)" }}>
      {onDismiss && (
        <span role="button" aria-label="Скрыть" onClick={onDismiss} className="tap" style={{ position: "absolute", top: 2, right: 2, width: 40, height: 40, display: "grid", placeItems: "center", cursor: "pointer", zIndex: 3 }}>
          <span style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.14)", display: "grid", placeItems: "center" }}><svg width="10" height="10" viewBox="0 0 11 11"><path d="M2 2l7 7M9 2l-7 7" stroke="rgba(255,255,255,0.75)" strokeWidth="1.8" strokeLinecap="round" /></svg></span>
        </span>
      )}
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
    // «Партнёры» — тоже закрываемая (David 2026-07-17: «на всех карточках должен быть крестик»);
    // прежний pin снят.
    { key: "partners", id: "partners", iconKey: "partners", title: "Партнёры", desc: "Впечатления за твой опыт", show: true },
    // «Люди» до 10 уровня — закрытый круг: чёрная плашка + золотой замок (макет).
    // Замка больше нет: вклад описывает кто угодно, а доверие набирается делами,
    // а не уровнем. Раньше карточка обещала «с 10 уровня», а вкладка при этом
    // открывалась — человек минуту решал, баг это или он тут нелегально.
    { key: "people", id: "people", iconKey: "people", title: "Люди", desc: "Чем ты полезен окружению", show: true, locked: false },
  ];
  // Механики, реально попадающие в ряд (кап ≤6) — нумеруем позиционно 01…06, прогресс «N из M».
  const mech = deckDefs.filter((c) => c.show && !dismissed[c.key]).slice(0, 6);
  const total = mech.length;
  const openCount = mech.filter((c) => !!seen[c.id]).length;

  const mechCards = mech.map((c, i) => (
    <_DiscCard key={c.key} num={c.locked ? (("0" + (i + 1)).slice(-2) + " · С 10 УРОВНЯ") : ("0" + (i + 1)).slice(-2)}
      iconKey={c.iconKey} title={c.title} desc={c.desc} isDark={isDark} open={!!seen[c.id]} locked={c.locked}
      onOpen={() => openDisc(c.id)} onDismiss={(ev) => doDismiss(ev, c.key)} />
  ));

  // Ряд по макету: обложка «Суть» → (празднование уровня, если есть) → карточки механик.
  // Обложка «Как устроен Balance» открывает НАСТОЯЩИЙ гид (GuideLive), а не мини-шторку «core»
  // (David 2026-07-14: «пусть всплывает наш гайд, а не заглушка»). Гид ушёл из настроек — тут его дом.
  // Обложка тоже закрываемая (David 2026-07-17); сам гид всегда доступен из «Я».
  const rail = [];
  if (!dismissed["cover"]) rail.push(<DiscoveryCoverCard key="cover"
    onOpen={() => { bosDiscMark("bos:discoverySeen", "core"); if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } navigate("guide", { from: "community" }); }}
    onDismiss={(ev) => doDismiss(ev, "cover")} />);
  if (showLevelUp) rail.push(<DiscoveryLevelUpCard key={"lvl" + userLevel} level={userLevel} unlock={BOS_LEVEL_UNLOCKS[userLevel]} onOpen={() => { ackLevel(); openDisc("xp"); }} onDismiss={(ev) => { ev.stopPropagation(); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } ackLevel(); }} />);
  mechCards.forEach((n) => rail.push(n));

  // Всё закрыто крестиками → секция «Открой Balance» пропадает ЦЕЛИКОМ (David 2026-07-17).
  if (!rail.length) return null;

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
          <span style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#FEDE34,#EF9F14)", display: "grid", placeItems: "center", fontSize: 21, flexShrink: 0, boxShadow: "0 4px 12px rgba(239,159,20,0.28)" }}>{bosIconOf(cand, 21, "#0a0a0a", "🌙")}</span>
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
      {/* КОМПАКТ-СЕТКА (David 2026-07-16: «в Сообществе все круги — компактной карточкой с волной»). */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
        {teams.map(function (t) {
          return <BosCircleCardCompactLive key={t._id || t.cloudId} t={t} joined
            onOpen={function () { navigate("team-detail", { team: t, from: "community" }); }} />;
        })}
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

/* ════════════════════════════════════════════════════════════════════════════
   «ЛЮДИ» · ТВОЙ ВКЛАД В ОКРУЖЕНИЕ (v868, бриф David 2026-08-02)

   Экран отвечает на один вопрос: «чем ты можешь быть полезен окружению — и кто
   может быть полезен тебе». Три блока и всё:
     1. Твой вклад     — одна-две вещи, которые ты готов сделать для другого.
     2. Дела           — заказы: к тебе и от тебя. Нет дел — нет блока.
     3. Кто рядом      — люди, которые описали свой вклад.

   Что УБРАНО и почему: лесенка «Твой путь помощника» (5 ступеней до первого
   дела), верстак навыков и подтверждения роли кругом. David: «утверждает не
   круг, утверждают другие люди — те, кто за XP заказал твою пользу».
   Подтверждение здесь ровно одно — состоявшееся дело плюс ВПЕЧАТЛЕНИЕ (живая
   фраза, не отзыв и не звёзды).

   Палитра: чернила рисуют всё, кроме цены. Золото = валюта, поэтому золотое
   только число XP — и текстом, а не заливкой, чтобы не превратиться в пятно.
   Данных нет → блока нет; выдуманных людей на экране не бывает.
   Сервер: supabase/patch_people_contribution.sql. ════════════════════════ */

function bosXPGoldLive(isDark) { return isDark ? "#E9BD32" : "#A87C0A"; }
function bosDoneWordLive(n) { var a = n % 10, b = n % 100; return (a >= 2 && a <= 4 && (b < 12 || b > 14)) ? "раза" : "раз"; }
function bosWaitWordLive(n) { var a = n % 10, b = n % 100; return (a === 1 && b !== 11) ? "ждёт" : "ждут"; }
function bosPeopleWordLive(n) { var a = n % 10, b = n % 100; return (a === 1 && b !== 11) ? "человек" : ((a >= 2 && a <= 4 && (b < 12 || b > 14)) ? "человека" : "человек"); }
function bosImprWordLive(n) { var a = n % 10, b = n % 100; return (a === 1 && b !== 11) ? "впечатление" : ((a >= 2 && a <= 4 && (b < 12 || b > 14)) ? "впечатления" : "впечатлений"); }
function bosAgoLive(iso) {
  if (!iso) return "";
  var d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (!(d >= 0)) return "";
  if (d === 0) return "сегодня";
  if (d === 1) return "вчера";
  if (d < 7) return d + " дн. назад";
  if (d < 31) { var w = Math.floor(d / 7); return w + " нед. назад"; }
  var m = Math.floor(d / 30); return m + " мес. назад";
}
// Цена вклада: золотое ЧИСЛО, чернильная единица. Ноль — не «0 XP», а «даром».
function BosPriceLive({ xp, isDark, size }) {
  size = size || 14;
  if (!(xp > 0)) return <span style={{ fontSize: size - 1.5, fontWeight: 700, color: "var(--text-4)" }}>даром</span>;
  return <span style={{ whiteSpace: "nowrap" }}>
    <span style={{ fontSize: size, fontWeight: 800, color: bosXPGoldLive(isDark), letterSpacing: "-0.2px" }}>{xp}</span>
    <span style={{ fontSize: size - 3, fontWeight: 700, color: "var(--text-4)", marginLeft: 3 }}>XP</span>
  </span>;
}
// Строка вклада — общая для списка людей, профиля человека и своей карточки.
// Одна строка внимания: что человек сделает + за сколько + сколько раз этим уже воспользовались.
// Полное название вклада всегда несёт навык в хвосте («…по «Продуктовый дизайн»»,
// «… · Тексты и редактура»). В компактной строке это лишнее: навык и так стоит во
// второй строке, а хвост разгонял заголовок на три строки с обрубленной кавычкой.
// Убираем хвост — остаётся действие: «Разобрать задачу», «Сделать первый шаг».
function bosContribShortTitle(offer) {
  var t = bosHelpOfferTitleText(offer);
  var skill = bosNetSkillForOffer(offer).title;
  t = t.replace(/\s+(?:по|в)\s+«[^»]*»\s*$/, "");
  if (skill) t = t.replace(new RegExp("\\s*·\\s*" + skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*$"), "");
  return t.trim() || bosHelpOfferTitleText(offer);
}
function ContributionRowLive({ offer, isDark, action, muted }) {
  var done = offer.done_count | 0, skill = bosNetSkillForOffer(offer);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 12px", borderRadius: 17, background: "var(--surface-3)", opacity: muted ? 0.55 : 1 }}>
      <span style={{ width: 36, height: 36, borderRadius: 12, background: "var(--card)", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <BosHelpOfferIconLive offer={offer} size={17} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)", lineHeight: 1.28, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{bosContribShortTitle(offer)}</div>
        {/* В компактной строке «онлайн/рядом» не пишем — это важно на самой карточке
            человека, а в списке съедает строку и заставляет обрезать всё остальное. */}
        <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 3, lineHeight: 1.35 }}>
          {skill.title} · {offer.when_text || "30 мин"}{done > 0 ? " · " + done + " " + bosDoneWordLive(done) : ""}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 7, flexShrink: 0 }}>
        <BosPriceLive xp={offer.price_xp | 0} isDark={isDark} />
        {action || null}
      </div>
    </div>
  );
}

/* ── 1. ТВОЙ ВКЛАД ─────────────────────────────────────────────────────────
   Пусто → один вопрос и одна кнопка. Есть → карточки с честными счётчиками.
   Больше двух не даём: «для начала 1–2 вещи», а не список всего, что пробовал. */
function MyContributionLive({ app, isDark, rows, onChanged }) {
  var s = (typeof useSheet === "function") ? useSheet() : { open: function () {} };
  var list = rows || [];
  var edit = function (offer) { s.open(<ContributionSheetLive app={app} offer={offer || null} isDark={isDark} onDone={onChanged} />); };
  if (!list.length) {
    return (
      <div style={{ background: "var(--card)", borderRadius: 22, padding: "18px 16px", boxShadow: "var(--card-shadow)" }}>
        <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.4px", color: "var(--text)", lineHeight: 1.22 }}>Чем ты можешь быть полезен окружению?</div>
        <div style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.5, marginTop: 7 }}>
          Назови одну вещь, которую готов сделать для другого человека на этой неделе.
        </div>
        {/* Главный факт — сразу, а не петитом в конце формы: XP тут не зарабатывают.
            Раньше «люди закажут её за XP» читалось как «тебе заплатят», и правда
            всплывала только на четвёртом экране. */}
        <div style={{ marginTop: 11, borderRadius: 15, background: "var(--surface-3)", padding: "11px 12px", fontSize: 12, color: "var(--text-3)", lineHeight: 1.48 }}>
          XP здесь не зарабатывают: плата заказчика сгорает, помощь остаётся даром. Тебе достаётся другое — <b style={{ color: "var(--text-2)" }}>состоявшиеся дела и живые впечатления людей</b> в твоей карточке. Из них и складывается доверие.
        </div>
        {/* Кнопка живая даже когда сервер не готов: увидеть, из чего состоит вклад,
            полезно и до сохранения, а отказ приходит честной строкой в шторке. */}
        <button onClick={function () { edit(null); }} className="tap hit44"
          style={{ width: "100%", minHeight: 48, marginTop: 14, border: 0, borderRadius: 16, background: "var(--cta, #0a0a0a)", color: "var(--cta-ink, #fff)", fontSize: 14.5, fontWeight: 750, cursor: "pointer" }}>
          Добавить вклад
        </button>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {list.map(function (c) {
        var done = c.done_count | 0, people = c.people_count | 0, impr = c.impressions_count | 0, waiting = c.waiting_count | 0;
        return (
          <div key={c.id} style={{ background: "var(--card)", borderRadius: 22, padding: 15, boxShadow: "var(--card-shadow)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
              <span style={{ width: 40, height: 40, borderRadius: 13, background: "var(--surface-3)", display: "grid", placeItems: "center", flexShrink: 0 }}><BosHelpOfferIconLive offer={c} size={19} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 750, color: "var(--text)", lineHeight: 1.24 }}>{bosContribShortTitle(c)}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 3, lineHeight: 1.4 }}>{bosNetSkillForOffer(c).title} · {bosNetWhenText(c)} · {bosNetSlotsText(c.slots_week)}</div>
              </div>
              <div style={{ flexShrink: 0, paddingTop: 2 }}><BosPriceLive xp={c.price_xp | 0} isDark={isDark} size={15} /></div>
            </div>
            {/* Счётчики появляются, только когда за ними есть дела. Нулей не рисуем. */}
            {(done || impr || waiting) ? (
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 12, paddingTop: 11, borderTop: "1px solid var(--line)", fontSize: 12, color: "var(--text-3)" }}>
                {done ? <span><b style={{ color: "var(--text)", fontWeight: 750 }}>{done}</b> {bosDoneWordLive(done)} воспользовались · {people} {bosPeopleWordLive(people)}</span> : null}
                {impr ? <span><b style={{ color: "var(--text)", fontWeight: 750 }}>{impr}</b> {bosImprWordLive(impr)}</span> : null}
                {waiting ? <span style={{ fontWeight: 700, color: "var(--text)" }}>{waiting} {bosWaitWordLive(waiting)} ответа</span> : null}
              </div>
            ) : null}
            <button onClick={function () { edit(c); }} className="tap hit44"
              style={{ width: "100%", minHeight: 42, marginTop: 12, border: 0, borderRadius: 14, background: "var(--surface-3)", color: "var(--text-2)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Изменить</button>
          </div>
        );
      })}
      {list.length < 2 ? (
        <button onClick={function () { edit(null); }} className="tap hit44"
          style={{ width: "100%", minHeight: 46, border: "1px dashed var(--line)", borderRadius: 18, background: "transparent", color: "var(--text-3)", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
          Добавить второй вклад
        </button>
      ) : (
        <div style={{ fontSize: 11.5, color: "var(--text-4)", textAlign: "center", padding: "2px 12px", lineHeight: 1.42 }}>Два вклада — потолок. Лучше довести эти до состоявшихся дел, чем перечислять всё, что пробовал.</div>
      )}
    </div>
  );
}

/* Шторка вклада: навык → что человек получит → границы → цена. Один экран,
   один «Сохранить». Заголовок карточки собирает сервер из словарей — вписать
   произвольное обещание нельзя. */
function ContributionSheetLive({ app, offer, isDark, onDone }) {
  var s = (typeof useSheet === "function") ? useSheet() : { close: function () {} };
  var _sk = React.useState((offer && offer.skill_key) || null), skillKey = _sk[0], setSkillKey = _sk[1];
  var _q = React.useState(""), q = _q[0], setQ = _q[1];
  var _it = React.useState((offer && offer.interaction_key) || "question"), itKey = _it[0], setItKey = _it[1];
  var _out = React.useState((offer && offer.outcome_key) || "clear_next_step"), outcome = _out[0], setOutcome = _out[1];
  var initMin = offer && parseInt(offer.when_text, 10); if ([30, 45, 60].indexOf(initMin) < 0) initMin = 30;
  var _m = React.useState(initMin), mins = _m[0], setMins = _m[1];
  var _md = React.useState((offer && offer.mode) || "online"), mode = _md[0], setMode = _md[1];
  var _sl = React.useState((offer && offer.slots_week) || 1), slots = _sl[0], setSlots = _sl[1];
  var _p = React.useState(offer ? (offer.price_xp | 0) : 100), price = _p[0], setPrice = _p[1];
  var _b = React.useState(false), busy = _b[0], setBusy = _b[1];
  var _e = React.useState(""), error = _e[0], setError = _e[1];

  var outcomes = [
    { key: "clear_next_step", title: "Понятный следующий шаг", descr: "Человек уйдёт с одним конкретным действием." },
    { key: "three_recommendations", title: "Разбор и три совета", descr: "Короткая обратная связь без обещания результата." },
    { key: "working_first_result", title: "Первый результат вместе", descr: "Во встрече появится рабочий черновик или практика." }
  ];
  var skillDef = skillKey ? bosSkillDef(skillKey) : null;
  var it = bosNetInteraction(itKey);
  var preview = !skillDef ? "" : outcome === "three_recommendations" ? ("Разобрать задачу по «" + skillDef.title + "»")
    : outcome === "working_first_result" ? ("Сделать первый шаг в «" + skillDef.title + "»")
    : (it.outcome + " · " + skillDef.title);
  var shownSkills = BOS_SKILL_CATALOG.filter(function (x) { return !q.trim() || (x.title + " " + x.groupTitle).toLowerCase().indexOf(q.trim().toLowerCase()) >= 0; });
  var chip = function (on) { return { minHeight: 42, border: on ? "1px solid var(--text)" : "1px solid transparent", borderRadius: 13, background: on ? "var(--surface-3)" : "var(--card)", color: "var(--text)", boxShadow: on ? "none" : "var(--card-shadow)", fontSize: 12.5, fontWeight: on ? 780 : 650, padding: "8px 9px", cursor: "pointer" }; };

  var save = async function () {
    if (busy || !skillKey) return;
    setBusy(true); setError("");
    var C = window.bosCloud, r = null;
    try { if (C && C.netSetContribution) r = await C.netSetContribution({ id: offer && offer.id, skill_key: skillKey, interaction_key: itKey, outcome_key: outcome, mode: mode, duration: mins, slots_week: slots, price_xp: price }); } catch (e) {}
    setBusy(false);
    if (r && r.ok) { if (onDone) onDone(); s.close(); return; }
    var err = (r && r.err) || "server";
    // Отдельная строка на каждую причину: «попробуй ещё раз» на неисправимую ошибку —
    // это бесконечный круг, человек жмёт и жмёт, а сохраниться не может никогда.
    setError(err === "limit_two" ? "Уже есть два вклада. Измени один из них или поставь на паузу."
      : /semantics_have_episodes/.test(err) ? "По этому вкладу уже были дела — менять его смысл нельзя. Цену, время и число мест поменять можно; для другого формата поставь этот на паузу и опиши новый."
      : /contribution_limit_two/.test(err) ? "Уже есть два вклада. Измени один из них или поставь на паузу."
      : err === "unavailable" ? "Раздел ещё готовится — сохранить пока не выйдет."
      : err === "auth" ? "Нужен вход, чтобы вклад увидели другие."
      : "Не удалось сохранить вклад. Попробуй ещё раз.");
  };
  var drop = async function () {
    if (busy || !offer) return;
    setBusy(true); setError("");
    var C = window.bosCloud, r = null;
    try { if (C && C.netDropContribution) r = await C.netDropContribution(offer.id); } catch (e) {}
    setBusy(false);
    if (r && r.ok) { if (onDone) onDone(); s.close(); } else setError("Не удалось поставить на паузу.");
  };

  return <div className="bos-sheet-scroll" style={{ padding: "2px 16px 18px", color: "var(--text)" }}>
    {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
    <div style={_dSTitle}>{offer ? "Изменить вклад" : "Твой вклад в окружение"}</div>
    <div style={_dSSub}>что ты готов сделать для другого человека</div>

    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase", color: "var(--text-4)", margin: "12px 2px 8px" }}>В чём ты силён</div>
    {skillDef ? (
      <button onClick={function () { setSkillKey(null); }} className="tap hit44" style={{ width: "100%", minHeight: 52, border: 0, borderRadius: 16, background: "var(--card)", boxShadow: "var(--card-shadow)", color: "var(--text)", display: "flex", alignItems: "center", gap: 11, padding: "10px 13px", textAlign: "left", cursor: "pointer" }}>
        <span style={{ width: 34, height: 34, borderRadius: 11, background: "var(--surface-3)", display: "grid", placeItems: "center" }}>{(function () { var X = I[skillDef.icon] || I.Bulb; return <X size={17} />; })()}</span>
        <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontSize: 14, fontWeight: 750 }}>{skillDef.title}</span><span style={{ display: "block", fontSize: 11, color: "var(--text-4)", marginTop: 2 }}>{skillDef.groupTitle} · нажми, чтобы выбрать другое</span></span>
      </button>
    ) : (
      <React.Fragment>
        <div style={{ position: "relative" }}><I.Search size={16} color="var(--text-4)" style={{ position: "absolute", left: 13, top: 13 }} />
          <input value={q} onChange={function (e) { setQ(e.target.value); }} placeholder="Найти: йога, тексты, аналитика…" style={{ width: "100%", height: 43, border: "1px solid var(--line)", borderRadius: 14, background: "var(--card)", color: "var(--text)", padding: "0 12px 0 38px", boxSizing: "border-box", outline: "none", fontFamily: "inherit", fontSize: 13.5 }} /></div>
        <div style={{ marginTop: 9, background: "var(--card)", borderRadius: 18, boxShadow: "var(--card-shadow)", overflow: "hidden" }}>
          {shownSkills.map(function (x, i) { var X = I[x.icon] || I.Bulb; return (
            <button key={x.key} onClick={function () { setSkillKey(x.key); }} className="tap hit44" style={{ width: "100%", minHeight: 50, border: 0, borderTop: i ? "1px solid var(--line)" : 0, background: "transparent", color: "var(--text)", display: "flex", alignItems: "center", gap: 11, padding: "9px 12px", textAlign: "left", cursor: "pointer" }}>
              <span style={{ width: 30, height: 30, borderRadius: 10, background: "var(--surface-3)", display: "grid", placeItems: "center" }}><X size={15} /></span>
              <span style={{ flex: 1 }}><span style={{ display: "block", fontSize: 13.5, fontWeight: 700 }}>{x.title}</span><span style={{ display: "block", fontSize: 10.5, color: "var(--text-4)", marginTop: 1 }}>{x.groupTitle}</span></span>
              <I.ChevronRight size={15} color="var(--text-4)" />
            </button>); })}
          {!shownSkills.length ? <div style={{ padding: "16px 14px", fontSize: 12.5, color: "var(--text-4)" }}>Такого пока нет в каталоге. Каталог расширяется через модерацию — вписать своё от руки нельзя, иначе карточки превратятся в объявления.</div> : null}
        </div>
      </React.Fragment>
    )}

    {skillDef ? <React.Fragment>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase", color: "var(--text-4)", margin: "18px 2px 8px" }}>Что человек получит</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {outcomes.map(function (x) { var on = outcome === x.key; return (
          <button key={x.key} onClick={function () { setOutcome(x.key); }} className="tap hit44" style={{ minHeight: 52, border: on ? "1px solid var(--text)" : "1px solid transparent", borderRadius: 15, background: on ? "var(--surface-3)" : "var(--card)", color: "var(--text)", boxShadow: on ? "none" : "var(--card-shadow)", padding: "10px 12px", textAlign: "left", cursor: "pointer" }}>
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 750 }}>{x.title}</span>
            <span style={{ display: "block", fontSize: 11, color: "var(--text-4)", marginTop: 3 }}>{x.descr}</span>
          </button>); })}
      </div>

      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase", color: "var(--text-4)", margin: "18px 2px 8px" }}>Как это происходит</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
        {BOS_NET_INTERACTIONS.map(function (x) { return <button key={x.key} onClick={function () { setItKey(x.key); }} className="tap hit44" style={chip(itKey === x.key)}>{x.title}</button>; })}
      </div>

      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase", color: "var(--text-4)", margin: "18px 2px 8px" }}>Границы</div>
      <div style={{ background: "var(--card)", borderRadius: 18, boxShadow: "var(--card-shadow)", padding: 12 }}>
        <div style={{ fontSize: 10.5, color: "var(--text-4)", fontWeight: 700, marginBottom: 6 }}>Сколько времени</div>
        <div style={{ display: "flex", gap: 6 }}>{[30, 45, 60].map(function (x) { return <button key={x} onClick={function () { setMins(x); }} className="tap hit44" style={Object.assign({ flex: 1 }, chip(mins === x))}>{x} мин</button>; })}</div>
        <div style={{ fontSize: 10.5, color: "var(--text-4)", fontWeight: 700, margin: "12px 0 6px" }}>Где</div>
        <div style={{ display: "flex", gap: 6 }}>{[["online", "Онлайн"], ["nearby", "Рядом"]].map(function (x) { return <button key={x[0]} onClick={function () { setMode(x[0]); }} className="tap hit44" style={Object.assign({ flex: 1 }, chip(mode === x[0]))}>{x[1]}</button>; })}</div>
        <div style={{ fontSize: 10.5, color: "var(--text-4)", fontWeight: 700, margin: "12px 0 6px" }}>Сколько раз в неделю ты готов это делать</div>
        <div style={{ display: "flex", gap: 6 }}>{[1, 2, 3, 4, 5].map(function (x) { return <button key={x} onClick={function () { setSlots(x); }} className="tap hit44" style={Object.assign({ flex: 1 }, chip(slots === x))}>{x}</button>; })}</div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase", color: "var(--text-4)", margin: "18px 2px 8px" }}>Сколько это стоит в XP</div>
      <div style={{ background: "var(--card)", borderRadius: 18, boxShadow: "var(--card-shadow)", padding: "14px 13px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={function () { setPrice(Math.max(0, price - 10)); }} aria-label="Меньше" className="tap hit44" style={{ width: 44, height: 44, border: 0, borderRadius: 14, background: "var(--surface-3)", color: "var(--text)", fontSize: 20, fontWeight: 700, cursor: "pointer" }}>−</button>
          <div style={{ flex: 1, textAlign: "center" }}><BosPriceLive xp={price} isDark={isDark} size={26} /></div>
          <button onClick={function () { setPrice(Math.min(1000, price + 10)); }} aria-label="Больше" className="tap hit44" style={{ width: 44, height: 44, border: 0, borderRadius: 14, background: "var(--surface-3)", color: "var(--text)", fontSize: 20, fontWeight: 700, cursor: "pointer" }}>+</button>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--text-4)", lineHeight: 1.45, marginTop: 11 }}>Цена — фильтр внимания, а не заработок: она отсекает случайные просьбы. XP спишутся у заказчика после состоявшегося дела и сгорят — тебе не начислятся. За полчаса обычно ставят 100–200.</div>
      </div>

      {preview ? (
        <div style={{ marginTop: 14, borderRadius: 18, background: "var(--surface-3)", padding: 13 }}>
          <div style={{ fontSize: 10.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 0.7, fontWeight: 800 }}>Так это увидят люди</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 9 }}>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14.5, fontWeight: 750, lineHeight: 1.25 }}>{preview}</div>
              {/* Формат встречи пишем ЯВНО: заголовок его не всегда вбирает, и без этой
                  строки восемь плиток «Как это происходит» выглядели ни на что не влияющими. */}
              <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 3 }}>{it.title.toLowerCase()} · {skillDef.title} · {mins} мин · {mode === "online" ? "онлайн" : "рядом"}</div></div>
            <BosPriceLive xp={price} isDark={isDark} />
          </div>
        </div>
      ) : null}

      {error ? <div role="alert" style={{ marginTop: 12, borderRadius: 13, background: "rgba(255,59,48,0.09)", color: "#C8443A", padding: 11, fontSize: 12, lineHeight: 1.4 }}>{error}</div> : null}
      <button onClick={save} disabled={busy} className="tap hit44" style={{ width: "100%", minHeight: 50, marginTop: 14, border: 0, borderRadius: 16, background: "var(--cta, #0a0a0a)", color: "var(--cta-ink, #fff)", fontSize: 15, fontWeight: 780, cursor: "pointer" }}>{busy ? "Сохраняем…" : (offer ? "Сохранить" : "Показать людям")}</button>
      {/* Что именно станет видно — до нажатия, а не после. Модерации тут нет, вклад
          появляется сразу, и человек должен это знать заранее. */}
      <div style={{ fontSize: 11, color: "var(--text-4)", lineHeight: 1.45, margin: "10px 4px 0", textAlign: "center" }}>
        Сразу увидят все, кто откроет «Люди»: имя, уровень и эту карточку. Телеграм откроется только тому, чей заказ ты примешь. Убрать можно в любой момент.
      </div>
      {offer ? <button onClick={drop} disabled={busy} className="tap hit44" style={{ width: "100%", minHeight: 44, marginTop: 10, border: 0, borderRadius: 14, background: "transparent", color: "var(--text-4)", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Поставить вклад на паузу</button> : null}
    </React.Fragment> : null}
  </div>;
}

/* ── 2. ДЕЛА ───────────────────────────────────────────────────────────────
   Одна лента вместо двух вкладок «ко мне / от меня»: у дела всегда есть ровно
   один следующий шаг, и он подписан ролью. Заказчик закрывает дело и сразу
   оставляет впечатление — это же и есть подтверждение. */
function PeopleDealsLive({ app, isDark, deals, impressions, onChanged }) {
  var sheet = (typeof useSheet === "function") ? useSheet() : { open: function () {} };
  var _busy = React.useState(null), busyId = _busy[0], setBusy = _busy[1];
  var _err = React.useState(""), err = _err[0], setErr = _err[1];
  var list = deals || [];
  if (!list.length) return null;
  var act = async function (row, action) {
    if (busyId) return; setBusy(row.id); setErr("");
    var C = window.bosCloud, fn = action === "accept" ? C.netAcceptSkillEpisode : action === "decline" ? C.netDeclineSkillEpisode
      : action === "cancel" ? C.netCancelSkillEpisode : action === "provider_done" ? C.netMarkSkillProviderDone : C.netMarkSkillRecipientDone;
    var earned = (typeof bosLiveXPLive === "function") ? bosLiveXPLive(app) : null;
    var r = null; try { if (fn) r = (action === "recipient_done") ? await fn(row.id, earned) : await fn(row.id); } catch (e) {}
    setBusy(null);
    if (r && r.ok) {
      // XP списывает сервер ровно один раз — двигаем локальную копилку на ту же величину.
      if ((r.charged_xp | 0) > 0 && app && typeof app.noteSpentXP === "function") app.noteSpentXP(r.charged_xp | 0);
      if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
      // Дело закрыто с обеих сторон — сразу предлагаем оставить впечатление.
      if (action === "recipient_done" && r.lifecycle === "done") sheet.open(<ImpressionSheetLive episode={row} onDone={onChanged} />);
      else if (onChanged) onChanged();
    } else {
      if (window.tgHaptic) { try { window.tgHaptic("error"); } catch (e) {} }
      var e2 = (r && r.err) || "";
      setErr(e2 === "full" ? "Места на эту неделю закончились."
        : e2 === "wait_provider" ? "Сначала отмечает тот, кто помогал. Как только он подтвердит — подтвердишь и ты."
        : e2 === "insufficient" ? "Не хватает XP, чтобы закрыть это дело."
        : e2 === "unavailable" ? "Раздел ещё готовится — действие не прошло."
        : "Не получилось. Попробуй ещё раз.");
    }
  };
  var btn = function (label, onClick, primary, key) {
    return <button key={key} onClick={onClick} className="tap hit44" style={{ flex: primary ? 1 : "0 0 auto", minHeight: 42, border: 0, borderRadius: 13, background: primary ? "var(--cta, #0a0a0a)" : "var(--surface-3)", color: primary ? "var(--cta-ink, #fff)" : "var(--text-2)", padding: "9px 14px", fontSize: 12.5, fontWeight: 750, cursor: "pointer" }}>{label}</button>;
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {err ? <div role="alert" style={{ borderRadius: 13, background: "rgba(255,59,48,0.09)", color: "#C8443A", padding: 10, fontSize: 12 }}>{err}</div> : null}
      {list.map(function (row) {
        var o = row.network_offers || row.offer || {}, st = row.status || row.lifecycle || "requested";
        var mine = !!row._provider, p = row.other_profile;
        var iDid = mine ? !!row.provider_done_at : !!row.recipient_done_at;
        var left = mine ? !!row.recipient_done_at : !!row.provider_done_at;
        var imprKey = (row.offer_id || "") + "|" + (row.week || "");
        var impressionLeft = (impressions || []).indexOf(imprKey) >= 0;
        var ago = bosAgoLive(row.created_at);
        // Порядок закрытия жёсткий: сначала отмечает тот, кто помогал, потом заказчик —
        // и только его подтверждение списывает XP. Пока исполнитель молчит, у заказчика
        // нет кнопки, которой он мог бы заплатить за несостоявшееся.
        var line = st === "requested" ? (mine ? "Ждёт твоего ответа" : "Ждём ответа")
          : st === "accepted" ? (mine
              ? (iDid ? "Ты отметил — ждём подтверждения" : "Принято · договоритесь о времени")
              : (left ? "Помогавший отметил — подтверди, что было" : "Принято · договоритесь о времени"))
          : st === "done" ? "Состоялось" + (ago ? " · " + ago : "")
          : st === "declined" ? "Отклонено" : st === "cancelled" ? "Отменено" : st;
        var actions = [];
        if (st === "requested" && mine) { actions.push(btn("Принять", function () { act(row, "accept"); }, true, "a")); actions.push(btn("Отказать", function () { act(row, "decline"); }, false, "d")); }
        if (st === "requested" && !mine) actions.push(btn("Отменить заказ", function () { act(row, "cancel"); }, false, "c"));
        if (st === "accepted") {
          actions.push(btn("Связаться", function () { sheet.open(<NetworkEpisodeContactSheetLive episode={row} />); }, false, "k"));
          if (mine && !iDid) actions.push(btn("Я помог", function () { act(row, "provider_done"); }, true, "done"));
          if (!mine && left) actions.push(btn((row.price_xp | 0) > 0 ? ("Да, было · −" + row.price_xp + " XP") : "Да, было", function () { act(row, "recipient_done"); }, true, "done"));
          // Обе стороны могут выйти из принятого дела: иначе пропавший человек навсегда
          // занимал место в неделе, и починить это было нечем.
          actions.push(btn(mine ? "Не состоялось" : "Отменить", function () { act(row, "cancel"); }, false, "x"));
        }
        if (st === "done" && !mine && !impressionLeft) actions.push(btn("Оставить впечатление", function () { sheet.open(<ImpressionSheetLive episode={row} onDone={onChanged} />); }, true, "i"));
        return (
          <div key={row.id} style={{ background: "var(--card)", borderRadius: 20, padding: 14, boxShadow: "var(--card-shadow)", opacity: (st === "declined" || st === "cancelled") ? 0.6 : 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              {p ? <BosAvatar avatar={p.avatar || "default"} size={38} /> : <span style={{ width: 38, height: 38, borderRadius: 12, background: "var(--surface-3)", display: "grid", placeItems: "center" }}><BosHelpOfferIconLive offer={o} size={17} /></span>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--text-4)" }}>{mine ? "Тебя попросили" : "Ты заказал"}</div>
                <div style={{ fontSize: 14, fontWeight: 750, color: "var(--text)", marginTop: 2, lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{(p && p.name ? p.name + " · " : "") + bosHelpOfferTitleText(o)}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 2 }}>
                  {[o.when_text, (row.price_xp | 0) > 0 ? (row.price_xp + " XP") : "даром", st === "requested" && ago ? ago : null].filter(Boolean).join(" · ")}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2, fontWeight: 650 }}>{line}</div>
              </div>
              {/* Цену держим строкой, а не золотой пилюлей: в делах это условие сделки,
                  а не витринный ценник, и золото на экране должно оставаться редким. */}
            </div>
            {row.request_note ? <div style={{ marginTop: 10, borderRadius: 13, background: "var(--surface-3)", padding: 10, fontSize: 12, color: "var(--text-3)", lineHeight: 1.42 }}>{row.request_note}</div> : null}
            {actions.length ? <div style={{ display: "flex", gap: 7, marginTop: 11, flexWrap: "wrap" }}>{actions}</div> : null}
            {st === "done" && !mine && impressionLeft ? <div style={{ marginTop: 10, fontSize: 11.5, color: "var(--text-4)" }}>Впечатление оставлено — оно стоит в карточке этого человека.</div> : null}
            {st === "accepted" && !mine && !left ? <div style={{ marginTop: 9, fontSize: 11.5, color: "var(--text-4)", lineHeight: 1.42 }}>XP спишутся только после того, как помогавший отметит дело, а ты подтвердишь.</div> : null}
            {st === "accepted" && mine && iDid ? <div style={{ marginTop: 9, fontSize: 11.5, color: "var(--text-4)", lineHeight: 1.42 }}>Дело засчитается, когда человек подтвердит со своей стороны.</div> : null}
          </div>
        );
      })}
    </div>
  );
}

/* Впечатление — одна живая фраза о том, что изменилось. Ни звёзд, ни оценок:
   оценивать человека нечем, а рассказать о состоявшемся деле — можно. */
function ImpressionSheetLive({ episode, onDone }) {
  var s = (typeof useSheet === "function") ? useSheet() : { close: function () {} };
  var _t = React.useState(""), text = _t[0], setText = _t[1];
  var _b = React.useState(false), busy = _b[0], setBusy = _b[1];
  var _e = React.useState(""), err = _e[0], setErr = _e[1];
  var o = (episode && (episode.network_offers || episode.offer)) || {};
  var who = (episode && episode.other_profile) || null;
  var send = async function () {
    if (busy || !text.trim()) return;
    setBusy(true); setErr("");
    var C = window.bosCloud, r = null;
    try { if (C && C.netLeaveImpression) r = await C.netLeaveImpression(episode.id, text.trim()); } catch (e) {}
    setBusy(false);
    if (r && r.ok) { if (onDone) onDone(); s.close(); }
    else setErr((r && r.err) === "not_done" ? "Впечатление можно оставить только после состоявшегося дела." : "Не удалось отправить впечатление.");
  };
  return <div className="bos-sheet-scroll" style={{ padding: "2px 16px 18px", color: "var(--text)" }}>
    {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
    <div style={_dSTitle}>Впечатление</div>
    <div style={_dSSub}>что изменилось после этого дела</div>
    <div style={{ marginTop: 12, borderRadius: 18, background: "var(--card)", padding: 13, boxShadow: "var(--card-shadow)", display: "flex", alignItems: "center", gap: 11 }}>
      {who ? <BosAvatar avatar={who.avatar || "default"} size={40} /> : null}
      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 750 }}>{(who && who.name) || "Участник"}</div><div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 2 }}>{bosHelpOfferTitleText(o)}</div></div>
    </div>
    <textarea value={text} maxLength={140} onChange={function (e) { setText(e.target.value); }} autoFocus
      placeholder="Например: за полчаса разобрали, почему я застревал на первом шаге — теперь знаю, что делать в понедельник."
      style={{ width: "100%", minHeight: 104, resize: "none", marginTop: 13, border: "1px solid var(--line)", borderRadius: 16, background: "var(--card)", color: "var(--text)", padding: 13, boxSizing: "border-box", fontFamily: "inherit", fontSize: 13.5, lineHeight: 1.45, outline: "none" }} />
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, margin: "6px 2px 0", fontSize: 10.5, color: "var(--text-4)" }}><span>Без звёзд и оценок — просто как было</span><span>{text.length}/140</span></div>
    {/* Раньше «просто как было» звучало как личная записка, а текст вставал в чужой
        публичный профиль под моим именем. Говорим это ДО отправки. */}
    <div style={{ fontSize: 11, color: "var(--text-4)", lineHeight: 1.45, margin: "9px 2px 0" }}>Впечатление встанет в карточку этого человека с твоим именем и лицом — его увидят все. Переписать потом нельзя.</div>
    {err ? <div role="alert" style={{ marginTop: 11, borderRadius: 13, background: "rgba(255,59,48,0.09)", color: "#C8443A", padding: 10, fontSize: 12 }}>{err}</div> : null}
    <button onClick={send} disabled={busy || !text.trim()} className="tap hit44" style={{ width: "100%", minHeight: 49, marginTop: 13, border: 0, borderRadius: 16, background: text.trim() ? "var(--cta, #0a0a0a)" : "var(--surface-3)", color: text.trim() ? "var(--cta-ink, #fff)" : "var(--text-4)", fontSize: 14.5, fontWeight: 780, cursor: "pointer" }}>{busy ? "Отправляем…" : "Оставить впечатление"}</button>
    {/* Шторка открывается сама сразу после закрытия дела — значит из неё обязан быть
        выход без текста, иначе это не просьба, а требование. */}
    <button onClick={s.close} className="tap hit44" style={{ width: "100%", minHeight: 44, marginTop: 8, border: 0, borderRadius: 14, background: "transparent", color: "var(--text-4)", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Не сейчас</button>
  </div>;
}

/* ── 3. КАРТОЧКА ЧЕЛОВЕКА ──────────────────────────────────────────────────
   По демо (NetworkPersonCard): лицо + имя + уровень, сразу ДВА «чем готов
   помочь» с ценой, и строка «помог N раз». Никаких био-простыней и тегов:
   человека представляет то, что он делает, а не то, что он о себе написал. */
function PersonCardLive({ person, isDark, navigate, app }) {
  var sheet = (typeof useSheet === "function") ? useSheet() : { open: function () {} };
  var offers = (person.offers || []).slice(0, 2);
  var done = person.done_count | 0, people = person.people_count | 0, impr = person.impressions_count | 0;
  var balance = (typeof bosLiveSpendableXPLive === "function") ? bosLiveSpendableXPLive(app) : 0;
  var order = function (o) { sheet.open(<OrderHelpSheetLive person={person} offer={o} app={app} isDark={isDark} />); };
  // Возврат: комната «Сообщества» хранится в общем сторе, а не в параметрах маршрута —
  // поэтому вкладку восстанавливаем явно, иначе «назад» высаживает в «Круги».
  var back = function () {
    try { if (app && app.setCommunityView) app.setCommunityView({ section: "community", commTab: "network", filter: "people" }); } catch (e) {}
    navigate("community");
  };
  return (
    <div style={{ background: "var(--card)", borderRadius: 23, padding: 15, boxShadow: "var(--card-shadow)" }}>
      <button onClick={function () { navigate("net-person", { person: person }); }} className="tap"
        style={{ width: "100%", border: 0, background: "transparent", padding: 0, textAlign: "left", color: "var(--text)", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
        {typeof BosAvatar === "function" ? <BosAvatar avatar={person.avatar} size={46} style={{ flexShrink: 0 }} /> : null}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 16.5, fontWeight: 780, letterSpacing: "-0.3px" }}>{person.name || "Участник"}</span>
            {(person.level | 0) > 0 ? <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-4)", background: "var(--surface-3)", borderRadius: 999, padding: "3px 7px" }}>L{person.level | 0}</span> : null}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 3 }}>
            {done > 0 ? ("помог " + done + " " + bosDoneWordLive(done) + " · " + people + " " + bosPeopleWordLive(people) + (impr > 0 ? " · " + impr + " " + bosImprWordLive(impr) : ""))
              : "пока без состоявшихся дел"}
          </div>
        </div>
        <I.ChevronRight size={18} color="var(--text-4)" />
      </button>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 12 }}>
        {offers.map(function (o) {
          var full = (o.free_slots | 0) <= 0;
          return <ContributionRowLive key={o.id} offer={o} isDark={isDark} muted={full}
            action={full
              ? <span style={{ fontSize: 10.5, color: "var(--text-4)", fontWeight: 700 }}>мест нет</span>
              : (balance < (o.price_xp | 0))
                ? <span style={{ fontSize: 10.5, color: "var(--text-4)", fontWeight: 700, textAlign: "right", lineHeight: 1.3 }}>не хватает<br />{(o.price_xp | 0) - balance} XP</span>
                : <button onClick={function () { order(o); }} className="tap" style={{ border: 0, borderRadius: 999, background: "var(--cta, #0a0a0a)", color: "var(--cta-ink, #fff)", padding: "6px 13px", fontSize: 11.5, fontWeight: 780, cursor: "pointer" }}>Заказать</button>} />;
        })}
      </div>
    </div>
  );
}

/* Заказ. Одна строка контекста обязательна: пустой запрос «просто поболтать»
   съедает единственное место человека на неделю. Цена показана до отправки,
   а списывается только когда дело состоится. */
function OrderHelpSheetLive({ person, offer, app, isDark }) {
  var s = (typeof useSheet === "function") ? useSheet() : { close: function () {} };
  var _n = React.useState(""), note = _n[0], setNote = _n[1];
  var _b = React.useState(false), busy = _b[0], setBusy = _b[1];
  var _e = React.useState(""), err = _e[0], setErr = _e[1];
  var _ok = React.useState(false), sent = _ok[0], setSent = _ok[1];
  var price = offer.price_xp | 0;
  var balance = (typeof bosLiveSpendableXPLive === "function") ? bosLiveSpendableXPLive(app) : 0;
  var enough = balance >= price;
  var send = async function () {
    if (busy || !note.trim() || !enough) return;
    setBusy(true); setErr("");
    var C = window.bosCloud, r = null;
    try { if (C && C.netRequestSkillOffer) r = await C.netRequestSkillOffer(offer.id, note.trim()); } catch (e) {}
    setBusy(false);
    if (r && r.ok && r.dup) { setErr("Ты уже заказывал это на этой неделе — загляни в «Дела»."); }
    else if (r && r.ok) { setSent(true); if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} } }
    else setErr((r && r.err) === "full" ? "Места на эту неделю уже заняты — попробуй на следующей."
      : (r && r.err) === "unavailable" ? "Раздел ещё готовится — заказ не ушёл."
      : "Не удалось отправить заказ. Проверь соединение.");
  };
  if (sent) return <div className="bos-sheet-scroll" style={{ padding: "14px 18px 22px", textAlign: "center", color: "var(--text)" }}>
    {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--surface-3)", display: "grid", placeItems: "center", margin: "10px auto 14px" }}><I.Check size={25} color="var(--text)" strokeWidth={2.4} /></div>
    <div style={{ fontSize: 20, fontWeight: 800 }}>Заказ отправлен</div>
    <div style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.5, margin: "8px auto 16px", maxWidth: 300 }}>
      {(person.name || "Участник")} увидит его в «Делах» и сможет принять или вежливо отказаться. {price > 0 ? "XP спишутся, только когда дело состоится." : "Это бесплатный вклад."}
    </div>
    <button onClick={s.close} className="tap hit44" style={{ width: "100%", minHeight: 48, border: 0, borderRadius: 16, background: "var(--cta, #0a0a0a)", color: "var(--cta-ink, #fff)", fontSize: 14.5, fontWeight: 780, cursor: "pointer" }}>Готово</button>
  </div>;
  return <div className="bos-sheet-scroll" style={{ padding: "2px 16px 18px", color: "var(--text)" }}>
    {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
    <div style={_dSTitle}>Заказать помощь</div>
    <div style={_dSSub}>{bosNetSkillForOffer(offer).title} · {bosNetWhenText(offer)}</div>
    <div style={{ marginTop: 12, borderRadius: 18, background: "var(--card)", padding: 13, boxShadow: "var(--card-shadow)", display: "flex", alignItems: "center", gap: 11 }}>
      {typeof BosAvatar === "function" ? <BosAvatar avatar={person.avatar} size={42} /> : null}
      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14.5, fontWeight: 750 }}>{person.name || "Участник"}</div><div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>{bosHelpOfferTitleText(offer)}</div></div>
      <BosPriceLive xp={price} isDark={isDark} size={16} />
    </div>
    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase", color: "var(--text-4)", margin: "17px 2px 8px" }}>С чем именно нужна помощь</div>
    <textarea value={note} maxLength={200} onChange={function (e) { setNote(e.target.value); }}
      placeholder="Одна конкретная ситуация — так человек поймёт, сможет ли помочь"
      style={{ width: "100%", minHeight: 92, resize: "none", border: "1px solid var(--line)", borderRadius: 16, background: "var(--card)", color: "var(--text)", padding: 12, boxSizing: "border-box", fontFamily: "inherit", fontSize: 13.5, lineHeight: 1.45, outline: "none" }} />
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, margin: "6px 2px 0", fontSize: 10.5, color: "var(--text-4)" }}><span>{price > 0 ? "У тебя " + balance + " XP" : "Этот вклад бесплатный"}</span><span>{note.length}/200</span></div>
    {/* Три вещи, которые человек узнавал слишком поздно: что XP не достаются
        помогающему, когда именно они спишутся и что после принятия откроется личка. */}
    {price > 0 ? <div style={{ marginTop: 11, borderRadius: 15, background: "var(--surface-3)", padding: "11px 12px", fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.48 }}>
      {price} XP спишутся, только когда вы оба отметите, что дело состоялось. Помогающему они не достаются — сгорают: это плата за внимание, а не гонорар. Пока дела нет, с копилки не уходит ничего.
    </div> : null}
    <div style={{ fontSize: 10.8, color: "var(--text-4)", lineHeight: 1.45, margin: "9px 2px 0" }}>Твой текст увидит только {person.name || "этот человек"}. Если он примет заказ, вы откроете друг другу Telegram, чтобы договориться о времени.</div>
    {!enough ? <div style={{ marginTop: 11, borderRadius: 13, background: "var(--surface-3)", padding: 11, fontSize: 12, color: "var(--text-3)", lineHeight: 1.42 }}>Не хватает {price - balance} XP. Опыт приходит с отмеченными привычками и общими делами в кругах.</div> : null}
    {err ? <div role="alert" style={{ marginTop: 11, borderRadius: 13, background: "rgba(255,59,48,0.09)", color: "#C8443A", padding: 10, fontSize: 12 }}>{err}</div> : null}
    <button onClick={send} disabled={busy || !note.trim() || !enough} className="tap hit44"
      style={{ width: "100%", minHeight: 50, marginTop: 13, border: 0, borderRadius: 16, background: (note.trim() && enough) ? "var(--cta, #0a0a0a)" : "var(--surface-3)", color: (note.trim() && enough) ? "var(--cta-ink, #fff)" : "var(--text-4)", fontSize: 14.5, fontWeight: 780, cursor: "pointer" }}>
      {busy ? "Отправляем…" : "Отправить заказ"}
    </button>
  </div>;
}

/* Профиль человека (маршрут net-person). По демо-профилю: герой → чем помогает
   → внизу ВПЕЧАТЛЕНИЯ. История вклада не отдельным блоком, а числом в герое —
   иначе на экране два списка об одном и том же. */
function PersonScreenLive() {
  var nav = useNav(), navigate = nav.navigate, params = nav.params;
  var app = (typeof useApp === "function") ? useApp() : null;
  var sheet = (typeof useSheet === "function") ? useSheet() : { open: function () {} };
  var isDark = !!(app && app.themeOverride === "dark");
  var person = (params && params.person) || { user_id: null, name: "Участник", avatar: "default", level: 0, offers: [] };
  var _im = React.useState(null), impressions = _im[0], setImpressions = _im[1];
  React.useEffect(function () {
    var on = true, C = window.bosCloud;
    if (!(C && C.enabled && C.enabled() && C.netPersonImpressions) || !person.user_id) { setImpressions([]); return; }
    C.netPersonImpressions(person.user_id, 20).then(function (r) { if (on) setImpressions((r && r.impressions) || []); }).catch(function () { if (on) setImpressions([]); });
    return function () { on = false; };
  }, [person.user_id]);
  var done = person.done_count | 0, people = person.people_count | 0;
  var offers = person.offers || [];
  var balance = (typeof bosLiveSpendableXPLive === "function") ? bosLiveSpendableXPLive(app) : 0;
  var order = function (o) { sheet.open(<OrderHelpSheetLive person={person} offer={o} app={app} isDark={isDark} />); };
  return (
    <div className="page-in" style={{ padding: "0 0 30px" }}>
      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 6, paddingBottom: 14 }}>
          <button onClick={back} aria-label="Назад" className="tap hit44" style={{ width: 40, height: 40, border: 0, borderRadius: 999, background: "var(--card)", boxShadow: "var(--card-shadow)", color: "var(--text)", display: "grid", placeItems: "center", cursor: "pointer" }}><I.ChevronLeft size={19} /></button>
          <button onClick={function () { sheet.open(<NetworkSafetySheetLive person={{ ownerId: person.user_id, name: person.name, avatar: person.avatar }} onHidden={back} />); }} aria-label="Действия" className="tap hit44" style={{ width: 40, height: 40, border: 0, borderRadius: 999, background: "var(--card)", boxShadow: "var(--card-shadow)", color: "var(--text-3)", display: "grid", placeItems: "center", cursor: "pointer" }}><I.More size={18} /></button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {typeof BosAvatar === "function" ? <BosAvatar avatar={person.avatar} size={64} style={{ flexShrink: 0 }} /> : null}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 23, fontWeight: 800, letterSpacing: "-0.55px", color: "var(--text)" }}>{person.name || "Участник"}</span>
              {(person.level | 0) > 0 ? <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-4)", background: "var(--surface-3)", borderRadius: 999, padding: "3px 8px" }}>L{person.level | 0}</span> : null}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 4 }}>
              {/* Число разных людей стоит рядом всегда: «помог 6 раз · 1 человек» —
                  это совсем другая история, чем «помог 6 раз · 6 человек», и прятать
                  её нельзя именно тогда, когда человек один. */}
              {done > 0 ? ("помог " + done + " " + bosDoneWordLive(done) + " · " + people + " " + bosPeopleWordLive(people)) : "пока без состоявшихся дел"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 16px 0" }}>
        <div className="section-label" style={{ margin: "0 0 10px" }}>Чем готов помочь</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {offers.map(function (o) {
            var full = (o.free_slots | 0) <= 0;
            return <div key={o.id} style={{ background: "var(--card)", borderRadius: 20, padding: 14, boxShadow: "var(--card-shadow)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span style={{ width: 42, height: 42, borderRadius: 14, background: "var(--surface-3)", display: "grid", placeItems: "center", flexShrink: 0 }}><BosHelpOfferIconLive offer={o} size={20} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Навык живёт во второй строке, поэтому из заголовка его хвост убран —
                      иначе «Разобрать задачу по «Продуктовый дизайн» · Продуктовый дизайн». */}
                  <div style={{ fontSize: 15.5, fontWeight: 750, color: "var(--text)", lineHeight: 1.24 }}>{bosContribShortTitle(o)}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 3, lineHeight: 1.4 }}>{bosNetSkillForOffer(o).title} · {bosNetWhenText(o)}{(o.done_count | 0) > 0 ? " · " + o.done_count + " " + bosDoneWordLive(o.done_count | 0) : ""}</div>
                </div>
                <div style={{ flexShrink: 0, paddingTop: 2 }}><BosPriceLive xp={o.price_xp | 0} isDark={isDark} size={15} /></div>
              </div>
              {o.descr ? <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.45, marginTop: 10 }}>{o.descr}</div> : null}
              {/* Не хватает XP — говорим об этом ЗДЕСЬ, а не после того, как человек
                  напишет текст заказа в шторке и упрётся в серую кнопку. */}
              {(function () {
                var poor = !full && balance < (o.price_xp | 0);
                var off = full || poor;
                return <button onClick={function () { if (!off) order(o); }} disabled={off} className="tap hit44"
                  style={{ width: "100%", minHeight: 44, marginTop: 12, border: 0, borderRadius: 14, background: off ? "var(--surface-3)" : "var(--cta, #0a0a0a)", color: off ? "var(--text-4)" : "var(--cta-ink, #fff)", fontSize: 13.5, fontWeight: 780, cursor: off ? "default" : "pointer" }}>
                  {full ? "Мест на этой неделе нет" : poor ? ("Не хватает " + ((o.price_xp | 0) - balance) + " XP") : ((o.price_xp | 0) > 0 ? ("Заказать за " + o.price_xp + " XP") : "Заказать")}
                </button>;
              })()}
            </div>;
          })}
          {!offers.length ? <div style={{ background: "var(--card)", borderRadius: 20, padding: 16, boxShadow: "var(--card-shadow)", fontSize: 13, color: "var(--text-4)" }}>Сейчас нет открытых вкладов.</div> : null}
        </div>
      </div>

      {/* ВПЕЧАТЛЕНИЯ. Нет ни одного — блока нет: пустая полка с заголовком врёт
          не меньше выдуманных отзывов. */}
      {(impressions && impressions.length) ? (
        <div style={{ padding: "22px 16px 0" }}>
          <div className="section-label" style={{ margin: "0 0 10px" }}>Впечатления</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {impressions.map(function (r) {
              return <div key={r.id} style={{ background: "var(--card)", borderRadius: 20, padding: 14, boxShadow: "var(--card-shadow)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {typeof BosAvatar === "function" ? <BosAvatar avatar={r.from_avatar || "default"} size={30} /> : null}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 750, color: "var(--text)" }}>{r.from_name || "Участник"}</div>
                    <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 1 }}>{bosAgoLive(r.created_at)}{r.offer_title ? " · " + r.offer_title : ""}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13.5, color: "var(--text-2)", marginTop: 10, lineHeight: 1.52 }}>{r.note}</div>
              </div>;
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── ЭКРАН «ЛЮДИ» ──────────────────────────────────────────────────────────
   Собирает три блока и все состояния загрузки/пустоты/недоступного сервера.
   Выдуманных людей здесь не бывает ни в одном состоянии. */
function PeopleTabLive({ app, navigate, isDark, query }) {
  var _mine = React.useState(null), mine = _mine[0], setMine = _mine[1];
  var _pp = React.useState(null), people = _pp[0], setPeople = _pp[1];
  var _dl = React.useState([]), deals = _dl[0], setDeals = _dl[1];
  var _im = React.useState([]), impressions = _im[0], setImpressions = _im[1];
  var _st = React.useState("loading"), state = _st[0], setState = _st[1]; // loading | ready | offline | outdated
  var _t = React.useState(0), tick = _t[0], setTick = _t[1];
  var refresh = function () { setTick(function (n) { return n + 1; }); };
  React.useEffect(function () {
    var on = true, C = window.bosCloud;
    if (!(C && C.enabled && C.enabled() && C.netMyContributions)) { setState("offline"); setMine([]); setPeople([]); setDeals([]); return; }
    (async function () {
      var r = await Promise.all([
        C.netMyContributions(), C.netPeopleContributions(60),
        C.netIncomingSkillEpisodes ? C.netIncomingSkillEpisodes({ limit: 40 }) : Promise.resolve({ episodes: [] }),
        C.netOutgoingSkillEpisodes ? C.netOutgoingSkillEpisodes({ limit: 40 }) : Promise.resolve({ episodes: [] }),
        C.netMyImpressions ? C.netMyImpressions() : Promise.resolve({ keys: [] })
      ]);
      if (!on) return;
      // Патч не прогнан → RPC нет. Говорим об этом прямо, а не показываем пустоту.
      if (r[0].status === "error" && (r[0].err === "unavailable" || r[1].err === "unavailable")) { setState("outdated"); setMine([]); setPeople([]); setDeals([]); return; }
      setMine(r[0].contributions || []);
      setPeople(r[1].people || []);
      var ins = ((r[2] && r[2].episodes) || []).map(function (x) { x._provider = true; return x; });
      var outs = ((r[3] && r[3].episodes) || []).map(function (x) { x._provider = false; return x; });
      var all = ins.concat(outs);
      var ids = []; all.forEach(function (x) { var id = x._provider ? x.booker_id : x.owner_id; if (id && ids.indexOf(id) < 0) ids.push(id); });
      if (C.netProfiles && ids.length) {
        try { var pr = await C.netProfiles(ids), pm = {}; ((pr && pr.profiles) || []).forEach(function (p) { pm[p.id] = p; });
          all.forEach(function (x) { x.other_profile = pm[x._provider ? x.booker_id : x.owner_id] || null; }); } catch (e) {}
      }
      if (!on) return;
      // Сначала то, что ждёт МОЕГО шага, потом остальное; закрытые — в хвост.
      var weight = function (x) {
        var st = x.status || x.lifecycle;
        if (st === "requested" && x._provider) return 0;
        if (st === "accepted" && !(x._provider ? x.provider_done_at : x.recipient_done_at)) return 1;
        if (st === "done") return 2;
        if (st === "requested") return 3;
        return 4;
      };
      all.sort(function (a, b) { return weight(a) - weight(b) || String(b.created_at || "").localeCompare(String(a.created_at || "")); });
      setDeals(all);
      setImpressions((r[4] && r[4].keys) || []);
      setState("ready");
    })().catch(function () { if (on) { setState("offline"); setMine([]); setPeople([]); setDeals([]); } });
    return function () { on = false; };
  }, [tick]);

  var balance = (typeof bosLiveSpendableXPLive === "function") ? bosLiveSpendableXPLive(app) : 0;
  var qq = String(query || "").trim().toLowerCase();
  var shown = (people || []).filter(function (p) {
    if (!qq) return true;
    var hay = [p.name].concat((p.offers || []).map(function (o) { return [o.title, o.descr, bosNetSkillForOffer(o).title].join(" "); })).join(" ").toLowerCase();
    return hay.indexOf(qq) >= 0;
  });


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
      {state === "outdated" ? (
        <div role="alert" style={{ borderRadius: 16, background: "var(--surface-3)", padding: "12px 13px", fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.45 }}>
          <b style={{ color: "var(--text)" }}>Раздел ещё готовится.</b> Посмотреть можно всё, но вклад и заказы пока не сохраняются. Придуманных людей вместо настоящих здесь не будет.
        </div>
      ) : null}

      <BosBlock name="my-contribution">
        <CommSectionHeadLive title="Твой вклад в окружение" />
        {state === "loading" ? <div style={{ background: "var(--card)", borderRadius: 22, padding: 18, boxShadow: "var(--card-shadow)", fontSize: 13, color: "var(--text-4)", marginTop: 8 }}>Загружаем…</div>
          : <div style={{ marginTop: 8 }}><MyContributionLive app={app} isDark={isDark} rows={mine} onChanged={refresh} /></div>}
      </BosBlock>

      {(deals && deals.length) ? (
        <BosBlock name="deals">
          <CommSectionHeadLive title="Дела" />
          <div style={{ marginTop: 8 }}><PeopleDealsLive app={app} isDark={isDark} deals={deals} impressions={impressions} onChanged={refresh} /></div>
        </BosBlock>
      ) : null}

      <BosBlock name="people">
        {/* Цены на этой полке в XP, поэтому рядом с заголовком стоит копилка: иначе
            человек узнаёт, что у него ноль, только дописав текст заказа. */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, padding: "4px 4px 0" }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)" }}>Кто может помочь</span>
          {/* Копилку пишем числом, а не через ценник: у ценника ноль читается как
              «даром», и строка превращалась в «у тебя даром». */}
          <span style={{ fontSize: 11.5, color: "var(--text-4)" }}>у тебя <b style={{ fontWeight: 800, color: bosXPGoldLive(isDark) }}>{balance}</b> XP</span>
        </div>
        {/* Порядок списка — не «лучшие», а «у кого больше состоявшихся дел». Это
            накручиваемое число, и оно должно называться своим именем. */}
        {(people && people.length > 1) ? <div style={{ fontSize: 11, color: "var(--text-4)", padding: "5px 4px 0", lineHeight: 1.4 }}>Сверху — у кого больше состоявшихся дел. Это не оценка человека, а счётчик.</div> : null}
        {/* Своего поля поиска здесь нет: ищет верхнее, общее для экрана. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          {state === "loading" ? <div style={{ background: "var(--card)", borderRadius: 22, padding: 18, boxShadow: "var(--card-shadow)", fontSize: 13, color: "var(--text-4)" }}>Загружаем…</div>
            : shown.length ? shown.map(function (p) { return <PersonCardLive key={p.user_id} person={p} isDark={isDark} navigate={navigate} app={app} />; })
            : qq ? <div style={{ background: "var(--card)", borderRadius: 22, padding: 18, boxShadow: "var(--card-shadow)", fontSize: 13, color: "var(--text-4)", lineHeight: 1.45 }}>Никто пока не описал такой вклад. Попробуй сказать короче — например, «тексты» или «бег».</div>
            : <PeopleEmptyLive isDark={isDark} />}
        </div>
      </BosBlock>
    </div>
  );
}

/* Пустая полка людей. Не фейковый человек, а ОБРАЗЕЦ ФОРМАТА: без лица, имени и
   кнопки — показывает, из чего состоит карточка, и ничего не обещает. */
function PeopleEmptyLive({ isDark }) {
  var sample = { kind: "skill_offer", skill_key: "meditation", interaction_key: "practice", outcome_key: "clear_next_step",
    title: "Провести короткую практику · Медитация", when_text: "30 мин", mode: "online", price_xp: 100 };
  return (
    <div style={{ background: "var(--card)", borderRadius: 22, padding: "17px 15px", boxShadow: "var(--card-shadow)" }}>
      <div style={{ fontSize: 16, fontWeight: 780, color: "var(--text)", letterSpacing: "-0.3px" }}>Здесь пока никого нет</div>
      <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.5, marginTop: 6 }}>
        Люди появятся тут, как только опишут свой вклад. Вот из чего будет состоять каждая строка:
      </div>
      <div style={{ marginTop: 12, opacity: 0.75, pointerEvents: "none" }}>
        <ContributionRowLive offer={sample} isDark={isDark} action={<span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-4)" }}>образец</span>} />
      </div>
      <div style={{ fontSize: 11.5, color: "var(--text-4)", lineHeight: 1.45, marginTop: 11 }}>
        Что человек сделает, за сколько времени и во сколько XP это ему обойдётся. Дальше к строке добавятся состоявшиеся дела и впечатления тех, кто уже заказывал.
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   ПАРТНЁРЫ · КАК ТУДА ПОПАДАЮТ ДРУГИЕ (v868, пункт 5 брифа)

   Дверь одна и она без администратора: любой предлагает место → заявку видят
   люди уровня 10 и выше → трое из них говорят «я там был, всё так» → место
   публикуется. Три голоса, а не один: одного знакомого привести легко, троих
   независимых — уже нет. Свою заявку подтвердить нельзя.

   Пока заявка собирает голоса, её видит только автор и проверяющие: витрина не
   засоряется тем, что ещё никто не проверил.  ═══════════════════════════════ */
function PartnerAddLive({ app, isDark }) {
  var s = (typeof useSheet === "function") ? useSheet() : { open: function () {} };
  var _mine = React.useState(null), mine = _mine[0], setMine = _mine[1];
  var _pend = React.useState([]), pending = _pend[0], setPending = _pend[1];
  var _live = React.useState([]), live = _live[0], setLive = _live[1];
  var _lvl = React.useState(0), level = _lvl[0], setLevel = _lvl[1];
  var _busy = React.useState(null), busyId = _busy[0], setBusy = _busy[1];
  var _err = React.useState(""), err = _err[0], setErr = _err[1];
  var _t = React.useState(0), tick = _t[0], setTick = _t[1];
  var refresh = function () { setTick(function (n) { return n + 1; }); };
  React.useEffect(function () {
    var on = true, C = window.bosCloud;
    if (!(C && C.enabled && C.enabled() && C.netPartnerPlaces)) { setMine([]); setPending([]); setLive([]); return; }
    Promise.all([C.netPartnerPlaces("mine"), C.netPartnerPlaces("pending"), C.netPartnerPlaces("published")]).then(function (r) {
      if (!on) return;
      setMine((r[0] && r[0].places) || []);
      setPending((r[1] && r[1].places) || []);
      setLive((r[2] && r[2].places) || []);
      setLevel((r[0] && r[0].level) | 0);
    }).catch(function () { if (on) { setMine([]); setPending([]); setLive([]); } });
    return function () { on = false; };
  }, [tick]);
  var vouch = async function (place) {
    if (busyId) return; setBusy(place.id); setErr("");
    var C = window.bosCloud, r = null;
    try { if (C && C.netVouchPartner) r = await C.netVouchPartner(place.id); } catch (e) {}
    setBusy(null);
    if (r && r.ok) { if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} } refresh(); }
    else {
      var e2 = (r && r.err) || "";
      setErr(e2 === "level" ? "Поручиться за место можно с 10 уровня."
        : e2 === "too_new" ? "Аккаунт слишком новый: поручаться можно через две недели после регистрации."
        : e2 === "same_circle" ? "Вы с автором в одном круге — это не независимый голос."
        : e2 === "unavailable" ? "Раздел ещё готовится — голос не ушёл."
        : "Не удалось поручиться. Попробуй позже.");
    }
  };
  var unvouch = async function (place) {
    if (busyId) return; setBusy(place.id); setErr("");
    var C = window.bosCloud, r = null;
    try { if (C && C.netUnvouchPartner) r = await C.netUnvouchPartner(place.id); } catch (e) {}
    setBusy(null);
    if (r && r.ok) refresh(); else setErr("Голос уже не забрать — место опубликовано.");
  };
  var withdraw = async function (place) {
    if (busyId) return; setBusy(place.id); setErr("");
    var C = window.bosCloud, r = null;
    try { if (C && C.netWithdrawPartner) r = await C.netWithdrawPartner(place.id); } catch (e) {}
    setBusy(null);
    if (r && r.ok) refresh(); else setErr("Не удалось убрать место.");
  };
  var open = function () { s.open(<PartnerProposeSheetLive isDark={isDark} onDone={refresh} />); };
  var card = function (pl, canVouch) {
    var n = pl.vouches | 0, vs = pl.vouchers || [];
    return (
      <div key={pl.id} style={{ background: "var(--card)", borderRadius: 20, padding: 14, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
          <span style={{ width: 40, height: 40, borderRadius: 13, background: "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 19, flexShrink: 0 }}>{pl.emblem || "🎁"}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 750, color: "var(--text)", lineHeight: 1.25 }}>{pl.name}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 3, lineHeight: 1.4 }}>{pl.what}</div>
          </div>
          <div style={{ flexShrink: 0, paddingTop: 2 }}><BosPriceLive xp={pl.cost_xp | 0} isDark={isDark} /></div>
        </div>
        {/* Описание места показываем: раньше «пара слов» уходили в базу и не попадали
            ни на один экран — человек писал их в пустоту. */}
        {pl.about ? <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.48, marginTop: 10 }}>{pl.about}</div> : null}
        <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 9 }}>{pl.address}</div>
        {/* Три деления — сколько людей уже поручились. Чернила, не золото: это факт
            проверки, а не награда. Рядом — их лица: счётчик без имён ничего не значит,
            а имя и лицо — уже чья-то репутация, поставленная на кон. */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 11 }}>
          <div style={{ display: "flex", gap: 4, flex: 1 }}>
            {[0, 1, 2].map(function (i) { return <span key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i < n ? "var(--text)" : "var(--line)" }} />; })}
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", flexShrink: 0 }}>{pl.status === "published" ? "опубликовано" : n + " из 3"}</span>
        </div>
        {vs.length ? (
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 9 }}>
            <div style={{ display: "flex" }}>{vs.slice(0, 3).map(function (v, i) { return <span key={i} style={{ marginLeft: i ? -7 : 0, borderRadius: "50%", boxShadow: "0 0 0 2px var(--card)" }}><BosAvatar avatar={v.avatar || "default"} size={22} /></span>; })}</div>
            <span style={{ fontSize: 11, color: "var(--text-4)" }}>поручились: {vs.slice(0, 3).map(function (v) { return v.name; }).join(", ")}</span>
          </div>
        ) : null}
        {canVouch ? (
          <div style={{ display: "flex", gap: 7, marginTop: 11 }}>
            <button onClick={function () { pl.vouched_by_me ? unvouch(pl) : vouch(pl); }} disabled={busyId === pl.id} className="tap hit44"
              style={{ flex: 1, minHeight: 44, border: 0, borderRadius: 14, background: pl.vouched_by_me ? "var(--surface-3)" : "var(--cta, #0a0a0a)", color: pl.vouched_by_me ? "var(--text-3)" : "var(--cta-ink, #fff)", fontSize: 13.5, fontWeight: 780, cursor: "pointer" }}>
              {busyId === pl.id ? "…" : (pl.vouched_by_me ? "Ты поручился · забрать голос" : "Я знаю это место — всё так")}
            </button>
          </div>
        ) : null}
        {pl.mine ? (
          <button onClick={function () { withdraw(pl); }} disabled={busyId === pl.id} className="tap hit44"
            style={{ width: "100%", minHeight: 42, marginTop: 11, border: 0, borderRadius: 14, background: "transparent", color: "var(--text-4)", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
            {pl.status === "published" ? "Снять место" : "Отозвать заявку"}
          </button>
        ) : null}
      </div>
    );
  };
  if (mine === null) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
      {err ? <div role="alert" style={{ borderRadius: 13, background: "rgba(255,59,48,0.09)", color: "#C8443A", padding: 10, fontSize: 12 }}>{err}</div> : null}

      {/* Места, которые привели сами люди и подтвердили трое побывавших. */}
      {live.length ? (
        <React.Fragment>
          <CommSectionHeadLive title="Привели люди · подтверждено" />
          {live.map(function (pl) { return card(pl, false); })}
        </React.Fragment>
      ) : null}

      {/* Очередь проверки — только тем, кто дошёл до 10 уровня. Ниже её не видно. */}
      {pending.length ? (
        <React.Fragment>
          <CommSectionHeadLive title="На проверке · нужен твой голос" />
          <div style={{ fontSize: 12, color: "var(--text-4)", lineHeight: 1.45, padding: "0 4px" }}>Ручайся только за то, что знаешь: что место существует и описано верно. Твоё имя встанет рядом с заявкой. Три голоса — и место увидят все.</div>
          {pending.map(function (pl) { return card(pl, true); })}
        </React.Fragment>
      ) : null}

      {mine.length ? (
        <React.Fragment>
          <CommSectionHeadLive title="Твои заявки" />
          {mine.map(function (pl) { return card(pl, false); })}
        </React.Fragment>
      ) : null}

      <div style={{ background: "var(--card)", borderRadius: 22, padding: "17px 15px", boxShadow: "var(--card-shadow)" }}>
        {/* Дверь должна узнавать и владельца места, и того, кто просто его любит.
            Раньше было только «знаешь место?» — владелец студии себя не находил. */}
        <div style={{ fontSize: 16.5, fontWeight: 780, color: "var(--text)", letterSpacing: "-0.3px" }}>У тебя своё место — или знаешь хорошее?</div>
        <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.5, marginTop: 6 }}>
          Студия, зал, кофейня. Гость приходит и платит XP из копилки — тебе он не платит ничего и ты ничего не платишь нам. Смысл простой: к тебе приходят люди, которые ведут себя как взрослые.
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.5, marginTop: 8 }}>
          Решает не администратор: трое, кто дошёл до 10 уровня и знает это место, поручаются — и оно появляется у всех. Пока голосов нет, заявку видят только они и ты; отозвать её можно в любой момент.
        </div>
        <button onClick={open} className="tap hit44"
          style={{ width: "100%", minHeight: 46, marginTop: 13, border: 0, borderRadius: 15, background: "var(--cta, #0a0a0a)", color: "var(--cta-ink, #fff)", fontSize: 14, fontWeight: 750, cursor: "pointer" }}>Предложить место</button>
        {level > 0 && level < 10 ? <div style={{ fontSize: 11, color: "var(--text-4)", textAlign: "center", marginTop: 9, lineHeight: 1.4 }}>Поручаться за чужие места можно с 10 уровня — у тебя {level}.</div> : null}
      </div>
    </div>
  );
}

function PartnerProposeSheetLive({ isDark, onDone }) {
  var s = (typeof useSheet === "function") ? useSheet() : { close: function () {} };
  var _n = React.useState(""), name = _n[0], setName = _n[1];
  var _w = React.useState(""), what = _w[0], setWhat = _w[1];
  var _a = React.useState(""), address = _a[0], setAddress = _a[1];
  var _ab = React.useState(""), about = _ab[0], setAbout = _ab[1];
  var _c = React.useState(200), cost = _c[0], setCost = _c[1];
  var _em = React.useState("🎁"), emblem = _em[0], setEmblem = _em[1];
  var _b = React.useState(false), busy = _b[0], setBusy = _b[1];
  var _e = React.useState(""), err = _e[0], setErr = _e[1];
  var _ok = React.useState(false), sent = _ok[0], setSent = _ok[1];
  var emblems = ["🎁", "🧘", "💃", "🥊", "☕", "🎨", "🏊", "🎸", "📚", "🍵"];
  var ready = name.trim().length >= 2 && what.trim().length >= 4 && address.trim().length >= 4;
  var field = { width: "100%", height: 46, border: "1px solid var(--line)", borderRadius: 14, background: "var(--card)", color: "var(--text)", padding: "0 13px", boxSizing: "border-box", outline: "none", fontFamily: "inherit", fontSize: 14 };
  var label = { fontSize: 11, fontWeight: 800, letterSpacing: 0.7, textTransform: "uppercase", color: "var(--text-4)", margin: "16px 2px 8px" };
  var send = async function () {
    if (busy || !ready) return;
    setBusy(true); setErr("");
    var C = window.bosCloud, r = null;
    try { if (C && C.netProposePartner) r = await C.netProposePartner({ name: name, what: what, about: about, address: address, cost_xp: cost, emblem: emblem }); } catch (e) {}
    setBusy(false);
    if (r && r.ok) { setSent(true); if (onDone) onDone(); }
    else setErr((r && r.err) === "too_many_pending" ? "У тебя уже три заявки на проверке — дождись их."
      : (r && r.err) === "unavailable" ? "Раздел ещё готовится — заявка не ушла."
      : "Не удалось отправить заявку. Проверь поля.");
  };
  if (sent) return <div className="bos-sheet-scroll" style={{ padding: "14px 18px 22px", textAlign: "center", color: "var(--text)" }}>
    {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--surface-3)", display: "grid", placeItems: "center", margin: "10px auto 14px" }}><I.Check size={25} color="var(--text)" strokeWidth={2.4} /></div>
    <div style={{ fontSize: 20, fontWeight: 800 }}>Заявка ушла на проверку</div>
    <div style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.5, margin: "8px auto 16px", maxWidth: 300 }}>Её увидят люди с 10 уровня. Как только трое поручатся, место появится у всех. Пока голосов нет, заявка лежит в «Твоих заявках» — её видно только тебе и проверяющим, и оттуда же её можно отозвать.</div>
    <button onClick={s.close} className="tap hit44" style={{ width: "100%", minHeight: 48, border: 0, borderRadius: 16, background: "var(--cta, #0a0a0a)", color: "var(--cta-ink, #fff)", fontSize: 14.5, fontWeight: 780, cursor: "pointer" }}>Готово</button>
  </div>;
  return <div className="bos-sheet-scroll" style={{ padding: "2px 16px 18px", color: "var(--text)" }}>
    {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
    <div style={_dSTitle}>Предложить место</div>
    <div style={_dSSub}>своё или то, которое ты знаешь</div>
    <div style={label}>Название</div>
    <input value={name} maxLength={60} onChange={function (e) { setName(e.target.value); }} placeholder="Студия «Тишина»" style={field} />
    <div style={label}>Что человек получит</div>
    <input value={what} maxLength={120} onChange={function (e) { setWhat(e.target.value); }} placeholder="Час осознанности с гидом" style={field} />
    <div style={label}>Адрес</div>
    <input value={address} maxLength={160} onChange={function (e) { setAddress(e.target.value); }} placeholder="Москва, ул. Пушкина, 12 · вход со двора" style={field} />
    <div style={label}>Пара слов · их увидят на карточке</div>
    <textarea value={about} maxLength={400} onChange={function (e) { setAbout(e.target.value); }} placeholder="Кому подойдёт, что взять с собой, как найти вход"
      style={{ width: "100%", minHeight: 84, resize: "none", border: "1px solid var(--line)", borderRadius: 14, background: "var(--card)", color: "var(--text)", padding: 12, boxSizing: "border-box", fontFamily: "inherit", fontSize: 13.5, lineHeight: 1.45, outline: "none" }} />
    <div style={label}>Значок</div>
    <div className="bos-hscroll" style={{ display: "flex", gap: 7, overflowX: "auto", padding: "0 1px 3px" }}>
      {emblems.map(function (e) { var on = emblem === e; return <button key={e} onClick={function () { setEmblem(e); }} className="tap hit44" style={{ width: 46, height: 46, flexShrink: 0, border: on ? "1px solid var(--text)" : "1px solid transparent", borderRadius: 14, background: on ? "var(--surface-3)" : "var(--card)", boxShadow: on ? "none" : "var(--card-shadow)", fontSize: 21, cursor: "pointer" }}>{e}</button>; })}
    </div>
    {/* Раньше заголовок читался как счёт владельцу: «сколько с меня». Теперь ясно,
        чьи это XP и что с них никому ничего не капает. */}
    <div style={label}>Сколько XP платит гость</div>
    <div style={{ background: "var(--card)", borderRadius: 18, boxShadow: "var(--card-shadow)", padding: "14px 13px", display: "flex", alignItems: "center", gap: 12 }}>
      <button onClick={function () { setCost(Math.max(0, cost - 50)); }} aria-label="Меньше" className="tap hit44" style={{ width: 44, height: 44, border: 0, borderRadius: 14, background: "var(--surface-3)", color: "var(--text)", fontSize: 20, fontWeight: 700, cursor: "pointer" }}>−</button>
      <div style={{ flex: 1, textAlign: "center" }}><BosPriceLive xp={cost} isDark={isDark} size={24} /></div>
      <button onClick={function () { setCost(Math.min(2000, cost + 50)); }} aria-label="Больше" className="tap hit44" style={{ width: 44, height: 44, border: 0, borderRadius: 14, background: "var(--surface-3)", color: "var(--text)", fontSize: 20, fontWeight: 700, cursor: "pointer" }}>+</button>
    </div>
    <div style={{ fontSize: 11.5, color: "var(--text-4)", lineHeight: 1.45, margin: "9px 2px 0" }}>Гость списывает это из своей копилки, деньгами не платит. Тебе XP не начисляются — это фильтр, а не выручка: чем выше цена, тем реже к тебе заходят случайно. Обычно ставят 150–400.</div>
    {err ? <div role="alert" style={{ marginTop: 12, borderRadius: 13, background: "rgba(255,59,48,0.09)", color: "#C8443A", padding: 10, fontSize: 12 }}>{err}</div> : null}
    <button onClick={send} disabled={busy || !ready} className="tap hit44"
      style={{ width: "100%", minHeight: 50, marginTop: 14, border: 0, borderRadius: 16, background: ready ? "var(--cta, #0a0a0a)" : "var(--surface-3)", color: ready ? "var(--cta-ink, #fff)" : "var(--text-4)", fontSize: 14.5, fontWeight: 780, cursor: "pointer" }}>
      {busy ? "Отправляем…" : "Отправить на проверку"}
    </button>
    <div style={{ fontSize: 11, color: "var(--text-4)", lineHeight: 1.45, marginTop: 10, textAlign: "center" }}>Заявку подтверждают трое живых людей, а не администратор. Их имена будут видны рядом с местом.</div>
  </div>;
}

// ── «ТВОЙ ПУТЬ ПОМОЩНИКА» — лесенка надёжности для своих (СНЯТА с экрана v868) ──
// David 2026-08-02: «не путь помощника, а твой вклад в окружение» и «утверждает не
// круг, утверждают другие люди». Лесенка с подтверждениями круга больше не
// вызывается — её место занял PeopleTabLive. Код оставлен только как история
// механики подтверждений; удалять его вместе с AddHelpFormatSheetLive нельзя,
// пока круговая помощь (circle_support) живёт в комнате круга.
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
  // Старт С КЭША прошлого визита (David 2026-07-17: «должны быть сразу, а не через 2-4 сек»),
  // сеть обновляет фоном. null = совсем нечего показать (первый запуск) → секция молчит до данных.
  var _l = React.useState(function () { return (typeof _bosDiscoverCache !== "undefined" && Array.isArray(_bosDiscoverCache) && _bosDiscoverCache.length) ? _bosDiscoverCache : null; }), list = _l[0], setList = _l[1];
  var _b = React.useState({}), busy = _b[0], setBusy = _b[1];
  var _rq = React.useState({}), reqd = _rq[0], setReqd = _rq[1];
  React.useEffect(function () {
    var on = true;
    try {
      if (window.bosCloud && window.bosCloud.enabled() && window.bosCloud.discoverTeams) {
        window.bosCloud.discoverTeams().then(function (ts) {
          if (!on) return;
          var arr = Array.isArray(ts) ? ts : [];
          if (arr.length && typeof _bosDiscoverCachePut === "function") _bosDiscoverCachePut(arr);
          // обрыв/пусто при живом кэше → держим кэш, не гасим секцию в ничто
          setList(function (prev) { return arr.length ? arr : (prev || arr); });
        }).catch(function () { if (on) setList(function (prev) { return prev || []; }); });
      } else setList(function (prev) { return prev || []; });
    } catch (e) { setList(function (prev) { return prev || []; }); }
    return function () { on = false; };
  }, []);
  // ВСЕ публичные общие цели — И те, где я уже состою (David 2026-07-17: «видны всем,
  // неважно, вступил или нет; новый человек заходит и сразу видит — люди ведут общие
  // цели»); свои — без кнопки «Вступить», тап ведёт в комнату.
  // Ранг = больше людей выше (David 2026-07-16: «самые большие — на первых местах»).
  var mineById = {}; ((app && app.teams) || []).forEach(function (t) { if (t && t.cloudId) mineById[t.cloudId] = t; });
  var real = (list || []).filter(Boolean)
    .sort(function (a, b) { var d = (b.members || 0) - (a.members || 0); if (d) return d; return (Date.parse(a.createdAt || 0) || 0) - (Date.parse(b.createdAt || 0) || 0); });
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
  // Круглый диск — ровно как на единой карточке круга (David: «квадратная подложка плохо
  // смотрится, круглая просится»; и тут был квадрат — тот же разнобой).
  var TILE = { width: 44, height: 44, borderRadius: "50%", background: (typeof BOS_ORB_SHEEN !== "undefined" ? BOS_ORB_SHEEN + ", " : "") + "linear-gradient(160deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))", boxShadow: (typeof bosOrbGlass === "function" ? bosOrbGlass(false) : "inset 0 0 0 0.5px rgba(0,0,0,0.06)"), display: "grid", placeItems: "center", fontSize: 23, flexShrink: 0 };
  var chip = function (txt, live) { return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, color: live ? "#B4820A" : "var(--text-4)", background: live ? "rgba(240,195,10,0.14)" : "var(--surface-3)", borderRadius: 999, padding: "3px 8px", marginTop: 9 }}>{txt}</span>; };
  var cards = [];
  // 1) реальные открытые круги — ЕДИНАЯ карточка (та же, что в каталоге и на главной; David:
  //    «в открытых кругах всё ещё урезанные»). Ширина 300 — стандартная карточка в горизонтальной
  //    ленте, целиком с нитью, чипами и «Вступить».
  real.slice(0, 8).forEach(function (t) {
    var mine = mineById[t.id] || null;
    cards.push(
      // Ширина = колонке каталога «Общих целей» (страница 12+12, зазор 10 → (100vw−34)/2):
      // David 2026-07-17 «на „Все" миниатюры ужатые — стандартизировать с вкладкой целей».
      <div key={"real:" + t.id} style={{ width: "min(calc(50vw - 17px), 200px)", flexShrink: 0, scrollSnapAlign: "start" }}>
        {typeof BosCircleCardCompactLive === "function"
          ? <BosCircleCardCompactLive t={t} joined={!!mine} busy={!!busy[t.id]} requested={!!reqd[t.id]} onJoin={join}
              onOpen={mine ? function () { navigate("team-detail", { team: mine, from: "community" }); } : null} />
          : null}
      </div>
    );
  });
  // 2) заготовленные популярные шаблоны — АРХИВ (David 2026-07-16: «удали все фейковые
  //    открытые круги»): карточки-заготовки выглядели как живые круги, но людей в них не
  //    было. Данные (POPULAR_OPEN_CIRCLES) и startSeed живы — вернуть = раскомментировать.
  // POPULAR_OPEN_CIRCLES.forEach(function (seed) { ... cards.push(<button onClick={() => startSeed(seed)} .../>); });
  if (!cards.length) return null; // без живых кругов раздел честно молчит (фейков больше нет)
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "0 4px 2px" }}>
        {/* Заголовок носил эмодзи 🌐 — глобус, а не круг (David 2026-07-15: «там тоже должна быть
            иконка кругов»). Теперь тот же BosCircleIcon, что на пилюле и в меню «+». */}
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.3px", display: "inline-flex", alignItems: "center", gap: 7 }}>
          <BosCircleIcon size={17} strokeWidth={1.9} color="var(--text)" />Общие цели
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
  const _pairFor = { all: "discover", nearby: "discover", circles: "discover", challenges: "discover", partners: "community", people: "community", training: "community" };
  const _legacyFilter = section === "community" ? (commTabEff === "courses" ? "training" : "people") : "all";
  const _fOk = cv.filter && _pairFor[cv.filter] === section
    && (section !== "community" || (cv.filter === "training") === (commTabEff === "courses"));
  let filter = _fOk ? cv.filter : _legacyFilter;
  // David: «Рядом» слит в «Партнёры» (карта+сетка одним блоком). «Курсы» ВЕРНУЛИ отдельным чипом
  // (David: «верни вкладку Курсы с 3мя курсами»). Старое «nearby» аккуратно переводим в «partners».
  if (filter === "nearby") filter = "partners";
  /* ТРИ КОМНАТЫ ВМЕСТО ШЕСТИ ЧИПОВ (David 2026-08-02: «на вкладке сообщество всё обновить,
     чтобы было логично»). Шесть фильтров резали одно и то же на куски («Общие цели» и
     «Челленджи» — оба про круги, «Партнёры» и «Курсы» — оба про то, куда деть XP), а «Все»
     показывало смесь. Теперь: КРУГИ (с кем делать) · ЛЮДИ (кто рядом) · ПАРТНЁРЫ (куда деть
     XP). Старые значения filter живут дальше — по ним приходят тур, онбординг и другие
     экраны, — просто сворачиваются в три комнаты. */
  // «Все» — обзорная комната из макета (кадр «Мои сообщества»): не смесь всего подряд, а
  // короткая сводка по каждому разделу с переходом внутрь. Раньше filter="all" сворачивался
  // в «Круги», и обзора не было вовсе.
  const seg = (filter === "people") ? "people"
    : ((filter === "partners" || filter === "training") ? "partners"
    : (filter === "circles" ? "circles" : "all"));
  const setFilter = (f) => setView({ filter: f, section: _pairFor[f] || "discover", commTab: f === "training" ? "courses" : "network", helpOwnerIds: null, helpOfferIds: null });
  const isDark = app?.themeOverride === "dark";
  const { open: _openSheet } = (typeof useSheet === "function") ? useSheet() : { open: () => {} };
  // ТВОИ КРУГИ — те же, что на доске Главной (архивные не в счёт): тут они показываются
  // полноценными карточками, а не строчками (David 2026-08-02).
  const _archCV = (typeof useBosArchived === "function") ? useBosArchived() : null;
  const myCircles = (app?.teams || []).filter((t) => t && !(typeof bosIsArch === "function" && bosIsArch(_archCV, "t", t)));

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
  // На комнате «Люди» верхнее поле ищет ЛЮДЕЙ, а не круги: раньше человек вводил там
  // «тексты», список людей исчезал и ему предлагали собрать круг на другой вкладке —
  // поле обмануло его собственной вкладкой. Один экран — один поиск, и он ищет то,
  // что на экране.
  const searching = qDeb.length >= 2 && seg !== "people";
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

  // «Мало активности» — круги, где я подряд пропускаю СВОИ дни. Считаем тем же bosCircleStrikes,
  // что судит вылет из круга: это не выдуманная метрика, а тот же счётчик, только мягче порог.
  const lowCircles = React.useMemo(() => {
    if (typeof bosCircleStrikes !== "function") return [];
    return myCircles.filter((t) => {
      try { const st = bosCircleStrikes(t, app?.habits, null); return st && st.miss >= 2; } catch (e) { return false; }
    });
  }, [myCircles, app?.habits]);
  const [lowOpen, setLowOpen] = React.useState(false);
  const addBtnRef = React.useRef(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const _grpWord = (n) => { const a = n % 10, b = n % 100; return (a === 1 && b !== 11) ? "группа" : (a >= 2 && a <= 4 && (b < 12 || b > 14)) ? "группы" : "групп"; };

  return (
    <div className="page-in fig" style={{ padding: "0 12px 24px", background: "var(--bg)", minHeight: "100%" }}>
      {/* ШАПКА ПО МАКЕТУ (кадр «Мои сообщества», Toolbar-Top 71). Было: заголовок и пульс в
          одну строку, кнопок нет вовсе. Стало: заголовок 28/700, под ним живой пульс, справа
          колокольчик и «+» — тот же стеклянный блок, что на Главной, чтобы рука искала их в
          одном месте на обоих экранах. */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, padding: "6px 4px 12px" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.8px", color: "var(--text)", lineHeight: 1.1 }}>Сообщество</div>
          {pulseN > 0 && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 3 }}>
              <span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
              <span style={{ fontSize: 15, color: "var(--text-2)", whiteSpace: "nowrap" }}>{pulseN} {_pulseWord(pulseN)}</span>
            </div>
          )}
        </div>
        <div className="glass" style={{ display: "flex", alignItems: "center", height: 44, borderRadius: 999, flexShrink: 0, overflow: "hidden" }}>
          <button onClick={() => navigate("notifications", { from: "community" })} className="tap" aria-label="Уведомления"
            style={{ width: 44, height: 44, borderRadius: 999, background: "transparent", border: 0, padding: 0, display: "grid", placeItems: "center", cursor: "pointer", color: "var(--text)" }}>
            <I.Bell size={19} strokeWidth={2} />
          </button>
          <button ref={addBtnRef} onClick={() => { setCreateOpen(true); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } }} className="tap" aria-label="Создать" aria-haspopup="menu" aria-expanded={createOpen}
            style={{ width: 44, height: 44, borderRadius: 999, background: "transparent", border: 0, padding: 0, display: "grid", placeItems: "center", cursor: "pointer", color: "var(--text)" }}>
            <I.Plus size={19} strokeWidth={2.4} style={{ transition: "transform 0.34s cubic-bezier(0.34,1.5,0.4,1)", transform: createOpen ? "rotate(45deg)" : "none" }} />
          </button>
        </div>
      </div>
      {typeof CreateMenuLive === "function" && <CreateMenuLive open={createOpen} onClose={() => setCreateOpen(false)} anchorRef={addBtnRef} navigate={navigate} />}

      {/* ПОИСК по всей ленте: круги (живые + облачные) · партнёры · программы. */}
      {/* Поле по макету: не белая карточка с тенью, а серая заливка 44px — стандартное
          поле поиска iOS (в макете Text Field Search 361×44). */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface-3)", borderRadius: 12, padding: "0 12px", height: 44, margin: "0 2px 10px" }}>
        <I.Search size={17} strokeWidth={2.2} color="var(--text-3)" style={{ flexShrink: 0 }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={seg === "people" ? "Кто нужен: тексты, йога, аналитика…" : "Поиск"} aria-label={seg === "people" ? "Поиск по людям и вкладам" : "Поиск по сообществу"}
          style={{ flex: 1, minWidth: 0, border: 0, outline: "none", background: "transparent", fontSize: 17, color: "var(--text)" }} />
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
      /* ЧИПЫ ПО МАКЕТУ (Badge Line 36px, зазор 8, боковые 16). Было: три равных сегмента в
          одном жёлобе. Стало: отдельные чипы-таблетки, которые ЕДУТ ГОРИЗОНТАЛЬНО — в макете
          строка чипов шире экрана (507 при ширине 393), значит она задумана прокручиваемой,
          и новые разделы можно дописывать, не сжимая остальные.
          «Все» — новая комната-обзор. «Круги» переименованы в «Группы» по макету; в остальном
          приложении слово пока прежнее — сквозное переименование отдельным заходом. */
      <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 2px 2px", margin: "0 -12px 0", paddingLeft: 14, paddingRight: 14, scrollbarWidth: "none" }}>
        {[["all", "Все"], ["circles", "Группы"], ["people", "Люди"], ["partners", "Партнёры"]].map(([id, t]) => {
          const on = seg === id;
          return (
            <button key={id} onClick={() => setFilter(id)} className="tap" data-haptic="selection"
              data-tour={id === "people" ? "network" : undefined}
              style={{ flexShrink: 0, border: 0, cursor: "pointer", borderRadius: 999, height: 36, padding: "0 16px",
                fontSize: 15, fontWeight: on ? 590 : 400, letterSpacing: "-0.2px", transition: "background 0.16s, color 0.16s",
                background: on ? "var(--cta)" : "var(--surface-3)",
                color: on ? "var(--cta-ink)" : "var(--text)" }}>
              {t}
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
                    <span style={{ width: 44, height: 44, borderRadius: 14, background: (typeof bosMixHex === "function" && isDark) ? bosMixHex(p.accent, "#101014", 0.48) : p.accent, display: "grid", placeItems: "center", fontSize: 24, flexShrink: 0 }}>{bosIconOf(p, 24, null)}</span>
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
        {/* ══ КРУГИ — комната «с кем делать». Читается сверху вниз: сначала ТВОИ круги живыми
            карточками, потом чужие открытые, потом готовые челленджи и «собери свой», и только в
            самом низу — как всё устроено. Раньше здесь первым шла лента гайдов, а живые люди
            лежали под ней. ══ */}
        {/* ══ ВСЕ — обзорная комната (кадр «Мои сообщества»). Читается сверху вниз: сначала то,
            что просит внимания (мало активности), потом твои группы, потом люди, потом то,
            куда можно пойти. Каждый блок — короткий, с переходом в свою комнату. ══ */}
        {seg === "all" && (
          <React.Fragment>
            {/* МАЛО АКТИВНОСТИ. Считается тем же счётчиком залётов, что решает вылет из круга,
                только порог мягче (2 пропуска против 3). Нет таких кругов — блока нет:
                пустую плашку «всё хорошо» не рисуем, она бы только занимала экран. */}
            {lowCircles.length > 0 && (
              <BosBlock name="low-activity">
                <CommSectionHeadLive title="Мало активности" />
                <div style={{ background: "var(--card)", borderRadius: 16, overflow: "hidden" }}>
                  <button onClick={() => setLowOpen(!lowOpen)} className="tap" data-haptic="selection"
                    style={{ width: "100%", border: 0, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", textAlign: "left", color: "var(--text)" }}>
                    <span style={{ display: "inline-flex", flexShrink: 0 }}>
                      {lowCircles.slice(0, 3).map((t, i) => (
                        <span key={t._id || t.cloudId || i} style={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 16, overflow: "hidden",
                          background: "var(--surface-3)", boxShadow: "0 0 0 2px var(--card)", marginLeft: i ? -10 : 0 }}>{bosIconOf(t, 16, null, "\ud83d\udc65")}</span>
                      ))}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 17, fontWeight: 590 }}>{lowCircles.length + " " + _grpWord(lowCircles.length)}</span>
                      <span style={{ display: "block", fontSize: 15, color: "var(--text-2)", marginTop: 1 }}>Ты давно не участвовал в этих группах</span>
                    </span>
                    <I.ChevronRight size={17} color="var(--text-3)" style={{ flexShrink: 0, transition: "transform .2s", transform: lowOpen ? "rotate(90deg)" : "none" }} />
                  </button>
                  {lowOpen && lowCircles.map((t) => (
                    <button key={"lo" + (t._id || t.cloudId)} onClick={() => navigate("team-detail", { team: t, from: "community" })} className="tap"
                      style={{ width: "100%", border: 0, borderTop: "0.5px solid var(--line-2)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", textAlign: "left", color: "var(--text)" }}>
                      <span style={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 16, overflow: "hidden", background: "var(--surface-3)", flexShrink: 0 }}>{bosIconOf(t, 16, null, "\ud83d\udc65")}</span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 17, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                      <I.ChevronRight size={16} color="var(--text-3)" style={{ flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              </BosBlock>
            )}

            {/* МОИ ГРУППЫ — компактными строками, как в макете (аватар 44, имя, подпись,
                кнопка чата). Полные карточки живут в комнате «Группы» — здесь обзор. */}
            {myCircles.length > 0 && (
              <BosBlock name="my-groups">
                <CommSectionHeadLive title="Мои группы" note={myCircles.length + " " + _grpWord(myCircles.length)} onAll={() => setFilter("circles")} />
                <div style={{ background: "var(--card)", borderRadius: 16, overflow: "hidden" }}>
                  {myCircles.slice(0, 4).map((t, i) => (
                    <div key={t._id || t.cloudId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderTop: i ? "0.5px solid var(--line-2)" : 0 }}>
                      <button onClick={() => navigate("team-detail", { team: t, from: "community" })} className="tap"
                        style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12, border: 0, background: "transparent", cursor: "pointer", textAlign: "left", padding: 0, color: "var(--text)" }}>
                        <span style={{ width: 44, height: 44, borderRadius: 13, display: "grid", placeItems: "center", fontSize: 22, overflow: "hidden", background: "var(--surface-3)", flexShrink: 0 }}>{bosIconOf(t, 22, null, "\ud83d\udc65")}</span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: "block", fontSize: 17, fontWeight: 590, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                          <span style={{ display: "block", fontSize: 15, color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {t.vis === "public" ? "Открытая" : "Приватная"}
                          </span>
                        </span>
                      </button>
                      <button onClick={() => navigate("team-detail", { team: t, from: "community", tab: "chat" })} className="tap" aria-label={"Чат «" + t.name + "»"}
                        style={{ width: 34, height: 34, borderRadius: "50%", border: 0, background: "transparent", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}>
                        <I.MessageCircle size={19} strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              </BosBlock>
            )}

            {/* ДРУЗЬЯ — живые люди из твоих же кругов. Компонент сам прячется, если их нет. */}
            {typeof CircleFriendsStripLive === "function" && (
              <BosBlock name="friends">
                <CircleFriendsStripLive app={app} navigate={navigate} />
              </BosBlock>
            )}

            {typeof InviteFriendsCardLive === "function" && <InviteFriendsCardLive isDark={isDark} />}

            {/* Групп нет — говорим про ГРУППЫ, а не «тут ничего нет»: курсы ниже есть, и общая
                фраза противоречила бы собственному экрану. */}
            {myCircles.length === 0 && (
              <div style={{ background: "var(--card)", borderRadius: 16, padding: "32px 22px", textAlign: "center", marginTop: 4 }}>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px", color: "var(--text)" }}>Групп пока нет</div>
                <div style={{ fontSize: 15, color: "var(--text-2)", marginTop: 5, lineHeight: 1.35 }}>Вступи в группу или собери свою — и она появится здесь.</div>
                <button onClick={() => setFilter("circles")} className="tap"
                  style={{ marginTop: 18, border: 0, borderRadius: 999, padding: "13px 24px", fontSize: 17, fontWeight: 590, cursor: "pointer", background: "var(--cta)", color: "var(--cta-ink)" }}>Каталог групп</button>
              </div>
            )}
            {/* КУРСЫ — витрина без оплаты (решение David 19.08). Горизонтальная лента, как в
                макете; цена показана, но кнопки «купить» нет — карточка ведёт на разбор курса. */}
            <BosBlock name="courses">
              <CommSectionHeadLive title="Курсы" desc="Программы, которые ведут вживую" onAll={() => setFilter("partners")} />
              <div style={{ display: "flex", gap: 10, overflowX: "auto", margin: "0 -12px", padding: "0 14px 4px", scrollbarWidth: "none" }}>
                {courses.map((c) => (
                  <button key={c.id} onClick={() => { if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } navigate("course-detail", { course: c }); }} className="tap"
                    style={{ flexShrink: 0, width: 240, border: 0, borderRadius: 16, overflow: "hidden", background: "var(--card)", cursor: "pointer", textAlign: "left", padding: 0, color: "var(--text)" }}>
                    <span style={{ display: "grid", placeItems: "center", height: 108, fontSize: 40, background: c.accent }}>{c.i}</span>
                    <span style={{ display: "block", padding: "10px 12px 12px" }}>
                      <span style={{ display: "block", fontSize: 17, fontWeight: 590, letterSpacing: "-0.3px" }}>{c.t}</span>
                      <span style={{ display: "block", fontSize: 15, color: "var(--text-2)", marginTop: 1 }}>{c.lvl + " \u00b7 " + c.length}</span>
                      <span style={{ display: "block", fontSize: 15, color: "var(--text-2)", marginTop: 6 }}>{"Старт " + c.cohort}</span>
                      <span style={{ display: "block", fontSize: 17, fontWeight: 590, marginTop: 6 }}>{c.price}</span>
                    </span>
                  </button>
                ))}
              </div>
            </BosBlock>

          </React.Fragment>
        )}

        {seg === "circles" && (
          <React.Fragment>
            {/* ВСЕ КРУГИ ОДНИМ СПИСКОМ (David 2026-08-02: «нет смысла дублировать твои круги и
                открытые — это сразу все круги»). Сначала твои — полноценной карточкой, той же,
                что на Главной; следом чужие открытые той же карточкой с «Вступить». Один
                заголовок, один список, никакой стены разделов.
                Челленджи и «Собери свой» СПРЯТАНЫ по решению David — шаблоны отвлекали от живых
                кругов. Компоненты живы (SEED_CIRCLES / CIRCLE_STARTERS), вернуть = раскомментировать. */}
            <BosBlock name="circles">
              {/* Заголовок в языке макета — «Группы». Глубже по экрану слово «круг» ещё живёт
                  (оно у нас несущее: «круг», «в круге», «круг отпускает»), сквозное
                  переименование — отдельное решение, не побочный эффект этой правки. */}
              <CommSectionHeadLive title="Группы" />
              {myCircles.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
                  {myCircles.map((t) => <TeamTileLive key={t._id || t.cloudId} team={t} from="community" />)}
                </div>
              )}
              <CloudTeamsDiscoverLive app={app} navigate={navigate} hideHead={myCircles.length > 0} />
            </BosBlock>
            {typeof InviteFriendsCardLive === "function" && <InviteFriendsCardLive isDark={isDark} />}
            {/* КАК ВСЁ УСТРОЕНО — лента карточек-гайдов. Она учит, а не зовёт, поэтому стоит
                последней: сначала живые люди, потом объяснения. */}
            <BosBlock name="discovery"><DiscoveryFeedLive app={app} navigate={navigate} isDark={isDark} /></BosBlock>
          </React.Fragment>
        )}

        {seg === "partners" && (
          <React.Fragment>
            {/* КАРТА + СЕТКА партнёров ОДНИМ блоком (David: «карта и партнёры аккуратнее в одном
                блоке»): крупная карта Москвы сверху → под ней все партнёры сеткой. */}
            {typeof PartnersMapLive === "function" && <PartnersMapLive app={app} navigate={navigate} from="community" />}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "4px 4px 0" }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)" }}>🎁 Партнёры · потратить XP</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 700, color: "var(--text)" }}>🪙 {(typeof bosLiveSpendableXPLive === "function") ? bosLiveSpendableXPLive(app) : 0}</span>
            </div>
            {typeof PartnersGridLive === "function" && <PartnersGridLive app={app} navigate={navigate} from="community" />}
            {/* КАК СЮДА ПОПАДАЮТ ДРУГИЕ (v868): заявка → три поручительства от уровня ≥10. */}
            <BosBlock name="partner-add"><PartnerAddLive app={app} isDark={isDark} /></BosBlock>
          </React.Fragment>
        )}
        {/* Чип «Общие цели» — только настоящие публичные круги из облака + «Собери свой».
            Челленджи-шаблоны уехали на СВОЙ чип «Челленджи» (David 2026-07-17). */}
        {/* ЛЮДИ (v868) — «Твой вклад в окружение». Замка по уровню больше нет: вклад
            описывает кто угодно, а доверие набирается делами, а не уровнем.
            Прежние NetworkLive / HelperPathLive / SkillsWorkbenchLive / NetworkLockedLive
            сняты с экрана — см. комментарий у PeopleTabLive. */}
        {seg === "people" && <PeopleTabLive app={app} navigate={navigate} isDark={isDark} query={qDeb} />}

        {/* КУРСЫ — там же, где партнёры: обе двери про то, куда деть XP. */}
        {seg === "partners" && (
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
          {/* КУРСЫ ниже; сначала — дверь «как сюда попадают другие места». */}
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

  // Год для заголовка — сама грядка строит дни сама (BosFieldCalendarLive).
  var mY = today.getFullYear();

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

      {/* (2) КАЛЕНДАРЬ — ГРЯДКА (David 2026-08-01, единый календарь приложения). Прежние
          «Месяц / Год» с СЕРО-ЧЁРНОЙ теплокартой были третьим языком календаря в приложении:
          сегмент убран, масштаб один, цвет — цвет круга (нейтральный → золото). */}
      <div style={{ ...card, padding: "16px 16px 14px", marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.2px", color: "var(--text)" }}>{mY}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-4)" }}>{selKey === "all" ? "весь круг" : (selP && selP.me ? "ты" : (selP && ("" + (selP.name || "")).split(" ")[0]))}</div>
        </div>
        <BosFieldCalendarLive
          isDark={isDark}
          accent={(accent && accent[0] === "#" && ("" + accent).toLowerCase() !== "#0a0a0a" && accent !== "#8E8E93") ? accent : null}
          pctOf={function (k) { return selKey === "all" ? (allFrac[k] || 0) : (selDays[k] ? 1 : 0); }}
          unknownBefore={(function () { var d = new Date(today); d.setDate(d.getDate() - 26 * 7); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })()}
          hint={selKey === "all" ? "плотность = доля круга в дне" : "клетка = день"} />

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


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
  const _loading = _cloud && roster === null; // cloud roster not back yet → skeleton, never «ты один»
  const members = _cloud ? (roster || []) : (t.members || []);
  const count = members.length;
  const ruPart = (n) => { const m = n % 10, h = n % 100; return (m === 1 && h !== 11) ? "участник" : (m >= 2 && m <= 4 && (h < 10 || h >= 20)) ? "участника" : "участников"; };
  // Инфо ЧИПАМИ, не строчками вразброс (David: «чипы для разной инфо вместо разброса»).
  const chipS = { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600, color: "var(--text-2)", ...bosChipGlass(false), padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" };
  return (
    <div className="tap" onClick={() => navigate("team-detail", { team: t })} style={{ background: "var(--card)", boxShadow: "var(--card-shadow)", borderRadius: 22, padding: 18, position: "relative", overflow: "hidden", cursor: "pointer" }}>
      <div aria-hidden className="team-card__emblem" style={{ position: "absolute", top: -10, right: -6, fontSize: 110, lineHeight: 1, pointerEvents: "none", transform: "rotate(8deg)" }}>{bosIcon(t.emblem, 88, null)}</div>
      <div style={{ position: "relative" }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: "var(--text)", letterSpacing: "-0.4px" }}>{t.name}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {rhythm && rhythmN > 0 && <span style={{ ...chipS, color: "#1E8E4E", background: "rgba(52,199,89,0.13)", boxShadow: "none" }}>● сегодня {rhythmN} в ритме</span>}
          {t.goal && <span style={chipS}>🎯 {t.goal}</span>}
          {t.date && <span style={chipS}>📅 {t.date}</span>}
          {!_loading && count > 0 && <span style={chipS}>👥 {count}</span>}
          <span style={chipS}>{t.vis === "public" ? "🌐 Открытая" : "🔒 Приватная"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
          <span>{t.target ? "К цели" : "Прогресс цели"}</span>
          <span style={{ color: "var(--text)" }}>{t.target ? (cur + " / " + tgt + " " + (t.unit || "")) : Math.round(gp * 100) + "%"}</span>
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
// Пороги «лесенки» замочков на странице — легко правимые (David ещё не уверен в точных цифрах).
var BOS_DISC_GATES = { showcase: 3, people: 10, map: 3 };
// Шторки колоды — обложка «прожита», когда открыты все.
var BOS_DISC_SHEETS = ["core", "xp", "together", "ch", "partners", "people"];

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
        <div><div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>Уровень</div><div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 3, lineHeight: 1.4 }}>Путь. Только растёт, открывает двери — Люди, Основатель, Нетворк.</div></div>
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
function DiscoveryPartnersSheetLive({ app, navigate, isDark }) {
  const { close } = (typeof useSheet === "function") ? useSheet() : { close: () => {} };
  const goPartners = () => {
    close();
    try { app && app.setCommunityView && app.setCommunityView({ filter: "partners", section: "community", commTab: "network" }); } catch (e) {}
  };
  return (
    <div className="bos-sheet-scroll" style={{ paddingTop: 2, paddingLeft: 16, paddingRight: 16, color: "var(--text)" }}>
      {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
      <div style={_dSTitle}>Партнёры</div>
      <div style={_dSSub}>впечатления за твой опыт</div>
      <div style={{ position: "relative", background: "var(--card)", borderRadius: 18, padding: 14, display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--card-shadow)" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: "var(--text-4)" }}>ПАРТНЁРСКИЙ БИЛЕТ</div>
          <div style={{ fontSize: 15, fontWeight: 800, marginTop: 3, color: "var(--text)" }}>Тренировка · зал рядом</div>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>покажи код на входе</div>
        </div>
        <div style={{ borderLeft: "2px dashed var(--line)", paddingLeft: 14, width: 74, textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>100</div>
          <div style={{ fontSize: 10.5, color: "var(--text-4)" }}>✦ XP</div>
        </div>
      </div>
      <div style={{ ..._dSText, paddingTop: 10 }}>Залы, студии, практики и кофейни рядом принимают твой опыт: <b style={{ color: "var(--text)" }}>от 150 ✦</b> за настоящее — тренировку, медитацию, бачату. Копишь дома — тратишь в жизни.</div>
      <div style={_dSCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 34, height: 34, borderRadius: "50%", background: BOS_GOLD, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#0a0a0a"><circle cx="12" cy="8" r="3.6" /><path d="M4.8 20c.9-3.4 3.8-5.4 7.2-5.4s6.3 2 7.2 5.4" stroke="#0a0a0a" strokeWidth="2.2" fill="none" strokeLinecap="round" /></svg>
          </span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>Стать партнёром</div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2, lineHeight: 1.4 }}>Вырастешь — подашь своё предложение: публикации открываются с 3 уровня, рынок пользы — с 10.</div>
          </div>
        </div>
      </div>
      <button className="tap" style={_dGbtn} onClick={goPartners}>Открыть карту партнёров</button>
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
    { lvl: 8, t: "Основатель", d: "подарок: прыжок сразу на 10", lock: true },
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

// Открывает нужную шторку по id (для колоды и перекрёстных ссылок).
function bosDiscSheetNode(id, app, navigate, isDark) {
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
  var body = {
    xp: <path d="M12 2.2l2.4 7.4 7.4 2.4-7.4 2.4-2.4 7.4-2.4-7.4-7.4-2.4 7.4-2.4z" />,
    together: <g><circle cx="9" cy="8" r="3.4" /><path d="M3 19.4c0-3.3 2.7-5.6 6-5.6s6 2.3 6 5.6c0 .7-.55 1.25-1.25 1.25H4.25C3.55 20.65 3 20.1 3 19.4z" /><circle cx="17.2" cy="9" r="2.5" opacity="0.5" /><path d="M14.9 14.9c.7-.28 1.5-.42 2.3-.42 2.4 0 4.3 1.85 4.3 4.25 0 .55-.45 1-1 1h-3.4z" opacity="0.5" /></g>,
    ch: <path d="M12 2c1.2 3.4-.8 4.6-.8 6.8a3 3 0 0 0 5.9.6C18.6 11 20 13.2 20 15.3A8 8 0 1 1 4 15.3c0-2.6 1.6-4.2 2.6-5.8.5 1.9 1.4 2.6 2.5 2.6C8 9 10 5.4 12 2z" />,
    partners: <path d="M20.5 8.6V6.4c0-1-.8-1.8-1.8-1.8H5.3c-1 0-1.8.8-1.8 1.8v2.2a3.4 3.4 0 0 1 0 6.8v2.2c0 1 .8 1.8 1.8 1.8h13.4c1 0 1.8-.8 1.8-1.8v-2.2a3.4 3.4 0 0 1 0-6.8zM14 15.6l-2-1.3-2 1.3.6-2.3-1.8-1.5 2.3-.2 1-2.2 1 2.2 2.3.2-1.9 1.5z" />,
    people: <g><circle cx="10" cy="8" r="3.6" /><path d="M3.6 19.6c0-3.6 2.9-6 6.4-6 1.1 0 2.2.25 3.1.72a4.7 4.7 0 0 0-1.2 3.1v2.8H5.1c-.9 0-1.5-.6-1.5-.62z" /><path d="M17.5 12.8a3 3 0 0 0-3 3v.6h-.1c-.7 0-1.3.6-1.3 1.3v2.9c0 .7.6 1.3 1.3 1.3h6.2c.7 0 1.3-.6 1.3-1.3v-2.9c0-.7-.6-1.3-1.3-1.3h-.1v-.6a3 3 0 0 0-3-3zm0 1.6c.8 0 1.4.6 1.4 1.4v.6h-2.8v-.6c0-.8.6-1.4 1.4-1.4z" /></g>,
    lock: <path d="M12 3.6c2.8 0 5 2.2 5 5v2h.4c1 0 1.8.8 1.8 1.8v6.8c0 1-.8 1.8-1.8 1.8H6.6c-1 0-1.8-.8-1.8-1.8v-6.8c0-1 .8-1.8 1.8-1.8H7v-2c0-2.8 2.2-5 5-5zm0 2.2a2.8 2.8 0 0 0-2.8 2.8v2h5.6v-2A2.8 2.8 0 0 0 12 5.8z" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>{body[key] || null}</svg>;
}

// ── карточка колоды: свой цвет (bosGoalSkin — язык тонированных карточек привычек) + крупная
//    анимированная иконка, без XP-меты (David: «геймификацию „прочти карточку" не ставим»). ──
function _DiscCard({ id, accent, iconKey, title, desc, onOpen, onDismiss, isDark, animDelay }) {
  var sk = (accent && typeof bosGoalSkin === "function") ? bosGoalSkin(accent, isDark, true) : null;
  var iconInk = sk ? (sk.accent || accent) : "var(--text)";
  return (
    <button onClick={onOpen} className="tap" style={{ position: "relative", flexShrink: 0, scrollSnapAlign: "start", width: 152, height: 172, borderRadius: 22, background: sk ? sk.bg : "var(--card)", boxShadow: sk ? sk.shadow : "var(--card-shadow)", border: 0, padding: "14px 13px", display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", cursor: "pointer", overflow: "hidden", color: sk ? sk.txt : "var(--text)", fontFamily: "inherit" }}>
      {onDismiss && <_DiscX onClick={onDismiss} color={sk ? sk.sub : "var(--text-4)"} />}
      <span className="disc-bob" style={{ width: 56, height: 56, borderRadius: 18, background: sk ? sk.iconBg : "var(--surface-3)", display: "grid", placeItems: "center", marginBottom: 12, animation: "discBob 3.4s ease-in-out infinite", animationDelay: (animDelay || 0) + "s" }}>{_discIcon(iconKey, 30, iconInk)}</span>
      <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.2px", lineHeight: 1.2 }}>{title}</span>
      <span style={{ fontSize: 12, color: sk ? sk.sub : "var(--text-3)", lineHeight: 1.35, marginTop: 5 }}>{desc}</span>
    </button>
  );
}

// ═════ ЛЕНТА ═════
// Что открывается на уровне — для празднующей карточки level-up (fixes «уровень не празднуется»).
var BOS_LEVEL_UNLOCKS = { 3: "Первая публикация · Разбор привычек", 5: "Карточка «Люди» в ленте", 8: "Подарок «Основатель» — прыжок на 10", 10: "Нетворк · рынок пользы" };

// обложка «звёздное небо» → шторка «Суть» (без крестика)
function DiscoveryCoverCard({ onOpen }) {
  return (
    <button onClick={onOpen} className="tap" style={{ position: "relative", flexShrink: 0, scrollSnapAlign: "start", width: 196, height: 172, borderRadius: 22, border: 0, padding: "13px 12px 12px", display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", cursor: "pointer", overflow: "hidden", color: "#fff", fontFamily: "inherit", background: "radial-gradient(140% 110% at 82% -8%, #23232e 0%, #14141a 45%, #08080a 100%)" }}>
      <span aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {[[12, 14, 2, 0, 0.75], [32, 8, 1.5, 0, 0.5], [78, 12, 2.5, 1, 0.9], [64, 22, 1.5, 0, 0.6], [88, 38, 2, 0, 0.7], [22, 34, 1.5, 1, 0.85], [46, 30, 1.5, 0, 0.4], [70, 48, 1.5, 0, 0.5]].map((s, i) => (
          <span key={i} style={{ position: "absolute", left: s[0] + "%", top: s[1] + "%", width: s[2], height: s[2], borderRadius: "50%", background: s[3] ? BOS_GOLD : "#fff", opacity: s[4], boxShadow: s[3] ? "0 0 5px rgba(254,222,52,0.85)" : "0 0 3px rgba(255,255,255,0.5)" }} />
        ))}
      </span>
      <span style={{ position: "relative", fontSize: 9.5, fontWeight: 800, letterSpacing: 1.5, color: "rgba(255,255,255,0.5)", marginBottom: 7 }}>С ЧЕГО НАЧАТЬ</span>
      <span style={{ position: "relative", fontSize: 16, fontWeight: 700, letterSpacing: "-0.2px", lineHeight: 1.2 }}>Как устроен Balance</span>
      <span style={{ position: "relative", fontSize: 11.5, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>День · опыт · свои · мир</span>
      <span style={{ position: "relative", marginTop: "auto", fontSize: 11, fontWeight: 800, background: BOS_GOLD, color: "#0a0a0a", borderRadius: 999, padding: "3.5px 9px" }}>Суть · 1 минута ›</span>
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

// «Основатель»: тизер-замок (L6-7) ИЛИ живая карточка «Забрать» (L8-9 → FounderUnlockLive в «Люди»)
function DiscoveryFounderCard({ actionable, onTap, userLevel, founderLeft, founderW }) {
  if (actionable) {
    return (
      <button onClick={onTap} className="tap" style={{ position: "relative", flexShrink: 0, scrollSnapAlign: "start", width: 152, height: 172, borderRadius: 22, border: "1px solid " + BOS_GOLD, background: "var(--card)", boxShadow: "0 6px 18px rgba(254,222,52,0.28)", padding: "13px 12px 12px", display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", cursor: "pointer", overflow: "hidden", color: "var(--text)", fontFamily: "inherit" }}>
        <span style={{ width: 36, height: 36, borderRadius: "50%", background: BOS_GOLD, display: "grid", placeItems: "center", marginBottom: 9 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="#0a0a0a"><path d="M5 16L3 5l5.5 4L12 4l3.5 5L21 5l-2 11z" /></svg></span>
        <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.2px", lineHeight: 1.2 }}>Основатель</span>
        <span style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.35, marginTop: 4 }}>Подарок открыт — прыжок сразу на 10 уровень</span>
        <span style={{ marginTop: "auto", fontSize: 11, fontWeight: 800, background: BOS_GOLD, color: "#0a0a0a", borderRadius: 999, padding: "3.5px 9px" }}>Забрать ›</span>
      </button>
    );
  }
  return (
    <div style={{ position: "relative", flexShrink: 0, scrollSnapAlign: "start", width: 152, height: 172, borderRadius: 22, background: "var(--card)", boxShadow: "var(--card-shadow)", padding: "13px 12px 12px", display: "flex", flexDirection: "column", alignItems: "flex-start", overflow: "hidden", color: "var(--text)" }}>
      <span style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--surface-3)", display: "grid", placeItems: "center", marginBottom: 9, opacity: 0.55 }}>{_discIcon("lock", 18, "var(--text)")}</span>
      <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.2px", lineHeight: 1.2, opacity: 0.55 }}>Основатель</span>
      <span style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.35, marginTop: 4, opacity: 0.55 }}>Подарок на 8 уровне: прыжок сразу на 10</span>
      <span style={{ marginTop: "auto", width: "100%" }}>
        <span style={{ display: "block", height: 4, borderRadius: 99, background: "var(--surface-3)", overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: founderW + "%", borderRadius: 99, background: BOS_GOLD }} /></span>
        <span style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "var(--text-4)", marginTop: 6 }}>Ты на {userLevel} · осталось {founderLeft} {founderLeft === 1 ? "уровень" : (founderLeft >= 2 && founderLeft <= 4 ? "уровня" : "уровней")}</span>
      </span>
    </div>
  );
}

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
  const founderClaimed = (function () { try { return localStorage.getItem("bos:founder") === "1"; } catch (e) { return false; } })();

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
  const goPeople = () => { if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } try { app && app.setCommunityView && app.setCommunityView({ filter: "people", section: "community", commTab: "network" }); } catch (e) {} };

  // колода по правилам: стартовые с L1, «Люди» с L5; уход по прожитости. У каждой — свой цвет
  // (David: «разные карточки разного цвета — сразу обращаешь внимание»).
  const deckDefs = [
    { key: "xp", id: "xp", iconKey: "xp", accent: "#FF9F0A", title: "Опыт и уровень", desc: "Каждый ход — шаг по пути", show: true },
    { key: "together", id: "together", iconKey: "together", accent: "#0A84FF", title: "Вместе — больше", desc: "Совместные привычки и цели", show: !hasTogether },
    { key: "ch", id: "ch", iconKey: "ch", accent: "#FF453A", title: "Челленджи", desc: "Готовая привычка с призом", show: !hasChallenge },
    { key: "partners", id: "partners", iconKey: "partners", accent: "#BF5AF2", title: "Партнёры", desc: "Впечатления за твой опыт", show: !hasSpent },
    { key: "people", id: "people", iconKey: "people", accent: "#30C08B", title: "Люди", desc: "Закрытый круг — с 10 уровня", show: userLevel >= 5 },
  ];
  const founderLeft = Math.max(0, 8 - userLevel);
  const founderW = Math.max(4, Math.min(100, (userLevel / 8) * 100));
  const founderActionable = !founderClaimed && userLevel >= 8 && userLevel < 10;
  const founderTeaser = !founderClaimed && userLevel >= 6 && userLevel < 8;

  // порядок приоритета → кап ≤6 карточек одновременно (обложка «Суть» убрана — David: про механики
  // рассказываем отдельными карточками, отдельный «как устроено» не нужен).
  const nodes = [];
  if (showLevelUp) nodes.push(<DiscoveryLevelUpCard key={"lvl" + userLevel} level={userLevel} unlock={BOS_LEVEL_UNLOCKS[userLevel]} onOpen={() => { ackLevel(); openDisc("xp"); }} onDismiss={(ev) => { ev.stopPropagation(); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } ackLevel(); }} />);
  if (founderActionable) nodes.push(<DiscoveryFounderCard key="founder-go" actionable onTap={goPeople} />);
  let _di = 0;
  deckDefs.forEach((c) => { if (c.show && !dismissed[c.key]) { nodes.push(<_DiscCard key={c.key} {...c} isDark={isDark} animDelay={_di * 0.25} onOpen={() => openDisc(c.id)} onDismiss={(ev) => doDismiss(ev, c.key)} />); _di++; } });
  if (founderTeaser) nodes.push(<DiscoveryFounderCard key="founder-teaser" userLevel={userLevel} founderLeft={founderLeft} founderW={founderW} />);
  const shown = nodes.slice(0, 6);

  return (
    <div className="bos-hscroll" style={{ display: "flex", gap: 10, overflowX: "auto", padding: "10px 12px 12px 4px", margin: "2px -12px 0 0", scrollSnapType: "x proximity", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
      {shown}
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
  var sig = teams.map(function (t) { return t.cloudId; }).join(",");
  var _m = React.useState(null), map = _m[0], setMap = _m[1];
  var _i = React.useState(null), meId = _i[0], setMeId = _i[1];
  React.useEffect(function () {
    if (!(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.teamMembers) || !teams.length) { setMap({}); return; }
    var on = true;
    window.bosCloud.uid().then(function (id) { if (on) setMeId(id || null); }).catch(function () {});
    Promise.all(teams.map(function (t) { return window.bosCloud.teamMembers(t.cloudId).then(function (mem) { return { t: t, mem: Array.isArray(mem) ? mem : [] }; }).catch(function () { return { t: t, mem: [] }; }); }))
      .then(function (res) {
        if (!on) return;
        var m = {};
        res.forEach(function (r) { r.mem.forEach(function (p) { if (p && p.id && !m[p.id]) m[p.id] = { name: p.name || "Участник", avatar: p.avatar, teamName: r.t.name }; }); });
        setMap(m);
      });
    return function () { on = false; };
  }, [sig]);
  return { map: map, meId: meId };
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

// ── «ПОМОЩЬ КРУГА» — вклады людей ИЗ ТВОИХ КРУГОВ (свои без замка L10), лица + имена ──
// netOffers читается всеми (RLS using(true)); фильтруем по owner_id ∈ участники моих кругов.
// Факты доверия ✓подтверждения/✦следы появятся в Э2/Э4 — пока показываем ТОЛЬКО реальное
// (время/онлайн, места, «показана: круг …»), без выдуманных чисел. Пусто → блок скрыт.
function CircleHelpLive({ app, navigate, isDark }) {
  var cm = bosUseCircleMembers(app), map = cm.map, meId = cm.meId;
  var _o = React.useState(null), offers = _o[0], setOffers = _o[1];
  var _cf = React.useState({}), confs = _cf[0], setConfs = _cf[1]; // offerId -> { n, mine }
  var _t = React.useState(0), tick = _t[0], setTick = _t[1];
  React.useEffect(function () {
    if (!(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.netOffers)) { setOffers([]); return; }
    var on = true;
    window.bosCloud.netOffers(200).then(function (all) { if (on) setOffers(Array.isArray(all) ? all : []); }).catch(function () { if (on) setOffers([]); });
    return function () { on = false; };
  }, []);
  var shown = (map && offers) ? offers.filter(function (o) { return o && o.owner_id && o.owner_id !== meId && map[o.owner_id] && o.active !== false; }).slice(0, 3) : [];
  var shownSig = shown.map(function (o) { return o.id; }).join(",");
  React.useEffect(function () {
    if (!shown.length || !(window.bosCloud && window.bosCloud.netRoleConfirmations)) return;
    var on = true;
    Promise.all(shown.map(function (o) { return window.bosCloud.netRoleConfirmations(o.id).then(function (rc) { rc = rc || []; return { id: o.id, n: rc.length, mine: meId ? rc.some(function (x) { return x.confirmer_id === meId; }) : false }; }).catch(function () { return { id: o.id, n: 0, mine: false }; }); }))
      .then(function (res) { if (!on) return; var m = {}; res.forEach(function (r) { m[r.id] = { n: r.n, mine: r.mine }; }); setConfs(m); });
    return function () { on = false; };
  }, [shownSig, meId, tick]);
  if (!map || offers === null) return null;
  if (!shown.length) return null;
  var confirmRole = function (o) {
    if (!window.bosCloud || !window.bosCloud.netConfirmRole) return;
    setConfs(function (m) { var n = Object.assign({}, m); var cur = n[o.id] || { n: 0, mine: false }; n[o.id] = { n: cur.n + 1, mine: true }; return n; }); // оптимистично
    if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
    window.bosCloud.netConfirmRole(o.id).then(function (ok) { if (ok === false) setTick(function (n) { return n + 1; }); });
  };
  return (
    <div>
      <CommSectionHeadLive title="🤝 Помощь круга" onAll={null} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
        {shown.map(function (o) {
          var p = map[o.owner_id];
          var slots = Math.max(1, o.slots_week || 1);
          var person = { ownerId: o.owner_id, avatar: p.avatar, level: null, offers: [o] };
          var cf = confs[o.id] || { n: 0, mine: false };
          var isDraft = o.status === "draft"; // подтверждён (или до-SQL легаси) → сразу «Попросить»
          var canConfirm = isDraft && !cf.mine;
          var facts = [o.when_text, slots + " " + bosSlotsWord(slots)];
          if (cf.n > 0) facts.push("✓ " + cf.n);
          return (
            <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--card)", borderRadius: 22, padding: "13px 14px", boxShadow: "var(--card-shadow)", color: "var(--text)" }}>
              <button onClick={function () { if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } navigate("net-person", { person: person }); }} className="tap" style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12, border: 0, background: "transparent", textAlign: "left", cursor: "pointer", color: "var(--text)", padding: 0 }}>
                <BuddyFaceLive avatar={p.avatar} name={p.name} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(p.name || "").split(" ")[0]} · {o.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>{facts.filter(Boolean).join(" · ")}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-4)", marginTop: 2 }}>Показана: круг «{p.teamName}»{isDraft ? " · черновик" : ""}</div>
                </div>
              </button>
              {canConfirm
                ? <button onClick={function () { confirmRole(o); }} className="tap" style={{ flexShrink: 0, background: "linear-gradient(135deg,#FEDE34,#EF9F14)", color: "#0a0a0a", border: 0, borderRadius: 999, padding: "8px 13px", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>Подтвердить</button>
                : <button onClick={function () { if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } navigate("net-person", { person: person }); }} className="tap" style={{ flexShrink: 0, background: "var(--surface-3)", color: "var(--text-2)", border: 0, borderRadius: 999, padding: "8px 13px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Попросить</button>}
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
  var _t = React.useState(0), tick = _t[0], setTick = _t[1];
  React.useEffect(function () {
    if (!(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.netMyOffers)) { setOffers([]); return; }
    var on = true;
    window.bosCloud.netMyOffers().then(function (mine) {
      if (!on) return; mine = Array.isArray(mine) ? mine : []; setOffers(mine);
      var first = mine.filter(function (o) { return o && o.active !== false; })[0];
      if (first && window.bosCloud.netRoleConfirmations) window.bosCloud.netRoleConfirmations(first.id).then(function (rc) { if (on) setConfN((rc || []).length); }); else setConfN(0);
    }).catch(function () { if (on) { setOffers([]); setConfN(0); } });
    return function () { on = false; };
  }, [tick]);
  if (offers === null) return null;
  var open = function (offer) { if (typeof AddHelpFormatSheetLive === "function") s.open(<AddHelpFormatSheetLive app={app} offer={offer} onDone={function () { setTick(function (n) { return n + 1; }); }} />); };
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
  var statusKick = confirmed ? "Мой вклад · открыт кругам" : "Мой вклад · черновик в ближнем круге";
  var sub = confirmed ? "Роль подтверждена · дальше: первое дело у своих" : (n + " из 2 подтверждений · дальше: первое дело у своих");
  return (
    <div style={goldCard}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 800, letterSpacing: 0.5, color: "#9a6800", textTransform: "uppercase" }}>{shield} {statusKick}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{first.title}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 3 }}>{sub}</div>
        </div>
        <button onClick={function () { open(first); }} className="tap" data-haptic="selection" style={{ flexShrink: 0, background: "var(--surface-3)", color: "var(--text-2)", border: 0, borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Изменить</button>
      </div>
    </div>
  );
}

// ═════ Э2 · ШТОРКА «Добавить формат помощи» (валидация окружением) ═════════════════
// Безопасный каталог + границы + «Кто может подтвердить эту роль?» (лица из кругов) → сохранить:
// черновик (visibility='circles', status='draft'), 2 подтверждения → confirmed. Каталог из дока §1.
var BOS_HELP_CATALOG = [
  { key: "habit",   i: "🌱", t: "Поддержать привычку" },
  { key: "walk",    i: "🚶", t: "Позвать на прогулку" },
  { key: "return",  i: "🔄", t: "Помочь вернуться в ритм" },
  { key: "workout", i: "🏃", t: "Провести первую тренировку" },
  { key: "breath",  i: "🧘", t: "Провести дыхание или медитацию" },
  { key: "week",    i: "🗓️", t: "Разобрать неделю" },
  { key: "meet",    i: "🤝", t: "Собрать маленькую встречу" },
];

function AddHelpFormatSheetLive({ app, offer, onDone }) {
  var s = (typeof useSheet === "function") ? useSheet() : { close: function () {} };
  var editing = !!(offer && offer.id);
  var cm = bosUseCircleMembers(app);
  var members = (cm.map ? Object.keys(cm.map) : []).filter(function (id) { return id !== cm.meId; }).map(function (id) { return { id: id, name: cm.map[id].name, avatar: cm.map[id].avatar }; });
  var initCat = BOS_HELP_CATALOG.filter(function (c) { return offer && c.t === offer.title; })[0];
  var _c = React.useState(initCat ? initCat.key : (editing ? "" : "habit")); var catKey = _c[0], setCatKey = _c[1];
  var _m = React.useState(20); var mins = _m[0], setMins = _m[1];
  var _p = React.useState("онлайн"); var place = _p[0], setPlace = _p[1];
  var _pk = React.useState({}); var picked = _pk[0], setPicked = _pk[1];
  var _b = React.useState(false); var busy = _b[0], setBusy = _b[1];
  var cat = BOS_HELP_CATALOG.filter(function (c) { return c.key === catKey; })[0];
  var togMin = function () { setMins(function (m) { return m === 15 ? 20 : m === 20 ? 30 : 15; }); };
  var togPlace = function () { setPlace(function (p) { return p === "онлайн" ? "рядом" : "онлайн"; }); };
  var togPick = function (id) { setPicked(function (m) { var n = Object.assign({}, m); if (n[id]) delete n[id]; else if (Object.keys(n).length < 3) n[id] = true; return n; }); };
  var save = async function () {
    if (!cat || busy) return; setBusy(true);
    var when = mins + " мин · " + place, row = null;
    try { row = await window.bosCloud.netUpsertOffer({ id: offer && offer.id, emoji: cat.i, title: cat.t, descr: "", price_xp: 0, slots_week: 2, when_text: when, min_level: (offer && offer.min_level) || 10, visibility: "circles", status: (offer && offer.status) || "draft", active: true }); } catch (e) {}
    try { var oid = (row && row.id) || (offer && offer.id); if (oid) localStorage.setItem("bos:offerAsked:" + oid, JSON.stringify(Object.keys(picked))); } catch (e) {}
    setBusy(false); if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} } if (onDone) onDone(); s.close();
  };
  var kick = { fontSize: 11, fontWeight: 800, letterSpacing: 0.6, color: "var(--text-4)", textTransform: "uppercase", padding: "16px 2px 8px" };
  var chipOn = { background: "rgba(254,222,52,0.28)", border: "1px solid #EF9F14", color: "var(--text)", borderRadius: 999, padding: "8px 13px", fontSize: 12.5, fontWeight: 600 };
  return (
    <div className="bos-sheet-scroll" style={{ paddingTop: 2, paddingLeft: 16, paddingRight: 16, color: "var(--text)" }}>
      {typeof SheetGreyBgLive === "function" && <SheetGreyBgLive />}
      <div style={_dSTitle}>Добавить формат помощи</div>
      <div style={_dSSub}>безопасный каталог · роль подтверждает твоё окружение</div>

      <div style={kick}>Как ты можешь помочь?</div>
      <div style={{ background: "var(--card)", borderRadius: 18, boxShadow: "var(--card-shadow)", overflow: "hidden" }}>
        {BOS_HELP_CATALOG.map(function (c, i) {
          var on = c.key === catKey;
          return (
            <button key={c.key} onClick={function () { setCatKey(c.key); if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } }} className="tap" style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: 0, borderTop: i ? "0.5px solid var(--line)" : 0, background: "transparent", textAlign: "left", cursor: "pointer", color: on ? "var(--text)" : "var(--text-3)", fontWeight: on ? 700 : 600 }}>
              <span style={{ width: 30, height: 30, borderRadius: 10, background: "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 16, flexShrink: 0 }}>{c.i}</span>
              <span style={{ flex: 1, fontSize: 14.5 }}>{c.t}</span>
              <span style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", background: on ? "#EF9F14" : "transparent", border: on ? 0 : "1.5px solid var(--line)" }}>{on && <svg width="12" height="12" viewBox="0 0 14 14"><path d="M2.8 7.4l2.9 2.9 5.5-6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}</span>
            </button>
          );
        })}
      </div>

      <div style={kick}>Границы формата</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        <button onClick={togMin} className="tap" style={{ ...chipOn, cursor: "pointer" }}>{mins} минут</button>
        <button onClick={togPlace} className="tap" style={{ ...chipOn, cursor: "pointer" }}>{place}</button>
        <span style={chipOn}>2 места в неделю</span>
        <span style={chipOn}>Сначала ближний круг</span>
        <span style={chipOn}>Без обещаний результата</span>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--text-4)", lineHeight: 1.45, padding: "8px 2px 0" }}>Без медицины, терапии и финансов — каталог только из безопасных форматов.</div>

      <div style={kick}>Кто может подтвердить эту роль?</div>
      {members.length ? (
        <div className="bos-hscroll" style={{ display: "flex", gap: 10, overflowX: "auto", padding: "2px 2px 4px" }}>
          {members.slice(0, 10).map(function (p) {
            var on = !!picked[p.id];
            return (
              <button key={p.id} onClick={function () { togPick(p.id); }} className="tap" data-no-haptic style={{ flexShrink: 0, border: 0, background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, width: 56 }}>
                <span style={{ position: "relative", borderRadius: "50%", boxShadow: on ? "0 0 0 2px var(--card), 0 0 0 4px #EF9F14" : "none" }}>
                  <BuddyFaceLive avatar={p.avatar} name={p.name} size={44} />
                  <span style={{ position: "absolute", right: -2, bottom: -2, width: 18, height: 18, borderRadius: "50%", background: on ? "#EF9F14" : "var(--surface-3)", border: "2px solid var(--card)", display: "grid", placeItems: "center" }}>{on ? <svg width="9" height="9" viewBox="0 0 14 14"><path d="M2.8 7.4l2.9 2.9 5.5-6" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg> : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>}</span>
                </span>
                <span style={{ fontSize: 11, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 56, textAlign: "center" }}>{(p.name || "").split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.45, padding: "0 2px" }}>Появится, когда у тебя будут круги с людьми — они и подтвердят роль. Пока можно сохранить черновик.</div>
      )}
      <div style={{ fontSize: 11.5, color: "var(--text-4)", lineHeight: 1.45, padding: "8px 2px 0" }}>Люди из твоих кругов, которые видели тебя в этом деле.</div>

      <div style={{ marginTop: 14, background: "var(--card)", border: "1px solid rgba(239,159,20,0.35)", borderRadius: 16, padding: 13, display: "flex", alignItems: "center", gap: 11 }}>
        <span style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#FEDE34,#EF9F14)", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 17 }}>🌙</span>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>Черновик в ближнем круге</div>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 1, lineHeight: 1.35 }}>2 подтверждения → первое действие → след пользы → шире</div>
        </div>
      </div>

      <button onClick={save} disabled={!cat || busy} className="tap" style={{ width: "100%", marginTop: 14, marginBottom: 8, border: 0, background: cat ? "linear-gradient(135deg,#FEDE34,#EF9F14)" : "var(--surface-3)", color: cat ? "#0a0a0a" : "var(--text-4)", fontSize: 15, fontWeight: 800, borderRadius: 16, padding: 14, cursor: cat ? "pointer" : "default", boxShadow: cat ? "0 6px 16px rgba(239,159,20,0.32)" : "none" }}>{editing ? "Сохранить формат" : "Сохранить и запросить подтверждения"}</button>
    </div>
  );
}

// ── «ТВОЙ ПУТЬ ПОМОЩНИКА» — лесенка валидации (на «Люди», до L10) ──
// Формат ✓ → Подтверждения круга N/2 (лица) → Первое дело → Следы → Нетворк L10.
function HelperPathLive({ app, navigate, isDark }) {
  var s = (typeof useSheet === "function") ? useSheet() : { open: function () {} };
  var cm = bosUseCircleMembers(app);
  var _o = React.useState(null), offers = _o[0], setOffers = _o[1];
  var _rc = React.useState([]), confIds = _rc[0], setConfIds = _rc[1];
  var _t = React.useState(0), tick = _t[0], setTick = _t[1];
  React.useEffect(function () {
    if (!(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.netMyOffers)) { setOffers([]); return; }
    var on = true;
    window.bosCloud.netMyOffers().then(function (mine) {
      if (!on) return; mine = Array.isArray(mine) ? mine : []; setOffers(mine);
      var first = mine.filter(function (o) { return o && o.active !== false; })[0];
      if (first && window.bosCloud.netRoleConfirmations) window.bosCloud.netRoleConfirmations(first.id).then(function (rc) { if (on) setConfIds((rc || []).map(function (x) { return x.confirmer_id; })); });
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
    { st: first ? "done" : "now", t: "Формат выбран", d: first ? (first.title + " · черновик у ближнего круга") : "Выбери формат из безопасного каталога", cta: !first },
    { st: !first ? "future" : (confirmed ? "done" : "now"), t: "Подтверждения круга", d: confSub, badge: (first && !confirmed) ? (confN + "/2") : null, faces: confFaces.concat(waitFaces.map(function (f) { return { _w: 1, avatar: f.avatar, name: f.name }; })) },
    { st: confirmed ? "now" : "future", t: "Первое дело у своих", d: "Просьбы ближнего круга придут сюда" },
    { st: "future", t: "Следы пользы", d: "«Спасибо» от тех, кому помог" },
    { st: lvl >= 10 ? "done" : "future", t: "Нетворк · опубликовать всем", d: "С 10 уровня · рынок пользы", lock: true },
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
  const setFilter = (f) => setView({ filter: f, section: _pairFor[f] || "discover", commTab: f === "training" ? "courses" : "network" });
  const isDark = app?.themeOverride === "dark";
  const { open: _openSheet } = (typeof useSheet === "function") ? useSheet() : { open: () => {} };

  // ── ПОИСК по ленте (Э2 редизайна): круги (облако + живые витрины) · партнёры · программы.
  // Дебаунс 350мс бережёт облако; от 2 символов. Пока ищем — чипы и лента уступают результатам.
  const [q, setQ] = React.useState("");
  const [qDeb, setQDeb] = React.useState("");
  const [cloudHits, setCloudHits] = React.useState(null); // null = ждём облако (для пустышки)
  React.useEffect(() => { const t = setTimeout(() => { setQDeb(q.trim()); setCloudHits(null); }, 350); return () => clearTimeout(t); }, [q]);
  const searching = qDeb.length >= 2;
  const _qq = qDeb.toLowerCase();
  const _hit = (...fs) => fs.some((f) => ("" + (f || "")).toLowerCase().indexOf(_qq) !== -1);
  // Живые круги: фейк сведён к ОДНОМУ примеру (David) — реальные круги ищутся через
  // CloudTeamsDiscoverLive (настоящий поиск публичных кругов). Пример может совпасть по слову.
  const lcHits = searching && typeof LIVING_CIRCLES !== "undefined"
    ? LIVING_CIRCLES.slice(0, 1).filter((s) => _hit(s.t, s.hook, (s.habits || []).map((h) => h.name).join(" "))) : [];
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
  const xpInLevel = _commLvl ? _commLvl.into : 0;
  const xpForNext = _commLvl ? _commLvl.span : 2000;
  const levelsLeft = Math.max(0, 10 - userLevel);
  const weeksToUnlock = Math.max(1, levelsLeft);
  // «Основатель» уже получен? (разовый подарок первому дошедшему — прыжок на 10 + Нетворк).
  const founderClaimed = (function () { try { return localStorage.getItem("bos:founder") === "1"; } catch (e) { return false; } })();

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
  const nothingFound = searching && cloudHits === 0 && !lcHits.length && !pHits.length && !cHits.length;

  return (
    <div className="page-in" style={{ padding: "0 12px 24px" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 4px 12px" }}>
        <div style={{ flex: 1, fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)" }}>Сообщество</div>
        {/* «Новая команда» убрана: круги создаются на вкладке Привычки → «+». Сообщество = только найти/расти. */}
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
        {/* Иконки у категорий (David: «svg-иконок не хватает, чтобы чётче отличать»). */}
        {[["all", "Все", I.Globe], ["circles", "Круги", I.Group], ["people", "Люди", I.Users], ["partners", "Партнёры", I.Heart], ["training", "Курсы", I.Bolt]].map(([id, t, Ic]) => {
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

      {/* Живая строка (VISION): сколько разных людей поставили отметку сегодня. */}
      {!searching && pulseN > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 4px 0" }}>
          <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: "#34C759", boxShadow: "0 0 0 3px rgba(52,199,89,0.16)", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "var(--text-3)" }}>Сейчас {pulseN} {_pulseWord(pulseN)}</span>
        </div>
      )}

      {/* РЕЗУЛЬТАТЫ ПОИСКА — те же карточки, что в ленте; тап ведёт туда же. */}
      {searching && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
          {lcHits.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)", padding: "4px 4px 8px" }}>🌱 Живые круги</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {lcHits.map((s) => (
                  <button key={s.id} onClick={() => { if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } if (typeof LivingCircleSheetLive === "function") _openSheet(<LivingCircleSheetLive circle={s} navigate={navigate} />); }} className="tap"
                    style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--card)", borderRadius: 22, padding: 14, boxShadow: "var(--card-shadow)", border: 0, textAlign: "left", width: "100%", cursor: "pointer", color: "var(--text)" }}>
                    <span style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))", display: "grid", placeItems: "center", fontSize: 24, flexShrink: 0 }}>{bosIcon(s.i, 24, null)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15.5, fontWeight: 600 }}>{s.t}</div>
                      <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.hook}</div>
                    </div>
                    <I.ChevronRight size={16} color="var(--text-4)" style={{ flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </div>
          )}
          <CloudTeamsDiscoverLive app={app} query={qDeb} onCount={setCloudHits} />
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
            <DiscoveryFeedLive app={app} navigate={navigate} isDark={isDark} />
            {/* ── СООБЩЕСТВО v2 · Э1 «Одно окно» (ЖИВЫЕ данные, пусто = скрыто): Подходит сейчас →
                Мои круги → Помощь круга → Мой вклад. Ставятся сразу под лентой открытий, партнёры
                и витрина кругов остаются ниже (не трогаем проверенную механику). */}
            <CommunitySuggestLive app={app} navigate={navigate} isDark={isDark} onOpen={() => setFilter("circles")} />
            <MyCirclesLive app={app} navigate={navigate} isDark={isDark} onAll={() => setFilter("circles")} />
            <CircleHelpLive app={app} navigate={navigate} isDark={isDark} />
            <MyContributionStatusLive app={app} navigate={navigate} isDark={isDark} />
            {/* КАРТА партнёров — под замком до BOS_DISC_GATES.map уровня (David 2026-07-10: «карта
                партнёров тоже должна быть закрыта под замочком»). Порог правится в BOS_DISC_GATES. */}
            {typeof PartnersMapLive === "function" && (
              <div>
                <CommSectionHeadLive title="🗺 Партнёры рядом" onAll={() => setFilter("partners")} />
                <div style={{ marginTop: 10 }}>
                  <DiscoveryVeil gate={BOS_DISC_GATES.map} level={userLevel} isDark={isDark} label={"Откроется с " + BOS_DISC_GATES.map + " уровня"}>
                    <PartnersMapLive app={app} navigate={navigate} from="community" />
                  </DiscoveryVeil>
                </div>
              </div>
            )}
            {/* Партнёры — «на что потратить XP»: живые вещи (медитация/бачата/бокс) за копилку.
                Лесенка раскрытия (David): под мягкой вуалью-замком до BOS_DISC_GATES.showcase уровня. */}
            {typeof PartnersShowcaseLive === "function" && (
              <DiscoveryVeil gate={BOS_DISC_GATES.showcase} level={userLevel} isDark={isDark} label={"Откроется с " + BOS_DISC_GATES.showcase + " уровня"}>
                <PartnersShowcaseLive app={app} navigate={navigate} onAll={() => setFilter("partners")} />
              </DiscoveryVeil>
            )}
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
        {filter === "all" && typeof NetworkPeekLive === "function" && (
          /* Баннер «Люди» — ВТОРЫМ блоком, заметный (David: «суть нравится, но тоненький и в
             незаметном месте»). Тап → чип «Люди». */
          <NetworkPeekLive unlocked={userLevel >= 10} onOpen={() => setFilter("people")} />
        )}

        {(filter === "all" || filter === "circles") && (
          <React.Fragment>
            {/* КРУГИ (v526): ЕДИНЫЙ язык плиток — мозаика 2 колонки по макету, вместо трёх
                разных горизонтальных лент. На «Все» — превью 4 плитки (2 живых + 2 челленджа);
                чип «Круги» — все группы теми же плитками. Тапы прежние: живой → шторка-превью
                с «Постучаться», челлендж → подтверждение → старт, пресет → форма создания. */}
            {filter === "all" ? (
              <React.Fragment>
              {/* Обзор (David: «каждая категория со скроллом вбок» + «в ленте должна быть ИХ
                  карточка с орбитами, не новая»): живые круги — НАСТОЯЩИЕ карточки
                  LivingCircleCardLive (лица и привычки на кольцах), фикс-ширина в ленте,
                  соседняя выглядывает; следом — компакт-плитки челленджей. */}
              <CommSectionHeadLive title="🌱 Круги" onAll={() => setFilter("circles")} />
              {/* Выравнивание (David): СЛЕВА первая карточка ровно под кикером (padding-left 4 от
                  колонки страницы), СПРАВА уходит за экран (margin-right -12). Не bleed с обеих сторон.
                  Карточки НАШЕГО размера (w=300): чётные — вариант «чипы», нечётные — «с орбитой»,
                  чтобы David сравнил оба вживую (круги — примеры). */}
              <div className="bos-hscroll" style={{ display: "flex", alignItems: "stretch", gap: 10, overflowX: "auto", padding: "3px 12px 14px 4px", margin: "-2px -12px 0 0", scrollSnapType: "x proximity", WebkitOverflowScrolling: "touch" }}>
                {/* Живые круги: ОДИН пример-карточка (David) — весь реальный список открывается по «Все ›». */}
                {LIVING_CIRCLES.slice(0, 1).map((s, i) => (
                  <LivingCircleCardLive key={s.id} circle={s} w={300} variant="chips"
                    onTap={() => { if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } if (typeof LivingCircleSheetLive === "function") _openSheet(<LivingCircleSheetLive circle={s} navigate={navigate} />); }} />
                ))}
                {SEED_CIRCLES.map((s) => {
                  const mine = (app?.teams || []).find((t) => t.seedId === s.id);
                  return (
                    <button key={s.id} onClick={() => {
                        if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} }
                        if (mine) { navigate("team-detail", { team: mine, from: "community" }); return; }
                        _openSheet(<ChallengeStartSheetLive seed={s} onStart={() => bosStartSeedCircleLive(app, navigate, s)} />);
                      }} className="tap"
                      style={{ flex: "0 0 auto", width: 152, scrollSnapAlign: "start", background: "var(--card)", border: 0, borderRadius: 18, padding: 13, textAlign: "left", color: "var(--text)", boxShadow: "var(--card-shadow)", display: "flex", flexDirection: "column", justifyContent: "center", gap: 9, cursor: "pointer" }}>
                      <span style={{ width: 40, height: 40, borderRadius: 13, background: BOS_TILE_SHEEN + ", linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe8))", boxShadow: (typeof bosTileGlass === "function") ? bosTileGlass(isDark) : "none", display: "grid", placeItems: "center", fontSize: 20 }}>{bosIcon(s.emblem, 20, null)}</span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 14, fontWeight: 600, letterSpacing: "-0.2px", lineHeight: 1.25 }}>{s.name}</span>
                        <span style={{ display: "block", fontSize: 11.5, color: mine ? "#34C759" : "var(--text-4)", marginTop: 3, lineHeight: 1.35 }}>{mine ? "Ты в деле ✓" : s.goalText + " · +" + s.reward + " XP"}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <CommSectionHeadLive title="✨ Живые круги" />
                {/* David: живые круги теперь НАСТОЯЩИЕ (из облака) + ОДИН пример-карточка. Сделаешь
                    свою цель открытым кругом — она появится здесь среди реальных. */}
                <div style={{ fontSize: 12, color: "var(--text-4)", padding: "0 4px 8px", lineHeight: 1.4 }}>Пример круга — так он выглядит, когда наполнится жизнью 👇</div>
                {LIVING_CIRCLES.slice(0, 1).map((s) => (
                  <LivingCircleCardLive key={s.id} circle={s} variant="chips"
                    onTap={() => { if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } if (typeof LivingCircleSheetLive === "function") _openSheet(<LivingCircleSheetLive circle={s} navigate={navigate} />); }} />
                ))}
                {/* НАСТОЯЩИЕ открытые круги из облака (в т.ч. твоя цель-круг, если открыть её). */}
                <div style={{ marginTop: 12 }}><CloudTeamsDiscoverLive app={app} /></div>
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
              </React.Fragment>
            )}
            {/* РЕАЛЬНАЯ жизнь — живые лица из твоих кругов (скрыто, если людей нет). */}
            {typeof CircleFriendsStripLive === "function" && <CircleFriendsStripLive app={app} navigate={navigate} />}
            {filter === "circles" && (
              <React.Fragment>
                {/* Позови своих — родной выбор контактов Telegram (реферал). */}
                {typeof InviteFriendsCardLive === "function" && <InviteFriendsCardLive isDark={isDark} />}
                {/* Реальные открытые круги теперь показаны выше, под «Живые круги» (не дублируем). */}
              </React.Fragment>
            )}
          </React.Fragment>
        )}

        {filter === "people" && (
          <div style={{ marginTop: 0 }}>
            {userLevel >= 10 ? (
              // НАСТОЯЩИЙ Нетворк: твоя карточка + реальные дошедшие (без выдуманных людей).
              <NetworkLive navigate={navigate} app={app} level={userLevel} isDark={isDark} />
            ) : (
              <React.Fragment>
                {/* Э2 · «Твой путь помощника» — валидация видна ДО L10 (свои — без замка): формат →
                    подтверждения круга → первое дело → следы → Нетворк L10. */}
                <div style={{ marginBottom: 12 }}><HelperPathLive app={app} navigate={navigate} isDark={isDark} /></div>
                {/* Подарок «Основатель» первому дошедшему (8–9 ур.): прыжок на 10 + открытый Нетворк. */}
                {userLevel >= 8 && !founderClaimed && typeof FounderUnlockLive === "function" && (
                  <div style={{ marginBottom: 12 }}><FounderUnlockLive app={app} isDark={isDark} /></div>
                )}
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


        {/* Финал обзора «Все»: позови своих — путь приглашения живёт в «Найти» (решение David:
            с главной убран). На чипе «Круги» карточка живёт внутри полного раздела. */}
        {filter === "all" && typeof InviteFriendsCardLive === "function" && <InviteFriendsCardLive isDark={isDark} />}
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
      if (_rosterLive && window.bosCloud && window.bosCloud.updateTeamHabit) window.bosCloud.updateTeamHabit(editId, data).then(() => setHabitsTick((n) => n + 1));
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
  const editGoalLike = { _id: t._id, id: t.id, cloudId: t.cloudId, __isTeam: true, __team: t, name: t.name, emoji: t.emblem, color: t.accent, target: t.target, unit: t.unit, deadline: t.date || t.deadline || "", circle: true, type: t.type, vis: t.vis, stake: t.stake, goal: t.goal, desc: desc, joined: t.joined, circleBalanceOn: circleBalOn, habitIds: [] };
  // Сводки для свёрнутых секций единого блока (David: «краткая сводка на каждом»).
  const _myDoneCount = teamHabits.filter((h) => myDone(h)).length;
  const _habitWordT = (n) => (n % 10 === 1 && n % 100 !== 11) ? "привычка" : ((n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? "привычки" : "привычек");
  return (
    <div className="page-in" style={{ paddingBottom: 24 }}>
      {/* HERO — full-bleed до самого верха, снизу скруглён (как у партнёра). Внутри: назад слева;
          правка(владелец)/позвать/ЧАТ стеклом справа; орбита-пульс, %, имя, описание; вся инфа
          под орбитой = ЧИПЫ (люди/осталось/режим/приватность) + 1-2 чипа «от ИИ». David-редизайн. */}
      <div style={{ position: "relative", background: H.bg,
          marginTop: "calc(-1 * max(60px, var(--tg-top-inset, env(safe-area-inset-top, 0px))))",
          padding: "calc(max(60px, var(--tg-top-inset, env(safe-area-inset-top, 0px))) + 10px) 18px 20px",
          borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => navigate(from)} className="tap" aria-label="Назад" style={heroBtn}><I.ChevronLeft size={20} strokeWidth={2.4} /></button>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {_isOwner && <button onClick={() => openSheet(<GoalFormSheetLive mode="edit" circleOn={true} navigate={navigate} returnTo={from} goal={editGoalLike} />)} className="tap" data-haptic="selection" aria-label="Настройки цели" style={heroBtn}><I.Pencil size={16} strokeWidth={2} /></button>}
            <button onClick={() => openSheet(<TeamShareSheetLive team={t} />)} className="tap" data-haptic="selection" aria-label="Позвать в круг" style={heroBtn}><I.Share size={16} strokeWidth={2} /></button>
            {/* ЧАТ — стеклянная кнопка-ПИЛЮЛЯ справа В HERO с надписью «Чат» (David: «добавь подпись
                Чат справа от иконки и сделай чуть шире двух слева»); значок непрочитанных сохранён. */}
            <button onClick={() => { markChatRead(); navigate("team-chat", { team: t, from }); }} className="tap" aria-label="Чат цели" style={{ ...heroBtn, display: "flex", alignItems: "center", justifyContent: "center", width: "auto", borderRadius: 999, padding: "0 16px", gap: 7, position: "relative" }}><I.MessageCircle size={16} strokeWidth={2} /><span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.2px" }}>Чат</span>
              {_chatLive && chatPeek && chatPeek.unread > 0 && <span style={{ position: "absolute", top: -3, right: -3, background: "#FF3B30", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 999, minWidth: 17, height: 17, padding: "0 4px", display: "grid", placeItems: "center", border: "1.5px solid " + (H.onDark ? "rgba(0,0,0,0.45)" : "#fff") }}>{chatPeek.unread > 99 ? "99+" : chatPeek.unread}</span>}
            </button>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 4 }}>
          {gStyle.orbits ? (
            <div style={{ width: 172, height: 172, margin: "0 auto", display: "grid", placeItems: "center" }}>
              <GoalOrbitMini centerEmoji={t.emblem || "👥"} centerColor={teamColor}
                habits={teamHabits.map((h) => ({ emoji: h.emoji, color: h.color, done: myDone(h) }))}
                people={orbitFaces.map((f) => ({ avatar: f.avatar, name: f.name, active: f.done, progress: _pulseFor(f) }))}
                size={172} dark={isDark} progress={gp} />
            </div>
          ) : (
            <div style={{ position: "relative", width: 150, height: 150, margin: "0 auto" }}>
              <svg width="150" height="150" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="70" cy="70" r="54" fill="none" stroke={isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.08)"} strokeWidth="13" />
                {gp > 0 && <circle cx="70" cy="70" r="54" fill="none" stroke={ringInk} strokeWidth="13" strokeLinecap="round" strokeDasharray={2 * Math.PI * 54} strokeDashoffset={2 * Math.PI * 54 * (1 - gp)} style={{ transition: "stroke-dashoffset 0.6s ease", ...(gDone ? { filter: "drop-shadow(0 0 6px " + ringInk + "80)" } : {}) }} />}
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 36, lineHeight: 1 }}>{bosIcon(t.emblem || "👥", 34, null)}</div>
            </div>
          )}
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8, letterSpacing: "-0.5px", color: H.ink }}><CountC value={Math.round(gp * 100)} />%</div>
          <div style={{ fontSize: 21, fontWeight: 700, color: H.ink, marginTop: 5, letterSpacing: "-0.4px" }}>{t.name}</div>
          {/* Контекст цели (режим + приватность) — ТИХОЙ строкой под именем, чтобы чипы ниже несли
              ТОЛЬКО метрики (David: «чипы со смыслом, не хаотично раскиданы»). */}
          <div style={{ fontSize: 12.5, fontWeight: 600, color: H.sub, marginTop: 4 }}>{modeMeta.e} {modeMeta.t} · {t.vis === "public" ? "🌐 Открытая" : "🔒 Приватная"}</div>
          {desc ? <div style={{ fontSize: 13, color: H.sub, marginTop: 7, lineHeight: 1.45, maxWidth: 300, marginLeft: "auto", marginRight: "auto" }}>{desc}</div> : null}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 14 }}>
          {teamChips.map((ch, i) => <span key={i} style={ch.hot ? heroChipAI : heroChip}>{ch.t}</span>)}
        </div>
      </div>

      <div style={{ padding: "8px 16px 0" }}>

      {/* СТАВКА/БАНК — карточкой под статами (перенесено из бывшей мега-карточки, логика та же). */}
      {stake > 0 && !gDone && (
        <div style={{ ...card, borderRadius: 22, padding: 14, marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 38, height: 38, borderRadius: 13, background: "linear-gradient(135deg,#FEDE34,#EF9F14)", display: "grid", placeItems: "center", fontSize: 19, flexShrink: 0 }}>🪙</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Банк {bank} XP</div>
            <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 1 }}>{isRace ? "Лидер гонки забирает всё" : `Дойдёте — каждому вернётся +${stake}`}</div>
          </div>
        </div>
      )}
      {gDone && stake > 0 && (
        <div style={{ marginTop: 12, padding: "13px 15px", borderRadius: 22, background: "linear-gradient(135deg,#FEDE34,#EF9F14)", color: "#0a0a0a" }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, letterSpacing: "-0.2px" }}>🎉 Цель достигнута — банк раскрыт!</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 3, lineHeight: 1.4 }}>
            {isRace
              ? (myPay > 0 ? `Ты лидер гонки — весь банк твой: +${myPay} XP 👑` : `Банк ${bank} XP забрал лидер гонки`)
              : `Тебе +${myPay || stake} XP, и столько же каждому`}
          </div>
        </div>
      )}
      {/* (Убраны чипы-люди под банком — David: дублируют раздел «Люди» ниже, где и так есть все
          участники + кнопка «Позвать людей». Вклад/выплата теперь читаются в самом разделе.) */}

      {/* Заявки на вступление — владельцу, ПЕРЕД единым блоком (это действие, не раздел). */}
      {_isOwner && pending.length > 0 && (<>
        <div className="section-label" style={{ marginTop: 22 }}>Заявки на вступление ({pending.length})</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {pending.map((p, pi) => (
            <div key={p.id} style={{ background: "var(--card)", borderRadius: 22, boxShadow: "var(--card-shadow)", padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
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
      </>)}

      {/* ЕДИНЫЙ РАСКРЫВАЮЩИЙСЯ БЛОК: Привычки · Календарь · Баланс круга · Люди. ВСЕ свёрнуты по
          умолчанию (David: человек раскрывает сам). «Баланс круга» — между Календарём и Людьми. */}
      <BosSectionsAccordionLive dark={isDark} defaultOpen={null} sections={[
        {
          key: "habits", icon: <I.Flame size={17} color="var(--text-3)" />, title: "Привычки",
          summary: teamHabits.length ? (teamHabits.length + " " + _habitWordT(teamHabits.length) + " · сегодня " + _myDoneCount + " из " + teamHabits.length) : "Пока пусто — добавь первую",
          render: () => (<>
        {[main].concat(others).filter(Boolean).map((h, i) => {
          const done = myDone(h);
          const adopted = adoptedFor(h);
          const markInTeam = () => (adopted ? markAdopted(h) : toggleMyTeamHabit(h));
          return (
            <div key={h.id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderTop: i ? "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)") : 0 }}>
              {_rosterLive ? (
                <button onClick={markInTeam} className="tap" aria-label="Отметить сегодня"
                  style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, border: 0, display: "grid", placeItems: "center", cursor: "pointer",
                    background: done ? (h.color || ringInk) : (isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)"),
                    boxShadow: done ? "none" : "inset 0 0 0 1.5px " + (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.14)") }}>
                  {done && <I.Check size={16} strokeWidth={3} color="#fff" />}
                </button>
              ) : (
                <span aria-hidden style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)", boxShadow: "inset 0 0 0 1.5px " + (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.14)") }} />
              )}
              <button className="tap" onClick={() => { if (adopted) navigate("habit-detail", { habit: adopted, from: "team-detail" }); }} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12, padding: 0, background: "transparent", border: 0, textAlign: "left", color: "var(--text)", cursor: adopted ? "pointer" : "default" }}>
                <span style={{ width: 34, height: 34, borderRadius: 12, background: h.color ? h.color + "26" : (isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)"), display: "grid", placeItems: "center", fontSize: 17, flexShrink: 0 }}>{bosIcon(h.emoji, 18, h.color)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, color: "var(--text)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}{adopted && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-4)", marginLeft: 7 }}>· у себя</span>}</div>
                  <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 1 }}>
                    {h.isMain && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginRight: 7 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#EF9F14", display: "inline-block" }} />Якорь</span>}
                    {(h.doneToday != null && h.total != null) ? (h.doneToday + " из " + h.total + " сегодня") : "общая привычка"}
                  </div>
                </div>
                {adopted && <I.ChevronRight size={16} color="var(--text-4)" />}
              </button>
              {/* D: владелец правит ОПРЕДЕЛЕНИЕ общей привычки (та же полная форма) — прогресс цел. */}
              {_isOwner && (
                <button onClick={() => openEditTeamHabit(h)} className="tap" data-haptic="selection" aria-label="Изменить общую привычку" style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 999, border: 0, background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)", display: "grid", placeItems: "center", color: "var(--text-3)", cursor: "pointer" }}><I.Pencil size={14} strokeWidth={2} /></button>
              )}
              {_rosterLive && !adopted && (
                <button onClick={() => adoptTeamHabit(h)} className="tap" style={{ flexShrink: 0, background: "transparent", border: "1px dashed " + (isDark ? "rgba(255,255,255,0.24)" : "rgba(0,0,0,0.18)"), borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 600, color: "var(--text-3)", whiteSpace: "nowrap" }}>Вести у себя</button>
              )}
              {/* Г: копия «убрана с моей страницы» (shelved) — вернуть можно ОТСЮДА, со страницы
                  круга (David). История и опыт целы — просто снимаем с полки. */}
              {_rosterLive && adopted && adopted.shelved && (
                <button onClick={() => { if (app?.updateHabit) app.updateHabit(adopted.id, { shelved: false }); if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} } }} className="tap" style={{ flexShrink: 0, background: "transparent", border: "1px dashed " + (isDark ? "rgba(255,255,255,0.24)" : "rgba(0,0,0,0.18)"), borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 600, color: "var(--text-3)", whiteSpace: "nowrap" }}>Вернуть к себе</button>
              )}
            </div>
          );
        })}
        {teamHabits.length === 0 && (
          <div style={{ padding: "14px 14px 2px", fontSize: 13, color: "var(--text-4)", lineHeight: 1.5 }}>{_isOwner ? "Пока нет общих привычек. Добавь первую — она станет якорем цели." : "Пока нет общих привычек — их добавляет создатель цели."}</div>
        )}
        {/* Создавать общие привычки может ТОЛЬКО владелец цели (David: участники не должны заводить
            привычки для всех). Участник видит их и может «вести у себя», но не создаёт. RLS дублирует
            гейт (patch_team_habits_owner_only.sql) — UI-обход не пройдёт. */}
        {_isOwner && (
        <button className="tap" onClick={openAddHabit}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderTop: teamHabits.length ? "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)") : 0, background: "transparent", border: 0, color: "var(--text-2)", cursor: "pointer" }}>
          <span style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", border: "1.5px dashed " + (isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.18)") }}><I.Plus size={15} strokeWidth={2.4} color={isDark ? "#fff" : "var(--text-2)"} /></span>
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>Привычка для этой цели</span>
        </button>
        )}
          </>) },
        // ДЕЛА — задания совместной цели: автор ставит, участник отмечает своё + видит «кто выполнил».
        // Раздел появляется только когда облако поддерживает team_tasks (после patch_team_tasks.sql).
        (_rosterLive && _teamTasksAvail ? {
          key: "tasks", icon: <I.Check size={17} color="var(--text-3)" />, title: "Дела",
          summary: _teamTasks.length ? (_teamTasksMine + " из " + _teamTasks.length + " у тебя") : (_isOwner ? "Поставь задания участникам" : "Автор ещё не добавил заданий"),
          render: () => (<>
            {_teamTasks.map((tk, i) => (
              <div key={tk.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderTop: i ? "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)") : 0 }}>
                <button onClick={() => toggleMyTeamTask(tk)} className={"check-btn" + (tk.doneByMe ? "" : " unchecked")} aria-label={tk.doneByMe ? "Снять мою отметку" : "Я выполнил"}
                  style={{ width: 26, height: 26, flexShrink: 0, cursor: "pointer", ...(tk.doneByMe ? { "--check-color": accent } : {}) }}>
                  {tk.doneByMe && <I.Check size={14} strokeWidth={3} color="#fff" />}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, color: tk.doneByMe ? "var(--text-4)" : "var(--text)", textDecoration: tk.doneByMe ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tk.text}</div>
                  <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 1 }}>{(tk.doneCount || 0) + " из " + _teamTasksTotal + " выполнили"}</div>
                </div>
                {_isOwner && (
                  <button onClick={() => removeTeamTaskCloud(tk.id)} className="tap" aria-label="Удалить задание" style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", border: 0, background: "transparent", color: "var(--text-5)", cursor: "pointer", display: "grid", placeItems: "center" }}><I.X size={15} /></button>
                )}
              </div>
            ))}
            {_teamTasks.length === 0 && (
              <div style={{ padding: "14px 14px 2px", fontSize: 13, color: "var(--text-4)", lineHeight: 1.5 }}>{_isOwner ? "Пока нет заданий. Добавь первое — участники будут отмечать выполнение." : "Автор цели пока не добавил заданий."}</div>
            )}
            {_isOwner && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderTop: _teamTasks.length ? "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)") : 0 }}>
                <span style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", border: "1.5px dashed " + (isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.18)") }}><I.Plus size={14} strokeWidth={2.4} color={isDark ? "#fff" : "var(--text-2)"} /></span>
                <input value={newTeamTask} onChange={(e) => setNewTeamTask(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTeamTaskCloud(); } }} placeholder="Добавить задание…"
                  style={{ flex: 1, minWidth: 0, background: "transparent", border: 0, outline: 0, fontSize: 15, color: "var(--text)", fontFamily: "inherit" }} />
                {newTeamTask.trim() && <button onClick={addTeamTaskCloud} className="tap" style={{ flexShrink: 0, border: 0, background: accent, color: "#fff", borderRadius: 999, padding: "6px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Добавить</button>}
              </div>
            )}
          </>),
        } : null),
        {
          key: "calendar", icon: <I.Calendar size={17} color="var(--text-3)" />, title: "Календарь",
          summary: main ? ("Отметки по «" + main.name + "»") : "Отметки по дням",
          render: () => ((_rosterLive && main && mainProg && mainProg.length > 0)
            ? <div style={{ padding: "10px 12px 12px" }}><PeopleMonthCalendarLive bare label=""
                people={mainProg.map((m) => ({ name: m.me ? "Ты" : m.name, initials: m.me ? "Я" : ((m.name || "У").charAt(0).toUpperCase()), color: accent, you: !!m.me, avatar: m.avatar }))}
                dayFrac={(pi, d, mi) => (mainProg[pi] && mainProg[pi].days[_tCalKey(d, mi)] ? 1 : 0)} />
              </div>
            : <div style={{ fontSize: 13, color: "var(--text-4)", padding: 14, lineHeight: 1.5 }}>Пока нет отметок — появятся, когда участники начнут закрывать привычки круга.</div>),
        },
        (circleBalOn ? {
          // БАЛАНС КРУГА — та же аналитика, что «Баланс окружения», но В РАМКАХ ЦЕЛИ (кольцо-состояние
          // круга + темп каждого + поддержи отстающего). Секцией между Календарём и Людьми (David).
          // Гейт: раздел прячется целиком, если владелец выключил тумблер «Баланс круга» (circleBalOn).
          key: "circle", icon: <I.Sparkles size={16} color="var(--text-3)" />, title: "Баланс круга",
          summary: (_rosterLive && members.length >= 2) ? "как круг держит цель — темп каждого" : "нужно ≥2 участника",
          render: () => ((_rosterLive && members.length >= 2 && typeof BosCircleBalanceLive === "function")
            ? <BosCircleBalanceLive bare
                members={ranked.map(function (m) { var _p = _pulseFor(m); return { id: m.id, name: m.id === meId ? "Ты" : m.name, avatar: m.avatar, you: m.id === meId, pace: (_p == null ? (flowSet[m.id] ? 1 : 0) : _p) }; })}
                fallbackProgress={gp} dark={isDark} navigate={navigate} />
            : <div style={{ fontSize: 13, color: "var(--text-4)", padding: 14, lineHeight: 1.5 }}>Появится, когда в круге будет хотя бы двое.</div>),
        } : null),
        {
          key: "people", icon: <I.Users size={17} color="var(--text-3)" />, title: "Люди",
          summary: _rosterLoading ? "загрузка…" : (members.length + " " + _peopleWord(members.length) + (inFlowToday ? (" · сегодня " + inFlowToday + " в деле") : "")),
          render: () => (<>
        <div style={{ overflow: "hidden" }}>
        {_rosterLoading && [0, 1].map((i) => (
          <div key={"sk" + i} style={{ padding: 12, display: "flex", alignItems: "center", gap: 12, borderTop: i ? "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)") : 0 }}>
            <span className="bos-skel" style={{ width: 40, height: 40, borderRadius: "50%" }} />
            <div style={{ flex: 1 }}>
              <span className="bos-skel" style={{ display: "block", width: "42%", height: 12, borderRadius: 6 }} />
              <span className="bos-skel" style={{ display: "block", width: "26%", height: 10, borderRadius: 6, marginTop: 7 }} />
            </div>
          </div>
        ))}
        {!_rosterLoading && ranked.map((m, i) => (
          <div key={m.id || i} style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, borderTop: i ? "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)") : 0 }}>
            <span style={{ display: "inline-flex", borderRadius: "50%", boxShadow: flowSet[m.id] ? ("0 0 0 1.5px " + (isDark ? "#0f0f12" : "#fff") + ", 0 0 0 3.5px " + ringInk) : "none" }}>
              <BuddyFaceLive avatar={m.avatar} name={m.name} size={38} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.id === meId ? "Ты" : m.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 1 }}>{m.role === "owner" ? "Создатель" : "Участник"}{flowSet[m.id] ? " · сегодня в деле" : ""}</div>
            </div>
          </div>
        ))}
        <button className="tap" onClick={() => openSheet(<TeamShareSheetLive team={t} />)}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderTop: (members.length || _rosterLoading) ? "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)") : 0, background: "transparent", border: 0, color: "var(--text-2)", cursor: "pointer" }}>
          <span style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", border: "1.5px dashed " + (isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.18)") }}><I.Plus size={15} strokeWidth={2.4} color={isDark ? "#fff" : "var(--text-2)"} /></span>
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>Позвать людей</span>
        </button>
        </div>
          </>) },
      ].filter(Boolean)} />

      {/* Чат цели переехал в hero-шапку справа (David: «доступ к чату стеклянной кнопкой в блоке»). */}

      {/* ПОКИНУТЬ — только участник (у него нет карандаша). Владелец УДАЛЯЕТ круг со шторки правки
          (карандаш) — David: «удалить никчему на главной внутри круга». */}
      {!_isOwner && (
        <button onClick={() => bosConfirmExitTeam({ app, team: t, isOwner: false, navigate, openSheet, returnTo: from })} className="tap"
          style={{ width: "100%", marginTop: 26, background: "transparent", border: 0, color: "var(--accent-red)", padding: 14, fontSize: 15, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <I.Logout size={17}/> Покинуть цель
        </button>
      )}
      </div>
    </div>
  );
}

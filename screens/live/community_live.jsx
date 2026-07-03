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
function LiveTeamCard({ t, navigate }) {
  // Карточка круга теперь БЕЛАЯ как привычки/цели (David: «в целях карточки того же цвета — единый
  // стиль»). Круги живут среди целей, поэтому делим единый белый вид; эмблема-watermark + чипы-стекло.
  const tgt = t.target || 0;
  const cur = t.current != null ? t.current : Math.round((t.progress || 0) * tgt);
  const gp = tgt > 0 ? Math.min(1, cur / tgt) : (t.progress || 0);
  const palette = (typeof BOS_TEAM_PALETTE !== "undefined") ? BOS_TEAM_PALETTE : ["#7FB3F2"];
  const _cloud = !!(t.cloudId && window.bosCloud && window.bosCloud.enabled() && window.bosCloud.teamMembers);
  const [roster, setRoster] = React.useState(null); // null = not loaded yet
  React.useEffect(() => {
    if (!_cloud) return;
    let on = true;
    window.bosCloud.teamMembers(t.cloudId).then((mem) => {
      if (!on || !Array.isArray(mem)) return;
      setRoster(mem.map((m, j) => ({ name: m.name || "Участник", avatar: m.avatar, initials: (m.name || "У").slice(0, 1).toUpperCase(), color: palette[j % palette.length] })));
    }).catch(() => { if (on) setRoster([]); });
    return () => { on = false; };
  }, [t.cloudId]);
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

/* Заголовок секции ленты «Найти» (Е: вкладка «Все» = ОБЗОР с превью-секциями).
   Крупный титул + подпись; onAll → маленькая «Все ›» справа (паттерн App Store
   «See All»), которая переключает чип на полный раздел. Без onAll — просто шапка. */
function CommSectionHeadLive({ title, sub, onAll }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, padding: "2px 4px 0" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)" }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: "var(--text-4)", marginTop: 3, lineHeight: 1.45 }}>{sub}</div>}
      </div>
      {onAll && (
        <button onClick={onAll} className="tap" data-haptic="selection"
          style={{ border: 0, background: "transparent", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 2,
            fontSize: 13.5, fontWeight: 600, color: "var(--text-3)", padding: "4px 0 5px 8px", flexShrink: 0 }}>
          Все <I.ChevronRight size={14} color="var(--text-4)" />
        </button>
      )}
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
  const _pairFor = { all: "discover", circles: "discover", partners: "community", people: "community" };
  const _legacyFilter = section === "community" ? (commTabEff === "courses" ? "partners" : "people") : "all";
  const _fOk = cv.filter && _pairFor[cv.filter] === section
    && (section !== "community" || (cv.filter === "partners") === (commTabEff === "courses"));
  const filter = _fOk ? cv.filter : _legacyFilter;
  const setFilter = (f) => setView({ filter: f, section: _pairFor[f] || "discover", commTab: f === "partners" ? "courses" : "network" });
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
  const lcHits = searching && typeof LIVING_CIRCLES !== "undefined"
    ? LIVING_CIRCLES.filter((s) => _hit(s.t, s.hook, (s.habits || []).map((h) => h.name).join(" "))) : [];
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
  const _pulseWord = (n) => { const a = n % 10, b = n % 100; if (a === 1 && b !== 11) return "человек держит практики"; if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return "человека держат практики"; return "человек держат практики"; };

  // Real level for the live user — never the demo's curated 8/1240/2000. The
  // typeof guard keeps this safe if the XP helpers aren't loaded yet.
  const _commLvl = (typeof bosLiveXPLive === "function" && typeof bosLevelInfoLive === "function") ? bosLevelInfoLive(bosLiveXPLive(app)) : null;
  const userLevel = _commLvl ? _commLvl.level : 1;
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
      <div style={{ display: "flex", gap: 7, padding: "2px 2px 0" }}>
        {/* ЗАГОТОВКА (Е3, план David): пятый чип ["nearby", "Рядом"] — режим КАРТЫ партнёров
            города. Включаем, когда партнёры появятся больше чем в одном городе: добавить чип
            сюда + ветку filter === "nearby" с картой в ленте (map-заглушки не строим — честно). */}
        {[["all", "Все"], ["circles", "Круги"], ["people", "Люди"], ["partners", "Партнёры"]].map(([id, t]) => {
          const on = filter === id;
          const glass = (!on && typeof bosChipGlass === "function") ? bosChipGlass(isDark) : {};
          return (
            <button key={id} onClick={() => setFilter(id)} className="tap" data-haptic="selection"
              data-tour={id === "people" ? "network" : undefined}
              style={{ border: 0, cursor: "pointer", borderRadius: 999, padding: "8px 15px", fontSize: 13.5, fontWeight: 600,
                transition: "background 0.2s, color 0.2s", ...glass,
                background: on ? "var(--cta, #0a0a0a)" : glass.background,
                color: on ? "var(--cta-ink, #fff)" : "var(--text-2)" }}>{t}</button>
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
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)", padding: "4px 4px 8px" }}>🎓 Программы партнёров</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {cHits.map((c) => (
                  <button key={c.id} onClick={() => { if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } navigate("course-detail", { course: c }); }} className="tap"
                    style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--card)", borderRadius: 22, padding: 14, boxShadow: "var(--card-shadow)", border: 0, textAlign: "left", width: "100%", cursor: "pointer", color: "var(--text)" }}>
                    <span style={{ width: 44, height: 44, borderRadius: "50%", background: c.accent, display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>{c.i}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15.5, fontWeight: 600 }}>{c.t}</div>
                      <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 2 }}>{c.length} · {c.lvl}</div>
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
        {(filter === "all" || filter === "partners") && (
          <React.Fragment>
            {/* Партнёры — «на что потратить XP»: живые вещи (медитация/бачата/бокс) за копилку.
                На «Все» — превью с «Все ›» (Е: обзор), чип «Партнёры» — полный раздел + программы. */}
            <CommSectionHeadLive title="Партнёры" sub="Живые впечатления в городе — за твои XP."
              onAll={filter === "all" ? () => setFilter("partners") : null} />
            {typeof PartnersShowcaseLive === "function" && <PartnersShowcaseLive app={app} navigate={navigate} />}
          </React.Fragment>
        )}

        {(filter === "all" || filter === "circles") && (
          <React.Fragment>
            <CommSectionHeadLive title="Круги для тебя" sub="Вступай в челленджи и живые круги — или собери свой. Любой появится у тебя в «Целях»."
              onAll={filter === "all" ? () => setFilter("circles") : null} />
            {/* Челленджи — срочные, с призом за финиш: витрина-превью и на «Все», и в разделе. */}
            {typeof SeedCirclesShowcaseLive === "function" && <SeedCirclesShowcaseLive app={app} navigate={navigate} />}
            {filter === "circles" && (
              <React.Fragment>
                {/* ПОЛНЫЙ раздел (чип «Круги»): пресеты + живые витрины. На «Все» их нет —
                    обзор короткий, «Все ›» ведёт сюда. */}
                {typeof CircleStartersShowcaseLive === "function" && <CircleStartersShowcaseLive navigate={navigate} />}
                {typeof LivingCirclesShowcaseLive === "function" && <LivingCirclesShowcaseLive navigate={navigate} />}
              </React.Fragment>
            )}
            {/* РЕАЛЬНАЯ жизнь — живые лица из твоих кругов (скрыто, если людей нет). */}
            {typeof CircleFriendsStripLive === "function" && <CircleFriendsStripLive app={app} navigate={navigate} />}
            {filter === "circles" && (
              <React.Fragment>
                {/* Позови своих — родной выбор контактов Telegram (реферал). */}
                {typeof InviteFriendsCardLive === "function" && <InviteFriendsCardLive isDark={isDark} />}
                {/* Открытые круги из облака, в которые можно вступить. */}
                <CloudTeamsDiscoverLive app={app} />
              </React.Fragment>
            )}
          </React.Fragment>
        )}

        {(filter === "all" || filter === "people") && (
          // Живого нетворка ещё нет — честный замок (реальные пути XP, без выдуманных людей).
          <div style={{ marginTop: filter === "all" ? 4 : 0 }}>
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
          </div>
        )}

        {(filter === "all" || filter === "partners") && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
          {/* ПРОГРАММЫ ПАРТНЁРОВ (бывшие «Курсы» — David: «курсы как слово ощущается хуже
              партнёров»): интенсивы-ускорители внутри партнёрского мира.
              На «Все» — превью: 2 карточки + «Все ›»; голд-баннер «зачем» живёт на чипе. */}
          <CommSectionHeadLive title="Программы партнёров" sub="Интенсивы и курсы — самый быстрый рост уровня."
            onAll={filter === "all" ? () => setFilter("partners") : null} />
          {/* Gold "why courses" banner — the hook (esp. for a newcomer): a course is
              the fastest level-up — a whole level + an achievement that opens new
              circles of people + a big XP boost. Same gold as the level badge. */}
          {filter === "partners" && (
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
          )}
          {(filter === "all" ? courses.slice(0, 2) : courses).map((c, i) => (
            <button key={i} data-tour={i === 0 ? "course" : undefined} onClick={() => navigate("course-detail", { course: c })} className="tap"
              style={{ background: "var(--card)", borderRadius: 22, padding: 16, boxShadow: "var(--card-shadow)", border: 0, textAlign: "left", color: "var(--text)", display: "block", width: "100%" }}>
              {/* Name + meta left, coloured emblem on the RIGHT — matches the Partners card */}
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
    window.bosCloud.toggleTeamHabitToday(h.id, !h.doneByMe).then(() => setHabitsTick((n) => n + 1));
  };
  const addTeamHabitCloud = (h) => { var first = !(liveTeamHabits && liveTeamHabits.length); window.bosCloud.addTeamHabit(t.cloudId, { ...h, isMain: (h && h.isMain) || first }).then(() => setHabitsTick((n) => n + 1)); };
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
  const _todayK = new Date().toISOString().slice(0, 10);
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
  const openAddHabit = () => openSheet(<TeamHabitSheetLive team={t} members={members} onAdd={(h) => { if (_rosterLive) addTeamHabitCloud(h); else app?.addTeamHabit(t._id, h); }} />);
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
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Цель" onBack={() => navigate(from)} right={
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Правка НА МЕСТЕ — карандаш открывает шторку правки прямо над комнатой (не уводит
              на отдельный экран). _isOwner = роль из ростера, фолбэк !t.joined. «Поделиться»
              ушло вниз в тихие чипы («Позвать»), чтобы шапка не выбивалась. */}
          {/* Карандаш круга открывает ТУ ЖЕ шторку, что у обычной цели — GoalFormSheetLive (David:
              «унифицировать; отдельную урезанную шторку убрать»). Команда маппится в goal-подобный
              объект (emblem→emoji, accent→color) + __isTeam/__team → форма редактирует круг: save =
              updateTeam, delete = выход/удаление круга, ссылка «Участники и роли →». */}
          {_isOwner && <EditGlassButtonLive onClick={() => openSheet(<GoalFormSheetLive mode="edit" circleOn={true} navigate={navigate} returnTo={from} goal={{
            _id: t._id, id: t.id, cloudId: t.cloudId, __isTeam: true, __team: t,
            name: t.name, emoji: t.emblem, color: t.accent,
            target: t.target, unit: t.unit, deadline: t.date || t.deadline || "",
            circle: true, type: t.type, vis: t.vis, stake: t.stake, goal: t.goal, joined: t.joined, habitIds: [],
          }} />)} />}
        </div>
      }/>
      {/* HERO — БЛИЗНЕЦ личной цели (David: «команда = та же цель + блок людей»):
          голая орбита-пульс ИЛИ кольцо (тот же тумблер стиля), крупный %, имя, суть. */}
      <div style={{ textAlign: "center", padding: "6px 0 18px" }}>
        {gStyle.orbits ? (
          <>
            <div style={{ width: 190, height: 190, margin: "0 auto", display: "grid", placeItems: "center" }}>
              <GoalOrbitMini centerEmoji={t.emblem || "👥"} centerColor={teamColor}
                habits={teamHabits.map((h) => ({ emoji: h.emoji, color: h.color, done: myDone(h) }))}
                people={orbitFaces.map((f) => ({ avatar: f.avatar, name: f.name, active: f.done, progress: _pulseFor(f) }))}
                size={190} dark={isDark} progress={gp} />
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, marginTop: 12, letterSpacing: "-0.5px", color: "var(--text)" }}><CountC value={Math.round(gp * 100)} />%</div>
          </>
        ) : (
          <div style={{ position: "relative", width: 170, height: 170, margin: "0 auto" }}>
            <svg width="170" height="170" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="70" cy="70" r="54" fill="none" stroke={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.07)"} strokeWidth="13" />
              {gp > 0 && <circle cx="70" cy="70" r="54" fill="none" stroke={ringInk} strokeWidth="13" strokeLinecap="round" strokeDasharray={2 * Math.PI * 54} strokeDashoffset={2 * Math.PI * 54 * (1 - gp)} style={{ transition: "stroke-dashoffset 0.6s ease", ...(gDone ? { filter: "drop-shadow(0 0 6px " + ringInk + "80)" } : {}) }} />}
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
              <div>
                <div style={{ fontSize: 34, lineHeight: 1 }}>{bosIcon(t.emblem || "👥", 32, null)}</div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, letterSpacing: "-0.5px" }}><CountC value={Math.round(gp * 100)} />%</div>
              </div>
            </div>
          </div>
        )}
        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginTop: 14, letterSpacing: "-0.4px" }}>{t.name}</div>
        <div style={{ fontSize: 13, color: "var(--text-4)", marginTop: 3 }}>
          {gTgt > 0 ? <><CountC value={gCur} /> из {gTgt} {gUnit} · {modeLabel}</> : modeLabel}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-5, var(--text-4))", marginTop: 2 }}>
          {t.vis === "public" ? "🌐 Открытая" : "🔒 Приватная"}{t.goal ? " · " + t.goal : ""}
        </div>
      </div>

      {/* Stat row — тот же StatTrioLive и те же ячейки, что у личной цели; третья — Люди. */}
      <StatTrioLive isDark={isDark} card={card} items={[
        { l: "Осталось", v: gRemaining, icon: <I.Target size={16} strokeWidth={2} color={isDark ? "#fff" : "#0a0a0a"} /> },
        { l: "Сделано", v: gCur, icon: <I.Check size={16} strokeWidth={2.4} color={isDark ? "#fff" : "#0a0a0a"} /> },
        { l: "Люди", v: _rosterLoading ? 0 : members.length, icon: <I.Users size={16} strokeWidth={2} color={isDark ? "#fff" : "#0a0a0a"} /> },
      ]} />

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
      {contrib.length > 0 && (
        <div style={{ display: "flex", gap: 7, marginTop: 12, flexWrap: "wrap" }}>
          {contrib.map((m, i) => {
            const pay = payFor(m, i);
            return (
              <span key={m.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, ...bosChipGlass(isDark), borderRadius: 999, padding: "3px 10px 3px 3px" }}>
                <BuddyFaceLive avatar={m.avatar} name={m.name} size={20} />
                <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-2)" }}>{m.me ? "Ты" : (m.name || "").split(" ")[0]} · {m.value}</span>
                {pay > 0 && <span style={{ fontSize: 10, fontWeight: 800, color: "#7a5300", background: "rgba(254,222,52,0.95)", borderRadius: 999, padding: "1px 6px" }}>+{pay}{isRace ? " 👑" : ""}</span>}
              </span>
            );
          })}
        </div>
      )}

      {/* СКЛАДЫВАЕТСЯ ИЗ ПРИВЫЧЕК — ТОТ ЖЕ блок-строки, что у личной цели (David: «привычки
          должны быть так же»). Чек-кружок отмечает В КОМАНДЕ (или личную копию, если ведёшь
          у себя); «Вести у себя» — тихая пилюля справа; якорь — жёлтая точка в подписи. */}
      <div className="section-label" style={{ marginTop: 22 }}>Складывается из привычек</div>
      <div style={{ ...card, borderRadius: 22, marginTop: 8, overflow: "hidden" }}>
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
              {_rosterLive && !adopted && (
                <button onClick={() => adoptTeamHabit(h)} className="tap" style={{ flexShrink: 0, background: "transparent", border: "1px dashed " + (isDark ? "rgba(255,255,255,0.24)" : "rgba(0,0,0,0.18)"), borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 600, color: "var(--text-3)", whiteSpace: "nowrap" }}>Вести у себя</button>
              )}
            </div>
          );
        })}
        {teamHabits.length === 0 && (
          <div style={{ padding: "14px 14px 2px", fontSize: 13, color: "var(--text-4)", lineHeight: 1.5 }}>Пока нет общих привычек. Добавь первую — она станет якорем цели.</div>
        )}
        <button className="tap" onClick={openAddHabit}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderTop: teamHabits.length ? "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)") : 0, background: "transparent", border: 0, color: "var(--text-2)", cursor: "pointer" }}>
          <span style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", border: "1.5px dashed " + (isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.18)") }}><I.Plus size={15} strokeWidth={2.4} color={isDark ? "#fff" : "var(--text-2)"} /></span>
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>Привычка для этой цели</span>
        </button>
      </div>

      {/* Кто какой день отметил — календарь по якорю, ПОД зоной привычек (так якорь и привычки
          стоят рядом, а разбор по дням — отдельным блоком ниже). */}
      {_rosterLive && main && mainProg && mainProg.length > 0 && (
        <PeopleMonthCalendarLive
          people={mainProg.map((m) => ({ name: m.me ? "Ты" : m.name, initials: m.me ? "Я" : ((m.name || "У").charAt(0).toUpperCase()), color: accent, you: !!m.me, avatar: m.avatar }))}
          dayFrac={(pi, d, mi) => (mainProg[pi] && mainProg[pi].days[_tCalKey(d, mi)] ? 1 : 0)}
          label={"Кто отметил «" + main.name + "»"}
        />
      )}

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
      {/* ЛЮДИ — «тот же блок, только с людьми» (David): одна карточка-список в языке страницы
          цели; колечко на лице = отметился сегодня (пульс), «Позвать людей» — dashed-строкой. */}
      <div className="section-label" style={{ marginTop: 22 }}>Люди{_rosterLoading ? "" : " · " + members.length}</div>
      <div style={{ ...card, borderRadius: 22, marginTop: 8, overflow: "hidden" }}>
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

      {/* Чат цели — стеклянная кнопка под «Людьми» (счётчик непрочитанных сохранён). */}
      <button onClick={() => { markChatRead(); navigate("team-chat", { team: t, from }); }} className="tap" style={{ width: "100%", marginTop: 12, position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, background: BOS_TILE_SHEEN + ", var(--surface-3)", boxShadow: bosTileGlass(isDark), border: 0, borderRadius: 18, padding: "15px 12px", fontSize: 15, fontWeight: 600, color: "var(--text-2)" }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>💬</span> Чат цели
        {_chatLive && chatPeek && chatPeek.unread > 0 && <span style={{ position: "absolute", top: 9, right: 14, background: "#FF3B30", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 999, minWidth: 18, height: 18, padding: "0 5px", display: "grid", placeItems: "center" }}>{chatPeek.unread > 99 ? "99+" : chatPeek.unread}</span>}
      </button>

      {/* ПОКИНУТЬ — только участник (у него нет карандаша). Владелец УДАЛЯЕТ круг со шторки правки
          (карандаш) — David: «удалить никчему на главной внутри круга». */}
      {!_isOwner && (
        <button onClick={() => bosConfirmExitTeam({ app, team: t, isOwner: false, navigate, openSheet, returnTo: from })} className="tap"
          style={{ width: "100%", marginTop: 26, background: "transparent", border: 0, color: "var(--accent-red)", padding: 14, fontSize: 15, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <I.Logout size={17}/> Покинуть цель
        </button>
      )}
    </div>
  );
}

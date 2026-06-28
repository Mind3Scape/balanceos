/* PROFILE SUB-SCREENS — LIVE-only forks (real Telegram user, app.mode === "live"
   is ALWAYS true here). Every demo ("Павел") and fresh branch is stripped: no
   curated April-2026 calendar, no scripted sample notifications, no demo
   ACHIEVEMENTS/courses ladder, no demo-only settings rows. Everything is real —
   real history from each habit's log, real Telegram sign-in, the real
   bosEarnedAchievementsLive / BOS_ACHIEVEMENTS_LIVE ladder, real cloud notifications.

   Reuses the shared core/ toolkit (SysCard, SysBtn, OrbitField, EditProfileSheet,
   InfoSheet, AvatarPickerSheet, DayRing) + the FeedbackSheetLive fork (shared_live.jsx)
   + framework (PageHeader, Switch, I, hooks useApp/useNav/useSheet, every
   bos* helper, BOS_ACHIEVEMENTS_LIVE / bosEarnedAchievementsLive, MOOD_OPTIONS, StaticOrb,
   tintFromMood, window.StateOrb, window.ALL_SPHERES / DEFAULT_SPHERES). useP is the
   React.useState alias now defined once in core/aliases.jsx.

   TYPOGRAPHY (iOS Headline polish): PRIMARY labels (settings-row labels,
   notification titles, history entry titles, achievement names, section titles)
   carry fontWeight: 600 + color: "var(--text)". Already-700 weights and
   secondary/caption text are left untouched.

   The ONLY new top-level declarations in this file are the seven `…Live`
   components below: SettingsLive, NotificationsLive, HistoryLive, SupportLive,
   AchievementsLive, ManifestLive, IconPickerLive. (GuideScreen is NOT defined in
   profile.jsx — it lives in app.jsx — so no GuideLive fork is made here.) */

// LIVE state-history sheet (Settings → «История состояния»): the user's REAL day-keyed
// mood marks, newest first. Honest empty state — never a fake calendar.
// Unified STATE + JOURNAL history (David: «состояние и дневник — одно и то же»): every day
// that has a mood mark OR a written note/tags, newest first, each row showing the state and
// the day's journal note together. Honest empty state.
function StateHistorySheetLive({ app, dark = false }) {
  const moods = (typeof MOOD_OPTIONS !== "undefined") ? MOOD_OPTIONS : [];
  const dm = (app && app.dayMoods) || {};
  const dn = (app && app.dayNotes) || {};
  const keys = {};
  Object.keys(dm).forEach((k) => { if (/^\d{4}-\d{2}-\d{2}$/.test(k) && dm[k] != null) keys[k] = 1; });
  Object.keys(dn).forEach((k) => { const e = dn[k]; if (/^\d{4}-\d{2}-\d{2}$/.test(k) && e && (((e.note != null) && ("" + e.note).trim()) || (e.tags && e.tags.length))) keys[k] = 1; });
  const entries = Object.keys(keys).sort().reverse().map((k) => {
    const e = dn[k] || {};
    return { key: k, m: (dm[k] != null) ? (moods[dm[k]] || null) : null, note: ("" + (e.note || "")).trim(), tags: (e.tags || []) };
  });
  const streak = (typeof bosMoodStreak === "function") ? bosMoodStreak(dm) : 0;
  const C = dark
    ? { text: "#fff", sub: "rgba(255,255,255,0.5)", tile: "rgba(255,255,255,0.07)" }
    : { text: "#0a0a0a", sub: "rgba(0,0,0,0.5)", tile: "#f4f4f6" };
  const fmt = (k) => { try { const a = k.split("-"); return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(new Date(+a[0], +a[1] - 1, +a[2])); } catch (e) { return k; } };
  return (
    <div style={{ padding: "2px 20px 22px", color: C.text }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>История состояния</div>
        <div style={{ fontSize: 13.5, color: C.sub, marginTop: 3 }}>
          {entries.length ? ("Дней с записью: " + entries.length + (streak >= 2 ? "  ·  🔥 " + streak + " " + (typeof bosRuDays === "function" ? bosRuDays(streak) : "дней") + " подряд" : "")) : "Здесь будут твои состояния и записи дневника"}
        </div>
      </div>
      {entries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "26px 6px", color: C.sub, fontSize: 14, lineHeight: 1.5 }}>Пока пусто — отметь состояние на главном экране.</div>
      ) : (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8, maxHeight: "52vh", overflowY: "auto" }}>
          {entries.map((e, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "11px 12px", background: C.tile, borderRadius: 14 }}>
              <span style={{ width: 36, height: 36, borderRadius: "50%", background: e.m ? ("linear-gradient(160deg, " + e.m.c + ", " + e.m.c + "99)") : "rgba(127,181,255,0.18)", display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0, marginTop: 1 }}>{e.m ? e.m.i : "📝"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{e.m ? e.m.t : "Запись дня"}</div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 1 }}>{fmt(e.key)}</div>
                {e.note && <div style={{ fontSize: 13.5, color: C.text, marginTop: 6, lineHeight: 1.4, whiteSpace: "pre-wrap" }}>{e.note}</div>}
                {!e.note && e.tags.length > 0 && <div style={{ fontSize: 12.5, color: C.sub, marginTop: 5 }}>{e.tags.map((t) => "#" + ("" + t).replace(/_/g, " ")).join("  ")}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// LIVE friends sheet (Settings → «Друзья»): the REAL people you invited (referral circle)
// from the cloud. Honest — name + avatar only, no fabricated profiles; empty state nudges to
// invite. No tap-through to ContactDetailLive (that screen is a curated mock).
function FriendsSheetLive({ dark = false }) {
  const [people, setPeople] = React.useState(null); // null = loading
  React.useEffect(() => {
    let on = true;
    if (window.bosCloud && window.bosCloud.enabled() && window.bosCloud.invitedPeople) {
      window.bosCloud.invitedPeople().then((list) => { if (on) setPeople(Array.isArray(list) ? list : []); }).catch(() => { if (on) setPeople([]); });
    } else setPeople([]);
    return () => { on = false; };
  }, []);
  const C = dark
    ? { text: "#fff", sub: "rgba(255,255,255,0.5)", tile: "rgba(255,255,255,0.07)" }
    : { text: "#0a0a0a", sub: "rgba(0,0,0,0.5)", tile: "#f4f4f6" };
  const _COLORS = ["#e8c8a8", "#a8b9d4", "#d4b8e8", "#a8d4e8", "#b8e8c8", "#e8b8d4", "#d4c8e8"];
  return (
    <div style={{ padding: "2px 20px 22px", color: C.text }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>Друзья</div>
        <div style={{ fontSize: 13.5, color: C.sub, marginTop: 3 }}>Кого ты пригласил в приложение</div>
      </div>
      {people === null ? (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: C.tile, borderRadius: 14 }}>
              <span className="bos-skel" style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0 }} />
              <span className="bos-skel" style={{ display: "block", width: "45%", height: 12, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      ) : people.length === 0 ? (
        <div style={{ textAlign: "center", padding: "22px 8px", color: C.sub, fontSize: 14, lineHeight: 1.5 }}>Пока никого. Пригласи друга по ссылке с главного экрана — за каждого +XP к уровню.</div>
      ) : (
        <div className="bos-acc-in" style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8, maxHeight: "52vh", overflowY: "auto" }}>
          {people.map((p, i) => {
            const nm = (p && p.username) ? p.username : "Друг";
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: C.tile, borderRadius: 14 }}>
                <span style={{ width: 38, height: 38, borderRadius: "50%", background: _COLORS[i % _COLORS.length], display: "grid", placeItems: "center", fontSize: 16, fontWeight: 700, color: "rgba(0,0,0,0.55)", flexShrink: 0 }}>{nm.charAt(0).toUpperCase()}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{nm}</div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 1 }}>В твоём круге</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SettingsLive() {
  const { navigate } = useNav();
  const app = useApp();
  const { open: openSheet } = useSheet();
  const routeDark = app?.themeOverride !== "light"; // settings is a dark route unless globally forced light
  // Push is a REAL saved setting for live users — persisted to localStorage by profile id,
  // and it gates the Telegram push the bot sends.
  const pushKey = "bos:push:" + (app?.persistId || "live");
  const [push, setPush] = useP(() => {
    try { const v = localStorage.getItem(pushKey); return v == null ? true : v === "1"; } catch (e) { return true; }
  });
  const setPushPersist = (on) => {
    setPush(on);
    try { localStorage.setItem(pushKey, on ? "1" : "0"); } catch (e) {}
  };
  const isDark = app?.themeOverride === "dark";
  const setDark = (on) => app?.setThemeOverride(on ? "dark" : "light");
  // «Обучение» cards on the Habits screen — ON shows them, OFF hides (restore after «Скрыть»).
  const [learnOn, setLearnOn] = React.useState(() => !(typeof bosLearnHidden === "function" && bosLearnHidden()));
  const setLearnPersist = (on) => { setLearnOn(on); if (typeof bosSetLearnHidden === "function") bosSetLearnHidden(!on); };
  // Grouped iOS-style sections (v279 reno): ONE card per group, hairline-divided rows inside.
  // Helpers are plain render-fns (not components) so toggling never remounts the list.
  const PRIVACY_BODY = "Мы храним только то, что нужно приложению: твои привычки, состояние и записи. Они привязаны к твоему аккаунту Telegram. Полные документы — на сайте проекта.";
  const chip = (icon) => <span className="bos-sys-chip-bg" style={{ width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0 }}>{React.createElement(icon, { size: 16, color: "var(--text)" })}</span>;
  const row = (icon, label, onClick, last) => (
    <button key={label} onClick={onClick} className="tap" style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: "transparent", border: 0, borderBottom: last ? "none" : "0.5px solid var(--line)", cursor: "pointer", textAlign: "left", padding: "13px 14px" }}>
      {icon ? chip(icon) : null}
      <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{label}</span>
      <I.ChevronRight size={16} className="bos-sys-text-2" />
    </button>
  );
  const toggleRow = (icon, label, val, set, last) => (
    <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderBottom: last ? "none" : "0.5px solid var(--line)" }}>
      {chip(icon)}
      <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{label}</span>
      <Switch on={val} onChange={set} dark={isDark} />
    </div>
  );
  const group = (title, rows) => (
    <React.Fragment key={title}>
      <div className="section-label" style={{ marginTop: 22 }}>{title}</div>
      <div className="bos-sys-card" style={{ marginTop: 8, padding: 0, overflow: "hidden" }}>{rows}</div>
    </React.Fragment>
  );
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Настройки" onBack={() => navigate("profile")} />

      {group("Профиль", [
        row(I.Pencil, "Редактировать профиль", () => openSheet(<EditProfileSheet dark={routeDark}/>)),
        row(I.Globe, "Вход через Telegram", () => openSheet(<InfoSheet title="Вход через Telegram" body="Ты входишь через свой аккаунт Telegram — отдельный пароль не нужен. Твои данные привязаны к нему и переносятся между устройствами." cta="Понятно" dark={routeDark}/>), true),
      ])}

      {group("Предпочтения", [
        toggleRow(I.Eye, "Тёмная тема", isDark, setDark),
        toggleRow(I.Bell, "Push-уведомления", push, setPushPersist),
        toggleRow(I.Book, "Карточки-подсказки", learnOn, setLearnPersist, true),
      ])}

      {group("Главный экран", [
        row(I.Home, "Виджеты на главном", () => navigate("home-customize"), true),
      ])}

      {group("О приложении", [
        row(I.Sparkles, "Манифест", () => navigate("manifest", { from: "settings" })),
        row(null, "Политика конфиденциальности", () => openSheet(<InfoSheet title="Политика конфиденциальности" body={PRIVACY_BODY} cta="Готово" dark={routeDark}/>)),
        row(null, "Условия использования", () => openSheet(<InfoSheet title="Условия использования" body={PRIVACY_BODY} cta="Готово" dark={routeDark}/>), true),
      ])}
      <div className="bos-sys-text-3" style={{ textAlign: "center", padding: "16px 14px 2px", fontSize: 13 }}>Версия {APP_VERSION}</div>
    </div>
  );
}

function NotificationsLive() {
  const { navigate, params } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  // LIVE: real notifications computed from the cloud — unread team-chat messages.
  // Nothing scripted ever reaches a real user, so there is no sample list.
  const [liveItems, setLiveItems] = React.useState(null);  // null = still loading (skeleton); [] = loaded-empty
  React.useEffect(() => {
    if (!(window.bosCloud && window.bosCloud.enabled())) { setLiveItems([]); return; }
    const teams = (app?.teams || []).filter((t) => t.cloudId);
    if (!teams.length) { setLiveItems([]); return; }   // no cloud teams → no notifications, skip the skeleton
    let on = true;
    (async () => {
      try {
        const me = await window.bosCloud.uid();
        const out = [];
        for (const t of teams) {
          const rows = await window.bosCloud.loadMessages(t.cloudId);
          if (!Array.isArray(rows) || !rows.length) continue;
          const lastRead = Number(localStorage.getItem("bos:chatread:" + t.cloudId) || 0);
          const unread = rows.filter((r) => r && r.user_id !== me && new Date(r.created_at).getTime() > lastRead);
          if (unread.length) {
            const last = unread[unread.length - 1];
            const word = unread.length === 1 ? "новое сообщение" : (unread.length < 5 ? "новых сообщения" : "новых сообщений");
            out.push({ i: "💬", t: unread.length + " " + word + " в «" + t.name + "»", b: last.text || "📷 Фото", w: "сейчас", new: true, goChat: t });
          }
        }
        if (on) setLiveItems(out);
      } catch (e) { if (on) setLiveItems([]); }
    })();
    return () => { on = false; };
  }, []);
  const loading = liveItems === null;
  const shown = liveItems || [];
  const clearAll = () => setLiveItems([]);
  const tap = (n, idx) => {
    if (n.goChat) { try { localStorage.setItem("bos:chatread:" + n.goChat.cloudId, String(Date.now())); } catch (e) {} navigate("team-chat", { team: n.goChat }); }
    else if (n.go) navigate(n.go);
  };
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Уведомления" onBack={() => navigate(params?.from || "profile")} right={
        shown.length > 0 ? <button onClick={clearAll} className="tap bos-sys-text-2" style={{ background: "transparent", border: 0, fontSize: 13 }}>Очистить</button> : null
      }/>
      {loading ? (
        <div className="bos-acc-in" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[0, 1].map((i) => (
            <div key={i} className="bos-sys-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: 14 }}>
              <span className="bos-skel" style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span className="bos-skel" style={{ display: "block", width: "60%", height: 12, borderRadius: 6 }} />
                <span className="bos-skel" style={{ display: "block", width: "40%", height: 10, borderRadius: 6, marginTop: 7 }} />
              </div>
            </div>
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="bos-sys-text-3" style={{ textAlign: "center", padding: "60px 20px", fontSize: 14 }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>🔔</div>
          Новых уведомлений нет
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {shown.map((n, i) => (
            <SysCard key={i} onClick={() => tap(n, i)} style={{ padding: 14, display: "flex", gap: 12, cursor: "pointer" }}>
              <span style={{ fontSize: 26 }}>{n.i}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text)" }}>{n.t}</span>
                  {n.new && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FEDE34" }} />}
                </div>
                <div className="bos-sys-text-2" style={{ fontSize: 13, marginTop: 2 }}>{n.b}</div>
                <div className="bos-sys-text-3" style={{ fontSize: 11, marginTop: 6 }}>{n.w}</div>
              </div>
              {n.go && <I.ChevronRight size={16} className="bos-sys-text-3" style={{ alignSelf: "center" }} />}
            </SysCard>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryLive() {
  const { navigate } = useNav();
  const app = useApp();

  // Detect theme from wrapper class so all calendar visuals stay coherent.
  const wrapRef = React.useRef(null);
  const [isDark, setIsDark] = useP(false);
  React.useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    let n = el.parentElement;
    while (n && !n.classList.contains("theme-light") && !n.classList.contains("theme-dark")) n = n.parentElement;
    setIsDark(!!(n && n.classList.contains("theme-dark")));
  }, []);

  // Theme tokens shared across the page
  const TH = isDark ? {
    cellEmpty: "rgba(255,255,255,0.05)",
    cellIdle:  "rgba(255,255,255,0.10)",
    ringTrack: "rgba(255,255,255,0.13)",
    cellSelBg: "rgba(255,255,255,0.16)",
    todayBg: "rgba(255,255,255,0.14)", todayFg: "#fff",
    cellBorder:"rgba(255,255,255,0.10)",
    cellText:  "#fff",
    cellMuted: "rgba(255,255,255,0.45)",
    yellowFill:"linear-gradient(160deg, #FEDE34, #EF9F14)",
    yellow:    "#FEDE34",
    chipBg:    "rgba(255,255,255,0.06)",
    progressBg:"rgba(255,255,255,0.08)",
    iconBg:    "rgba(255,255,255,0.06)",
    outlineSel:"#fff",
    outlineToday:"rgba(255,255,255,0.45)",
    moodText:  "rgba(0,0,0,0.75)", // emoji bg is colored so dark text reads
  } : {
    cellEmpty: "transparent",
    cellIdle:  "#f5f5f5",
    ringTrack: "rgba(0,0,0,0.09)",
    cellSelBg: "rgba(0,0,0,0.07)",
    todayBg: "rgba(0,0,0,0.07)", todayFg: "var(--text)",
    cellBorder:"rgba(0,0,0,0.06)",
    cellText:  "var(--text)",
    cellMuted: "var(--text-4)",
    yellowFill:"linear-gradient(160deg, #FEDE34, #EF9F14)",
    yellow:    "#FEDE34",
    chipBg:    "var(--surface-3)",
    progressBg:"var(--surface-3)",
    iconBg:    "var(--surface-3)",
    outlineSel:"#0a0a0a",
    outlineToday:"rgba(0,0,0,0.35)",
    moodText:  "rgba(0,0,0,0.75)",
  };

  // LIVE walks the user's REAL calendar (today = now).
  const MONTHS = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const DIM = [31,28,31,30,31,30,31,31,30,31,30,31];
  const _now = new Date();
  const CUR_M = _now.getMonth();
  const year = _now.getFullYear();
  const today = _now.getDate();
  const _leap = (y) => (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
  const [mIdx, setMIdx] = useP(CUR_M);
  const monthName = MONTHS[mIdx];
  const daysInMonth = (mIdx === 1 && _leap(year)) ? 29 : DIM[mIdx];
  // Real weekday of the 1st of the shown month.
  const startWeekday = new Date(year, mIdx, 1).getDay();
  const isCurMonth = mIdx === CUR_M;
  const isFuture = mIdx > CUR_M;
  const lastLogged = isCurMonth ? today : daysInMonth; // past months fully logged; this one up to today

  // A day's completion = share of the user's habits logged on that real date.
  // h.log is keyed by local ISO date ("2026-06-23"); 0 habits → null (nothing to show).
  const liveHabits = app?.habits || [];
  const iso = (d) => year + "-" + (mIdx + 1 < 10 ? "0" : "") + (mIdx + 1) + "-" + (d < 10 ? "0" : "") + d;
  const completion = (d) => {
    if (isFuture || d > lastLogged) return null;
    if (!liveHabits.length) return null;
    const k = iso(d);
    const done = liveHabits.reduce((s, h) => s + (h && h.log && h.log[k] ? 1 : 0), 0);
    return done / liveHabits.length;
  };

  const [selDay, setSelDay] = useP(today);
  // «Компактно» (minimalist, default) ↔ «Подробно» — the SAME eye toggle as the habit-detail
  // calendar (David: «минималистичный вид + переключение как в привычках»).
  const [compact, setCompact] = useP(true);

  const blanks = Array.from({ length: startWeekday }, (_, i) => ({ blank: true, key: "b" + i }));
  const days = Array.from({ length: daysInMonth }, (_, i) => ({ d: i + 1, key: "d" + (i + 1) }));
  const cells = [...blanks, ...days];
  const weekday = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];
  // Heat-cell tokens for the squircle calendar — graphite fill by completion, grey glass rings,
  // no gold (David: золото на дне не подходит → серое стекло; единый язык с деталью привычки).
  const cellFut    = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)";
  const todayRingC = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.42)";
  const selRingC   = isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.28)";

  // The live user's REAL habits + whether each was logged on the selected date.
  const liveDayHabits = (d) => liveHabits.map((h) => ({ e: h.emoji || "✨", n: h.name || "Привычка", on: !!(h && h.log && h.log[iso(d)]) }));
  const dayHabits = liveDayHabits(selDay);
  const selPct = completion(selDay);

  // Stats — REAL across all logged history.
  let totalDone, perfectDays, bestStreak;
  totalDone = liveHabits.reduce((s, h) => s + (h && h.log ? Object.keys(h.log).length : 0), 0);
  bestStreak = (typeof bosMaxStreak === "function") ? bosMaxStreak(liveHabits) : 0;
  // A "perfect day" = a date on which every habit was logged. Gather all logged dates,
  // then count those where the done-count equals the number of habits.
  const allDates = {};
  liveHabits.forEach((h) => { if (h && h.log) Object.keys(h.log).forEach((k) => { allDates[k] = (allDates[k] || 0) + 1; }); });
  perfectDays = liveHabits.length ? Object.keys(allDates).filter((k) => allDates[k] >= liveHabits.length).length : 0;
  // Empty state: no habits at all, OR habits but not a single logged day yet.
  const liveHasHistory = liveHabits.length > 0 && totalDone > 0;
  const showEmpty = !liveHasHistory;

  return (
    <div ref={wrapRef} className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Календарь" onBack={() => navigate("home")} />

      {showEmpty ? (
        /* No history yet — honest empty state, never a fake calendar. */
        <div className="bos-sys-text-3" style={{ textAlign: "center", padding: "70px 24px", fontSize: 14, lineHeight: 1.55 }}>
          <div style={{ fontSize: 38, marginBottom: 12 }}>🗓️</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>Пока нет истории</div>
          Отмечай привычки, и тут появится твой ритм.
        </div>
      ) : (<>
      {/* Stat band — the SAME unified plaque as Habits/Goals detail (StatTrioLive): one card,
          thin line icons in line with SF numbers, hairline dividers. Continuity over the old trio. */}
      <StatTrioLive isDark={isDark} card={{ background: "var(--card)", boxShadow: "var(--card-shadow)", transform: "translateZ(0)" }} items={[
        { l: "Лучшая", v: bestStreak, suf: "д", icon: <I.Flame size={14} color="var(--text-4)" /> },
        { l: "Идеальных", v: perfectDays, suf: "", icon: <I.Trophy size={14} color="var(--text-4)" /> },
        { l: "Отметок", v: Math.round(totalDone), suf: "", icon: <I.ChartBar size={14} color="var(--text-4)" /> },
      ]} />

      {/* Month calendar — minimalist by default («Компактно»): just a glanceable squircle heat-grid,
          no numbers / nav / legend. The eye toggle flips to «Подробно» (numbers + month nav + legend +
          the day breakdown below) — the SAME toggle as the habit-detail calendar (David: «как в
          привычках»). No mood pip on the dates anymore (David: «ор сверху на датах не нравится»). */}
      <SysCard style={{ padding: 16, marginTop: 12, borderRadius: 22, transform: "translateZ(0)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          {compact
            ? <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.3px" }}>{monthName} {year}</div>
            : <span />}
          <button onClick={() => setCompact(c => !c)} className="tap" aria-label={compact ? "Подробно" : "Компактно"}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: TH.chipBg, border: 0, borderRadius: 999, padding: "5px 11px", color: "var(--text-2)", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
            <I.Eye size={14} color="var(--text-3)" />{compact ? "Подробно" : "Компактно"}
          </button>
        </div>

        {!compact && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={() => setMIdx(m => Math.max(0, m - 1))} disabled={mIdx === 0} data-haptic="selection" className="tap hit44" style={{ background: TH.chipBg, border: 0, borderRadius: 999, width: 32, height: 32, display: "grid", placeItems: "center", color: "inherit", opacity: mIdx === 0 ? 0.35 : 1 }}>
              <I.ChevronLeft size={16}/>
            </button>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.3px" }}>{monthName} {year}</div>
            <button onClick={() => setMIdx(m => Math.min(11, m + 1))} disabled={mIdx === 11} data-haptic="selection" className="tap hit44" style={{ background: TH.chipBg, border: 0, borderRadius: 999, width: 32, height: 32, display: "grid", placeItems: "center", color: "inherit", opacity: mIdx === 11 ? 0.35 : 1 }}>
              <I.ChevronRight size={16}/>
            </button>
          </div>
        )}

        {!compact && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, maxWidth: 300, width: "100%", margin: "14px auto 0" }}>
            {weekday.map((w, i) => (
              <div key={i} className="bos-sys-text-3" style={{ textAlign: "center", fontSize: 10.5, fontWeight: 600, letterSpacing: 0.6 }}>{w}</div>
            ))}
          </div>
        )}

        {/* Day cells — SQUIRCLE heat-tiles filled in graphite by the day's completion share. Compact =
            glanceable (no numbers, not tappable); detailed = numbered + tap to inspect below. Today
            keeps a grey glass ring in both modes; the picked day gets a grey ring in detailed. */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, maxWidth: 300, width: "100%", margin: compact ? "0 auto" : "6px auto 0" }}>
          {cells.map(c => {
            if (c.blank) return <span key={c.key} aria-hidden style={{ aspectRatio: "1/1" }}/>;
            const pct = completion(c.d);
            const fut = pct == null;
            const isSelected = selDay === c.d;
            const isToday = isCurMonth && c.d === today;
            const filled = !fut && pct > 0;
            const bg = fut ? cellFut : (pct <= 0 ? TH.cellIdle : bosCellFill("#0a0a0a", pct));
            const ink = fut ? TH.cellMuted : (pct <= 0 ? TH.cellText : bosCellInk("#0a0a0a", pct, isDark));
            const ring = isToday ? todayRingC : ((!compact && isSelected) ? selRingC : null);
            const sh = [filled ? bosCellGlass(isDark) : "", ring ? ("0 0 0 1.6px " + ring) : ""].filter(Boolean).join(", ") || "none";
            return (
              <button key={c.key} onClick={compact ? undefined : () => setSelDay(c.d)} className="tap"
                style={{
                  aspectRatio: "1/1", border: 0, borderRadius: "30%", padding: 0,
                  display: "grid", placeItems: "center", position: "relative",
                  fontSize: 12.5, fontWeight: isToday ? 700 : 500, cursor: compact ? "default" : "pointer",
                  background: bg, boxShadow: sh, color: ink,
                }}>
                {!compact && !fut && <span style={{ position: "relative", zIndex: 1 }}>{c.d}</span>}
              </button>
            );
          })}
        </div>

        {!compact && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <span className="bos-sys-text-3" style={{ fontSize: 11 }}>Меньше</span>
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                <span key={i} style={{ width: 15, height: 15, borderRadius: "30%", background: p <= 0 ? TH.cellIdle : bosCellFill("#0a0a0a", p), boxShadow: p > 0 ? bosCellGlass(isDark) : "none" }} />
              ))}
            </div>
            <span className="bos-sys-text-3" style={{ fontSize: 11 }}>Больше</span>
          </div>
        )}
      </SysCard>

      {/* Day detail — only in «Подробно»; tap a day above to inspect it. */}
      {!compact && (<>
      <div className="section-label" style={{ marginTop: 22, padding: "0 4px" }}>
        {monthName} {selDay} · {selPct == null ? "Будущее" : selPct === 1 ? "Идеальный день ✨" : selPct === 0 ? "Пропущен" : `${Math.round(selPct * 100)}%`}
      </div>
      <SysCard style={{ marginTop: 8, borderRadius: 22, overflow: "hidden", padding: 0, transform: "translateZ(0)" }}>
        {selPct == null ? (
          <div className="bos-sys-text-3" style={{ padding: 24, textAlign: "center", fontSize: 14 }}>Этот день ещё не наступил.</div>
        ) : (
          <>
            <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--line)" }}>
              <div style={{ flex: 1 }}>
                <div className="bos-sys-text-2" style={{ fontSize: 13 }}>{Math.round(selPct * dayHabits.length)} из {dayHabits.length} привычек</div>
                <div style={{ marginTop: 6, height: 8, background: TH.progressBg, borderRadius: 999, overflow: "hidden" }}>
                  <span style={{ display: "block", height: "100%", width: (selPct * 100) + "%", background: bosCellFill("#0a0a0a", 1), borderRadius: 999 }}/>
                </div>
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px" }}>{Math.round(selPct * 100)}%</span>
            </div>
            {/* Mood/journal keys: live is written by ISO date (bosTodayKey) so it scopes
                correctly to any month. */}
            {(() => {
              const dkey = iso(selDay);
              const dm = app?.dayMoods?.[dkey] != null ? MOOD_OPTIONS[app.dayMoods[dkey]] : null;
              if (!dm) return null;
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
                  <span style={{ width: 36, height: 36, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <StaticOrb size={34} tint={tintFromMood(dm.c)} seed={1.2} intensity={0.7} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div className="bos-sys-text-3" style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Состояние</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginTop: 2 }}>{dm.t}</div>
                  </div>
                </div>
              );
            })()}
            {(() => {
              const nkey = iso(selDay);
              const dn = app?.dayNotes?.[nkey];
              if (!dn || !((dn.tags && dn.tags.length) || dn.note)) return null;
              return (
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
                  <div className="bos-sys-text-3" style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Журнал</div>
                  {dn.tags && dn.tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                      {dn.tags.map((tg, k) => (
                        <span key={k} style={{ fontSize: 12.5, padding: "5px 10px", borderRadius: 999, ...bosChipGlass(isDark) }}>#{tg}</span>
                      ))}
                    </div>
                  )}
                  {dn.note && (
                    <div className="bos-sys-text-2" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.45 }}>{dn.note}</div>
                  )}
                </div>
              );
            })()}
            {dayHabits.map((h, i) => {
              // The habit's OWN logged state for this date.
              const done = h.on;
              return (
                <div key={i}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
                    <span style={{ width: 36, height: 36, borderRadius: 13, background: BOS_TILE_SHEEN + ", " + (isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)"), boxShadow: bosTileGlass(isDark), display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0 }}>{bosIcon(h.e, 18, null)}</span>
                    <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>{h.n}</span>
                    <span style={{
                      width: 26, height: 26, borderRadius: "50%",
                      background: done ? "var(--check-color, var(--accent))" : "transparent",
                      border: done ? 0 : "2px solid " + (isDark ? "rgba(255,255,255,0.35)" : "var(--text-5)"),
                      display: "grid", placeItems: "center",
                    }}>
                      {done && <I.Check size={14} strokeWidth={2.5} color="#fff"/>}
                    </span>
                  </div>
                  {i < dayHabits.length - 1 && <div className="divider"/>}
                </div>
              );
            })}
          </>
        )}
      </SysCard>
      </>)}
      </>)}
    </div>
  );
}

function SupportLive() {
  const { navigate } = useNav();
  const app = useApp();
  const { open: openSheet } = useSheet();
  const routeDark = app?.themeOverride !== "light";
  const [q, setQ] = useP("");
  const [openFaq, setOpenFaq] = useP(null);
  const FAQ = [
    { q: "Как работают серии", a: "Серия прибавляет день за каждый день, когда ты выполнил хотя бы одну привычку. Пропустишь день — серия обнуляется, но история остаётся." },
    { q: "Приглашение команды", a: "Открой команду → шестерёнка → раздел «Участники» → выбери друга из подсказок. Он получит уведомление и сможет присоединиться к общей цели." },
    { q: "Конфиденциальность и данные", a: "Твои данные о привычках видны только тебе. В команде друзья видят лишь отметки по общим привычкам — не личные." },
    { q: "Подключение Apple Health", a: "Настройки → Привязанные аккаунты. После подключения шаги и тренировки будут автоматически отмечать связанные привычки." },
    { q: "Отмена подписки", a: "Подписка управляется в App Store: Настройки телефона → Apple ID → Подписки → BalanceOS → Отменить." },
  ].filter(f => !q || f.q.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Поддержка и помощь" onBack={() => navigate("profile")} />
      <SysCard style={{ padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <I.Search size={18} className="bos-sys-text-2"/>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск по статьям" className="bos-sys-text-2"
          style={{ flex: 1, border: 0, outline: 0, background: "transparent", fontSize: 15, color: "inherit" }}/>
      </SysCard>
      <div className="section-label" style={{ marginTop: 22 }}>Популярные темы</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {FAQ.map((f,i)=>(
          <div key={i}>
            <SysBtn onClick={() => setOpenFaq(o => o === f.q ? null : f.q)}>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{f.q}</span>
              <I.ChevronRight size={16} className="bos-sys-text-2" style={{ transform: openFaq === f.q ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}/>
            </SysBtn>
            {openFaq === f.q && (
              <div className="bos-sys-text-2" style={{ fontSize: 13.5, lineHeight: 1.55, padding: "10px 16px 2px" }}>{f.a}</div>
            )}
          </div>
        ))}
        {FAQ.length === 0 && <div className="bos-sys-text-3" style={{ fontSize: 14, padding: "8px 4px" }}>Ничего не найдено. Напиши нам ниже.</div>}
      </div>
      <div className="section-label" style={{ marginTop: 22 }}>Свяжитесь с нами</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
        <SysCard onClick={() => openSheet(<FeedbackSheetLive title="Написать нам" dark={routeDark}/>)} style={{ padding: 18, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6, cursor: "pointer" }}>
          <I.Mail size={20}/>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Написать нам</span>
          <span className="bos-sys-text-2" style={{ fontSize: 12 }}>support@balanceos.app</span>
        </SysCard>
        <SysCard onClick={() => openSheet(<FeedbackSheetLive title="Чат поддержки" dark={routeDark}/>)} style={{ padding: 18, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6, cursor: "pointer" }}>
          <I.MessageCircle size={20}/>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Чат поддержки</span>
          <span className="bos-sys-text-2" style={{ fontSize: 12 }}>Ответ в среднем 5 мин</span>
        </SysCard>
      </div>
    </div>
  );
}

function AchievementsLive() {
  const { navigate, params } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  const { open: openSheet } = useSheet();
  const dark = app?.themeOverride === "dark";
  const back = params?.from || "profile";
  // LIVE: achievements earned by real signals — the real bosEarnedAchievementsLive ladder.
  const LIST = bosEarnedAchievementsLive(app);
  const byId = {}; LIST.forEach((a) => { byId[a.id] = a; });
  const earnedN = LIST.filter((a) => a.earned).length;
  const _achXP = LIST.filter((a) => a.earned).reduce((s, a) => s + (a.xp || 0), 0);
  // Category ladders — each badge grows within its branch (Apple-Fitness-style award grid).
  // Emoji art for now (David: native custom art later); grouped by what earns it.
  const CATS = [
    { t: "Старт", ids: ["first_habit"] },
    { t: "Уровни", ids: ["lvl5", "lvl10", "lvl15", "lvl20", "lvl25"] },
    { t: "Серии привычек", ids: ["habit21", "habit60"] },
    { t: "Забота о себе", ids: ["week_state", "care30", "care100", "care180", "year"] },
    { t: "Цели и команда", ids: ["goal", "team"] },
  ];
  const showDetail = (a) => openSheet(<InfoSheet dark={dark} title={a.t}
    body={(a.earned ? "Открыто ✓\n\n" : "Как открыть: " + (a.how || "") + "\n\n") + a.d + (a.xp ? "  ·  +" + a.xp + " XP" : "")}
    cta="Готово" />);
  const tile = (a) => (
    <button key={a.id} onClick={() => showDetail(a)} className="tap" aria-label={a.t}
      style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer", display: "grid", placeItems: "center" }}>
      <span style={{ width: "100%", maxWidth: 58, aspectRatio: "1", borderRadius: 16, display: "grid", placeItems: "center", fontSize: 27, position: "relative",
        background: a.earned ? a.accent + "26" : "var(--card-2)",
        boxShadow: a.earned ? "inset 0 0 0 1.5px " + a.accent + "55" : "none",
        filter: a.earned ? "none" : "grayscale(1)", opacity: a.earned ? 1 : 0.5 }}>
        {a.i}
        {!a.earned && <span style={{ position: "absolute", right: -2, bottom: -2, width: 18, height: 18, borderRadius: "50%", background: "var(--card)", display: "grid", placeItems: "center", fontSize: 9 }}>🔒</span>}
      </span>
    </button>
  );
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Достижения" onBack={() => navigate(back)} />

      {/* Category ladders — straight to the badges (David: no «Твои награды» banner) */}
      {CATS.map((cat) => {
        const items = cat.ids.map((id) => byId[id]).filter(Boolean);
        if (!items.length) return null;
        const got = items.filter((a) => a.earned).length;
        return (
          <React.Fragment key={cat.t}>
            <div className="section-label" style={{ marginTop: 22, padding: "0 4px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span>{cat.t}</span>
              <span className="bos-sys-text-3" style={{ fontWeight: 600, fontSize: 12 }}>{got}/{items.length}</span>
            </div>
            <SysCard style={{ padding: "16px 14px", marginTop: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                {items.map(tile)}
              </div>
            </SysCard>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Manifesto — the full philosophical text behind the onboarding, for those who
// want to read it whole. Reached from Settings → «О приложении». No mode-specific
// behaviour in the original, so the live fork is a faithful copy with the Headline
// stanza weight kept as-is (already 600).
function ManifestLive() {
  const { navigate, params } = useNav();
  const Orb = window.StateOrb;
  const stanzas = [
    ["Ты — точка.", "Точка внимания внутри бесконечного количества возможных вариантов жизни."],
    ["Ты не видишь мир таким, какой он есть.", "Ты видишь его таким, в каком состоянии находишься."],
    [null, "Большинство людей не выбирают своё состояние. Они позволяют новостям, обстоятельствам, страхам и чужому мнению выбирать его за них."],
    [null, "Тебе кажется, что твоей жизнью управляют обстоятельства. Но обстоятельства не определяют твои решения — их определяет твоё состояние."],
    [null, "В одном состоянии всё кажется невозможным. В другом — ты видишь решения, которые были рядом всё это время."],
    ["Это пространство — для одного.", "Научиться управлять своим состоянием. Расширять восприятие. Видеть больше возможностей. И осознанно выбирать направление движения."],
    [null, "Твоя жизнь не определяется тем, что происходит вокруг. Она определяется тем, из какого состояния ты встречаешь происходящее."],
    ["Путешествие начинается внутри.", "Это пространство учит главному: управлять не обстоятельствами, а собой."],
  ];
  return (
    <div className="page-in" style={{ padding: "0 22px 44px" }}>
      <PageHeader title="Манифест" onBack={() => navigate(params?.from || "settings")} />
      <div style={{ display: "grid", placeItems: "center", margin: "6px 0 22px" }}>
        {Orb ? <Orb size={94} tint={["#cfe1ff", "#7aa4d0", "#1a2c48"]} intensity={1} /> : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        {stanzas.map((s, i) => (
          <div key={i}>
            {s[0] && <div style={{ fontSize: 20.5, fontWeight: 600, letterSpacing: "-0.4px", lineHeight: 1.26, color: "var(--text)" }}>{s[0]}</div>}
            {s[1] && <div className="bos-sys-text-2" style={{ fontSize: 15.5, lineHeight: 1.62, marginTop: s[0] ? 8 : 0 }}>{s[1]}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function IconPickerLive() {
  const { navigate, params } = useNav();
  const list = ["☀️","🤸🏼‍♀️","📖","🙏","🧭","⌨️","🦶","🚭","🌚","👟","🧁","📞","🥊","🧘🏼‍♀️","🏃🏼‍♀️","📚","✍🏼","🥗","💧","🧊","🔥","🎯","🎨","🎵","🌱","☕"];
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Выбери иконку" onBack={() => navigate("habit-settings", params)} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
        {list.map((e, i) => (
          <button key={i} className="tap" onClick={() => navigate("habit-settings", { ...params, picked: e })}
            style={{ aspectRatio: "1/1", background: "var(--card)", border: 0, borderRadius: 14, fontSize: 28, boxShadow: "var(--card-shadow)" }}>
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

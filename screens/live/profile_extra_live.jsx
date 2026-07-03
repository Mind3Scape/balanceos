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

   Top-level declarations in this file: SettingsLive, NotificationsLive, HistoryLive,
   SupportLive, AchievementsLive, ManifestLive, IconPickerLive + the friends family
   (bosHabitsWord, _bosFriendsPageCache, FriendsLive, FriendPreviewSheetLive) and
   StateHistorySheetLive. (GuideScreen is NOT defined in profile.jsx — it lives in
   app.jsx — so no GuideLive fork is made here.) */

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

// Склонение «привычка/привычки/привычек» для подписей друзей.
function bosHabitsWord(n) {
  n = Math.abs(n | 0); var d10 = n % 10, d100 = n % 100;
  if (d10 === 1 && d100 !== 11) return "привычка";
  if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) return "привычки";
  return "привычек";
}

/* СТРАНИЦА «ДРУЗЬЯ» (David: «страница друзей с карточками, превью их профилей, редактирование
   своего видимого профиля — нативно, как родное приложение iOS»). Раньше была куцая шторка-список;
   теперь полноценный экран в языке «Я»/Настроек (bos-sys-card, hairline-строки):
   1) ТВОЙ ВИДИМЫЙ ПРОФИЛЬ — как тебя видят друзья + карандаш (EditProfileSheet) + честная
      строка «Что видно другим» (имя, аватар, уровень, значки привычек — БЕЗ названий и записей).
   2) ТВОИ ЛЮДИ — реальные люди: приглашённые (реферальный круг) + участники твоих кругов
      (дедуп, без себя). Тап по карточке → ШТОРКА-превью профиля (FriendPreviewSheetLive).
   3) Золотая «Позвать друга» (ShareAppSheetLive) — та же механика +150 XP, что везде.
   Кэш в модульной переменной → мгновенный повторный вход (паттерн CircleFriendsStripLive). */
var _bosFriendsPageCache = null; // { people:[{id,name,avatar,invited,teams[]}], pub:{id:{level,lvlPct,habits,goals,people}} }
function FriendsLive() {
  const { navigate, params } = useNav();
  const app = useApp();
  const { open: openSheet } = useSheet();
  const isDark = app?.themeOverride === "dark";
  const back = (params && params.from) || "profile";
  const [data, setData] = useP(_bosFriendsPageCache); // null = загрузка
  const teamSig = (app?.teams || []).filter((t) => t.cloudId).map((t) => t.cloudId).join(",");
  React.useEffect(() => {
    let on = true;
    (async () => {
      if (!(window.bosCloud && window.bosCloud.enabled())) { if (on) setData({ people: [], pub: {} }); return; }
      let myId = null; try { myId = await window.bosCloud.uid(); } catch (e) {}
      const seen = {}, out = [];
      // 1) Приглашённые тобой (реферальный круг) — в порядке приглашения.
      try {
        const inv = await window.bosCloud.invitedPeople();
        (inv || []).forEach((p) => { if (p && p.id && p.id !== myId && !seen[p.id]) { seen[p.id] = 1; out.push({ id: p.id, name: p.username || "Друг", avatar: p.avatar, invited: true, teams: [] }); } });
      } catch (e) {}
      // 2) Люди из твоих кругов — дедуп + запоминаем ОБЩИЕ круги (для превью).
      const teams = (app?.teams || []).filter((t) => t.cloudId);
      for (let i = 0; i < teams.length; i++) {
        try {
          const mem = await window.bosCloud.teamMembers(teams[i].cloudId);
          (mem || []).forEach((m) => {
            if (!m || !m.id || m.id === myId) return;
            if (!seen[m.id]) { seen[m.id] = 1; out.push({ id: m.id, name: m.name || "Друг", avatar: m.avatar, invited: false, teams: [] }); }
            const f = out.find((x) => x.id === m.id);
            if (f && !f.teams.some((x) => x._id === teams[i]._id)) f.teams.push(teams[i]);
          });
        } catch (e) {}
      }
      // 3) Публичные орбиты друзей (уровень + значки привычек) — кормят подписи и превью.
      let pub = {};
      try { pub = (await window.bosCloud.profilesPublic(out.map((f) => f.id))) || {}; } catch (e) {}
      const d = { people: out, pub };
      _bosFriendsPageCache = d;
      if (on) setData(d);
    })();
    return () => { on = false; };
  }, [teamSig]);

  const chip = (icon) => <span className="bos-sys-chip-bg" style={{ width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0 }}>{React.createElement(icon, { size: 15, color: "var(--text)" })}</span>;
  const people = data && data.people;
  const pub = (data && data.pub) || {};
  const inviteFriend = () => { if (typeof ShareAppSheetLive === "function") openSheet(<ShareAppSheetLive dark={isDark} />); };

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Друзья" onBack={() => navigate(back)} />

      {/* ТВОЙ ВИДИМЫЙ ПРОФИЛЬ — как тебя видят друзья; карандаш → правка имени/аватара. */}
      <div className="bos-sys-card" style={{ marginTop: 6, padding: 0, overflow: "hidden" }}>
        <button onClick={() => openSheet(<EditProfileSheet dark={isDark} />)} className="tap" style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "transparent", border: 0, cursor: "pointer", textAlign: "left", padding: "13px 14px" }}>
          <BuddyFaceLive avatar={app?.avatar} name={app?.userName} size={46} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>{app?.userName || "Ты"}</div>
            <div className="bos-sys-text-3" style={{ fontSize: 12.5, marginTop: 1 }}>Так тебя видят друзья</div>
          </div>
          <span className="bos-sys-chip-bg" style={{ width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0 }}><I.Pencil size={14} color="var(--text)" /></span>
        </button>
        <button onClick={() => openSheet(<InfoSheet title="Что видно другим" body="Друзья видят твоё имя, аватар, уровень и значки привычек — без названий, записей и заметок. Всё остальное остаётся только у тебя." cta="Понятно" dark={isDark} />)} className="tap" style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "transparent", border: 0, borderTop: "0.5px solid var(--line)", cursor: "pointer", textAlign: "left", padding: "13px 14px" }}>
          {chip(I.Eye)}
          <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Что видно другим</span>
          <I.ChevronRight size={16} className="bos-sys-text-2" />
        </button>
      </div>

      {/* ТВОИ ЛЮДИ — карточки друзей; тап → шторка-превью профиля. */}
      <div className="section-label" style={{ marginTop: 22 }}>Твои люди{people && people.length ? " · " + people.length : ""}</div>
      <div className="bos-sys-card" style={{ marginTop: 8, padding: 0, overflow: "hidden" }}>
        {people === null && [0, 1, 2].map((i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderTop: i ? "0.5px solid var(--line)" : 0 }}>
            <span className="bos-skel" style={{ width: 42, height: 42, borderRadius: "50%", flexShrink: 0 }} />
            <span className="bos-skel" style={{ display: "block", width: "42%", height: 12, borderRadius: 6 }} />
          </div>
        ))}
        {people && people.length === 0 && (
          <div style={{ padding: "24px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 30, lineHeight: 1 }}>🫧</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginTop: 9 }}>Пока никого рядом</div>
            <div className="bos-sys-text-3" style={{ fontSize: 12.5, marginTop: 4, lineHeight: 1.45, maxWidth: 240, margin: "4px auto 0" }}>Позови друга — он появится здесь и на твоей орбите.</div>
          </div>
        )}
        {people && people.map((f, i) => {
          const o = pub[f.id];
          const sub = (o && o.level > 0)
            ? ("Уровень " + o.level + ((o.habits || []).length ? " · " + o.habits.length + " " + bosHabitsWord((o.habits || []).length) : ""))
            : (f.invited ? "Пришёл по твоему приглашению" : "Вместе в круге");
          return (
            <button key={f.id} onClick={() => openSheet(<FriendPreviewSheetLive friend={f} pub={o} navigate={navigate} />)} className="tap" style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "transparent", border: 0, borderTop: i ? "0.5px solid var(--line)" : 0, cursor: "pointer", textAlign: "left", padding: "12px 14px" }}>
              <BuddyFaceLive avatar={f.avatar} name={f.name} size={42} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                <div className="bos-sys-text-3" style={{ fontSize: 12.5, marginTop: 1 }}>{sub}</div>
              </div>
              {f.teams.length > 0 && <span style={{ fontSize: 15, marginRight: 2 }}>{bosIcon(f.teams[0].emblem || "✨", 15, null)}</span>}
              <I.ChevronRight size={16} className="bos-sys-text-2" />
            </button>
          );
        })}
      </div>

      {/* Позвать друга — та же золотая механика +150 XP, что на главной/в Сообществе. */}
      <button onClick={inviteFriend} className="tap" style={{ width: "100%", marginTop: 16, position: "relative", overflow: "hidden", border: 0, borderRadius: 22, padding: 16, background: "linear-gradient(135deg, #FEDE34, #EF9F14)", boxShadow: "0 8px 22px rgba(239,159,20,0.3)", color: "#0a0a0a", display: "flex", alignItems: "center", gap: 13, textAlign: "left", cursor: "pointer" }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 86% 8%, rgba(255,255,255,0.4) 0%, transparent 55%)", pointerEvents: "none" }} />
        <span style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.5)", display: "grid", placeItems: "center", flexShrink: 0, position: "relative" }}><I.Share size={20} /></span>
        <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
          <div style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: "-0.2px" }}>Позвать друга</div>
          <div style={{ fontSize: 12.5, color: "rgba(10,10,10,0.65)", marginTop: 2 }}>+150 XP за каждого, кто войдёт по твоей ссылке</div>
        </div>
        <I.ChevronRight size={18} style={{ position: "relative" }} />
      </button>
    </div>
  );
}

/* ШТОРКА-ПРЕВЬЮ ПРОФИЛЯ ДРУГА — его космос тем же OrbitField, что на «Я» (аватар в центре,
   золотое кольцо уровня, значки привычек на кольцах — из ПУБЛИЧНОЙ орбиты, без названий),
   тройка фактов и общие круги (тап → комната круга). navigate — пропом (шторки вне NavCtx). */
function FriendPreviewSheetLive({ friend, pub, navigate }) {
  const { open: openSheet, close } = useSheet();
  const app = useApp();
  const isDark = app?.themeOverride === "dark";
  const o = pub || {};
  const habits = (o.habits || []).map((h) => ({ emoji: (h && h.e) || "✨", color: (h && h.c) || null }));
  const goTeam = (t) => { close(); if (typeof navigate === "function") navigate("team-detail", { team: t, from: "friends" }); };
  return (
    <div className="bos-sheet-scroll" style={{ paddingLeft: 18, paddingRight: 18, textAlign: "center" }}>
      {typeof OrbitField === "function" ? (
        <div style={{ marginTop: -8 }}>
          <OrbitField avatar={friend.avatar} name={friend.name} habits={habits} people={[]} levelPct={o.lvlPct || 2} dark={isDark} hideLevelArc editable={false} levelBadge={o.level || 0} />
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}><BuddyFaceLive avatar={friend.avatar} name={friend.name} size={76} /></div>
      )}
      <div style={{ fontFamily: "var(--bos-title-font)", fontWeight: 700, fontSize: 24, marginTop: 0, color: "var(--text)", letterSpacing: "-0.4px" }}>{friend.name}</div>
      <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 3 }}>{friend.invited ? "На твоей орбите — по твоему приглашению" : "Вы вместе ведёте круг"}</div>

      {/* Тройка фактов из публичной орбиты — если друг уже что-то наполнил. */}
      {(o.level > 0 || habits.length > 0 || o.goals > 0) ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
          {[["Уровень", o.level || 1], ["Привычки", habits.length], ["Цели", o.goals || 0]].map(([l, v]) => (
            <div key={l} style={{ background: "var(--surface-3)", borderRadius: 16, padding: "11px 6px" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>{v}</div>
              <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 1, fontWeight: 600 }}>{l}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 14, lineHeight: 1.45 }}>Орбита друга ещё наполняется — значки его привычек появятся здесь.</div>
      )}

      {/* Общие круги — тап ведёт в комнату. */}
      {friend.teams && friend.teams.length > 0 && (
        <>
          <div style={{ textAlign: "left", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)", margin: "18px 2px 8px" }}>Вместе в кругах</div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "flex-start" }}>
            {friend.teams.map((t) => (
              <button key={t._id} onClick={() => goTeam(t)} className="tap" style={{ display: "inline-flex", alignItems: "center", gap: 6, ...(typeof bosChipGlass === "function" ? bosChipGlass(isDark) : { background: "var(--surface-3)" }), padding: "7px 13px 7px 9px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, color: "var(--text-2)", border: 0, cursor: "pointer" }}>
                <span style={{ fontSize: 14 }}>{bosIcon(t.emblem || "✨", 14, null)}</span>{t.name}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Тихая дорога — начать общий круг с этим человеком (позвать по ссылке). */}
      <button onClick={() => openSheet(<GoalFormSheetLive mode="create" circleOn={true} navigate={navigate} />)} className="tap" style={{ width: "100%", background: "transparent", border: 0, color: "var(--text-3)", padding: "12px", marginTop: 14, fontSize: 13.5, fontWeight: 600 }}>
        Собрать общий круг →
      </button>
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
      {/* Тёплая подпись внизу настроек (David: «сделано с любовью» — золотое сердечко). */}
      <div className="bos-sys-text-3" style={{ textAlign: "center", padding: "5px 14px 6px", fontSize: 12.5, opacity: 0.85 }}>Сделано с 💛</div>
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
                  aspectRatio: "1/1", border: 0, borderRadius: "50%", padding: 0,
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
                <span key={i} style={{ width: 15, height: 15, borderRadius: "50%", background: p <= 0 ? TH.cellIdle : bosCellFill("#0a0a0a", p), boxShadow: p > 0 ? bosCellGlass(isDark) : "none" }} />
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
                    <span className={"check-btn " + (done ? "" : "unchecked")} style={{ width: 26, height: 26 }}>
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
    { q: "Позвать в совместную цель", a: "Открой цель → шестерёнка → раздел «Участники» → выбери друга из подсказок. Он получит уведомление и сможет присоединиться к общей цели." },
    { q: "Конфиденциальность и данные", a: "Твои данные о привычках видны только тебе. В совместной цели друзья видят лишь отметки по общим привычкам — не личные." },
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
    { t: "Цели и вместе", ids: ["goal", "team"] },
  ];
  const showDetail = (a) => openSheet(typeof AchievementDetailSheetLive === "function"
    ? <AchievementDetailSheetLive ach={a} dark={dark} />
    : <InfoSheet dark={dark} title={a.t} body={(a.earned ? "Открыто ✓\n\n" : "Как открыть: " + (a.how || "") + "\n\n") + a.d + (a.xp ? "  ·  +" + a.xp + " XP" : "")} cta="Готово" />);
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

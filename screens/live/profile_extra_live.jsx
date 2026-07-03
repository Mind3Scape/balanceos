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
          // ЖИВАЯ строка друга (v530): золотое кольцо уровня вокруг лица (тот же язык, что
          // строка «Уровень» на «Я»), бейдж-цифра, справа — значки его РЕАЛЬНЫХ привычек из
          // публичной орбиты (эмодзи+цвет, без названий — то, что он и так показывает миру).
          const o = pub[f.id];
          const lvl = (o && o.level) || 0;
          const pctRing = Math.max(0, Math.min(100, (o && o.lvlPct) || 0));
          const hb = ((o && o.habits) || []).slice(0, 3);
          const sub = lvl > 0
            ? ("Уровень " + lvl + ((o.habits || []).length ? " · " + o.habits.length + " " + bosHabitsWord((o.habits || []).length) : ""))
            : (f.invited ? "Пришёл по твоему приглашению" : "Вместе в круге");
          return (
            <button key={f.id} onClick={() => openSheet(<FriendPreviewSheetLive friend={f} pub={o} navigate={navigate} />)} className="tap" style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "transparent", border: 0, borderTop: i ? "0.5px solid var(--line)" : 0, cursor: "pointer", textAlign: "left", padding: "12px 14px" }}>
              <span style={{ position: "relative", width: 46, height: 46, flexShrink: 0, display: "grid", placeItems: "center" }}>
                <svg width="46" height="46" viewBox="0 0 46 46" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }} aria-hidden>
                  <circle cx="23" cy="23" r="21.5" fill="none" stroke={isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"} strokeWidth="2" />
                  {pctRing > 0 && <circle cx="23" cy="23" r="21.5" fill="none" stroke="url(#bosFrLvl)" strokeWidth="2" strokeLinecap="round" strokeDasharray="135.1" strokeDashoffset={135.1 * (1 - pctRing / 100)} />}
                  <defs><linearGradient id="bosFrLvl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FEDE34" /><stop offset="1" stopColor="#EF9F14" /></linearGradient></defs>
                </svg>
                <BuddyFaceLive avatar={f.avatar} name={f.name} size={38} />
                {lvl > 0 && <span style={{ position: "absolute", right: -3, bottom: -2, minWidth: 17, height: 17, borderRadius: 999, background: "linear-gradient(135deg,#FEDE34,#EF9F14)", color: "#0a0a0a", fontSize: 10, fontWeight: 800, display: "grid", placeItems: "center", padding: "0 3px", boxShadow: "0 0 0 2px var(--card)" }}>{lvl}</span>}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                <div className="bos-sys-text-3" style={{ fontSize: 12.5, marginTop: 1 }}>{sub}</div>
              </div>
              {hb.length > 0 ? (
                <div style={{ display: "flex", marginRight: 2, flexShrink: 0 }}>
                  {hb.map((hx, j) => <span key={j} style={{ width: 24, height: 24, borderRadius: 8, background: (hx && hx.c) ? hx.c + "26" : "var(--card-2)", display: "grid", placeItems: "center", fontSize: 12, marginLeft: j ? -6 : 0, border: "1.5px solid var(--card)" }}>{(hx && hx.e) || "✨"}</span>)}
                </div>
              ) : (f.teams.length > 0 && <span style={{ fontSize: 15, marginRight: 2 }}>{bosIcon(f.teams[0].emblem || "✨", 15, null)}</span>)}
              <I.ChevronRight size={16} className="bos-sys-text-2" />
            </button>
          );
        })}
      </div>

      {/* Позвать друга + ВЕХИ (v530): та же золотая механика +150 XP, но с РЕАЛЬНЫМ прогрессом
          к следующему бонусу (3/7/15/30 друзей → +300/700/1500/3000 XP — те же вехи, что фраза
          на главной). Сегменты = приглашённые из этой десятки/тройки; всё честно, без таймеров. */}
      {(() => {
        const invited = Math.max(app?.invitedCount || 0, people ? people.filter((p) => p.invited).length : 0);
        const miles = [{ n: 3, b: 300 }, { n: 7, b: 700 }, { n: 15, b: 1500 }, { n: 30, b: 3000 }];
        const next = miles.find((m) => m.n > invited);
        return (
          <button onClick={inviteFriend} className="tap" style={{ width: "100%", marginTop: 16, position: "relative", overflow: "hidden", border: 0, borderRadius: 22, padding: 16, background: "linear-gradient(135deg, #FEDE34, #EF9F14)", boxShadow: "0 8px 22px rgba(239,159,20,0.3)", color: "#0a0a0a", textAlign: "left", cursor: "pointer", display: "block" }}>
            <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 86% 8%, rgba(255,255,255,0.4) 0%, transparent 55%)", pointerEvents: "none" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 13, position: "relative" }}>
              <span style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.5)", display: "grid", placeItems: "center", flexShrink: 0 }}><I.Share size={20} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: "-0.2px" }}>Позвать друга</span>
                  <span style={{ display: "inline-flex", alignItems: "center", fontSize: 10.5, fontWeight: 800, color: "#FEDE34", background: "#0a0a0a", padding: "2px 8px", borderRadius: 999, flexShrink: 0 }}>+150 XP</span>
                </div>
                <div style={{ fontSize: 12.5, color: "rgba(10,10,10,0.65)", marginTop: 2 }}>Он появится на твоей орбите — и вы будете видеть живое друг друга</div>
              </div>
              <I.ChevronRight size={18} />
            </div>
            {next && (
              <div style={{ position: "relative", marginTop: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, color: "rgba(10,10,10,0.55)" }}>Веха · +{next.b} XP бонусом</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(10,10,10,0.75)", fontVariantNumeric: "tabular-nums" }}>{invited} из {next.n}</span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {Array.from({ length: next.n }, (_, j) => (
                    <span key={j} style={{ flex: 1, height: 6, borderRadius: 999, background: j < invited ? "#0a0a0a" : "rgba(10,10,10,0.18)" }} />
                  ))}
                </div>
              </div>
            )}
          </button>
        );
      })()}
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
  // Вкладка «Я» внизу (слияние Главной и «Привычек»): дефолт ВКЛ; выключил — заходи через
  // аватар в сводке дня. Если сводку убрали с доски, вкладка показывается принудительно
  // (app.jsx), чтобы дверь в настройки не захлопнулась.
  const [profTab, setProfTab] = React.useState(() => {
    try { return localStorage.getItem("bos:profileTab") !== "0"; } catch (e) { return true; }
  });
  const setProfTabPersist = (on) => {
    setProfTab(on);
    try { localStorage.setItem("bos:profileTab", on ? "1" : "0"); } catch (e) {}
    try { window.dispatchEvent(new Event("bos:profileTabChanged")); } catch (e) {}
  };
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
        toggleRow(I.Bell, "Push-уведомления", push, setPushPersist, true),
      ])}

      {group("Главный экран", [
        row(I.Home, "Главный экран", () => navigate("home-customize")),
        // Слияние: страницы «Привычки» больше нет, «Я» — четвёртая вкладка меню (по желанию).
        toggleRow(I.Person, "Вкладка «Я» внизу", profTab, setProfTabPersist, true),
      ])}

      {group("О приложении", [
        row(I.Compass, "Как устроен Balance", () => navigate("guide", { from: "settings" })),
        row(I.Sparkles, "Манифест", () => navigate("manifest", { from: "settings" })),
        row(null, "Политика конфиденциальности", () => openSheet(<InfoSheet title="Политика конфиденциальности" body={PRIVACY_BODY} cta="Готово" dark={routeDark}/>)),
        row(null, "Условия использования", () => openSheet(<InfoSheet title="Условия использования" body={PRIVACY_BODY} cta="Готово" dark={routeDark}/>), true),
      ])}
      <div className="bos-sys-text-3" style={{ textAlign: "center", padding: "16px 14px 2px", fontSize: 13 }}>Версия {APP_VERSION}</div>
      {/* «Сделано с 💛» ПЕРЕЕХАЛО на страницу «Я» (David: тёплой подписи место у орбит). */}
    </div>
  );
}

/* Лента уведомлений — ПРЕЗЕНТАЦИЯ (секция Б): «Требует решения» (заявки, Принять/✕),
   «Новое» (тебя приняли / вступили в круг / пришли по твоей ссылке), «Сообщения»
   (непрочитанные чаты). Отделена от загрузки, чтобы рендериться и с готовыми данными. */
function NotifFeedLive({ data, busy, onApprove, onReject, onOpenTeam, onOpenChat, onOpenAccepted, onOpenFriends, onOpenBuddy }) {
  const secHead = (t) => (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)", padding: "8px 4px 0" }}>{t}</div>
  );
  const face = (u, size) => (typeof BuddyFaceLive === "function")
    ? <span style={{ flexShrink: 0 }}><BuddyFaceLive avatar={(u && u.avatar) || "default"} name={(u && u.name) || ""} size={size || 40} /></span>
    : <span style={{ fontSize: 24, flexShrink: 0 }}>🙂</span>;
  const emblem = (e) => (
    <span style={{ width: 40, height: 40, borderRadius: 13, flexShrink: 0, background: "linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe8))", display: "grid", placeItems: "center", fontSize: 20 }}>{typeof bosIcon === "function" ? bosIcon(e || "✨", 20, null) : (e || "✨")}</span>
  );
  const row = (key, left, title, sub, right, onClick) => (
    <SysCard key={key} onClick={onClick} style={{ padding: 13, display: "flex", gap: 12, alignItems: "center", cursor: onClick ? "pointer" : "default" }}>
      {left}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14.5, color: "var(--text)", lineHeight: 1.3 }}>{title}</div>
        {sub && <div className="bos-sys-text-3" style={{ fontSize: 12.5, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>}
      </div>
      {right}
    </SysCard>
  );
  const chatWord = (n) => n === 1 ? "новое сообщение" : (n < 5 ? "новых сообщения" : "новых сообщений");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.requests.length > 0 && secHead("Требует решения")}
      {data.requests.map((r) => {
        const k = r.team.cloudId + ":" + r.user.id;
        const st = busy[k];
        return row(k, face(r.user),
          (r.user.name || "Гость") + " хочет в «" + r.team.name + "»",
          st === "done" ? "Принят — уже в круге ✓" : st === "rejected" ? "Заявка отклонена" : "Заявка на вступление",
          (st === "done" || st === "rejected") ? null : (
            <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
              <button onClick={(e) => { e.stopPropagation(); onApprove(r); }} disabled={st === "busy"} className="tap" data-haptic="selection"
                style={{ border: 0, cursor: "pointer", borderRadius: 999, padding: "9px 15px", fontSize: 13, fontWeight: 600, background: "var(--cta, #0a0a0a)", color: "var(--cta-ink, #fff)", opacity: st === "busy" ? 0.5 : 1 }}>Принять</button>
              <button onClick={(e) => { e.stopPropagation(); onReject(r); }} disabled={st === "busy"} className="tap" aria-label="Отклонить"
                style={{ border: 0, cursor: "pointer", width: 34, height: 34, borderRadius: "50%", background: "var(--card-2)", color: "var(--text-3)", display: "grid", placeItems: "center", opacity: st === "busy" ? 0.5 : 1 }}><I.X size={15} /></button>
            </div>
          ),
          null);
      })}

      {(data.accepted.length > 0 || data.joined.length > 0 || (data.buddies || []).length > 0 || data.invited.length > 0) && secHead("Новое")}
      {data.accepted.map((a) => row("acc-" + a.row.id, emblem(a.row.emblem),
        "Тебя приняли в «" + a.row.name + "»", "Открыть круг",
        <I.ChevronRight size={16} className="bos-sys-text-3" style={{ flexShrink: 0 }} />,
        () => onOpenAccepted(a.row)))}
      {data.joined.map((j, i) => row("join-" + i, face(j.user),
        (j.user.name || "Гость") + " теперь в «" + j.team.name + "»", "Вступил по ссылке-приглашению",
        <I.ChevronRight size={16} className="bos-sys-text-3" style={{ flexShrink: 0 }} />,
        () => onOpenTeam(j.team)))}
      {/* Совместные ПРИВЫЧКИ: друг вступил по твоей ссылке hb_ — теперь ведёте вместе. */}
      {(data.buddies || []).map((b, i) => row("bud-" + i, face(b.user),
        (b.user.name || "Друг") + " присоединился к привычке «" + (b.habit.name || "…") + "»",
        "Теперь ведёте её вместе — вы видите отметки друг друга",
        <I.ChevronRight size={16} className="bos-sys-text-3" style={{ flexShrink: 0 }} />,
        () => onOpenBuddy && onOpenBuddy(b.habit)))}
      {data.invited.map((p, i) => row("inv-" + i, face({ name: p.user.username, avatar: p.user.avatar }),
        (p.user.username || "Гость") + " пришёл по твоему приглашению", "Теперь на твоей орбите · +150 XP",
        <I.ChevronRight size={16} className="bos-sys-text-3" style={{ flexShrink: 0 }} />,
        onOpenFriends))}

      {data.chats.length > 0 && secHead("Сообщения")}
      {data.chats.map((c, i) => row("chat-" + i,
        <span style={{ fontSize: 24, flexShrink: 0 }}>💬</span>,
        c.count + " " + chatWord(c.count) + " в «" + c.team.name + "»",
        (c.last && c.last.text) || "📷 Фото",
        <I.ChevronRight size={16} className="bos-sys-text-3" style={{ flexShrink: 0 }} />,
        () => onOpenChat(c.team)))}
    </div>
  );
}

function NotificationsLive() {
  const { navigate, params } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  // LIVE (секция Б): события из облака одним сборщиком bosNotifCollectLive (shared_live) —
  // заявки/вступившие/рефералы/«тебя приняли»/чаты. Показ = прочитано для «Новое»
  // (bosNotifAbsorbLive гасит точку); заявки живут до решения, чаты — до открытия чата.
  const [data, setData] = React.useState(null);        // null = загрузка (скелет)
  const [busy, setBusy] = React.useState({});          // "<teamId>:<userId>" → busy|done|rejected
  const [cleared, setCleared] = React.useState(false); // «Очистить» прячет «Новое»+«Сообщения»
  React.useEffect(() => {
    let on = true;
    const emptyD = { requests: [], joined: [], invited: [], accepted: [], buddies: [], chats: [], absorb: null };
    if (!(window.bosCloud && window.bosCloud.enabled()) || typeof bosNotifCollectLive !== "function") { setData(emptyD); return; }
    bosNotifCollectLive(app).then((d) => {
      if (!on) return;
      setData(d);
      if (typeof bosNotifAbsorbLive === "function") bosNotifAbsorbLive(d.absorb);
    }).catch(() => { if (on) setData(emptyD); });
    return () => { on = false; };
  }, []);
  const setB = (k, v) => setBusy((b) => Object.assign({}, b, { [k]: v }));
  const approve = async (r) => {
    const k = r.team.cloudId + ":" + r.user.id;
    setB(k, "busy");
    const ok = await window.bosCloud.approveMember(r.team.cloudId, r.user.id).catch(() => false);
    if (ok) {
      if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
      setB(k, "done");
      // Принятый не должен тут же всплыть «вступившим»: пометим его виденным сразу.
      if (data && data.absorb && typeof bosNotifAbsorbLive === "function") {
        const m = (data.absorb.members[r.team.cloudId] || []).concat([r.user.id]);
        bosNotifAbsorbLive({ inv: data.absorb.inv, members: Object.assign({}, data.absorb.members, { [r.team.cloudId]: m }) });
      }
    } else setB(k, null);
  };
  const reject = async (r) => {
    const k = r.team.cloudId + ":" + r.user.id;
    setB(k, "busy");
    const ok = await window.bosCloud.rejectMember(r.team.cloudId, r.user.id).catch(() => false);
    if (ok) { if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } setB(k, "rejected"); }
    else setB(k, null);
  };
  const openChat = (t) => { try { localStorage.setItem("bos:chatread:" + t.cloudId, String(Date.now())); } catch (e) {} navigate("team-chat", { team: t, from: "notifications" }); };
  const openTeam = (t) => navigate("team-detail", { team: t, from: "notifications" });
  const openFriends = () => navigate("friends", { from: "notifications" });
  const openBuddy = (h) => navigate("habit-detail", { habit: h, from: "notifications" });
  const openAccepted = (row) => {
    // Круг ещё не в моих «Целях» (вступление подтвердил владелец, не я) → добавим локально
    // тем же форматом, что joinViaLink в shell, снимем «стук» и откроем комнату.
    const lt = { _id: "cloud-" + row.id, cloudId: row.id, joined: true, name: row.name, emblem: row.emblem || "✨", accent: "#dbe9ff", vis: row.vis, goal: "", members: [], target: row.goal_target || 0, current: 0, progress: 0 };
    let team = (app?.teams || []).find((t) => t.cloudId === row.id);
    if (!team && app && typeof app.addTeam === "function") team = app.addTeam(lt) || lt;
    if (typeof bosNotifKnockResolved === "function") bosNotifKnockResolved(row.id);
    navigate("team-detail", { team: team || lt, from: "notifications" });
  };
  const clearAll = () => {
    // «Новое» уже поглощено при показе; дочитаем чаты и спрячем всё, кроме заявок.
    if (data) data.chats.forEach((c) => { try { localStorage.setItem("bos:chatread:" + c.team.cloudId, String(Date.now())); } catch (e) {} });
    try { window.dispatchEvent(new Event("bos:notifSeenChanged")); } catch (e) {}
    setCleared(true);
  };
  const loading = data === null;
  const shown = loading ? null : (cleared ? Object.assign({}, data, { joined: [], invited: [], accepted: [], buddies: [], chats: [] }) : data);
  const _bud = (shown && shown.buddies) || [];
  const isEmpty = shown && !shown.requests.length && !shown.joined.length && !shown.invited.length && !shown.accepted.length && !_bud.length && !shown.chats.length;
  const canClear = shown && (shown.joined.length || shown.invited.length || shown.accepted.length || _bud.length || shown.chats.length) ? true : false;
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Уведомления" onBack={() => navigate(params?.from || "profile")} right={
        canClear ? <button onClick={clearAll} className="tap bos-sys-text-2" style={{ background: "transparent", border: 0, fontSize: 13 }}>Очистить</button> : null
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
      ) : isEmpty ? (
        <div className="bos-sys-text-3" style={{ textAlign: "center", padding: "60px 20px", fontSize: 14 }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>🔔</div>
          <div style={{ fontWeight: 600, color: "var(--text-2)", fontSize: 15 }}>Пока тихо</div>
          <div style={{ marginTop: 6, lineHeight: 1.5 }}>Здесь появятся заявки в твои круги,<br />новые люди и сообщения.</div>
        </div>
      ) : (
        <NotifFeedLive data={shown} busy={busy}
          onApprove={approve} onReject={reject}
          onOpenTeam={openTeam} onOpenChat={openChat}
          onOpenAccepted={openAccepted} onOpenFriends={openFriends} onOpenBuddy={openBuddy} />
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

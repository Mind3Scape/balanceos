/* PROFILE + AI — LIVE-only forks (real Telegram user, app.mode === "live" is
   ALWAYS true here). The demo ("Павел") and fresh branches are stripped: no
   curated level 7 / 72% / 1240 XP, no scripted "Павел Хиллсон" header, no demo
   orbit faces, no fresh Apple-Health intro, no scripted "Павел" insights /
   patterns / sparkline. Everything is real — real level/XP via bosLiveXPLive +
   bosLevelInfoLive, the real OrbitField with your invited people, real achievements,
   and the honest AI hub driven by app.aiBrief.

   Reuses the shared core/ toolkit (OrbitField, SysCard, SysBtn, AvatarPickerSheet,
   EditProfileSheet, InfoSheet, useAIT, buildQuickPrompts) + framework
   (PageHeader, BosAvatar, BosOrbFace, SiriOrb, I, hooks useApp/useNav/useSheet,
   every bos* helper, BOS_ACHIEVEMENTS_LIVE, tintFromMood).

   TYPOGRAPHY: primary labels (user name, section/row primary titles, list-item
   primary text) carry iOS Headline weight (fontWeight: 600 / 700) — matching the
   «Следующие шаги» pills. Secondary/caption text is left untouched.

   The ONLY new top-level declarations in this file are `function ProfileLive`
   and `function AILive`. */

function ProfileLive() {
  const { navigate } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  const { open: openSheet } = useSheet();
  const openAvatar = () => openSheet(<AvatarPickerSheetLive dark={app?.themeOverride === "dark"} />);
  // LIVE: always real data.
  const _xp = bosLiveXPLive(app);
  const _li = bosLevelInfoLive(_xp);
  const lvlNum = _li.level;
  const lvlPct = _li.pct;

  // Real multiplayer: pull the people you've actually invited (referral circle) from
  // the cloud and put them on your orbit.
  const [livePeople, setLivePeople] = React.useState([]);
  React.useEffect(() => {
    let on = true;
    try {
      if (window.bosCloud && window.bosCloud.enabled()) {
        window.bosCloud.invitedPeople().then((list) => {
          if (on && Array.isArray(list)) setLivePeople(list.map((p) => ({ avatar: (p && p.avatar) || "default", name: (p && (p.username || p.name)) || "" })));
        }).catch(() => {});
      }
    } catch (e) {}
    return () => { on = false; };
  }, []);
  const orbitPeople = livePeople;

  // Publish MY public ORBIT (level + habit icons + people count) so my system shows REAL to others in
  // «Вселенная» — their orbits with my habits/people, как у меня (David). World-readable; no-ops until
  // David adds the pub_orbit column. Only emoji+colour leave the device (no habit names). Re-publishes
  // when anything changes via a small signature string.
  const _pubHabits = (app?.habits || []).map((h) => ({ e: h.emoji, c: h.color }));
  const _pubSig = JSON.stringify(_pubHabits) + "|" + orbitPeople.length + "|" + lvlNum + "|" + (app?.goals || []).length;
  React.useEffect(() => {
    try { if (window.bosCloud && window.bosCloud.enabled() && window.bosCloud.savePublicStats) window.bosCloud.savePublicStats({ level: lvlNum, habits: _pubHabits, goals: (app?.goals || []).length, people: orbitPeople.length }); } catch (e) {}
  }, [_pubSig]);

  // Achievements badge — REAL earned set + emojis.
  const _liveAch = bosEarnedAchievementsLive(app).filter((a) => a.earned);
  const _achTotal = BOS_ACHIEVEMENTS_LIVE.length;
  const _achEarnedN = _liveAch.length;
  const _achEmojis = _liveAch.slice(0, 3).map((a) => a.i);
  const _achCircles = livePeople.length;
  const isDark = app?.themeOverride === "dark";
  const [universeOpen, setUniverseOpen] = React.useState(false); // зум-аут в «Вселенную»
  // Единый ЦЕЛОСТНЫЙ переход: меряем твою орбиту на «Я» и отдаём её рект во Вселенную — она стартует
  // ровно отсюда и плавно отдаляется к множеству систем (David: «ощущение перехода ОТ нашей системы»).
  const orbitRef = React.useRef(null);
  const [universeFrom, setUniverseFrom] = React.useState(null);
  const openUniverse = () => {
    try { const r = orbitRef.current && orbitRef.current.getBoundingClientRect(); setUniverseFrom(r && r.width ? { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height, size: Math.min(r.width, r.height) } : null); } catch (e) { setUniverseFrom(null); }
    setUniverseOpen(true);
  };
  const statCard = isDark
    ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }
    : { background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" };
  // Grouped iOS-style menu (v280): plain render-fn so re-renders never remount the rows.
  const chip = (icon) => <span className="bos-sys-chip-bg" style={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0 }}>{React.createElement(icon, { size: 16, color: "var(--text)" })}</span>;
  const navRow = (icon, label, id, last) => (
    <button key={id} onClick={() => navigate(id, { from: "profile" })} className="tap" style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: "transparent", border: 0, borderBottom: last ? "none" : "0.5px solid var(--line)", cursor: "pointer", textAlign: "left", padding: "13px 14px" }}>
      {chip(icon)}
      <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: "var(--text)" }}>{label}</span>
      <I.ChevronRight size={18} className="bos-sys-text-2" />
    </button>
  );
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      {/* Правый-верх: «Вселенная» (зум-аут к другим системам) + карандаш-правки (как на стр. Привычки).
          David: кнопке вселенной «снизу по центру между блоками не место» → ушла в шапку. */}
      <PageHeader onBack={() => navigate("home")} title="" right={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={openUniverse} className="tap" aria-label="Вселенная" title="Вселенная"
            style={{ width: 40, height: 40, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", cursor: "pointer", color: isDark ? "#fff" : "var(--text)", background: (typeof BOS_TILE_SHEEN !== "undefined" ? BOS_TILE_SHEEN + ", " : "") + (isDark ? "rgba(255,255,255,0.10)" : "var(--surface-3)"), boxShadow: (typeof bosTileGlass === "function" ? bosTileGlass(isDark) : "none") }}>
            <I.Galaxy size={18} strokeWidth={1.8} />
          </button>
          {typeof EditGlassButtonLive === "function" ? <EditGlassButtonLive onClick={openAvatar} /> : null}
        </div>
      } />

      <div style={{ textAlign: "center", marginTop: 4 }}>
        {/* Your orbit — you in the centre, habits orbiting by strength, your invited people around you */}
        {/* Центр = аватар с золотым кольцом + ЦИФРОЙ уровня (как на главной); карандаш ушёл наверх-вправо. */}
        {/* При входе во Вселенную прячем СТРАНИЧНУЮ орбиту (overlay рисует её идентичную копию ровно
            на этом же месте) → нет «двойной орбиты», переход читается как одно целое. */}
        <div ref={orbitRef} style={{ opacity: universeOpen ? 0 : 1, transition: "opacity 0.2s ease" }}>
          <OrbitField avatar={app?.avatar} name={app?.userName} habits={app?.habits || []} people={orbitPeople} levelPct={lvlPct} moodC={app?.mood?.c} dark={app?.themeOverride === "dark"} hideLevelArc editable={false} levelBadge={lvlNum} />
        </div>
        <div style={{ fontFamily: "var(--bos-title-font)", fontWeight: 700, fontSize: 28, marginTop: 6, color: "var(--text)" }}>{app?.userName || "Ты"}</div>
      </div>

      {universeOpen && typeof UniverseFieldLive === "function" && <UniverseFieldLive app={app} people={orbitPeople} from={universeFrom} onClose={() => setUniverseOpen(false)} />}

      {/* Уровень (золотая ВЕРХУШКА — перенесена с главной) + Достижения + Друзья — ЕДИНЫЙ блок в стиле
          «Настройки/Уведомления/Поддержка» (David: «друзья/достижения/уровни одним блоком, уровень
          интегрировать как верхушку красивее; старый верхний стат-блок убрать»). */}
      <div className="bos-sys-card" style={{ marginTop: 16, padding: 0, overflow: "hidden" }}>
        {/* Уровень — теперь РАВНОВЫСОКАЯ строка как остальные: прогресс свёрнут в тонкое ЗОЛОТОЕ
            КОЛЬЦО вокруг иконки (язык орбит/колец приложения), без тяжёлого баннера и широкой полосы.
            Иконка — монохромный SVG в кружке, как у Достижений/Друзей и нижнего меню. */}
        <button onClick={() => navigate("levels", { from: "profile" })} className="tap" style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "transparent", border: 0, cursor: "pointer", textAlign: "left", padding: "13px 14px" }}>
          <span style={{ position: "relative", width: 40, height: 40, flexShrink: 0, display: "grid", placeItems: "center" }}>
            <svg width="40" height="40" viewBox="0 0 40 40" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)", transformBox: "fill-box", transformOrigin: "center" }}>
              <circle cx="20" cy="20" r="18" fill="none" stroke={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)"} strokeWidth="2.5" />
              <circle cx="20" cy="20" r="18" fill="none" stroke="url(#bosLvlRing)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="113.1" strokeDashoffset={113.1 * (1 - Math.max(0, Math.min(100, lvlPct)) / 100)} />
              <defs><linearGradient id="bosLvlRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FEDE34" /><stop offset="1" stopColor="#EF9F14" /></linearGradient></defs>
            </svg>
            <span className="bos-sys-chip-bg" style={{ width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center" }}><I.Sparkles size={15} color="var(--text)" /></span>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>Уровень {lvlNum}</div>
            <div className="bos-sys-text-3" style={{ fontSize: 12.5, marginTop: 1 }}>До {lvlNum + 1} уровня — {lvlPct}% · {_xp} XP</div>
          </div>
          <I.ChevronRight size={18} className="bos-sys-text-2" />
        </button>
        <button onClick={() => navigate("achievements", { from: "profile" })} className="tap" style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "transparent", border: 0, borderTop: "0.5px solid var(--line)", cursor: "pointer", textAlign: "left", padding: "13px 14px" }}>
          {chip(I.Trophy)}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>Достижения</div>
            <div className="bos-sys-text-3" style={{ fontSize: 12.5, marginTop: 1 }}>{_achEarnedN + " из " + _achTotal + (_achEarnedN === 0 ? " · открой первую" : "")}</div>
          </div>
          <div style={{ display: "flex", marginRight: 4 }}>
            {_achEmojis.map((e, i) => <span key={i} style={{ width: 24, height: 24, borderRadius: 7, background: "var(--card-2)", display: "grid", placeItems: "center", fontSize: 12, marginLeft: i ? -7 : 0, border: "1.5px solid var(--card)" }}>{e}</span>)}
          </div>
          <I.ChevronRight size={18} className="bos-sys-text-2" />
        </button>
        <button onClick={() => openSheet(<FriendsSheetLive dark={isDark} />)} className="tap" style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "transparent", border: 0, borderTop: "0.5px solid var(--line)", cursor: "pointer", textAlign: "left", padding: "13px 14px" }}>
          {chip(I.Users)}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>Друзья</div>
            <div className="bos-sys-text-3" style={{ fontSize: 12.5, marginTop: 1 }}>{livePeople.length > 0 ? (livePeople.length + (livePeople.length === 1 ? " человек на орбите" : " на твоей орбите")) : "Позови первого — он появится на орбите"}</div>
          </div>
          {livePeople.length > 0 && <div style={{ marginRight: 4, flexShrink: 0 }}><PeopleStackLive people={livePeople} size={24} max={4} /></div>}
          <I.ChevronRight size={18} className="bos-sys-text-2" />
        </button>
      </div>

      {/* App menu — one grouped iOS card, hairline-divided rows */}
      {/* App menu — Настройки first, Уведомления under (David). ИИ-инсайты removed (ИИ is its
          own tab) and История removed (it's reachable from the home calendar). */}
      <div className="bos-sys-card" style={{ marginTop: 12, padding: 0, overflow: "hidden" }}>
        {navRow(I.Settings, "Настройки", "settings")}
        {navRow(I.Bell, "Уведомления", "notifications")}
        {navRow(I.Help, "Поддержка и помощь", "support", true)}
      </div>
      <SysBtn onClick={() => navigate("onboarding", { from: "profile" })} style={{ marginTop: 12, color: "var(--accent-red)" }}>
        <span style={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0, background: "rgba(239,68,68,0.12)" }}>
          <I.Logout size={16} />
        </span>
        <span style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>Выйти</span>
      </SysBtn>
    </div>
  );
}

function AILive() {
  const { navigate } = useNav();
  const app = useApp();
  const t = useAIT();
  const [ask, setAsk] = useP("");
  // Same orb DNA as intro — pulled into the AI hub
  const orbTint = ["#cfe1ff", "#7aa4d0", "#1a2c48"];

  // ── LIVE user: a REAL coach hub, driven by live data + the AI login-brief ──
  // Everything below is computed from THIS person's own habits, state, XP and the
  // brief the AI generated for them at login. No scripted "Павел" insights.
  const brief = app.aiBrief || null;
  const liveHabits = app.habits || [];
  const doneToday = liveHabits.filter((h) => h && h.done).length;
  const maxStreak = (typeof bosMaxStreak === "function") ? bosMaxStreak(liveHabits) : 0;
  const liveXP = (typeof bosLiveXPLive === "function") ? bosLiveXPLive(app) : 0;
  const lvl = (typeof bosLevelInfoLive === "function") ? bosLevelInfoLive(liveXP) : { level: 1 };
  const moodName = (app.mood && app.mood.t) || "";
  const moodIcon = (app.mood && app.mood.i) || "";
  // ONE real line about the user today: prefer the AI brief summary; otherwise
  // derive a specific, TRUE line from their actual completion / streak / state.
  const briefSummary = (brief && brief.summary && ("" + brief.summary).trim()) || "";
  // A brand-new live user (no habits AND no real brief) gets an HONEST empty
  // state below — a check-in / start-chatting invite, never invented advice.
  const isBlank = liveHabits.length === 0 && !briefSummary;

  // The hero orb tint follows the user's CURRENT state colour — the same mood tint
  // the home hero orb uses (tintFromMood(app.mood.c)) — so it reads as "you, right now".
  const moodC = app.mood && app.mood.c;
  const liveTint = (moodC && typeof tintFromMood === "function") ? tintFromMood(moodC) : orbTint;

  let headline = briefSummary;
  if (!headline) {
    if (doneToday > 0 && liveHabits.length) headline = "Сегодня закрыто " + doneToday + " из " + liveHabits.length + ". Хороший темп — давай удержим его.";
    else if (maxStreak >= 2) headline = "Твоя серия — " + maxStreak + " дн. подряд. Одно небольшое действие сейчас её продлит.";
    else if (liveHabits.length) headline = "Новый день начался. Выбери одну привычку, с которой стартуешь.";
    else if (moodName) headline = "Состояние сейчас — «" + moodName + "». Начнём с одного маленького шага под него.";
    else headline = "Я рядом. Расскажи, как ты, — и наметим один маленький шаг на сегодня.";
  }
  // The brief's optional one-line next-step hint, shown softly under the headline.
  const hint = (brief && brief.hint && ("" + brief.hint).trim()) || "";

  // Real next-step suggestions = the brief pills ({ i: emoji, t: text }). The pill
  // text doubles as the chat prompt — the same contract the chat itself uses.
  // Fallback to context-aware prompts so a returning user never sees an empty list.
  let pills = (brief && Array.isArray(brief.pills) && brief.pills.length) ? brief.pills.slice(0, 4) : [];
  if (!pills.length && !isBlank && typeof buildQuickPrompts === "function") pills = buildQuickPrompts(app).slice(0, 4);

  const planPrompt = "Помоги составить простой план на сегодня по моим привычкам.";

  // «Следующие шаги» route to REAL features, not always the chat. New pills carry
  // { label, kind:"action"|"chat", route?, params?, prompt? }. action → open that
  // screen; chat → open the chat primed with prompt. Legacy/string pills (the old
  // { i, t } brief shape) gracefully fall back to a chat entry on their text.
  const pillLabel = (p) => (typeof p === "string" ? p : (p && (p.label || p.t)) || "");
  const goPill = (p) => {
    if (p && p.kind === "action" && p.route) return navigate(p.route, p.params || {});
    if (p && p.kind === "chat") return navigate("ai-chat", { prompt: p.prompt || pillLabel(p) });
    navigate("ai-chat", { prompt: pillLabel(p) });
  };

  return (
    <div className="page-in" style={{ padding: "0 12px 24px" }}>
      {/* Header — tab-style, no back button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 4px 14px" }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-4)", letterSpacing: 0.4 }}>{(app.userName || "").trim() ? "Персонально · для " + app.userName.trim() : "Твой помощник"}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.5px", marginTop: 2 }}>Balance AI</div>
        </div>
        <button data-tour="ai-chat-btn" onClick={() => navigate("ai-chat")} className="tap"
          style={{ height: 36, padding: "0 14px", borderRadius: 999, background: "#0a0a0a", color: "#fff", border: 0, fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <I.MessageCircle size={14}/> Чат
        </button>
      </div>

      {/* Warm hero — the user's own state orb + ONE real line about them today */}
      <div data-tour="ai-hero" style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(160deg, #0e1a2e 0%, #0a1424 100%)",
        borderRadius: 22, padding: "22px 22px 24px", color: "#fff",
      }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, background:
          "radial-gradient(circle at 80% 20%, rgba(180,210,255,0.18) 0%, transparent 40%), radial-gradient(circle at 10% 90%, rgba(120,160,210,0.15) 0%, transparent 40%)" }} />

        <div style={{ display: "flex", gap: 16, alignItems: "center", position: "relative" }}>
          <div style={{ flexShrink: 0, width: 112, height: 112, display: "grid", placeItems: "center" }}>
            <svg viewBox="-80 -80 160 160" width="112" height="112" style={{ overflow: "visible" }}>
              <SiriOrb r={42} tint={liveTint} t={t} intensity={1}/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "rgba(180,210,255,0.85)", fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase" }}>
              {moodName ? "Сейчас · " + (moodIcon ? moodIcon + " " : "") + moodName : "Сегодня"}
            </div>
            <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 19, lineHeight: 1.28, marginTop: 6, letterSpacing: "-0.3px" }}>{headline}</div>
            {hint && <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)", marginTop: 8, lineHeight: 1.5 }}>{hint}</div>}
          </div>
        </div>

        {/* Live stat row — only when there's something real to show */}
        {!isBlank && (
          <div style={{ display: "flex", gap: 6, marginTop: 16, position: "relative" }}>
            {[["Сегодня", liveHabits.length ? (doneToday + "/" + liveHabits.length) : "—"], ["Серия", maxStreak ? (maxStreak + " дн") : "—"], ["Уровень", lvl.level]].map((s, i) => (
              <div key={i} style={{ flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.3px" }}>{s[1]}</div>
                <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.6)", marginTop: 2, letterSpacing: 0.4 }}>{s[0]}</div>
              </div>
            ))}
          </div>
        )}

        {/* Primary CTA — «Построить план» → opens the chat primed with a real plan ask.
            Secondary — just talk → opens a free conversation. */}
        <div style={{ display: "flex", gap: 8, marginTop: 16, position: "relative" }}>
          <button onClick={() => navigate("ai-chat", { prompt: planPrompt })} className="tap"
            style={{ flex: 1, background: "var(--card)", color: "#0a1424", border: 0, borderRadius: 999, padding: "12px 14px", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <I.Sparkles size={15}/> Построить план
          </button>
          <button onClick={() => navigate("ai-chat")} className="tap"
            style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 999, padding: "12px 16px", fontSize: 14, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <I.MessageCircle size={14}/> Поговорить
          </button>
        </div>
      </div>

      {isBlank ? (
        /* HONEST empty state for a brand-new live user — no fake recommendations.
           Two real first steps: check in your state, or just start a conversation. */
        <>
          <button onClick={() => navigate("mood")} className="tap"
            style={{ width: "100%", marginTop: 12, background: "var(--card)", border: 0, borderRadius: 22, padding: 16, boxShadow: "var(--card-shadow)", display: "flex", alignItems: "center", gap: 13, textAlign: "left", color: "var(--text)" }}>
            <span style={{ width: 46, height: 46, borderRadius: 14, background: "linear-gradient(135deg,#e9f1ff,#cfe1ff)", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>🧭</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600 }}>Отметить состояние</div>
              <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 2, lineHeight: 1.45 }}>Пара секунд — и советы начнут подстраиваться под тебя.</div>
            </div>
            <I.ChevronRight size={18} color="var(--text-4)"/>
          </button>
          <button onClick={() => navigate("ai-chat", { prompt: "Расскажу немного о себе и своих целях" })} className="tap"
            style={{ width: "100%", marginTop: 10, background: "var(--card)", border: 0, borderRadius: 22, padding: 16, boxShadow: "var(--card-shadow)", display: "flex", alignItems: "center", gap: 13, textAlign: "left", color: "var(--text)" }}>
            <span style={{ width: 46, height: 46, borderRadius: 14, background: "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>💬</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600 }}>Рассказать о себе</div>
              <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 2, lineHeight: 1.45 }}>Пара минут — и ИИ узнает твои цели и ритм дня.</div>
            </div>
            <I.ChevronRight size={18} color="var(--text-4)"/>
          </button>
          <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-4)", marginTop: 18, padding: "0 24px", lineHeight: 1.5 }}>
            Подсказки появятся здесь, как только наберётся немного твоих данных.
          </div>
        </>
      ) : (
        /* Real next-step suggestions — the AI brief pills as tappable cards.
           Tap → open the chat already primed with that step. */
        pills.length > 0 && (
          <>
            <div className="section-label" style={{ marginTop: 18, color: "var(--text-3)", padding: "0 4px" }}>Следующие шаги</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {pills.map((p, i) => {
                const isChat = !p || typeof p === "string" || p.kind !== "action";
                return (
                <button key={i} onClick={() => goPill(p)} className="tap"
                  style={{ width: "100%", background: "var(--card)", borderRadius: 22, boxShadow: "var(--card-shadow)", border: 0, padding: 14, display: "flex", alignItems: "center", gap: 12, textAlign: "left", color: "var(--text)" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg, #e9f1ff, #cfe1ff)", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>{(p && p.i) || "✨"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)" }}>{pillLabel(p)}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 2, lineHeight: 1.45 }}>{isChat ? "Обсудить с помощником →" : "Открыть →"}</div>
                  </div>
                  <I.ChevronRight size={18} color="var(--text-4)" style={{ flexShrink: 0 }}/>
                </button>
                );
              })}
            </div>
          </>
        )
      )}

      {/* Free conversation — always available, even with no data yet */}
      <div className="section-label" style={{ marginTop: 18, color: "var(--text-3)", padding: "0 4px" }}>Спроси что угодно</div>
      <div style={{ background: "var(--card)", borderRadius: 22, padding: 14, marginTop: 8, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 6px" }}>
          <input value={ask} onChange={e => setAsk(e.target.value)} placeholder="Спросить Balance AI…"
            onKeyDown={e => e.key === "Enter" && navigate("ai-chat", ask.trim() ? { prompt: ask } : {})}
            style={{ flex: 1, border: 0, outline: 0, background: "transparent", color: "var(--text)", fontSize: 14, padding: "10px 6px" }}/>
          <button onClick={() => navigate("ai-chat", ask.trim() ? { prompt: ask } : {})} className="tap hit44"
            style={{ width: 36, height: 36, borderRadius: "50%", background: "#0a0a0a", border: 0, color: "#fff", display: "grid", placeItems: "center" }}>
            <I.Send size={14}/>
          </button>
        </div>
      </div>
    </div>
  );
}

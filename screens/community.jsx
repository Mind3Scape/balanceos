/* COMMUNITY: Teams + Network + Courses + Partners — polished */
const { useState: useCS } = React;

/* Liquid-glass icon chip — glossy, dimensional, iOS-26 style. Vivid gradient
   fill + bright top specular + inner shadow + soft coloured glow underneath. */
const COURSE_GLASS = {
  overload:     { from: "#FFD60A", to: "#FF8A00" },
  breakthrough: { from: "#6EC6FF", to: "#0A84FF" },
  marathon:     { from: "#5BE8A4", to: "#2BB673" },
};
function GlassChip({ from, to, emoji, size = 48, radius = 16 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      display: "grid", placeItems: "center", position: "relative", overflow: "hidden",
      background: `linear-gradient(145deg, ${from} 0%, ${to} 100%)`,
      boxShadow: `inset 0 1px 1.5px rgba(255,255,255,0.7), inset 0 -3px 8px rgba(0,0,0,0.18), 0 6px 16px ${to}66`,
      border: "0.5px solid rgba(255,255,255,0.35)",
    }}>
      <div aria-hidden style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: "48%", background: "linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0))", borderRadius: "0 0 60% 60%" }}/>
      <span style={{ position: "relative", fontSize: Math.round(size * 0.46), lineHeight: 1, filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.22))" }}>{emoji}</span>
    </div>
  );
}
function CourseGlass({ c, size = 46 }) {
  const g = COURSE_GLASS[c.id] || { from: c.accent, to: c.accent };
  return <GlassChip from={g.from} to={g.to} emoji={c.i} size={size} radius={size >= 54 ? 18 : 15} />;
}

/* Network locked-state banner.
   Network is a premium social tier — unlocks at L10. Shown when level too low. */
function NetworkLocked({ navigate, live, level, xp, xpMax, levelsLeft, weeks, onUnlock, onSwitchToCommunity }) {
  const xpPct = Math.max(0, Math.min(1, xp / xpMax));
  const ruLvl = (n) => { const m = n % 10, h = n % 100; return (m === 1 && h !== 11) ? "уровень" : (m >= 2 && m <= 4 && (h < 10 || h >= 20)) ? "уровня" : "уровней"; };
  const progPct = ((10 - levelsLeft - 1 + xpPct) / 10 * 100).toFixed(1);

  // For LIVE users these are the REAL ways to climb — actions inside the app that
  // actually earn XP. Demo keeps its curated premium showcase.
  const paths = live ? [
    {
      i: "🔥", t: "Закрывай привычки",
      d: "Каждый день с галочкой — это опыт и шаг к цели.",
      cta: "К привычкам", action: () => navigate("home"),
      meta: "+10 XP / день",
      accent: "#FEDE34",
    },
    {
      i: "🌤️", t: "Отмечай состояние",
      d: "Отметка и пара строк в дневнике дают опыт каждый день.",
      cta: "Отметить сейчас", action: () => navigate("mood"),
      meta: "+15 XP / день",
      accent: "#9bd0ff",
    },
    {
      i: "🤝", t: "Собери команду",
      d: "Общие привычки с друзьями тоже идут в твой опыт — и так веселее.",
      cta: "Создать команду", action: () => navigate("team-create"),
      meta: "Привычки вместе",
      accent: "#85e3a8",
    },
  ] : [
    {
      i: "🔥", t: "Держи серию",
      d: `Около ${weeks} недель ежедневных отметок — и ты на месте.`,
      cta: "К сегодняшнему дню", action: () => navigate("home"),
      meta: `+${Math.round((1 - xpPct) * 100)}% осталось`,
      accent: "#FEDE34",
    },
    {
      i: "🎓", t: "Пройди курс сообщества",
      d: "Каждый завершённый курс поднимает на целый уровень. Самый быстрый путь.",
      cta: "Смотреть курсы", action: () => onSwitchToCommunity(),
      meta: "Сразу +1 уровень",
      accent: "#85e3a8",
    },
    {
      i: "🤝", t: "Воспользуйся услугой партнёра",
      d: "Запишись к коучу Balance или партнёру — занятие принесёт XP.",
      cta: "Смотреть партнёров", action: () => onSwitchToCommunity(),
      meta: "+250 XP / сессия",
      accent: "#9bd0ff",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
      {/* Premium DARK hero — its OWN identity, distinct from the gold Courses banner
          so the two never blend. SAME format though: eyebrow · headline · desc · pills ·
          emblem top-right · progress. A lock emoji (no orb) sits where the trophy sits. */}
      <div style={{ position: "relative", overflow: "hidden", borderRadius: 22, padding: "16px 18px",
        background: "linear-gradient(145deg, #26406e 0%, #182c4f 52%, #0c1730 100%)",
        boxShadow: "0 10px 26px rgba(12,23,48,0.42)" }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 82% 18%, rgba(150,185,255,0.30) 0%, transparent 46%), radial-gradient(circle at 12% 96%, rgba(120,160,220,0.16) 0%, transparent 44%)", pointerEvents: "none" }} />
        <div aria-hidden style={{ position: "absolute", top: 15, right: 18, fontSize: 34, lineHeight: 1, pointerEvents: "none" }}>👑</div>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: "rgba(160,196,255,0.9)" }}>Нетворк · откроется с 10 уровня</div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px", color: "#fff", marginTop: 4, maxWidth: 215, lineHeight: 1.18 }}>Закрытый круг своих</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.74)", marginTop: 6, lineHeight: 1.4, maxWidth: 248 }}>Живые встречи и помощь рядом — с людьми твоего города.</div>

          {/* Level progress toward the unlock — sits ~middle (golden ratio) */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>Уровень {level} → 10</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.72)" }}>осталось {levelsLeft} {ruLvl(levelsLeft)}</span>
            </div>
            <div style={{ height: 9, borderRadius: 999, background: "rgba(255,255,255,0.13)", overflow: "hidden" }}>
              <span style={{ display: "block", height: "100%", width: progPct + "%", background: "linear-gradient(90deg, #FEDE34, #EF9F14)", borderRadius: 999 }} />
            </div>
          </div>

          {/* Essence pills — one row, at the bottom */}
          <div style={{ display: "flex", gap: 7, marginTop: 13 }}>
            {[["🤝", "Наставники"], ["💎", "Услуги за XP"]].map(([e, l], i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.13)", borderRadius: 999, padding: "6px 11px", fontSize: 12.5, fontWeight: 700, color: "#fff" }}>
                <span style={{ fontSize: 13, lineHeight: 1 }}>{e}</span>{l}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* UNLOCK PATHS */}
      <div className="section-label" style={{ marginTop: 6 }}>3 способа открыть</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {paths.map((p, i) => (
          <button key={i} onClick={p.action} className="tap" style={{
            background: "var(--card)", border: 0, borderRadius: 22, padding: 16,
            boxShadow: "var(--card-shadow)",
            display: "flex", alignItems: "center", gap: 14, textAlign: "left",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 14,
              background: `linear-gradient(135deg, ${p.accent}66, ${p.accent}22)`,
              display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0, position: "relative",
            }}>{p.i}</div>
            <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{p.t}</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: `${p.accent}33`, color: "#0a0a0a", letterSpacing: 0.2 }}>{p.meta}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 4, lineHeight: 1.45 }}>{p.d}</div>
            </div>
            <I.ChevronRight size={18} color="var(--text-4)" style={{ position: "relative" }}/>
          </button>
        ))}
      </div>

      {/* Footnote */}
      <div style={{ background: "var(--card)", borderRadius: 18, padding: "14px 16px", boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <I.Help size={14} color="var(--text-3)"/>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", letterSpacing: 0.2 }}>Почему Нетворк закрыт?</span>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.5 }}>
          Нам важны люди, преданные делу, а не случайный шум. Когда вход нужно заслужить, здесь остаются только те, с кем правда хочется познакомиться.
        </div>
      </div>

      {/* Dev: instant unlock — review-only, never shown to real (live) users */}
      {!live && (
      <button onClick={onUnlock} className="tap" style={{
        background: "transparent", border: "1px dashed rgba(0,0,0,0.15)", color: "var(--text-4)",
        borderRadius: 999, padding: "8px 14px", fontSize: 11, marginTop: 4, alignSelf: "center",
      }}>
Посмотреть открытый Нетворк →
      </button>
      )}
    </div>
  );
}

/* ── Impact gamification (Network tab) ────────────────────────────────
   Each level unlocks the ability to publicly offer a kind of service to
   the community, building a "social impact" score. Other members can
   book/redeem those offers — the offer is the unit of social capital.
   Tier table is shared between YourImpactCard and NetworkPersonCard so
   levels light up consistently. */
const IMPACT_TIERS = [
  { lvl: 3,  i: "🧠", t: "Разбор привычек",   d: "Найди чужие препятствия" },
  { lvl: 4,  i: "🌬️", t: "Дыхательная практика",  d: "Проведи 20-минутную сессию" },
  { lvl: 5,  i: "🧘", t: "Сессия медитации",  d: "Веди 30-минутную группу" },
  { lvl: 8,  i: "🏃", t: "Коучинг дисциплины", d: "Звонки по темпу и ответственности" },
  { lvl: 10, i: "💼", t: "Профессиональная консультация", d: "Поделись опытом (1 ч)" },
  { lvl: 15, i: "🎯", t: "Спринт менторства",   d: "Месячный пакет сопровождения" },
  { lvl: 20, i: "🌍", t: "Проведи ретрит",      d: "Организуй выходные с сообществом" },
];

function YourImpactCard({ level }) {
  const unlocked = IMPACT_TIERS.filter(t => t.lvl <= level);
  const next = IMPACT_TIERS.find(t => t.lvl > level);
  const myImpact = 480; // demo
  return (
    <div data-tour="impact" style={{
      background: "linear-gradient(135deg, #1a1a1d 0%, #0a0a0a 100%)",
      color: "#fff", borderRadius: 22, padding: 18, position: "relative", overflow: "hidden",
      boxShadow: "0 6px 22px rgba(0,0,0,0.18)",
    }}>
      <div aria-hidden style={{ position: "absolute", top: -40, right: -30, width: 160, height: 160, borderRadius: "50%",
        background: "radial-gradient(circle at 35% 35%, #ffe88a 0%, #FEDE34 30%, #EF9F14 70%, transparent 95%)", opacity: 0.18, filter: "blur(8px)" }}/>
      <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 600 }}>Твой вклад в сообщество</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
            <span style={{ fontFamily: "var(--bos-title-font)", fontSize: 30, fontWeight: 400, letterSpacing: "-0.5px" }}>{myImpact}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", letterSpacing: 0.4 }}>XP вклада · Уровень {level}</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, marginTop: 4 }}>
            Помогаешь другим — растёт твой вклад. Его можно обменять на XP или поднять статус.
          </div>
        </div>
      </div>

      {/* Unlocked offers — chips */}
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, marginBottom: 8 }}>Что ты можешь предложить</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {unlocked.length === 0 && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>С 3-го уровня сможешь предлагать свою помощь другим.</span>}
          {unlocked.map((u, i) => (
            <span key={i} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 10px", background: "rgba(255,255,255,0.07)", borderRadius: 999,
              fontSize: 12, color: "#fff", letterSpacing: -0.1,
            }}>
              <span aria-hidden style={{ fontSize: 14 }}>{u.i}</span>{u.t}
            </span>
          ))}
        </div>
      </div>

      {/* Next unlock teaser */}
      {next && (
        <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(255,222,52,0.08)", borderRadius: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 30, height: 30, borderRadius: 999, background: "rgba(254,222,52,0.18)", display: "grid", placeItems: "center", fontSize: 16, color: "#FEDE34" }}>{next.i}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>Откроется на {next.lvl} уровне · {next.t}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>{next.d}</div>
          </div>
          <I.ChevronRight size={14} color="rgba(255,255,255,0.5)"/>
        </div>
      )}

      <button className="tap" style={{
        width: "100%", marginTop: 12, background: "#FEDE34", color: "#0a0a0a",
        border: 0, borderRadius: 999, padding: "12px 14px",
        fontSize: 13, fontWeight: 600, letterSpacing: "-0.1px",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
      }}>
Опубликовать мои предложения <I.ChevronRight size={14}/>
      </button>
    </div>
  );
}

/* Reusable "write a message" sheet (light — sheets render outside theme scope). */
function MessageSheet({ name = "" }) {
  const { close } = useSheet();
  const [txt, setTxt] = useCS("");
  const [sent, setSent] = useCS(false);
  const send = () => { setSent(true); window.setTimeout(close, 1100); };
  return (
    <div style={{ padding: "2px 20px 8px", color: "#0a0a0a" }}>
      {sent ? (
        <div style={{ textAlign: "center", padding: "18px 0 12px" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#0a0a0a", color: "#fff", display: "grid", placeItems: "center", margin: "0 auto", fontSize: 26 }}>✓</div>
          <div style={{ fontSize: 17, fontWeight: 700, marginTop: 12 }}>Отправлено{name ? " · " + name : ""}</div>
          <div style={{ fontSize: 13, color: "rgba(0,0,0,0.5)", marginTop: 3 }}>Ответ придёт в уведомления</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 18, fontWeight: 700, textAlign: "center" }}>Написать{name ? " · " + name : ""}</div>
          <textarea value={txt} onChange={e => setTxt(e.target.value)} placeholder="Твоё сообщение…" rows={4}
            style={{ width: "100%", marginTop: 14, border: "1px solid rgba(0,0,0,0.1)", borderRadius: 14, padding: 12, fontSize: 16, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box", background: "#f7f7f8" }}/>
          <button onClick={send} className="tap" style={{ width: "100%", marginTop: 12, background: "#0a0a0a", color: "#fff", border: 0, borderRadius: 999, padding: "13px", fontSize: 15, fontWeight: 600 }}>Отправить</button>
        </>
      )}
    </div>
  );
}

function NetworkPersonCard({ p, userLevel }) {
  const { navigate } = useNav();
  const { open: openSheet } = useSheet();
  // sort offers by level so the easiest-to-book sits first
  const offers = (p.offers || []).slice().sort((a, b) => a.lvl - b.lvl);
  return (
    <div onClick={() => navigate("contact-detail", { contact: p })} className="tap"
      style={{ background: "var(--card)", borderRadius: 22, padding: 16, boxShadow: "var(--card-shadow)", cursor: "pointer" }}>
      {/* Top row: avatar + identity + impact pill */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <AvatarStack people={[p]} size={44} max={1} label={false}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>{p.name}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", background: "var(--card-2)", borderRadius: 999, padding: "2px 7px", letterSpacing: 0.4 }}>L{p.level}</span>
          </div>
          <div style={{ display: "flex", gap: 10, fontSize: 12, color: "var(--text-4)", marginTop: 4 }}>
            <span>📍 {p.city}</span><span>💼 {p.role}</span>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Вклад</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.4px", marginTop: 1 }}>{p.impact.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 10, lineHeight: 1.5 }}>{p.bio}</div>

      {/* Offers — what they share with the community */}
      {offers.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
          <div style={{ fontSize: 10, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, marginBottom: 8 }}>Предложения сообществу</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {offers.map((o, j) => {
              const locked = userLevel < o.lvl;
              return (
                <div key={j} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px", background: "var(--card-2)", borderRadius: 12,
                  opacity: locked ? 0.55 : 1,
                }}>
                  <span style={{ width: 30, height: 30, borderRadius: 10, background: "var(--card)", display: "grid", placeItems: "center", fontSize: 15, flexShrink: 0 }}>{o.i}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", letterSpacing: -0.1 }}>{o.t}</span>
                      {locked && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-4)", background: "var(--card)", borderRadius: 999, padding: "2px 6px", letterSpacing: 0.4 }}>
                          🔒 L{o.lvl}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 1 }}>{o.d}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: locked ? "var(--text-4)" : "var(--text)" }}>{o.price}</div>
                    {!locked && (
                      <button onClick={(e) => { e.stopPropagation(); navigate("contact-detail", { contact: p, focusOffer: j }); }} className="tap" style={{ marginTop: 2, fontSize: 11, fontWeight: 600, color: "#0a0a0a", background: "#FEDE34", border: 0, borderRadius: 999, padding: "3px 9px" }}>Записаться</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={(e) => { e.stopPropagation(); openSheet(<MessageSheet name={p.name}/>); }} className="tap" style={{ flex: 1, background: "var(--card-2)", border: 0, borderRadius: 999, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, color: "var(--text-2)" }}>
          <I.MessageCircle size={15}/> Написать
        </button>
        <button onClick={(e) => { e.stopPropagation(); navigate("contact-detail", { contact: p }); }} className="tap" style={{ background: "#0a0a0a", color: "#fff", border: 0, borderRadius: 999, padding: "10px 16px", fontSize: 13, fontWeight: 500 }}>Связаться</button>
      </div>
    </div>
  );
}

/* D3 — public teams you can JOIN. Pulls open teams from the cloud (excluding ones
   you're already in), with live member counts. Joining adds a real cloud-linked
   team to your list (real roster) and opens up its shared chat (D4). Renders only
   when there's something to join, so it never clutters an empty community. */
function CloudTeamsDiscover({ app }) {
  const [list, setList] = React.useState(null);
  const [busy, setBusy] = React.useState({});
  const [requested, setRequested] = React.useState({});
  React.useEffect(() => {
    let on = true;
    try {
      if (window.bosCloud && window.bosCloud.enabled()) {
        window.bosCloud.discoverTeams().then((ts) => { if (on) setList(Array.isArray(ts) ? ts : []); }).catch(() => { if (on) setList([]); });
      } else setList([]);
    } catch (e) { setList([]); }
    return () => { on = false; };
  }, []);
  if (!list || !list.length) return null;
  // E: send a JOIN REQUEST («из поиска — по заявке»). The creator approves it later.
  // Pre-SQL (no approval system yet) the call falls back to an instant join.
  const join = (t) => {
    setBusy((b) => Object.assign({}, b, { [t.id]: true }));
    try {
      window.bosCloud.requestJoin(t.id).then((res) => {
        setBusy((b) => Object.assign({}, b, { [t.id]: false }));
        if (!res) return;
        if (res.pending) { setRequested((r) => Object.assign({}, r, { [t.id]: true })); return; }
        // fallback: actually joined → add to my teams + drop from the discover list
        window.bosCloud.teamMembers(t.id).then((mem) => {
          if (app && app.addTeam) app.addTeam({
            cloudId: t.id, joined: true, name: t.name, emblem: t.emblem || "✨", accent: "#dbe9ff",
            vis: t.vis, goal: "Общая цель", target: t.goalTarget || 0,
            current: 0, unit: "", date: "", progress: 0,
            members: (mem || []).map((m) => ({ name: m.name || "Участник", initials: (m.name || "?").slice(0, 1), color: "#cfe1ff", avatar: m.avatar, pct: 0 })),
          });
          setList((l) => (l || []).filter((x) => x.id !== t.id));
        });
      });
    } catch (e) { setBusy((b) => Object.assign({}, b, { [t.id]: false })); }
  };
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)", padding: "4px 4px 8px" }}>Открытые команды рядом</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map((t) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--card)", borderRadius: 18, padding: 14, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <span style={{ width: 44, height: 44, borderRadius: 14, background: "var(--card-2)", display: "grid", placeItems: "center", fontSize: 24, flexShrink: 0 }}>{t.emblem || "✨"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600, color: "var(--text)" }}>{t.name}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2 }}>🌐 Открытая · {t.members} участ.</div>
            </div>
            <button onClick={() => join(t)} disabled={busy[t.id] || requested[t.id]} className="tap" style={{ flexShrink: 0, background: (busy[t.id] || requested[t.id]) ? "var(--card-2)" : "#0a0a0a", color: (busy[t.id] || requested[t.id]) ? "var(--text-3)" : "#fff", border: 0, borderRadius: 999, padding: "9px 16px", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{requested[t.id] ? "Заявка отправлена" : busy[t.id] ? "…" : "Вступить"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommunityScreen() {
  const { navigate } = useNav();
  const app = useApp();
  // View-state (section / sub-tabs / network unlock) lives in the shared store so
  // it survives navigating into a detail screen and back (the screen remounts).
  const cv = app?.communityView || { section: "discover", discTab: "teams", commTab: "network", networkUnlocked: false };
  const { section, discTab, commTab, networkUnlocked } = cv;
  const setView = (patch) => app?.setCommunityView(patch);
  const resolve = (v, cur) => (typeof v === "function" ? v(cur) : v);
  const setSection = (v) => setView({ section: resolve(v, section) });
  const setDiscTab = (v) => setView({ discTab: resolve(v, discTab) });
  const setCommTab = (v) => setView({ commTab: resolve(v, commTab) });
  const setNetworkUnlocked = (v) => setView({ networkUnlocked: resolve(v, networkUnlocked) });
  const [activated, setActivated] = useCS({}); // partner activations (by index)

  // Real level for LIVE users (was hard-coded to 8 — it wrongly told a level-1 user
  // they were 8/10). Demo keeps its curated numbers.
  const _isLiveComm = app?.mode === "live";
  // LIVE has no Партнёры tab — if a stale view left commTab on "partners" (e.g. it was
  // selected in demo), fall back to "network" so the content area is never blank.
  const commTabEff = (_isLiveComm && commTab === "partners") ? "network" : commTab;
  const _commLvl = (_isLiveComm && typeof bosLiveXP === "function") ? bosLevelInfo(bosLiveXP(app)) : null;
  const userLevel = _commLvl ? _commLvl.level : 8;
  const xpInLevel = _commLvl ? _commLvl.into : 1240;
  const xpForNext = _commLvl ? _commLvl.span : 2000;
  const levelsLeft = Math.max(0, 10 - userLevel);
  const weeksToUnlock = Math.max(1, levelsLeft);

  const teams = app?.teams || []; // shared store — "Создать команду" adds here
  const network = [
    { name: "Александра Иванова", initials: "АИ", color: "#e8c8a8", city: "Москва", role: "Маркетинг", bio: "Диджитал-маркетолог, 5 лет. Йога и медитация.", tags: ["Йога","Маркетинг","Путешествия"], dist: "в 2 км",
      level: 12, impact: 1840, offers: [
        { i: "🧘", t: "Сессия медитации", d: "30 мин · вт и чт",       price: "Бесплатно",        lvl: 5 },
        { i: "💼", t: "Консультация по маркетингу",  d: "1 ч · бренд и рост",      price: "150 XP/ч",   lvl: 10 },
      ] },
    { name: "Иван Петров",        initials: "ИП", color: "#a8d4e8", city: "Москва", role: "Основатель",   bio: "Предприниматель, бегун, вечный ученик.", tags: ["Бег","Книги","Закаливание"], dist: "в 3 км",
      level: 18, impact: 3120, offers: [
        { i: "🌬️", t: "Дыхательная практика",  d: "20 мин · по утрам в будни", price: "Бесплатно",        lvl: 4 },
        { i: "🏃", t: "Звонок с беговым коучем",     d: "45 мин · планы темпа",     price: "100 XP/звонок", lvl: 8 },
        { i: "💬", t: "Q&A с основателем",        d: "1 ч · b2b SaaS",            price: "200 XP/ч",   lvl: 15 },
      ] },
    { name: "Анастасия В.",       initials: "АВ", color: "#d4b8e8", city: "Москва", role: "Коуч",      bio: "Помогаю выстраивать устойчивые ритуалы.", tags: ["Коучинг","Мышление"], dist: "в 5 км",
      level: 9, impact: 1240, offers: [
        { i: "🧠", t: "Разбор привычек",  d: "30 мин · диагностика",       price: "Бесплатно",       lvl: 3 },
        { i: "🎯", t: "Менторство на месяц", d: "4 звонка · сопровождение",  price: "300 XP/мес",   lvl: 7 },
      ] },
  ];
  // Upcoming cohort window: a "D — D MMM" range that starts `startIn` days from the
  // REAL today and runs `days` long. Used for LIVE users so dates are never stale (demo
  // keeps its frozen showcase strings below). Same dash/short-month look as the originals.
  const _ruMon = ["янв","фев","мар","апр","мая","июн","июл","авг","сен","окт","ноя","дек"];
  const _cohortWindow = (startIn, days) => {
    const a = new Date(); a.setHours(0, 0, 0, 0); a.setDate(a.getDate() + startIn);
    const b = new Date(a); b.setDate(b.getDate() + (days - 1));
    return a.getMonth() === b.getMonth()
      ? a.getDate() + " — " + b.getDate() + " " + _ruMon[b.getMonth()]
      : a.getDate() + " " + _ruMon[a.getMonth()] + " — " + b.getDate() + " " + _ruMon[b.getMonth()];
  };
  const courses = [
    { id: "overload",     i: "⚡",    accent: "#fef3c7", t: "Перегрузка",      d: "Перенастрой мышление и очисти негативные убеждения.", price: "110 000 ₽", lvl: "Интенсив",   length: "3 дня", cohort: _isLiveComm ? _cohortWindow(12, 3) : "14 — 16 мар" },
    { id: "breakthrough", i: "🚀",    accent: "#dbe9ff", t: "Прорыв",  d: "Открой новые пути и преодолей пределы.",            price: "110 000 ₽", lvl: "Продвинутый",    length: "7 дней", cohort: _isLiveComm ? _cohortWindow(33, 7) : "8 — 14 апр" },
    { id: "marathon",     i: "🏃🏼‍♀️", accent: "#d6f3df", t: "Марафон",      d: "21-дневная программа устойчивых привычек.",                price: "110 000 ₽", lvl: "Базовый",  length: "21 день", cohort: _isLiveComm ? _cohortWindow(54, 21) : "1 — 21 мая" },
  ];
  const partners = [
    { name: "Headspace", emblem: "🧘", accent: "#ffe1c8", tagline: "Медитация под твою жизнь", offer: "−20% на год",      tags: ["Медитация","Сон"], xp: 250 },
    { name: "Strava",    emblem: "🏃", accent: "#fde2e2", tagline: "Двигайся с миллионами атлетов", offer: "2 месяца бесплатно",       tags: ["Бег","Велоспорт"], xp: 200 },
    { name: "Calm",      emblem: "🌙", accent: "#dbe9ff", tagline: "Истории для сна и звуки",    offer: "30 дней пробно",         tags: ["Сон","Спокойствие"], xp: 200 },
    { name: "Withings",  emblem: "⌚",  accent: "#d4f0eb", tagline: "Умные весы и трекинг сна",  offer: "−15% на устройства",      tags: ["Здоровье","Сон"], xp: 300 },
  ];

  return (
    <div className="page-in" style={{ padding: "0 12px 24px" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 4px 12px" }}>
        <div style={{ flex: 1, fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>Сообщество</div>
        <button onClick={() => navigate("team-create")} className="tap" style={{ background: "#0a0a0a", color: "#fff", border: 0, borderRadius: 999, padding: "10px 14px", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, boxShadow: "0 4px 14px rgba(0,0,0,0.18)" }}>
          <I.Plus size={16}/> Новая команда
        </button>
      </div>

      {/* Primary section — pill */}
      <div className="tab-pill" style={{ background: "var(--card-2)" }}>
        <button className={"tap " + (section === "discover" ? "active" : "")} onClick={() => setSection("discover")}>Команды</button>
        <button className={"tap " + (section === "community" ? "active" : "")} onClick={() => setSection("community")}>Сообщество</button>
      </div>

      {/* Secondary scope bar — a thinner pill segmented control (same family as the
          Команды/Сообщество pill above), only inside «Сообщество». «Команды» stands alone. */}
      {section === "community" && (
        // LIVE: Нетворк + Курсы (the 3 courses are real). Партнёры стоит скрыть, пока
        // реальных партнёров нет. DEMO: все три вкладки (showcase).
        <div className="tab-pill tab-pill-sm" style={{ background: "var(--card-2)", marginTop: 10, marginBottom: 14 }}>
          {(_isLiveComm
            ? [{ id: "network", t: "Нетворк" }, { id: "courses", t: "Курсы" }]
            : [{ id: "network", t: "Нетворк" }, { id: "courses", t: "Курсы" }, { id: "partners", t: "Партнёры" }]
          ).map(tb => (
            <button key={tb.id} className={"tap " + (commTabEff === tb.id ? "active" : "")} data-tour={tb.id === "network" ? "network" : undefined} onClick={() => setCommTab(tb.id)}>{tb.t}</button>
          ))}
        </div>
      )}

      {section === "discover" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
          {teams.map((t, i) => {
            const tgt = t.target || 0;
            const cur = t.current != null ? t.current : Math.round((t.progress || 0) * tgt);
            const gp = tgt > 0 ? Math.min(1, cur / tgt) : (t.progress || 0);
            return (
            <div key={i} className="team-card" style={{ ["--team-accent"]: t.accent, borderRadius: 22, padding: 18, position: "relative", overflow: "hidden" }}>
              {/* soft pastel card + faded emblem watermark — the calmer earlier look (no glow) */}
              <div aria-hidden className="team-card__emblem" style={{ position: "absolute", top: -10, right: -6, fontSize: 110, lineHeight: 1, pointerEvents: "none", transform: "rotate(8deg)" }}>{t.emblem}</div>
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: "var(--text)", letterSpacing: "-0.4px" }}>{t.name}</div>
                  <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 600, color: "var(--text-3)", background: "var(--card-track)", padding: "2px 8px", borderRadius: 999 }}>{t.vis === "public" ? "🌐 Открытая" : "🔒 Приватная"}</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 6, fontWeight: 500 }}>🎯 {t.goal}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{t.date} · {t.members.length} участников</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
                  <span>{t.target ? "К цели" : "Прогресс команды"}</span>
                  <span style={{ color: "var(--text)" }}>{t.target ? `${cur} / ${tgt} ${t.unit || ""}` : Math.round(gp * 100) + "%"}</span>
                </div>
                <div style={{ marginTop: 6, height: 8, borderRadius: 999, background: "var(--card-track)", overflow: "hidden" }}>
                  <span className="team-card__fill" style={{ display: "block", height: "100%", width: (gp * 100) + "%", borderRadius: 999 }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", marginTop: 14, gap: 8 }}>
                  <AvatarStack people={t.members} size={28} max={5} label={false}/>
                  <button onClick={() => navigate("team-detail", { team: t })} className="tap team-card__cta" style={{ marginLeft: "auto", border: 0, borderRadius: 999, padding: "11px 18px", fontSize: 13.5, fontWeight: 600 }}>
                    Открыть команду
                  </button>
                </div>
              </div>
            </div>
            );
          })}
          {teams.length === 0 && (
            <div style={{ textAlign: "center", padding: "8px 18px 2px", color: "var(--text-4)", fontSize: 13.5, lineHeight: 1.5 }}>
              Команды — это привычки вместе с друзьями. Создай первую или дождись приглашения.
            </div>
          )}
          <button data-tour="make-team" onClick={() => navigate("team-create")} className="tap team-new-cta" style={{ color: "#fff", border: 0, borderRadius: 22, padding: 18, display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
            <span style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,222,52,0.15)", display: "grid", placeItems: "center" }}>
              <I.Plus size={22} color="#FEDE34"/>
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>Создать команду</div>
              <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>Пригласи друзей, поставь общую цель, выстраивайте серии вместе.</div>
            </div>
            <I.ChevronRight size={18}/>
          </button>
          {/* D3 — open teams from the cloud you can join (live accounts only) */}
          {app?.mode === "live" && <CloudTeamsDiscover app={app} />}
        </div>
      )}

      {section === "community" && commTabEff === "network" && (
        // The unlocked Network body (YourImpactCard + the people list + their message/booking
        // buttons) is CURATED/FABRICATED content — demo-only. LIVE users get the honest locked
        // banner instead (real XP paths, no fabricated people), until a real network exists.
        (networkUnlocked && !_isLiveComm) ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
          {/* Your-impact hero — what YOU offer at your current level */}
          <YourImpactCard level={userLevel} />
          {/* Network header */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "4px 4px 0" }}>
            <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700 }}>Люди рядом с тобой</div>
            <div style={{ fontSize: 11, color: "var(--text-4)" }}>По вкладу</div>
          </div>
          {network.map((p, i) => <div key={i} data-tour={i === 0 ? "contacts" : undefined}><NetworkPersonCard p={p} userLevel={userLevel} /></div>)}
        </div>
        ) : (
          <div style={{ marginTop: 2 }}>
            <NetworkLocked
              navigate={navigate}
              live={_isLiveComm}
              level={userLevel}
              xp={xpInLevel}
              xpMax={xpForNext}
              levelsLeft={levelsLeft}
              weeks={weeksToUnlock}
              onUnlock={() => { if (!_isLiveComm) setNetworkUnlocked(true); }}
              onSwitchToCommunity={() => { setSection("community"); setCommTab("courses"); }}
            />
          </div>
        )
      )}

      {section === "community" && commTabEff === "courses" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
          {/* Gold "why courses" banner — the hook (esp. for a newcomer): a course is
              the fastest level-up — a whole level + an achievement that opens new
              circles of people + a big XP boost. Same gold as the level badge. */}
          <div style={{ position: "relative", overflow: "hidden", borderRadius: 22, padding: "16px 18px",
            background: "linear-gradient(135deg, #FEDE34 0%, #F7C420 44%, #EF9F14 100%)",
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
                <span style={{ background: "#0a0a0a", color: "#fff", borderRadius: 999, padding: "10px 18px", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500 }}>
                  О курсе <I.ChevronRight size={14} />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {section === "community" && commTabEff === "partners" && !_isLiveComm && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
          {partners.map((p, i) => (
            <div key={i} style={{ background: "var(--card)", borderRadius: 22, padding: 16, boxShadow: "var(--card-shadow)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 17, color: "var(--text)", letterSpacing: "-0.3px" }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4 }}>{p.tagline}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    {p.tags.map((tg, j) => <span key={j} style={{ background: "var(--card-2)", borderRadius: 999, padding: "4px 10px", fontSize: 11, color: "var(--text-3)" }}>{tg}</span>)}
                  </div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: p.accent, display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>{p.emblem}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Предложение для участников</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2, color: "var(--text)" }}>{p.offer}</div>
                  <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 2 }}>+{p.xp} XP за активацию</div>
                </div>
                {activated[i] ? (
                  <span style={{ background: "rgba(52,199,89,0.14)", color: "#1E8E4E", borderRadius: 999, padding: "10px 16px", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <I.Check size={14} strokeWidth={3}/> Активно
                  </span>
                ) : (
                  <button onClick={() => setActivated(a => ({ ...a, [i]: true }))} className="tap" style={{ background: "#0a0a0a", color: "#fff", border: 0, borderRadius: 999, padding: "10px 16px", fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    Активировать <I.ChevronRight size={14}/>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* Underline-style text tabs — secondary navigation that visually contrasts with the pill */
function UnderlineTabs({ value, onChange, tabs }) {
  return (
    <div style={{ display: "flex", gap: 0, marginTop: 14, marginBottom: 14, borderBottom: "1px solid rgba(0,0,0,0.06)", padding: "0 4px" }}>
      {tabs.map(tab => {
        const active = tab.id === value;
        return (
          <button key={tab.id} data-tour={tab.id === "network" ? "network" : undefined} onClick={() => onChange(tab.id)} className="tap" style={{
            background: "transparent", border: 0, padding: "10px 14px 12px",
            fontSize: 14, fontWeight: 600,
            color: active ? "var(--text)" : "var(--text-4)",
            letterSpacing: "-0.2px",
            position: "relative",
            transition: "color 0.18s",
          }}>
            {tab.t}
            <span style={{
              position: "absolute", left: 14, right: 14, bottom: -1, height: 2,
              background: active ? "#0a0a0a" : "transparent",
              borderRadius: 2, transition: "background 0.18s",
            }}/>
          </button>
        );
      })}
    </div>
  );
}

/* SplitEditor — Auto / Custom per-member quota distribution.
   In auto mode: target divides evenly across active members.
   In custom mode: each member gets an editable number input;
   shows running total + remainder vs target. */
function SplitEditor({ target, unit, members, setMembers, splitMode, setSplitMode }) {
  const activeMembers = members.filter(m => m.on);
  const perMember = activeMembers.length ? Math.ceil(target / activeMembers.length) : 0;

  // Initialise custom quotas the first time mode flips to custom
  React.useEffect(() => {
    if (splitMode !== "custom") return;
    setMembers(curr => {
      const active = curr.filter(m => m.on);
      const base = active.length ? Math.floor(target / active.length) : 0;
      const remainder = active.length ? target - base * active.length : 0;
      let activeIdx = 0;
      return curr.map(m => {
        if (!m.on) return { ...m, quota: undefined };
        if (m.quota != null) return m;
        const isFirst = activeIdx === 0;
        activeIdx++;
        return { ...m, quota: base + (isFirst ? remainder : 0) };
      });
    });
    // eslint-disable-next-line
  }, [splitMode]);

  const setQuota = (idx, q) => {
    const clean = Math.max(0, parseInt(String(q).replace(/\D/g, "")) || 0);
    setMembers(curr => curr.map((m, i) => i === idx ? { ...m, quota: clean } : m));
  };
  const autoBalance = () => {
    setMembers(curr => {
      const active = curr.filter(m => m.on);
      const base = active.length ? Math.floor(target / active.length) : 0;
      const remainder = active.length ? target - base * active.length : 0;
      let activeIdx = 0;
      return curr.map(m => {
        if (!m.on) return { ...m, quota: undefined };
        const isFirst = activeIdx === 0;
        activeIdx++;
        return { ...m, quota: base + (isFirst ? remainder : 0) };
      });
    });
  };

  const customTotal = activeMembers.reduce((s, m) => s + (m.quota || 0), 0);
  const remainder = target - customTotal;

  return (
    <div style={{ background: "var(--card)", borderRadius: 18, padding: 16, marginTop: 10, boxShadow: "var(--card-shadow)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, color: "var(--text-2)", fontWeight: 500 }}>Как распределяется?</div>
          <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>
            {splitMode === "auto" ? `~${perMember} ${unit}/чел.` : "Задай квоты на каждого ниже"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, background: "var(--card-2)", borderRadius: 999, padding: 3, flexShrink: 0 }}>
          {[{id:"auto",t:"Авто"},{id:"custom",t:"Вручную"}].map(o => (
            <button key={o.id} onClick={() => setSplitMode(o.id)} className="tap"
              style={{ background: splitMode === o.id ? "#fff" : "transparent", border: 0, borderRadius: 999, padding: "5px 12px", fontSize: 12, fontWeight: 500, color: "var(--text)" }}>{o.t}</button>
          ))}
        </div>
      </div>

      {splitMode === "auto" ? (
        <>
          <div style={{ display: "flex", width: "100%", height: 10, borderRadius: 999, overflow: "hidden", background: "var(--card-2)" }}>
            {activeMembers.map((m, i) => (
              <div key={i} title={`${m.name} · ${perMember} ${unit}`}
                style={{ flex: 1, background: m.color, borderRight: i < activeMembers.length - 1 ? "2px solid #fff" : 0 }}/>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--text-4)" }}>
            <span>{activeMembers.length} активных участников</span>
            <span>{target} {unit} всего</span>
          </div>
        </>
      ) : (
        <>
          {/* Stacked bar — proportional to entered quotas */}
          <div style={{ display: "flex", width: "100%", height: 10, borderRadius: 999, overflow: "hidden", background: "var(--card-2)" }}>
            {activeMembers.map((m, i) => {
              const flex = Math.max(0.001, m.quota || 0);
              return <div key={i} title={`${m.name} · ${m.quota || 0} ${unit}`}
                style={{ flex, background: m.color, borderRight: i < activeMembers.length - 1 ? "2px solid #fff" : 0, transition: "flex 0.2s" }}/>;
            })}
          </div>

          {/* Per-member quota rows */}
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
            {members.map((m, i) => {
              if (!m.on) return null;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: m.color, border: "1.5px solid #fff", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.6)", boxShadow: "0 1px 2px rgba(0,0,0,0.08)" }}>{m.initials}</span>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 14, color: "var(--text)" }}>{m.name}</div>
                  <button onClick={() => setQuota(i, Math.max(0, (m.quota || 0) - 1))} className="tap"
                    style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--card-2)", border: 0, fontSize: 14, color: "var(--text)" }}>−</button>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" value={m.quota ?? 0}
                    onChange={e => setQuota(i, e.target.value)}
                    style={{ width: 50, textAlign: "center", fontSize: 15, fontWeight: 600, color: "var(--text)", border: 0, outline: 0, background: "transparent", padding: 0 }}/>
                  <button onClick={() => setQuota(i, (m.quota || 0) + 1)} className="tap"
                    style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--card-2)", border: 0, fontSize: 14, color: "var(--text)" }}>+</button>
                </div>
              );
            })}
          </div>

          {/* Totals + auto-balance */}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button onClick={autoBalance} className="tap"
              style={{ background: "transparent", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 500, color: "var(--text-2)", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <I.Refresh size={12}/> Распределить поровну
            </button>
            <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
              <span style={{ fontSize: 12, color: "var(--text-4)" }}>{customTotal} / {target} {unit}</span>
              <span style={{
                fontSize: 11, fontWeight: 700,
                padding: "3px 9px", borderRadius: 999,
                background: remainder === 0 ? "#e5f5ea" : remainder > 0 ? "#fff5d8" : "#ffe8e8",
                color: remainder === 0 ? "#1e6b3a" : remainder > 0 ? "#8a6a00" : "#a02020",
              }}>
                {remainder === 0 ? "Ровно" : remainder > 0 ? `+${remainder} осталось` : `${-remainder} сверх`}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* DurationPicker — flexible team-goal timeframe.
   Presets in chips + "Custom range" that opens start/end date editors. */
function DurationPicker({ value, onChange }) {
  const presets = [
    { id: "week",    t: "1 неделя",    days: 7 },
    { id: "2weeks",  t: "2 недели",   days: 14 },
    { id: "month",   t: "1 месяц",   days: 30 },
    { id: "quarter", t: "3 месяца",  days: 90 },
    { id: "6mo",     t: "6 месяцев",  days: 180 },
    { id: "year",    t: "1 год",    days: 365 },
  ];
  const isCustom = typeof value === "object" && value !== null;
  const [showCustom, setShowCustom] = useCS(isCustom);
  const today = new Date();
  const fmt = (d) => d.toLocaleDateString("ru-RU", { month: "short", day: "numeric" });
  const todayStr = today.toISOString().slice(0, 10);
  const [start, setStart] = useCS(isCustom ? value.start : todayStr);
  const [end, setEnd] = useCS(() => {
    if (isCustom) return value.end;
    const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10);
  });

  const previewEnd = (() => {
    if (showCustom) return null;
    const p = presets.find(x => x.id === value);
    if (!p) return null;
    const d = new Date(); d.setDate(d.getDate() + p.days);
    return d;
  })();

  const days = (() => {
    if (!showCustom) {
      const p = presets.find(x => x.id === value);
      return p ? p.days : 0;
    }
    try {
      const s = new Date(start), e = new Date(end);
      return Math.max(0, Math.round((e - s) / 86400000));
    } catch { return 0; }
  })();

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {presets.map(p => {
          const on = !showCustom && value === p.id;
          return (
            <button key={p.id} onClick={() => { setShowCustom(false); onChange(p.id); }} className="tap"
              style={{
                background: on ? "#0a0a0a" : "#fff",
                color: on ? "#fff" : "var(--text-2)",
                border: on ? 0 : "1px solid rgba(0,0,0,0.08)",
                borderRadius: 999, padding: "8px 14px",
                fontSize: 13, fontWeight: 500,
              }}>{p.t}</button>
          );
        })}
        <button onClick={() => { setShowCustom(true); onChange({ start, end }); }} className="tap"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: showCustom ? "#0a0a0a" : "#fff",
            color: showCustom ? "#fff" : "var(--text-2)",
            border: showCustom ? 0 : "1px solid rgba(0,0,0,0.08)",
            borderRadius: 999, padding: "8px 14px",
            fontSize: 13, fontWeight: 500,
          }}>
          <I.Calendar size={13}/> Свой
        </button>
      </div>

      <div style={{ background: "var(--card)", borderRadius: 18, padding: 14, marginTop: 10, boxShadow: "var(--card-shadow)" }}>
        {!showCustom ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <I.Calendar size={18} color="var(--text-3)"/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                {fmt(today)} → {previewEnd ? fmt(previewEnd) : "—"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 2 }}>{days} дней · с сегодняшнего дня</div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 10.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Начало</div>
                <input type="date" value={start}
                  onChange={e => { setStart(e.target.value); onChange({ start: e.target.value, end }); }}
                  style={{ width: "100%", marginTop: 4, fontSize: 14, fontWeight: 500, color: "var(--text)", border: 0, outline: 0, background: "transparent", padding: "6px 0", borderBottom: "1px solid var(--line)" }}/>
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Конец</div>
                <input type="date" value={end}
                  onChange={e => { setEnd(e.target.value); onChange({ start, end: e.target.value }); }}
                  style={{ width: "100%", marginTop: 4, fontSize: 14, fontWeight: 500, color: "var(--text)", border: 0, outline: 0, background: "transparent", padding: "6px 0", borderBottom: "1px solid var(--line)" }}/>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 10 }}>{days} дней всего</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Shared emblem set for teams — a big, tasteful selection (create + settings use the same list).
const TEAM_EMBLEMS = [
  "✨","🔥","🌱","🌊","🏔️","⛰️","☀️","🌙","⭐","🌈","🍀","🌳","🌸","🌿",
  "🚀","🎯","🧭","🏃","🚴","🧘","🏋️","⚽","🏀","🥊","🏊","🤸","💪","🥇",
  "🧠","📚","💡","🎓","♟️","🪶","🔮",
  "🏆","👑","💎","⚡","🛡️","🗝️","🧩",
  "❤️","🤝","🫶","🌟","🎵","🎨","🌍","⚓",
];

function TeamCreateScreen() {
  const { navigate } = useNav();
  const app = useApp();
  const [name, setName] = useCS("");
  const [emblem, setEmblem] = useCS("✨");
  const [accent, setAccent] = useCS("#fef3c7");
  const [duration, setDuration] = useCS("month");
  const [vis, setVis] = useCS("private");

  // Goal config
  const [goalType, setGoalType] = useCS("collective"); // collective | streak | race
  const [goalTitle, setGoalTitle] = useCS("50 добрых дел");
  const [target, setTarget] = useCS(50);
  const [unit, setUnit] = useCS("дел");
  const [splitMode, setSplitMode] = useCS("auto"); // auto | custom
  const [linkedHabits, setLinkedHabits] = useCS({
    "🙏": true, "🧘🏼‍♀️": false, "📖": false, "🥗": false, "🏃🏼‍♀️": false,
  });
  const [stakes, setStakes] = useCS(true);
  const [stakeAmount, setStakeAmount] = useCS(100);

  // Members for split preview
  const allMembers = [
    { name: "Павел (вы)", initials: "П",  color: "#FEDE34", on: true,  you: true },
    { name: "Ник",      initials: "Н",  color: "#a8b9d4", on: true },
    { name: "Светлана",  initials: "С",  color: "#e8c8a8", on: true },
    { name: "Вадим",     initials: "В",  color: "#a8d4e8", on: false },
    { name: "Анна",      initials: "А",  color: "#d4a8b9", on: false },
    { name: "Лена",      initials: "Л",  color: "#d4b8e8", on: false },
  ];
  const [members, setMembers] = useCS(allMembers);
  const toggleMember = (i) => setMembers(m => m.map((x, j) => j === i ? { ...x, on: !x.on } : x));
  const activeMembers = members.filter(m => m.on);
  const perMember = Math.max(1, Math.ceil(target / Math.max(1, activeMembers.length)));

  const goalTypes = [
    { id: "collective", e: "🌊", t: "Общий счёт",  d: "Отметки всех складываются в одно число.", example: `напр. ${target} ${unit} вместе` },
    { id: "streak",     e: "🔥", t: "Серия у каждого",  d: "Каждый держит серию — команда проходит только если прошли все.", example: `напр. все держат серию ${duration === "week" ? 7 : duration === "month" ? 21 : 60} дней` },
    { id: "race",       e: "🏁", t: "Гонка",              d: "Бок о бок — первый до цели побеждает, остальные получают часть XP.",  example: `напр. первый до ${target} ${unit}` },
  ];

  const HABIT_LIB = [
    { e: "🙏", t: "Помогать" },
    { e: "🧘🏼‍♀️", t: "Медитация" },
    { e: "📖", t: "Чтение" },
    { e: "🥗", t: "Питание" },
    { e: "🏃🏼‍♀️", t: "Бег" },
  ];
  const linkedCount = Object.values(linkedHabits).filter(Boolean).length;
  const toggleHabit = (e) => setLinkedHabits(h => ({ ...h, [e]: !h[e] }));

  const accentSwatches = ["#fef3c7", "#dbe9ff", "#d6f3df", "#e9dffd", "#fde2e2", "#ffe1c8", "#d4f0eb", "#e3e3e3"];
  const emblemChoices = TEAM_EMBLEMS;

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Создать команду" onBack={() => navigate("community")} />

      {/* IDENTITY — team name + emblem + accent */}
      <div className="section-label">Идентичность</div>
      <div style={{
        background: `linear-gradient(135deg, ${accent} 0%, ${accent}66 60%, var(--card-fade) 100%)`,
        borderRadius: 22, padding: 18, marginTop: 8, boxShadow: "var(--card-shadow)",
        position: "relative", overflow: "hidden",
      }}>
        <div aria-hidden style={{
          position: "absolute", top: -10, right: -6, fontSize: 110, lineHeight: 1,
          opacity: 0.28, pointerEvents: "none", filter: "saturate(0.9)",
          transform: "rotate(8deg)",
        }}>{emblem}</div>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 600 }}>Название команды</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Команда создателей"
            style={{ width: "100%", marginTop: 6, fontSize: 22, fontWeight: 700, color: "var(--text)", border: 0, outline: 0, background: "transparent", padding: 0, letterSpacing: "-0.4px" }} />
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap", position: "relative", maxHeight: 142, overflowY: "auto", scrollbarWidth: "none", paddingRight: 2 }}>
          {emblemChoices.map(e => (
            <button key={e} onClick={() => setEmblem(e)} className="tap"
              style={{ width: 36, height: 36, borderRadius: "50%", background: emblem === e ? "#0a0a0a" : "rgba(255,255,255,0.7)", border: 0, fontSize: 18, display: "grid", placeItems: "center", boxShadow: emblem === e ? "none" : "inset 0 0 0 1px rgba(0,0,0,0.06)" }}>{e}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", position: "relative" }}>
          {accentSwatches.map(c => (
            <button key={c} onClick={() => setAccent(c)} className="tap"
              style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: 0, padding: 0, boxShadow: accent === c ? "0 0 0 2px #0a0a0a, 0 0 0 4px #fff" : "inset 0 0 0 1px rgba(0,0,0,0.08)" }}/>
          ))}
        </div>
      </div>

      {/* SHARED GOAL */}
      <div className="section-label" style={{ marginTop: 22 }}>Общая цель</div>

      {/* Goal type picker — 3 cards */}
      <div data-tour="team-modes" style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {goalTypes.map(gt => {
          const active = goalType === gt.id;
          return (
            <button key={gt.id} onClick={() => setGoalType(gt.id)} className="tap"
              style={{
                background: "var(--card)", border: active ? "2px solid #0a0a0a" : "1px solid rgba(0,0,0,0.05)",
                borderRadius: 18, padding: 14, display: "flex", alignItems: "center", gap: 12,
                textAlign: "left", boxShadow: "var(--card-shadow)",
              }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: active ? "#0a0a0a" : "#e8e8e8", color: active ? "#fff" : "var(--text)", display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0 }}>{gt.e}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{gt.t}</div>
                <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.45 }}>{gt.d}</div>
              </div>
              <div style={{
                width: 18, height: 18, borderRadius: "50%",
                background: active ? "#0a0a0a" : "transparent",
                border: active ? "0" : "1.5px solid var(--text-5)",
                flexShrink: 0, display: "grid", placeItems: "center",
              }}>
                {active && <I.Check size={11} color="#fff" strokeWidth={3}/>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Goal headline + target */}
      <div style={{ background: "var(--card)", borderRadius: 18, padding: 16, marginTop: 10, boxShadow: "var(--card-shadow)" }}>
        <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Чего ты хочешь</div>
        <input value={goalTitle} onChange={e => setGoalTitle(e.target.value)}
          placeholder="50 добрых дел"
          style={{ width: "100%", fontSize: 19, fontWeight: 600, color: "var(--text)", border: 0, outline: 0, padding: "8px 0 12px", background: "transparent", borderBottom: "1px solid var(--line)" }}/>
        {goalType !== "streak" && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Цель</div>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={target}
                onChange={e => setTarget(parseInt(e.target.value.replace(/\D/g,"")) || 0)}
                style={{ width: "100%", fontSize: 28, fontWeight: 700, color: "var(--text)", border: 0, outline: 0, background: "transparent", padding: 0, marginTop: 2 }}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Единица</div>
              <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="дел"
                style={{ width: "100%", fontSize: 18, color: "var(--text-3)", border: 0, outline: 0, background: "transparent", padding: "4px 0" }}/>
            </div>
          </div>
        )}
      </div>

      {/* Linked habits — drive the count */}
      <div style={{ background: "var(--card)", borderRadius: 18, padding: 16, marginTop: 10, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: "var(--text-2)", fontWeight: 500, lineHeight: 1.4 }}>Двигать цель привычками</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.5 }}>Отметка каждого участника по этим привычкам = +1 к цели. Участники также могут добавлять своё число вручную.</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: linkedCount > 0 ? "#1e6b3a" : "var(--text-4)", background: linkedCount > 0 ? "#e5f5ea" : "#e8e8e8", padding: "3px 9px", borderRadius: 999, flexShrink: 0 }}>{linkedCount} привязано</span>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
          {HABIT_LIB.map(h => {
            const on = linkedHabits[h.e];
            return (
              <button key={h.e} onClick={() => toggleHabit(h.e)} className="tap" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 11px 5px 5px", borderRadius: 999,
                background: on ? "#0a0a0a" : "#e8e8e8",
                color: on ? "#fff" : "var(--text-3)",
                border: 0, fontSize: 12, fontWeight: 500,
              }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--card)", display: "grid", placeItems: "center", fontSize: 13 }}>{h.e}</span>
                {h.t}
                {on && <I.Check size={12} strokeWidth={3}/>}
              </button>
            );
          })}
          <button className="tap" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 11px", borderRadius: 999,
            background: "transparent", border: "1px dashed rgba(0,0,0,0.18)",
            color: "var(--text-3)", fontSize: 12, fontWeight: 500,
          }}><I.Plus size={12}/> Новая привычка</button>
        </div>
      </div>

      {/* Per-member split (only for collective goals) */}
      {goalType === "collective" && <SplitEditor target={target} unit={unit} members={members} setMembers={setMembers} splitMode={splitMode} setSplitMode={setSplitMode}/>}

      {/* DURATION & VISIBILITY */}
      <div className="section-label" style={{ marginTop: 22 }}>Длительность</div>
      <DurationPicker value={duration} onChange={setDuration}/>

      <div className="section-label" style={{ marginTop: 22 }}>Видимость</div>
      <div style={{ marginTop: 8 }}>
        <Segmented value={vis} onChange={setVis} options={[
          {value:"private",label:"Приватная"},{value:"public",label:"Публичная"}
        ]} />
      </div>

      {/* STAKES — optional XP wager */}
      <div className="section-label" style={{ marginTop: 22 }}>Ставка в игре</div>
      <div data-tour="team-stakes" style={{ background: "var(--card)", borderRadius: 18, padding: 16, marginTop: 8, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: "var(--text-2)", fontWeight: 500 }}>Все ставят XP</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.5 }}>Дойдёте до цели — банк вернётся вдвое больше. Не дойдёте — ставки сгорают. Необязательно, но азартно.</div>
          </div>
          <Switch on={stakes} onChange={setStakes}/>
        </div>
        {stakes && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
            <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Ставка на человека</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={stakeAmount}
                onChange={e => setStakeAmount(parseInt(e.target.value.replace(/\D/g,"")) || 0)}
                style={{ flex: "0 0 80px", fontSize: 22, fontWeight: 700, color: "var(--text)", border: 0, outline: 0, background: "transparent", padding: 0, minWidth: 0 }}/>
              <span style={{ fontSize: 13, color: "var(--text-4)" }}>XP каждый</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, fontSize: 12, color: "var(--text-4)" }}>
              <span>{activeMembers.length} {activeMembers.length === 1 ? "участник" : "участников"}</span>
              <span style={{ fontWeight: 700, color: "var(--text)" }}>банк {stakeAmount * activeMembers.length} XP</span>
            </div>
          </div>
        )}
      </div>

      {/* INVITE MEMBERS */}
      <div className="section-label" style={{ marginTop: 22 }}>Пригласить участников</div>
      <div style={{ background: "var(--card)", borderRadius: 18, padding: 16, marginTop: 8, boxShadow: "var(--card-shadow)" }}>
        <div style={{ fontSize: 12, color: "var(--text-4)", marginBottom: 12, lineHeight: 1.45 }}>Участники видят отметки, итоги и распределение. Они могут поддержать или подтолкнуть.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {members.map((p, i) => (
            <button key={i} onClick={() => !p.you && toggleMember(i)} className="tap"
              disabled={p.you} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 11px 5px 5px", borderRadius: 999,
              background: p.on ? "#0a0a0a" : "#e8e8e8",
              color: p.on ? "#fff" : "var(--text-3)",
              border: 0, fontSize: 12, fontWeight: 500,
              opacity: p.you ? 0.85 : 1,
            }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: p.color, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.55)" }}>{p.initials}</span>
              {p.name}
              {p.on && <I.Check size={12} strokeWidth={3}/>}
            </button>
          ))}
          <button className="tap" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 11px", borderRadius: 999,
            background: "transparent", border: "1px dashed rgba(0,0,0,0.18)",
            color: "var(--text-3)", fontSize: 12, fontWeight: 500,
          }}><I.Plus size={12}/> Пригласить</button>
        </div>
      </div>

      <button className="bos-btn" style={{ marginTop: 20 }} onClick={() => {
        const dur = { week: "Эта неделя", month: "Этот месяц", quarter: "3 месяца", year: "Год" }[duration] || "Этот месяц";
        const nt = app?.addTeam({
          name: name.trim() || "Новая команда",
          emblem, accent, vis, // private / public — preserved from the toggle above
          goal: goalTitle || (target + " " + unit),
          target: Number(target) || 0, current: 0, unit,
          date: dur,
          progress: 0,
          members: activeMembers.map(m => ({ name: m.name, initials: m.initials, color: m.color, pct: 0 })),
        });
        // D3 — mirror to the cloud so a public team is discoverable by everyone and
        // can be joined by link. The local team keeps working even if the cloud is off.
        try {
          if (nt && app?.mode === "live" && window.bosCloud && window.bosCloud.enabled()) {
            window.bosCloud.createTeam({ name: nt.name, emblem, vis, goalKind: nt.goal, goalTarget: Number(target) || 0 })
              .then((row) => { if (row && row.id && app.updateTeam) app.updateTeam(nt._id, { cloudId: row.id }); });
          }
        } catch (e) {}
        navigate("community");
      }}>Создать команду</button>
    </div>
  );
}

/* Colored progress ring for a calendar day — like History's DayRing but any colour
   (per-member tint), so a member's month reads in their own colour. */
function TeamRing({ pct, color = "#FFC400", track, sw = 3, glow }) {
  const r = 16, C = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 40 40" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
      <circle cx="20" cy="20" r={r} fill="none" stroke={track} strokeWidth={sw} />
      {pct > 0 && <circle cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={glow ? { filter: `drop-shadow(0 0 1.5px ${color}bf)` } : undefined} />}
    </svg>
  );
}

/* PEOPLE MONTH CALENDAR — ONE shared full-month calendar (paged, like History), used
   by BOTH a team and an individual habit so the whole app reads the same way. Pass
   people [{name,initials,color,you?}] and dayFrac(personIdx, day, month)→0..1. With
   >1 person it shows a "Все" density view + a per-person selector; 1 person = just
   that month. Selection can be controlled (selPerson/onSelPerson) to sync with a
   leaderboard, else internal. `granular` shows %-completion in the read-out (teams). */
function PeopleMonthCalendar({ people = [], dayFrac, label = "Календарь", granular = false, selPerson: selProp, onSelPerson }) {
  const app = (typeof useApp === "function") ? useApp() : null;
  const isDark = app?.themeOverride === "dark";
  const MONTHS = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const DIM = [31,28,31,30,31,30,31,31,30,31,30,31];
  const CUR_M = 3, today = 28, year = 2026;
  const solo = people.length <= 1;
  const [mIdx, setMIdx] = useCS(CUR_M);
  const [selInner, setSelInner] = useCS(solo ? 0 : null);
  const selPerson = selProp !== undefined ? selProp : selInner;
  const setSelPerson = (v) => { if (onSelPerson) onSelPerson(v); else setSelInner(v); };
  const [selDay, setSelDay] = useCS(today);
  const daysInMonth = DIM[mIdx];
  const startWeekday = (mIdx * 3 + 3) % 7;
  const isCurMonth = mIdx === CUR_M;
  const lastLogged = isCurMonth ? today : (mIdx > CUR_M ? 0 : daysInMonth);
  const future = (d) => mIdx > CUR_M || d > lastLogged;
  const pf = (pi, d) => (future(d) ? null : dayFrac(pi, d, mIdx));
  const allFrac = (d) => { if (future(d)) return null; const v = people.map((_, i) => pf(i, d)); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; };
  const dayPct = (d) => (selPerson == null ? allFrac(d) : pf(selPerson, d));
  const track = isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.09)";
  const selColor = selPerson == null ? "#FFC400" : (people[selPerson]?.color || "#FFC400");
  const todayBg = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.07)"; // soft grey — not a hard black fill
  const selRing = isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.28)";
  const chipBg = isDark ? "rgba(255,255,255,0.07)" : "var(--surface-3)";
  const chip = (active) => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px 5px 6px", borderRadius: 999, background: active ? (isDark ? "#fff" : "#0a0a0a") : chipBg, color: active ? (isDark ? "#0a0a0a" : "#fff") : "var(--text-2)", border: 0, flexShrink: 0, fontSize: 13, fontWeight: active ? 700 : 500, whiteSpace: "nowrap", cursor: "pointer" });
  const weekday = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];
  const cells = [...Array.from({ length: startWeekday }, (_, i) => ({ blank: true, key: "b" + i })), ...Array.from({ length: daysInMonth }, (_, i) => ({ d: i + 1, key: "d" + (i + 1) }))];
  const selActive = future(selDay) ? null : people.filter((_, i) => (pf(i, selDay) ?? 0) >= 0.5).length;
  const selAvg = future(selDay) ? null : Math.round((allFrac(selDay) || 0) * 100);
  const selName = (selPerson != null && people[selPerson]) ? people[selPerson].name : null;

  return (
    <>
      {label && <div className="section-label" style={{ marginTop: 22 }}>{label}</div>}
      <div style={{ background: "var(--card)", borderRadius: 22, padding: 16, marginTop: label ? 8 : 0, boxShadow: "var(--card-shadow)" }}>
        {!solo && (
          <div className="screen-scroll" style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2, marginBottom: 14 }}>
            <button onClick={() => setSelPerson(null)} className="tap" style={chip(selPerson == null)}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", background: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.1)", display: "grid", placeItems: "center", fontSize: 10 }}>👥</span>
              Все
            </button>
            {people.map((m, i) => (
              <button key={i} onClick={() => setSelPerson(i)} className="tap" style={chip(selPerson === i)}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: m.color, display: "grid", placeItems: "center", fontSize: 9, fontWeight: 700, color: "rgba(0,0,0,0.6)" }}>{m.initials}</span>
                {m.you ? "Ты" : (m.name || "").split(" ")[0]}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => setMIdx((m) => Math.max(0, m - 1))} className="tap" style={{ background: chipBg, border: 0, borderRadius: 999, width: 32, height: 32, display: "grid", placeItems: "center", color: "inherit", opacity: mIdx === 0 ? 0.35 : 1 }}><I.ChevronLeft size={16} /></button>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.3px" }}>{MONTHS[mIdx]} {year}</div>
          <button onClick={() => setMIdx((m) => Math.min(11, m + 1))} className="tap" style={{ background: chipBg, border: 0, borderRadius: 999, width: 32, height: 32, display: "grid", placeItems: "center", color: "inherit", opacity: mIdx === 11 ? 0.35 : 1 }}><I.ChevronRight size={16} /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginTop: 14 }}>
          {weekday.map((w, i) => <div key={i} style={{ textAlign: "center", fontSize: 10.5, fontWeight: 600, letterSpacing: 0.6, color: "var(--text-4)" }}>{w}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginTop: 6 }}>
          {cells.map((c) => {
            if (c.blank) return <span key={c.key} aria-hidden style={{ aspectRatio: "1/1" }} />;
            const pct = dayPct(c.d);
            const fut = pct == null;
            const isToday = isCurMonth && c.d === today;
            const isSel = selDay === c.d;
            return (
              <button key={c.key} onClick={() => setSelDay(c.d)} className="tap" style={{ aspectRatio: "1/1", border: 0, borderRadius: "50%", padding: 0, display: "grid", placeItems: "center", position: "relative", fontSize: 13, fontWeight: isToday ? 700 : 500, cursor: "pointer", background: "transparent", color: fut ? "var(--text-4)" : (isDark ? "#fff" : "var(--text)") }}>
                {isToday && <span aria-hidden style={{ position: "absolute", width: "62%", aspectRatio: "1/1", borderRadius: "50%", background: todayBg }} />}
                {isSel && !isToday && <span aria-hidden style={{ position: "absolute", width: "66%", aspectRatio: "1/1", borderRadius: "50%", border: "1.5px solid " + selRing }} />}
                {fut ? <span aria-hidden style={{ position: "absolute", inset: "17%", borderRadius: "50%", border: "1px dashed " + (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)") }} />
                  : <TeamRing pct={pct} color={selColor} track={track} glow={pct === 1} />}
                <span style={{ position: "relative", zIndex: 1 }}>{c.d}</span>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 14, paddingTop: 13, borderTop: "1px solid var(--line)", fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.45 }}>
          {future(selDay) ? `${MONTHS[mIdx]} ${selDay} — ещё впереди`
            : solo
              ? <span><b style={{ color: "var(--text)" }}>{MONTHS[mIdx]} {selDay}</b> · {(dayPct(selDay) || 0) > 0 ? "выполнено ✓" : "пропущено"}</span>
              : selPerson == null
                ? <span><b style={{ color: "var(--text)" }}>{MONTHS[mIdx]} {selDay}</b> · отметилось {selActive} из {people.length}{granular && selAvg != null ? ` · ${selAvg}%` : ""}</span>
                : <span><b style={{ color: "var(--text)" }}>{selName}</b> · {MONTHS[mIdx]} {selDay} · {granular ? `${Math.round((dayPct(selDay) || 0) * 100)}% привычек` : ((dayPct(selDay) || 0) > 0 ? "отмечался ✓" : "пропустил")}</span>}
        </div>
      </div>
    </>
  );
}

/* iOS-style confirmation sheet — a destructive primary action over a Cancel.
   Reused for leaving / deleting a team. `onConfirm` may be async; the button shows
   a pending state and closes the sheet when it resolves. Sheets render outside the
   themed page scope, so the page background is light (same as the other team sheets). */
function ConfirmActionSheet({ emoji = "⚠️", title, message, confirmLabel, confirmIcon, onConfirm }) {
  const { close } = useSheet();
  const [busy, setBusy] = React.useState(false);
  const go = async () => {
    if (busy) return;
    setBusy(true);
    if (window.tgHaptic) { try { window.tgHaptic("medium"); } catch (e) {} }
    try { await onConfirm(); } catch (e) {}
    close();
  };
  return (
    <div style={{ padding: "2px 20px 0", color: "var(--text)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 12px", background: "rgba(255,59,48,0.12)", display: "grid", placeItems: "center", fontSize: 32 }}>{emoji}</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>{title}</div>
        {message && <div style={{ fontSize: 13.5, color: "var(--text-3)", marginTop: 6, maxWidth: 290, marginInline: "auto", lineHeight: 1.45 }}>{message}</div>}
      </div>
      <button onClick={go} disabled={busy} className="tap" style={{ width: "100%", marginTop: 20, border: 0, borderRadius: 999, padding: 15, background: "#FF3B30", color: "#fff", fontSize: 15.5, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: busy ? 0.6 : 1 }}>
        {confirmIcon ? React.createElement(confirmIcon, { size: 18 }) : null} {busy ? "Минутку…" : confirmLabel}
      </button>
      <button onClick={close} disabled={busy} className="tap" style={{ width: "100%", marginTop: 8, border: 0, borderRadius: 999, padding: 15, background: "var(--surface-3)", color: "var(--text)", fontSize: 15.5, fontWeight: 600 }}>
        Отмена
      </button>
      <div style={{ height: "max(8px, var(--tg-bottom-inset, 0px))" }} />
    </div>
  );
}

/* Leave (member) or delete (owner) a team, then drop it from the local store and go
   back to the community list. For a cloud team we hit the cloud first; a local-only
   team (no cloudId) just removes locally. Used by Team detail + Team settings. */
async function bosExitTeam({ app, team, isOwner }) {
  try {
    if (team && team.cloudId && window.bosCloud) {
      if (isOwner) { if (window.bosCloud.deleteTeam) await window.bosCloud.deleteTeam(team.cloudId); }
      else { if (window.bosCloud.leaveTeam) await window.bosCloud.leaveTeam(team.cloudId); }
    }
  } catch (e) {}
  if (app && app.removeTeam && team) app.removeTeam(team._id);
}
/* Open the iOS confirm sheet for leaving/deleting, wired to bosExitTeam + navigate-back. */
function bosConfirmExitTeam({ app, team, isOwner, navigate, openSheet }) {
  openSheet(
    <ConfirmActionSheet
      emoji={isOwner ? "🗑️" : "👋"}
      title={isOwner ? "Удалить команду?" : "Покинуть команду?"}
      message={isOwner
        ? "Команда «" + (team?.name || "") + "» и весь её прогресс исчезнут у всех участников. Это не отменить."
        : "Ты выйдешь из «" + (team?.name || "") + "». Снова войти можно будет только по приглашению."}
      confirmLabel={isOwner ? "Удалить команду" : "Покинуть"}
      confirmIcon={isOwner ? I.Trash : I.Logout}
      onConfirm={async () => { await bosExitTeam({ app, team, isOwner }); navigate("community"); }}
    />
  );
}

/* Share a team — invite link + native share. For a PRIVATE team this is the ONLY
   way someone else gets in (it's invisible otherwise); for a PUBLIC team the link
   just jumps straight to it. Join-by-link wires to the cloud at T1; the
   share/copy itself works now. */
function TeamShareSheet({ team }) {
  const [copied, setCopied] = React.useState(false);
  const isPublic = team?.vis === "public";
  // REFERRAL invite: every inviter gets their OWN link (?team=<id>&ref=<myUid>) so the
  // referral system can credit who brought a new member. The ref is resolved async from
  // the cloud uid; until it arrives we show the plain ?team link (still joins correctly).
  // Demo/local-only teams (no cloudId) keep the placeholder ?join link — no referral.
  const base = (typeof location !== "undefined" ? (location.origin + location.pathname) : "https://mind3scape.github.io/balanceos/");
  const baseTeamLink = team?.cloudId ? (base + "?team=" + team.cloudId) : (base + "?join=" + (team?._id || ""));
  const [link, setLink] = React.useState(baseTeamLink);
  React.useEffect(() => {
    let on = true;
    if (team?.cloudId && window.bosCloud && window.bosCloud.uid) {
      window.bosCloud.uid().then((id) => { if (on && id) setLink(base + "?team=" + team.cloudId + "&ref=" + id); }).catch(() => {});
    } else { setLink(baseTeamLink); }
    return () => { on = false; };
  }, [team?.cloudId]);
  const shareText = "Вести привычки вместе — веселее, и за совместные привычки больше XP ✨ Залетай в команду «" + (team?.name || "") + "» в BalanceOS";
  const copyLink = () => { try { navigator.clipboard.writeText(link); } catch (e) {} setCopied(true); setTimeout(() => setCopied(false), 1600); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } };
  const shareTelegram = () => {
    const url = "https://t.me/share/url?url=" + encodeURIComponent(link) + "&text=" + encodeURIComponent(shareText);
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
    // Inside Telegram Mini App, openTelegramLink keeps it in-app; otherwise open a tab.
    try { if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openTelegramLink) { window.Telegram.WebApp.openTelegramLink(url); return; } } catch (e) {}
    try { window.open(url, "_blank"); } catch (e) {}
  };
  return (
    <div style={{ padding: "2px 20px 0", color: "var(--text)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 12px", background: team?.accent || "#fef3c7", display: "grid", placeItems: "center", fontSize: 34 }}>{team?.emblem || "✨"}</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>Поделиться командой</div>
        {/* Enticing invite hook (same for both visibilities) … */}
        <div style={{ fontSize: 13.5, color: "var(--text-3)", marginTop: 6, maxWidth: 290, marginInline: "auto", lineHeight: 1.45 }}>
          Вести привычки вместе — веселее, и за совместные привычки больше XP ✨
        </div>
        {/* … plus an honest one-liner driven by the team's REAL visibility (never claim a
            private team is open). */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, fontSize: 11.5, fontWeight: 600, color: "var(--text-3)", background: "var(--surface-3)", padding: "4px 11px", borderRadius: 999 }}>
          {isPublic ? "🌐 Открытая · ссылка ведёт прямо в команду" : "🔒 Приватная · войдут только по этой ссылке"}
        </div>
      </div>
      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10, background: "var(--surface-3)", borderRadius: 14, padding: "11px 8px 11px 14px" }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{link}</span>
        <button onClick={copyLink} className="tap" style={{ flexShrink: 0, border: 0, background: "#0a0a0a", color: "#fff", borderRadius: 999, padding: "8px 15px", fontSize: 12.5, fontWeight: 600 }}>{copied ? "Готово" : "Копировать"}</button>
      </div>
      {/* Two clear actions (were blank black buttons): copy + Telegram, each with a label
          and an icon. Explicit colours so they stay legible whatever theme the sheet renders in. */}
      <button onClick={copyLink} className="tap" style={{ width: "100%", marginTop: 12, border: 0, borderRadius: 999, padding: 14, background: "#0a0a0a", color: "#fff", fontSize: 15, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <span style={{ fontSize: 17, lineHeight: 1 }}>🔗</span> {copied ? "Ссылка скопирована" : "Скопировать ссылку"}
      </button>
      <button onClick={shareTelegram} className="tap" style={{ width: "100%", marginTop: 8, border: 0, borderRadius: 999, padding: 14, background: "#229ED9", color: "#fff", fontSize: 15, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <I.Send size={18}/> Поделиться в Telegram
      </button>
      <div style={{ height: "max(8px, var(--tg-bottom-inset, 0px))" }} />
    </div>
  );
}

function TeamDetailScreen() {
  const { navigate, params } = useNav();
  const app = useApp();
  const { open: openSheet } = useSheet();
  const [expandedMember, setExpandedMember] = useCS(null);
  const passed = params?.team || { _id: "seed-1", name: "Команда создателей", emblem: "✨", accent: "#fef3c7", goal: "50 добрых дел за месяц", date: "1 — 31 дек", progress: 0.62, members: [] };
  // Read the LIVE team from the store so a just-added habit appears immediately.
  const t = (app?.teams || []).find(x => x._id === passed._id) || passed;
  const accent = t.accent || "#fef3c7";

  // Real team-chat preview + unread badge for LIVE cloud teams (demo keeps its scripted line).
  const _chatLive = app?.mode === "live" && !!(window.bosCloud && window.bosCloud.enabled() && t.cloudId);
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
        // SAME time base on both sides. (Was Date.now() = the reader's device clock, which
        // drifts vs the server, so on skewed phones the badge got stuck or never showed.)
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
  const _rosterLive = app?.mode === "live" && !!(window.bosCloud && window.bosCloud.enabled() && t.cloudId);
  const [cloudRoster, setCloudRoster] = React.useState(null);
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
      var palette = ["#a8b9d4", "#d4b8e8", "#a8d4e8", "#e8c8a8", "#b8e8c8", "#e8b8d4"];
      // owner first, then members, in join order
      var sorted = mem.slice().sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0));
      setCloudRoster(sorted.map((m, i) => ({ id: m.id, name: m.name || "Участник", avatar: m.avatar, role: m.role, initials: (m.name || "У").slice(0, 1).toUpperCase(), color: palette[i % palette.length] })));
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
  const [liveTeamHabits, setLiveTeamHabits] = React.useState(null);
  const [habitsTick, setHabitsTick] = React.useState(0);
  React.useEffect(() => {
    if (!_rosterLive || !window.bosCloud.teamHabitsFull) return;
    let on = true;
    window.bosCloud.teamHabitsFull(t.cloudId).then((hs) => { if (on) setLiveTeamHabits(Array.isArray(hs) ? hs : []); }).catch(() => {});
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
  const liveRoster = _rosterLive && cloudRoster;
  const members = liveRoster ? cloudRoster : (t.members?.length ? t.members : [{name:"Ник",initials:"Н",pct:19,color:"#a8b9d4"}]);
  const ranked = liveRoster ? members : [...members].sort((a, b) => (b.pct || 0) - (a.pct || 0)); // demo: by contribution; live: roster order (owner first)
  const DEFAULT_TEAM_HABITS = [
    { id: 1, emoji: "🙏", name: "Добрые дела",  isMain: true,  doneToday: 8,  total: 9, weekPct: 0.78, week:[1,1,0,1,1,1,1] },
    { id: 2, emoji: "🧘🏼‍♀️", name: "Групповая медитация", isMain: false, doneToday: 6, total: 9, weekPct: 0.65, week:[1,0,1,1,0,1,1] },
    { id: 3, emoji: "📖", name: "Читаем вместе",       isMain: false, doneToday: 4, total: 9, weekPct: 0.42, week:[0,1,0,1,0,0,1] },
    { id: 4, emoji: "🥗", name: "Здоровое питание",         isMain: false, doneToday: 7, total: 9, weekPct: 0.81, week:[1,1,1,1,0,1,1] },
  ];
  const teamHabits = _rosterLive ? (liveTeamHabits || []) : (Array.isArray(t.habits) ? t.habits : DEFAULT_TEAM_HABITS);
  const main = teamHabits.find(h => h.isMain);
  const others = teamHabits.filter(h => !h.isMain);
  const aggregate = teamHabits.length ? Math.round(teamHabits.reduce((s,h) => s + (h.weekPct||0), 0) / teamHabits.length * 100) : 0;
  const openAddHabit = () => openSheet(<TeamHabitSheet team={t} members={members} onAdd={(h) => { if (_rosterLive) addTeamHabitCloud(h); else app?.addTeamHabit(t._id, h); }} />);
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Команда" onBack={() => navigate("community")} right={
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => openSheet(<TeamShareSheet team={t} />)} className="tap" title="Поделиться командой" style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--surface-3)", border: 0, display: "grid", placeItems: "center" }}>
            <I.Share size={18}/>
          </button>
          {/* E — only the team's CREATOR sees the gear. _isOwner reads the real roster role
              (so a creator on a second device still gets it), falling back to !t.joined. */}
          {_isOwner && (
          <button onClick={() => navigate("team-settings", { team: t })} className="tap" style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--surface-3)", border: 0, display: "grid", placeItems: "center" }}>
            <I.Settings size={18}/>
          </button>
          )}
        </div>
      }/>
      <div style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}66 60%, var(--card-fade) 100%)`, color: "var(--text)", borderRadius: 22, padding: 20, position: "relative", overflow: "hidden" }}>
        <div aria-hidden style={{ position: "absolute", top: -14, right: -10, fontSize: 150, lineHeight: 1, opacity: 0.28, pointerEvents: "none", filter: "saturate(0.9)", transform: "rotate(8deg)" }}>{t.emblem || "✨"}</div>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)" }}>{t.name}</div>
          <div style={{ fontSize: 14, color: "var(--text-2)", marginTop: 6, fontWeight: 500 }}>🎯 {t.goal}</div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{t.date}</div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 9, fontSize: 11.5, fontWeight: 600, color: "var(--text-2)", background: "rgba(255,255,255,0.5)", padding: "4px 10px", borderRadius: 999 }}>
            {t.vis === "public" ? "🌐 Открытая · видна всем" : "🔒 Приватная · по приглашению"}
          </span>
          {/* The GOAL — the team's destination. Real progress toward the target
             (not the weekly habit aggregate), and it COMPLETES at target. */}
          {(() => {
            const tgt = t.target || 0;
            const cur = t.current != null ? t.current : Math.round((t.progress || 0) * tgt);
            const done = tgt > 0 && cur >= tgt;
            const gp = tgt > 0 ? Math.min(1, cur / tgt) : (t.progress || 0);
            return (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{done ? "Цель достигнута 🎉" : "До цели вместе"}</span>
                  {tgt > 0 && <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{cur} / {tgt} {t.unit || ""}</span>}
                </div>
                <div style={{ height: 9, background: "rgba(255,255,255,0.55)", borderRadius: 999, overflow: "hidden", marginTop: 6 }}>
                  <span style={{ display: "block", height: "100%", width: (gp * 100) + "%", background: done ? "linear-gradient(90deg,#FEDE34,#EF9F14)" : "var(--card-fill)", borderRadius: 999, transition: "width 0.6s ease" }} />
                </div>
                {tgt > 0 && !done && <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 6 }}>Осталось {tgt - cur} {t.unit || ""} — закроем вместе</div>}
              </div>
            );
          })()}
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            <div><div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>Привычки</div><div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: "var(--text)" }}>{teamHabits.length}</div></div>
            <div><div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>Участники</div><div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: "var(--text)" }}>{members.length}</div></div>
            <div><div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>Серия</div><div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: "var(--text)" }}>{_rosterLive ? "—" : "14д 🔥"}</div></div>
          </div>
        </div>
      </div>

      {/* Team chat — one shared space for the whole team */}
      <button data-tour="team-chat" onClick={() => { markChatRead(); navigate("team-chat", { team: t }); }} className="tap" style={{ width: "100%", marginTop: 12, background: "var(--card)", border: 0, borderRadius: 18, padding: 14, boxShadow: "var(--card-shadow)", display: "flex", alignItems: "center", gap: 13, textAlign: "left", color: "var(--text)" }}>
        <span style={{ width: 44, height: 44, borderRadius: 13, background: "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>💬</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 600 }}>Чат команды</div>
          <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{_chatLive ? (chatPeek ? (chatPeek.last || "Пока пусто — напишите первыми") : "…") : "Сергей: Цель добьём к выходным — налегаем! 🔥"}</div>
        </div>
        {_chatLive
          ? (chatPeek && chatPeek.unread > 0 ? <span style={{ background: "#FF3B30", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 999, minWidth: 20, height: 20, padding: "0 6px", display: "grid", placeItems: "center", flexShrink: 0 }}>{chatPeek.unread > 99 ? "99+" : chatPeek.unread}</span> : null)
          : <span style={{ background: "#FF3B30", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 999, minWidth: 20, height: 20, padding: "0 6px", display: "grid", placeItems: "center", flexShrink: 0 }}>3</span>}
        <I.ChevronRight size={18} color="var(--text-4)"/>
      </button>

      {main && (<>
      {/* Main habit — featured card */}
      <div className="section-label" style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FEDE34" }}/> Главная привычка
      </div>
      <div style={{ background: "linear-gradient(135deg,#FEDE34,#EF9F14)", borderRadius: 22, padding: 18, marginTop: 8, color: "#0a0a0a", position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 38 }}>{main.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.4, opacity: 0.6 }}>Якорь команды</div>
            <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.4px", marginTop: 2 }}>{main.name}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Сегодня</span>
          <span style={{ fontSize: 13 }}>{main.doneToday} из {main.total} участников ✓</span>
        </div>
        {/* Guard against a desynced doneByMe / total: never let the bar exceed 100% or
            divide by zero, and never render a negative number of member dots. */}
        {(() => { const denom = main.total || 1; return (
        <div style={{ height: 8, background: "rgba(0,0,0,0.12)", borderRadius: 999, overflow: "hidden", marginTop: 6 }}>
          <span style={{ display: "block", height: "100%", width: Math.min(100, (main.doneToday/denom*100))+"%", background: "#0a0a0a" }} />
        </div>
        ); })()}
        {/* Member dots */}
        <div style={{ display: "flex", gap: 4, marginTop: 12, flexWrap: "wrap" }}>
          {Array.from({length: Math.max(0, main.total)}).map((_, i) => (
            <span key={i} style={{
              width: 22, height: 22, borderRadius: "50%",
              background: i < main.doneToday ? "#0a0a0a" : "rgba(0,0,0,0.15)",
              display: "grid", placeItems: "center", color: "#FEDE34", fontSize: 11, fontWeight: 700,
            }}>{i < main.doneToday ? "✓" : ""}</span>
          ))}
        </div>
        {_rosterLive && (
          <button onClick={() => toggleMyTeamHabit(main)} className="tap" style={{ width: "100%", marginTop: 14, border: 0, borderRadius: 999, padding: "11px 14px", fontSize: 14, fontWeight: 700, background: main.doneByMe ? "rgba(0,0,0,0.12)" : "#0a0a0a", color: main.doneByMe ? "#0a0a0a" : "#FEDE34" }}>
            {main.doneByMe ? "✓ Сделано сегодня" : "Отметить сегодня"}
          </button>
        )}
      </div>
      </>)}

      {/* Team calendar — completion is fabricated, so demo-only until real per-member logs exist */}
      {!_rosterLive && <PeopleMonthCalendar
        people={members.map((m) => ({ name: m.name, initials: m.initials, color: m.color }))}
        dayFrac={(pi, d, mi) => {
          const lvl = (members[pi] && members[pi].pct != null ? members[pi].pct : 50) / 100;
          const n = Math.sin(d * 12.9898 + pi * 78.233 + mi * 37.719) * 43758.5453;
          const r = n - Math.floor(n);
          return Math.max(0, Math.min(1, Math.round((lvl * 0.5 + r * 0.55) * 5) / 5));
        }}
        granular label="Календарь команды" />}

      <div className="section-label" style={{ marginTop: 22 }}>Привычки команды ({others.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {teamHabits.length === 0 && (
          <div style={{ fontSize: 13, color: "var(--text-4)", padding: "4px 2px 8px", lineHeight: 1.5 }}>Пока нет общих привычек. Добавь первую — она станет якорем команды.</div>
        )}
        {others.map((h, i) => (
          <div key={i} style={{ background: "var(--card)", borderRadius: 16, padding: 14, display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--card-shadow)" }}>
            <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>{h.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>{h.name}</div>
              {/* Aggregate weekly consistency — the day-by-day view lives in the calendar above */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7 }}>
                <div style={{ flex: 1, maxWidth: 110, height: 5, borderRadius: 999, background: "var(--surface-3)", overflow: "hidden" }}>
                  <span style={{ display: "block", height: "100%", width: Math.round((h.weekPct || 0) * 100) + "%", background: "#0a0a0a", borderRadius: 999 }} />
                </div>
                <span style={{ fontSize: 11.5, color: "var(--text-4)" }}>{Math.round((h.weekPct || 0) * 100)}% за неделю</span>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{h.doneToday}/{h.total}</div>
              <div style={{ fontSize: 10, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1 }}>сегодня</div>
            </div>
            {_rosterLive && (
              <button onClick={() => toggleMyTeamHabit(h)} className="tap" aria-label="Отметить" style={{ flexShrink: 0, width: 34, height: 34, borderRadius: "50%", border: h.doneByMe ? "0" : "2px solid var(--surface-3)", background: h.doneByMe ? "#0a0a0a" : "transparent", color: "#fff", display: "grid", placeItems: "center", fontSize: 15, padding: 0 }}>{h.doneByMe ? "✓" : ""}</button>
            )}
          </div>
        ))}
        <button onClick={openAddHabit} className="tap" style={{ background: "transparent", border: "1px dashed rgba(0,0,0,0.18)", borderRadius: 16, padding: 14, color: "var(--text-3)", fontSize: 14, fontWeight: 500 }}>
          + Добавить привычку команды
        </button>
      </div>

      {_isOwner && pending.length > 0 && (<>
        <div className="section-label" style={{ marginTop: 22 }}>Заявки на вступление ({pending.length})</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {pending.map((p) => (
            <div key={p.id} style={{ background: "var(--card)", borderRadius: 16, boxShadow: "var(--card-shadow)", padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ position: "relative", width: 40, height: 40, borderRadius: "50%", background: "#cfe1ff", display: "grid", placeItems: "center", color: "#fff", fontWeight: 600, flexShrink: 0, overflow: "hidden" }}>
                {p.avatar && typeof BosAvatar === "function" ? <BosAvatar avatar={p.avatar} size={40} style={{ position: "absolute", inset: 0, borderRadius: "50%" }} /> : (p.name || "?").slice(0, 1)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, color: "var(--text)" }}>{p.name || "Гость"}</div>
                <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 1 }}>хочет вступить</div>
              </div>
              <button onClick={() => approveReq(p.id)} className="tap" style={{ flexShrink: 0, background: "#0a0a0a", color: "#fff", border: 0, borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 600 }}>Принять</button>
              <button onClick={() => rejectReq(p.id)} className="tap" aria-label="Отклонить" style={{ flexShrink: 0, background: "var(--surface-3)", color: "var(--text-3)", border: 0, borderRadius: 999, width: 34, height: 34, fontSize: 16, lineHeight: 1 }}>✕</button>
            </div>
          ))}
        </div>
      </>)}
      <div className="section-label" style={{ marginTop: 22 }}>Участники ({members.length}){liveRoster ? "" : " · по вкладу"}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {ranked.map((m,i)=>{
          const isLeader = !liveRoster && i === 0 && (m.pct || 0) > 0;
          const expanded = expandedMember === m.name;
          const todayDone = m.todayDone ?? 0;
          const todayTotal = m.todayTotal ?? teamHabits.length;
          return (
          <div key={i} style={{ background: "var(--card)", borderRadius: 16, boxShadow: "var(--card-shadow)", overflow: "hidden" }}>
            <button onClick={() => setExpandedMember(expanded ? null : m.name)} className="tap"
              style={{ width: "100%", background: "transparent", border: 0, padding: 12, display: "flex", alignItems: "center", gap: 12, textAlign: "left", color: "var(--text)" }}>
              <span style={{ position: "relative", width: 40, height: 40, borderRadius: "50%", background: m.color, display: "grid", placeItems: "center", color: "#fff", fontWeight: 600, flexShrink: 0 }}>
                {m.avatar && typeof BosAvatar === "function" ? <BosAvatar avatar={m.avatar} size={40} style={{ position: "absolute", inset: 0, borderRadius: "50%" }} /> : m.initials}
                {isLeader && <span style={{ position: "absolute", top: -7, right: -5, fontSize: 14, zIndex: 2 }}>👑</span>}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, display: "flex", alignItems: "center", gap: 7 }}>
                  {m.name}
                  {isLeader && <span style={{ fontSize: 9, fontWeight: 700, color: "#9A7B0A", background: "#FEF3C7", padding: "2px 7px", borderRadius: 999, textTransform: "uppercase", letterSpacing: 0.4 }}>Лидер</span>}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, display: "flex", gap: 10 }}>
                  {liveRoster
                    ? <span>{m.role === "owner" ? "Создатель команды" : "Участник"}</span>
                    : <><span>🔥 {m.streak ?? 0}</span><span>сегодня {todayDone}/{todayTotal}</span></>}
                </div>
              </div>
              {!liveRoster && <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-2)", flexShrink: 0 }}>{m.pct}%</span>}
              <I.ChevronRight size={16} color="var(--text-4)" style={{ flexShrink: 0, transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}/>
            </button>
            {!liveRoster && expanded && (
              <div style={{ padding: "0 14px 14px 64px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                {teamHabits.length === 0 && <span style={{ fontSize: 12, color: "var(--text-4)" }}>Нет общих привычек.</span>}
                {teamHabits.map((h, hi) => {
                  const did = hi < todayDone;
                  return (
                    <span key={hi} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, padding: "4px 9px", borderRadius: 999, background: did ? "#0a0a0a" : "var(--surface-3)", color: did ? "#fff" : "var(--text-4)" }}>
                      <span style={{ fontSize: 13 }}>{h.emoji}</span>{h.name}{did && <I.Check size={11} strokeWidth={3}/>}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          );
        })}
      </div>

      {!liveRoster && (<>
      <div className="section-label" style={{ marginTop: 22 }}>Активность</div>
      <div style={{ background: "var(--card)", borderRadius: 18, padding: 16, marginTop: 8, display: "flex", flexDirection: "column", gap: 12, boxShadow: "var(--card-shadow)" }}>
        {[
          { who: "Ник", what: "завершил утреннюю пробежку", when: "2 ч", emoji: "🏃🏼" },
          { who: "Светлана", what: "добавила новую привычку", when: "5 ч", emoji: "✨" },
          { who: "Вадим", what: "достиг серии 7 дней", when: "1 д", emoji: "🔥" },
        ].map((a,i)=>(
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, color: "var(--text-2)" }}>
            <span style={{ fontSize: 20 }}>{a.emoji}</span>
            <div style={{ flex: 1 }}><b>{a.who}</b> {a.what}</div>
            <span style={{ fontSize: 12, color: "var(--text-4)" }}>{a.when}</span>
          </div>
        ))}
      </div>
      </>)}

      {/* Leave / delete — LIVE only (demo teams are showcase). The owner deletes the whole
          team (cloud deleteTeam); a member leaves (cloud leaveTeam). Both confirm first and
          go back to the list. bosExitTeam guards a not-yet-synced local team (no cloudId). */}
      {app?.mode === "live" && (
        <button onClick={() => bosConfirmExitTeam({ app, team: t, isOwner: _isOwner, navigate, openSheet })} className="tap"
          style={{ width: "100%", marginTop: 26, background: "transparent", border: 0, color: "var(--accent-red)", padding: 14, fontSize: 15, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          {_isOwner ? <><I.Trash size={17}/> Удалить команду</> : <><I.Logout size={17}/> Покинуть команду</>}
        </button>
      )}
    </div>
  );
}

/* Team settings — full screen opened from the gear in Team detail. Edits are
   local until "Сохранить" → updateTeam; team detail re-reads the live team by _id. */
function TeamSettingsScreen() {
  const { navigate, params } = useNav();
  const app = useApp();
  const { open: openSheet } = useSheet();
  const team = params?.team || {};
  const [name, setName] = useCS(team.name || "");
  const [emblem, setEmblem] = useCS(team.emblem || "✨");
  const [accent, setAccent] = useCS(team.accent || "#fef3c7");
  const [goal, setGoal] = useCS(team.goal || "");
  const [priv, setPriv] = useCS(team.vis !== "public");
  const [notify, setNotify] = useCS(team.notify !== false);
  const [members, setMembers] = useCS(team.members || []);
  const emblems = TEAM_EMBLEMS;
  const accents = ["#fef3c7","#dbe9ff","#d6f3df","#e9dffd","#fde2e2","#ffe1c8","#d4f0eb","#e3e3e3"];
  const SUGGEST = [
    { name: "Аля",  initials: "А", color: "#d4c8e8" },
    { name: "Дима", initials: "Д", color: "#a8c0e8" },
    { name: "Соня", initials: "С", color: "#e8b8d4" },
  ];
  const removeMember = (i) => setMembers(ms => ms.filter((_, j) => j !== i));
  const invite = (p) => setMembers(ms => ms.some(m => m.name === p.name) ? ms : [...ms, { ...p, pct: 0 }]);
  const save = () => {
    app?.updateTeam(team._id, { name: name.trim() || team.name, emblem, accent, goal: goal.trim() || team.goal, vis: priv ? "private" : "public", notify, members });
    navigate("team-detail", { team });
  };
  // This screen is owner-only (gated by the gear), so deleting goes through the cloud
  // deleteTeam + a confirm sheet (was a silent local-only removeTeam).
  const del = () => bosConfirmExitTeam({ app, team, isOwner: true, navigate, openSheet });
  const card = { background: "#fff", borderRadius: 18, marginTop: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" };
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Настройки команды" onBack={() => navigate("team-detail", { team })} />

      <div className="section-label">Название</div>
      <input className="bos-input" value={name} onChange={e => setName(e.target.value)} style={{ marginTop: 8 }} />

      <div className="section-label" style={{ marginTop: 22 }}>Эмблема</div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", margin: "8px -16px 0", padding: "0 16px 4px", scrollbarWidth: "none" }}>
        {emblems.map(e => (
          <button key={e} onClick={() => setEmblem(e)} className="tap" data-no-haptic style={{ flexShrink: 0, width: 46, height: 46, borderRadius: 14, fontSize: 22, lineHeight: 1, background: e === emblem ? "#0a0a0a" : "#f1f1f3", border: 0 }}>{e}</button>
        ))}
      </div>

      <div className="section-label" style={{ marginTop: 22 }}>Цвет</div>
      <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
        {accents.map(c => (
          <button key={c} onClick={() => setAccent(c)} className="tap" style={{ width: 40, height: 40, borderRadius: "50%", background: c, border: c === accent ? "3px solid #0a0a0a" : "3px solid transparent" }}/>
        ))}
      </div>

      <div className="section-label" style={{ marginTop: 22 }}>Цель команды</div>
      <input className="bos-input" value={goal} onChange={e => setGoal(e.target.value)} placeholder="напр. 50 добрых дел" style={{ marginTop: 8 }} />

      <div style={{ ...card, padding: "2px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, color: "var(--text-2)" }}>Приватная команда</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 1 }}>Только по приглашению</div>
          </div>
          <Switch on={priv} onChange={setPriv} />
        </div>
        <div style={{ height: 1, background: "var(--line)" }}/>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, color: "var(--text-2)" }}>Уведомления</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 1 }}>Когда участники отмечаются</div>
          </div>
          <Switch on={notify} onChange={setNotify} />
        </div>
      </div>

      <div className="section-label" style={{ marginTop: 22 }}>Участники ({members.length})</div>
      <div style={{ ...card, padding: "8px 16px" }}>
        {members.map((m, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
            <span style={{ width: 36, height: 36, borderRadius: "50%", background: m.color, display: "grid", placeItems: "center", color: "#fff", fontWeight: 600, fontSize: 13 }}>{m.initials}</span>
            <div style={{ flex: 1, fontSize: 15, color: "var(--text-2)" }}>{m.name}</div>
            <button onClick={() => removeMember(i)} className="tap" aria-label="Убрать" style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface-3)", border: 0, color: "var(--text-3)", fontSize: 17, lineHeight: 1 }}>×</button>
          </div>
        ))}
        {members.length === 0 && <div style={{ fontSize: 13, color: "var(--text-4)", padding: "6px 0" }}>Пока никого. Пригласи друзей ниже.</div>}
      </div>
      {app?.mode !== "live" && SUGGEST.filter(p => !members.some(m => m.name === p.name)).length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {SUGGEST.filter(p => !members.some(m => m.name === p.name)).map((p, i) => (
            <button key={i} onClick={() => invite(p)} className="tap" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px 5px 5px", borderRadius: 999, background: "#fff", border: "1px dashed rgba(0,0,0,0.18)", color: "var(--text-3)", fontSize: 12, fontWeight: 500 }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: p.color, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.55)" }}>{p.initials}</span>
              {p.name} <I.Plus size={12}/>
            </button>
          ))}
        </div>
      )}
      {app?.mode === "live" && team.cloudId && (
        <button onClick={async () => {
          // Same referral link as TeamShareSheet: ?team=<id>&ref=<myUid> so invites are
          // credited to the inviter. Falls back to the plain link if uid isn't ready.
          var b = (typeof location !== "undefined" ? (location.origin + location.pathname) : "https://mind3scape.github.io/balanceos/");
          var link = b + "?team=" + team.cloudId;
          try { var id = (window.bosCloud && window.bosCloud.uid) ? await window.bosCloud.uid() : null; if (id) link += "&ref=" + id; } catch (e) {}
          var text = "Вести привычки вместе — веселее, и за совместные привычки больше XP ✨ Залетай в команду «" + (team.name || "") + "» в BalanceOS";
          if (window.bosShare) window.bosShare(link, text);
          else { try { navigator.clipboard.writeText(link); } catch (e) {} }
          if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
        }} className="tap" style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 999, background: "#0a0a0a", color: "#fff", border: 0, fontSize: 13, fontWeight: 600 }}>
          <I.Share size={15}/> Пригласить по ссылке
        </button>
      )}

      <button className="bos-btn" style={{ marginTop: 20 }} onClick={save}>Сохранить</button>
      <button onClick={del} className="tap" style={{ width: "100%", background: "transparent", border: 0, color: "var(--accent-red)", padding: 14, marginTop: 6, fontSize: 15, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
        <I.Trash size={17}/> Удалить команду
      </button>
    </div>
  );
}

/* Bottom sheet — create a shared team habit (opened from Team detail). Team
   detail is always light, so colors are explicit (sheets render outside the
   themed page scope, same pattern as ShareAppSheet). */
function TeamHabitSheet({ team, members = [], onAdd }) {
  const { close } = useSheet();
  const C = { text: "#0a0a0a", sub: "rgba(0,0,0,0.5)", tile: "#f1f1f3", line: "rgba(0,0,0,0.07)" };
  const EMO = ["🙏","🧘🏼‍♀️","📖","🥗","🏃🏼‍♀️","💧","🧊","☀️","💬","✍🏼","🎯","🔥"];
  const [emoji, setEmoji] = useCS("🙏");
  const [name, setName] = useCS("");
  const [movesGoal, setMovesGoal] = useCS(true);
  const [isMain, setIsMain] = useCS(false);
  const [picked, setPicked] = useCS(() => members.map((_, i) => i)); // default: everyone
  const toggleMember = (i) => setPicked(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);
  const participants = members.filter((_, i) => picked.includes(i)).map(m => ({ name: m.name, initials: m.initials, color: m.color }));
  const save = () => {
    onAdd && onAdd({
      emoji,
      name: name.trim() || "Новая привычка",
      isMain, movesGoal, participants,
      total: Math.max(1, participants.length || members.length || 1),
    });
    close();
  };
  return (
    <div style={{ padding: "2px 20px 6px", color: C.text }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>Новая привычка команды</div>
        <div style={{ fontSize: 13.5, color: C.sub, marginTop: 3 }}>Общая для всех в «{team?.name || "команде"}»</div>
      </div>

      {/* Emoji picker */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", margin: "16px -20px 0", padding: "0 20px 4px", scrollbarWidth: "none" }}>
        {EMO.map(e => (
          <button key={e} onClick={() => setEmoji(e)} className="tap" data-no-haptic style={{
            flexShrink: 0, width: 46, height: 46, borderRadius: 14, fontSize: 22, lineHeight: 1,
            background: e === emoji ? "#0a0a0a" : C.tile, border: 0,
          }}>{e}</button>
        ))}
      </div>

      {/* Name */}
      <input className="bos-input" value={name} onChange={e => setName(e.target.value)} placeholder="напр. Холодный душ" style={{ marginTop: 14 }}/>

      {/* Participants */}
      {members.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: C.sub, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, margin: "18px 0 8px" }}>Участвуют</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {members.map((m, i) => {
              const on = picked.includes(i);
              return (
                <button key={i} onClick={() => toggleMember(i)} className="tap" style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px 5px 5px", borderRadius: 999,
                  background: on ? "#0a0a0a" : C.tile, color: on ? "#fff" : C.sub, border: 0, fontSize: 12, fontWeight: 500,
                }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: m.color, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.55)" }}>{m.initials}</span>
                  {m.name}{on && <I.Check size={12} strokeWidth={3}/>}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Toggles */}
      <div style={{ background: C.tile, borderRadius: 16, padding: "2px 14px", marginTop: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5 }}>Двигает цель команды</div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 1 }}>Отметка участника = +1 к общей цели</div>
          </div>
          <Switch on={movesGoal} onChange={setMovesGoal}/>
        </div>
        <div style={{ height: 1, background: C.line }}/>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5 }}>Сделать главной</div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 1 }}>Станет «якорем» команды</div>
          </div>
          <Switch on={isMain} onChange={setIsMain}/>
        </div>
      </div>

      <button className="bos-btn" style={{ marginTop: 20, marginBottom: 2 }} onClick={save}>Добавить привычку</button>
    </div>
  );
}

/* LEVELS / CREDITS — gamification (theme-aware) */
function LevelsScreen() {
  const { navigate } = useNav();
  const { open: openSheet } = useSheet();
  const app = useApp ? useApp() : null;
  const isDark = app?.themeOverride === "dark";
  // LIVE: real count of people you've actually invited (referral circle) — same source as
  // the profile orbit. Was hardcoded 0 for live, so «Круг влияния» always read empty even
  // when you'd already drawn someone in.
  const [liveInvited, setLiveInvited] = React.useState(0);
  React.useEffect(() => {
    let on = true;
    if (app?.mode === "live" && window.bosCloud && window.bosCloud.invitedPeople) {
      window.bosCloud.invitedPeople().then((list) => { if (on && Array.isArray(list)) setLiveInvited(list.length); }).catch(() => {});
    }
    return () => { on = false; };
  }, [app?.mode]);
  const invited = app?.mode === "demo" ? 2 : liveInvited; // people you've drawn into the app
  // Круг влияния — concrete XP, no abstract ×/%. The felt "multiplier" is two
  // plain things: shared habits pay more (+15 vs +10), and growing your circle
  // hits milestones that drop a big lump bonus. No ceiling — milestones keep
  // climbing and every friend always pays +150.
  const CIRCLE_MILESTONES = [{ n: 3, bonus: 300 }, { n: 7, bonus: 700 }, { n: 15, bonus: 1500 }, { n: 30, bonus: 3000 }];
  const nextMile = CIRCLE_MILESTONES.find(t => t.n > invited) || null; // null = past the last listed milestone
  const prevMileN = ([...CIRCLE_MILESTONES].reverse().find(t => t.n <= invited) || { n: 0 }).n;
  const ruPpl = (n, a) => { const m = n % 10, h = n % 100; return a[(m === 1 && h !== 11) ? 0 : (m >= 2 && m <= 4 && (h < 10 || h >= 20)) ? 1 : 2]; };
  const ach = (typeof window !== "undefined" && window.ACHIEVEMENTS) || [];
  const achEarned = ach.filter(a => a.earned);
  // LIVE: real numbers from the date-keyed habit model (T0.2). DEMO: curated showcase.
  // Fresh demo: a clean level 1. Titles are shared so demo's "Преданный делу" still maps to 7.
  const _isLive = app?.mode === "live";
  const _xpLive = _isLive ? bosLiveXP(app) : 0;
  const _li = bosLevelInfo(_xpLive);
  const LEVEL_TITLES = ["Новичок", "Первые шаги", "Набираю ритм", "В потоке", "Стойкость", "Уверенность", "Преданный делу", "Сосредоточенный", "Мастер привычек", "Вдохновитель", "Наставник", "Легенда"];
  const titleFor = (l) => LEVEL_TITLES[Math.min(Math.max(1, l), LEVEL_TITLES.length) - 1];
  const lvl = app?.mode === "demo" ? 7 : (_isLive ? _li.level : 1);
  const xp = app?.mode === "demo" ? 1240 : (_isLive ? _xpLive : 0);
  const next = app?.mode === "demo" ? 1500 : (_isLive ? _li.next : 100);
  const pctBar = app?.mode === "demo" ? Math.round(1240 / 1500 * 100) : (_isLive ? _li.pct : 4);
  const credits = app?.mode === "demo" ? 980 : (_isLive ? _xpLive : 0); // spendable balance = earned XP for live
  const rUnlocked = (r) => lvl >= r.lvl;
  const rewards = [
    { i: "🎁", t: "Коробка-сюрприз", c: 200, lvl: 5, unlocked: true },
    { i: "🧘🏼‍♀️", t: "Персональная медитация", c: 500, lvl: 6, unlocked: true },
    { i: "📚", t: "Скидка на премиум-курс", c: 800, lvl: 7, unlocked: true },
    { i: "🏃🏼‍♀️", t: "Звонок с коучем (30 мин)", c: 1500, lvl: 9, unlocked: false },
    { i: "🎯", t: "Свой командный вызов", c: 2500, lvl: 10, unlocked: false },
    { i: "✨", t: "Пожизненный AI Pro", c: 5000, lvl: 12, unlocked: false },
  ];
  const badges = [
    { i: "🔥", t: "Серия 30 дней", earned: true },
    { i: "💪", t: "Первая привычка", earned: true },
    { i: "👥", t: "Командный игрок", earned: true },
    { i: "🌅", t: "Ранняя пташка", earned: true },
    { i: "🏆", t: "Покоритель целей", earned: false },
    { i: "💎", t: "Алмазный разум", earned: false },
  ];
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Уровни" onBack={() => navigate("home")} />
      {/* Level hero — yellow gradient is brand, fixed across themes */}
      <div style={{ background: "linear-gradient(135deg,#FEDE34,#EF9F14)", borderRadius: 24, padding: 22, color: "#0a0a0a", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, background: "radial-gradient(circle, rgba(255,255,255,0.4), transparent 70%)" }}/>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 700, opacity: 0.7 }}>Текущий уровень</div>
          <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: "-2px", lineHeight: 1, marginTop: 6 }}>{lvl}</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>{titleFor(lvl)}</div>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600 }}>
              <span>{xp} XP</span><span>{next} XP</span>
            </div>
            <div style={{ height: 8, background: "rgba(0,0,0,0.15)", borderRadius: 999, overflow: "hidden", marginTop: 6 }}>
              <span style={{ display: "block", height: "100%", width: pctBar+"%", background: "#0a0a0a" }} />
            </div>
            <div style={{ fontSize: 12, marginTop: 6, opacity: 0.7 }}>{Math.max(0, next-xp)} XP до {lvl+1} уровня · {titleFor(lvl+1)}</div>
          </div>
        </div>
      </div>

      {/* Gamification FIRST — for a new user the most important thing is HOW XP
         works and WHAT achievements unlock, so it sits right under the level. */}
      <div className="section-label" style={{ marginTop: 20 }}>Как зарабатывать XP</div>
      <SysCard style={{ padding: 14, marginTop: 8 }}>
        {[
          { t: "Выполнить привычку", v: "+10" },
          { t: "Идеальный день — все привычки", v: "+30" },
          { t: "Серия 7 дней", v: "+75" },
          { t: "Достичь цели", v: "+250" },
          { t: "Позвать друга в привычку", v: "+75", infl: true },
          { t: "Пригласить друга в приложение", v: "+150", infl: true },
        ].map((r, i, arr) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : 0, fontSize: 14 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>{r.infl && <span style={{ fontSize: 14 }}>🤝</span>}{r.t}</span>
            <span style={{ color: r.infl ? "#2f8fd6" : "#c99a1a", fontWeight: 700 }}>{r.v} XP</span>
          </div>
        ))}
      </SysCard>
      <div className="bos-sys-text-3" style={{ fontSize: 12, marginTop: 8, padding: "0 4px", lineHeight: 1.45 }}>
        За приглашённых друзей платим щедрее всего — так растёт твой круг.
      </div>

      {/* Круг влияния — your people make every step richer. Concrete XP only
         (no ×/%): shared habits pay more, and growing the circle unlocks milestone
         bonuses. Brand-gold accents on a neutral card. data-tour drives the demo. */}
      <div className="section-label" style={{ marginTop: 22 }}>Круг влияния</div>
      <SysCard data-tour="influence-mult" style={{ padding: 16, marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, flexShrink: 0, display: "grid", placeItems: "center", background: "linear-gradient(135deg,#FEDE34,#FFC400)", boxShadow: "0 7px 18px rgba(254,222,52,0.34)" }}>
            <I.Users size={25} color="#0a0a0a" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 700 }}>Множитель влияния</div>
            <div className="bos-sys-text-3" style={{ fontSize: 12.5, marginTop: 3, lineHeight: 1.4 }}>
              {invited > 0
                ? <>Рядом с тобой уже <b style={{ color: "var(--text-2)" }}>{invited} {ruPpl(invited, ["человек", "человека", "человек"])}</b>. Чем больше друзей — тем больше XP ты получаешь.</>
                : <>Позови друзей — и каждый поможет тебе получать больше XP.</>}
            </div>
          </div>
        </div>

        {/* Together is richer — the felt "multiplier", in plain XP */}
        <div style={{ marginTop: 14, padding: "12px 13px", borderRadius: 14, background: isDark ? "rgba(254,222,52,0.10)" : "#FFF7DC" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5 }}>
            <span className="bos-sys-text-2">Привычка в одиночку</span>
            <span style={{ fontWeight: 700, color: "#c99a1a" }}>+10 XP</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5, marginTop: 7 }}>
            <span className="bos-sys-text-2">Привычка с другом</span>
            <span style={{ fontWeight: 800, color: "#c99a1a" }}>+15 XP</span>
          </div>
          <div className="bos-sys-text-3" style={{ fontSize: 12, marginTop: 9, lineHeight: 1.4 }}>
            Одни и те же привычки с друзьями приносят больше XP.
          </div>
        </div>

        {/* Milestone progress — the "2 из 3 до бонуса" carrot. No ceiling. */}
        {nextMile ? (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 12.5 }}>
              <span className="bos-sys-text-3">Приглашено друзей</span>
              <span><b style={{ color: "var(--text-2)", fontWeight: 700 }}>{invited}</b> <span className="bos-sys-text-3">из {nextMile.n}</span></span>
            </div>
            <div style={{ height: 7, background: "var(--surface-3)", borderRadius: 999, overflow: "hidden", marginTop: 7 }}>
              <span style={{ display: "block", height: "100%", width: Math.min(100, Math.max(6, (invited - prevMileN) / (nextMile.n - prevMileN) * 100)) + "%", background: "linear-gradient(90deg,#FEDE34,#F0B400)", borderRadius: 999 }} />
            </div>
            <div className="bos-sys-text-3" style={{ fontSize: 12.5, marginTop: 8, lineHeight: 1.45 }}>
              Ещё <b style={{ color: "var(--text-2)" }}>{nextMile.n - invited}</b> — и получишь <b style={{ color: "#c99a1a" }}>+{nextMile.bonus} XP</b> разом.
            </div>
          </div>
        ) : (
          <div className="bos-sys-text-3" style={{ fontSize: 12.5, marginTop: 14, lineHeight: 1.45 }}>
            Круг можно растить бесконечно — и каждый новый друг приносит тебе <b style={{ color: "#c99a1a" }}>+150 XP</b>.
          </div>
        )}

        <button onClick={() => openSheet(<ShareAppSheet dark={isDark} />)} className="tap" style={{ width: "100%", marginTop: 14, background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff", border: 0, borderRadius: 999, padding: 12, fontSize: 14.5, fontWeight: 600 }}>Пригласить друга</button>
      </SysCard>

      <div className="section-label" style={{ marginTop: 22 }}>Достижения</div>
      <SysCard className="tap" onClick={() => navigate("achievements", { from: "levels" })} style={{ padding: 14, marginTop: 8, display: "flex", alignItems: "center", gap: 13, cursor: "pointer" }}>
        <span className="bos-sys-chip-bg" style={{ width: 44, height: 44, borderRadius: 13, display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>🏅</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 600 }}>Ачивки</div>
          <div className="bos-sys-text-3" style={{ fontSize: 12.5, marginTop: 2 }}>{achEarned.length} из {ach.length} · открывают круги контактов</div>
        </div>
        <div style={{ display: "flex", marginRight: 4 }}>
          {achEarned.slice(0, 3).map((a, i) => <span key={i} style={{ width: 26, height: 26, borderRadius: 8, background: "var(--card-2)", display: "grid", placeItems: "center", fontSize: 13, marginLeft: i ? -7 : 0, border: "1.5px solid var(--card)" }}>{a.i}</span>)}
        </div>
        <I.ChevronRight size={18} className="bos-sys-text-2"/>
      </SysCard>

      {/* Spendable XP balance — Variant A: one currency. Lifetime XP drives the
          level (never spent); this balance is what you spend on rewards & mentors.
          Spending it does NOT lower your level. */}
      <SysCard style={{ padding: 16, marginTop: 22, display: "flex", alignItems: "center", gap: 14, borderRadius: 18 }}>
        <span className="bos-sys-chip-bg" style={{ width: 50, height: 50, borderRadius: 14, display: "grid", placeItems: "center", fontSize: 24 }}>🪙</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="bos-sys-text-3" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Баланс XP</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 2 }}>{credits.toLocaleString()}</div>
          <div className="bos-sys-text-3" style={{ fontSize: 11.5, marginTop: 1 }}>можно потратить · уровень от траты не падает</div>
        </div>
        <button onClick={() => { app?.setCommunityView?.({ section: "community", commTab: "network" }); navigate("community"); }} className="tap" style={{ background: "#FEDE34", color: "#0a0a0a", border: 0, borderRadius: 999, padding: "10px 16px", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>В Нетворк</button>
      </SysCard>

      <div className="section-label" style={{ marginTop: 22 }}>Награды за XP</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {rewards.map((r, i) => (
          <SysCard key={i} style={{ padding: 12, display: "flex", alignItems: "center", gap: 12, opacity: rUnlocked(r) ? 1 : 0.55 }}>
            <span className="bos-sys-chip-bg" style={{ width: 42, height: 42, borderRadius: 12, display: "grid", placeItems: "center", fontSize: 22 }}>{r.i}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{r.t}</div>
              <div className="bos-sys-text-3" style={{ fontSize: 11, marginTop: 2 }}>
                {rUnlocked(r) ? `${r.c} XP` : `Откроется на уровне ${r.lvl}`}
              </div>
            </div>
            <button disabled={!rUnlocked(r) || credits < r.c} className="tap" style={{ background: rUnlocked(r) && credits >= r.c ? "#FEDE34" : "var(--surface-3)", color: rUnlocked(r) && credits >= r.c ? "#0a0a0a" : "var(--text-4)", border: 0, borderRadius: 999, padding: "8px 14px", fontSize: 12, fontWeight: 600 }}>
              {rUnlocked(r) ? (credits >= r.c ? "Получить" : "Нужно больше") : "🔒"}
            </button>
          </SysCard>
        ))}
      </div>

    </div>
  );
}

/* ─── COURSE DETAIL — full programme description ─── */
function CourseDetailScreen() {
  const { navigate, params } = useNav();
  const [enrolled, setEnrolled] = useCS(false);
  const c = params?.course || { id: "marathon", i: "🏃🏼‍♀️", accent: "#d6f3df", t: "Марафон", d: "21-дневная программа устойчивых привычек.", price: "110 000 ₽", lvl: "База", length: "21 день", cohort: "1 — 21 мая" };

  // Default to Marathon programme content; could be data-driven per id
  const META = [
    { l: "Длительность",     v: c.length || "21 день" },
    { l: "Поток",     v: c.cohort || "1 — 21 мая" },
    { l: "Формат",     v: "Онлайн · самостоят. + 2 живых звонка/нед." },
    { l: "Нагрузка", v: "30 мин/день" },
    { l: "Размер потока",v: "12 человек, ограничено" },
    { l: "Результат",    v: "1 устойчивая ежедневная привычка" },
  ];
  const PROGRAMME = {
    overload: [
      { wk: "День 1", h: "Найди шум", b: "Определи, что выбивает тебя из равновесия — и во что это обходится." },
      { wk: "День 2", h: "Убери три", b: "Убери три главных утечки энергии. Замени каждую на 60-секундную перезагрузку." },
      { wk: "День 3", h: "Задай минимум", b: "Собери минимальный ежедневный ритуал, который выдержишь даже в самый трудный день." },
    ],
    breakthrough: [
      { wk: "Дни 1–2", h: "Аудит", b: "Определи свой потолок и убеждение, которое его поставило." },
      { wk: "Дни 3–4", h: "Переосмысление", b: "Замени одно ограничивающее убеждение списком проверенных контраргументов." },
      { wk: "Дни 5–7", h: "Действуй", b: "Три осознанных эксперимента, пересекающих твою старую границу." },
    ],
    marathon: [
      { wk: "Неделя 1", h: "Крошечно и с опорой", b: "Выбери одну ключевую привычку. Найди якорь. Только двухминутная версия — каждый день." },
      { wk: "Неделя 2", h: "Добавь глубину", b: "Растяни её до реальной формы. Строй серию. Найди точки трения." },
      { wk: "Неделя 3", h: "Закрепи", b: "Выполняй полную версию на полную длительность. Спланируй восстановление. Задай следующий 30-дневный цикл." },
    ],
  };
  const programme = PROGRAMME[c.id] || PROGRAMME.marathon;
  const includes = [
    { i: "📓", t: "Рабочая тетрадь", b: "Ежедневные вопросы + страницы недельного разбора." },
    { i: "🎥", t: "Живые звонки", b: "2 раза в неделю с потоком и коучем." },
    { i: "💬", t: "Чат потока", b: "Закрытая группа для поддержки и ответственности." },
    { i: "🏆", t: "Бонус за финиш", b: "+500 XP и постоянный значок в профиле." },
  ];
  const FAQ = [
    { q: "Что, если я пропущу день?", a: "Восстанавливайся, а не начинай заново. Твоя единственная задача на следующий день — появиться, хотя бы в мини-версии." },
    { q: "Нужно ли оборудование?", a: "Нет. Программа использует только то, что у тебя уже есть. Инструменты добавляем, только если этого требует привычка." },
    { q: "Можно ли поставить на паузу?", a: "Да — один раз. Используй её для важных событий. Вторая пауза в потоке переносит на следующий набор." },
  ];

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Курс" onBack={() => navigate("community")} right={
        <button className="tap icon-btn"><I.More size={18}/></button>
      }/>

      {/* HERO */}
      <div style={{ background: "var(--card)", borderRadius: 24, padding: "22px 20px 20px", boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ width: 58, height: 58, borderRadius: "50%", background: c.accent, display: "grid", placeItems: "center", fontSize: 28, flexShrink: 0 }}>{c.i}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, padding: "2px 8px", background: "var(--card-2)", borderRadius: 999, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>{c.lvl}</span>
            </div>
            <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 26, lineHeight: 1.15, letterSpacing: "-0.4px", marginTop: 6, color: "var(--text)" }}>{c.t}</div>
            <div style={{ fontSize: 14, color: "var(--text-3)", marginTop: 8, lineHeight: 1.5 }}>{c.d}</div>
          </div>
        </div>

        {/* META grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, marginTop: 16, background: "var(--line)", borderRadius: 14, overflow: "hidden" }}>
          {META.map((m, i) => (
            <div key={i} style={{ background: "var(--card)", padding: "10px 12px" }}>
              <div style={{ fontSize: 10.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{m.l}</div>
              <div style={{ fontSize: 13, color: "var(--text)", marginTop: 2, fontWeight: 500 }}>{m.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PROGRAMME */}
      <div className="section-label" style={{ marginTop: 22, padding: "0 4px" }}>Программа</div>
      <div style={{ marginTop: 8, background: "var(--card)", borderRadius: 22, overflow: "hidden", boxShadow: "var(--card-shadow)" }}>
        {programme.map((p, i) => (
          <div key={i}>
            <div style={{ display: "flex", gap: 14, padding: "16px 18px" }}>
              <div style={{ width: 56, flexShrink: 0 }}>
                <div style={{ fontSize: 10.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{p.wk}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>{p.h}</div>
                <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4, lineHeight: 1.5 }}>{p.b}</div>
              </div>
            </div>
            {i < programme.length - 1 && <div className="divider"/>}
          </div>
        ))}
      </div>

      {/* WHAT'S INCLUDED */}
      <div className="section-label" style={{ marginTop: 22, padding: "0 4px" }}>Что входит</div>
      <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {includes.map((it, i) => (
          <div key={i} style={{ background: "var(--card)", borderRadius: 18, padding: 14, boxShadow: "var(--card-shadow)" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--card-2)", display: "grid", placeItems: "center", fontSize: 18, marginBottom: 8 }}>{it.i}</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{it.t}</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 3, lineHeight: 1.45 }}>{it.b}</div>
          </div>
        ))}
      </div>

      {/* COACH */}
      <div className="section-label" style={{ marginTop: 22, padding: "0 4px" }}>Твой коуч</div>
      <div style={{ marginTop: 8, background: "var(--card)", borderRadius: 22, padding: 16, boxShadow: "var(--card-shadow)", display: "flex", gap: 14, alignItems: "center" }}>
        <AvatarStack people={[{ name: "Марк Халверсон", initials: "МХ", color: "#d4b8e8" }]} size={52} max={1} label={false}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Марк Халверсон</div>
          <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>Коуч по привычкам · 1200+ выпускников</div>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 6, lineHeight: 1.5 }}>«Я строю коучинг для тех, кто ненавидит слово «коучинг». Просто появляйся — остальное сделаю я.»</div>
        </div>
      </div>

      {/* FAQ */}
      <div className="section-label" style={{ marginTop: 22, padding: "0 4px" }}>FAQ</div>
      <div style={{ marginTop: 8, background: "var(--card)", borderRadius: 22, overflow: "hidden", boxShadow: "var(--card-shadow)" }}>
        {FAQ.map((f, i) => (
          <div key={i}>
            <div style={{ padding: "14px 18px" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{f.q}</div>
              <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4, lineHeight: 1.5 }}>{f.a}</div>
            </div>
            {i < FAQ.length - 1 && <div className="divider"/>}
          </div>
        ))}
      </div>

      {/* STICKY-ish CTA — Tuition + Enroll */}
      <div style={{ marginTop: 22, background: "#0a0a0a", color: "#fff", borderRadius: 22, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, opacity: 0.6, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600 }}>Стоимость</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, letterSpacing: "-0.4px" }}>{c.price}</div>
          <div style={{ fontSize: 11, opacity: 0.65, marginTop: 2 }}>Единоразово · можно разбить на 3 месяца</div>
        </div>
        {enrolled ? (
          <span style={{ background: "rgba(52,199,89,0.18)", color: "#34C759", borderRadius: 999, padding: "12px 18px", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <I.Check size={15} strokeWidth={3}/> Вы записаны
          </span>
        ) : (
          <button onClick={() => setEnrolled(true)} className="tap" style={{ background: "var(--card)", color: "#0a0a0a", border: 0, borderRadius: 999, padding: "12px 18px", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
            Записаться <I.ChevronRight size={14}/>
          </button>
        )}
      </div>
    </div>
  );
}

/* Compress + downscale a picked image to a light JPEG data URL so chat photos
   stay small (a 4000px phone photo → ~1280px, ~50-150KB) — important once many
   people share into one team. At T1 these move to Supabase Storage; this call
   site doesn't change. */
function bosCompressImage(file, maxDim, quality) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onerror = reject;
    reader.onload = function () {
      var img = new Image();
      img.onerror = reject;
      img.onload = function () {
        var w = img.width, h = img.height;
        var scale = Math.min(1, maxDim / Math.max(w, h));
        w = Math.max(1, Math.round(w * scale)); h = Math.max(1, Math.round(h * scale));
        var canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        try {
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", quality || 0.72));
        } catch (e) { reject(e); }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ─── TEAM CHAT — one shared chat for the whole team: messages + photos, in the
   flow of doing the goal together. Core team feature; especially useful for
   trainers running cohorts and for family circles.
   Local-first: in a REAL (live) profile the conversation is saved per team and
   never lost on reload; demo modes show the rich seeded chat (ephemeral). The
   cross-person realtime layer (everyone sees each other) arrives at T1. ─── */
/* D4 helpers — a stable colour per user id, and HH:MM from an ISO timestamp. */
function bosUserColor(id) {
  var str = "" + (id || ""), s = 0;
  for (var i = 0; i < str.length; i++) s = (s * 31 + str.charCodeAt(i)) >>> 0;
  var pal = ["#F4A574", "#74CFE0", "#7FB3F2", "#76D3A0", "#C9A0E8", "#E89BC0", "#7BD0C4", "#F2B66B"];
  return pal[s % pal.length];
}
function bosMsgTime(iso) {
  try { var d = new Date(iso); return d.getHours() + ":" + ("0" + d.getMinutes()).slice(-2); } catch (e) { return ""; }
}

function TeamChatScreen() {
  const { navigate, params } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  const isDark = app?.themeOverride === "dark";
  const team = params?.team || { _id: "seed-1", name: "Команда создателей", emblem: "✨", members: [] };
  const live = app?.mode === "live";
  // D4 — a cloud-linked team gets the REAL shared+realtime chat; everything else
  // (demo, local-only teams) keeps the local behaviour below, untouched.
  const cloud = (live && window.bosCloud && window.bosCloud.enabled() && team.cloudId) ? window.bosCloud : null;
  const cloudId = cloud ? team.cloudId : null;
  const memberMapRef = React.useRef({});
  const myUidRef = React.useRef(null);
  const chatKey = "bos:chat:" + (app?.persistId || "live:local") + ":" + (team._id || team.name || "team");
  const SEED = [
    { who: "Светлана", c: "#F4A574", t: "Доброе утро, команда! ☀️ Кто уже отметил доброе дело?", time: "8:14" },
    { who: "Вадим",    c: "#74CFE0", t: "Я помог соседке с покупками 💪", time: "8:31" },
    { who: "Вадим",    c: "#74CFE0", photo: { e: "🌅", g: "linear-gradient(135deg,#ffd28a,#ff9a6b)" }, cap: "И пробежку засчитал", time: "8:32" },
    { who: "Ник",      c: "#7FB3F2", t: "Красиво! Тоже выхожу 🏃", time: "8:40" },
    { who: "Сергей",   c: "#76D3A0", t: "Перевёл бабушку через дорогу 😄 плюс одно доброе дело", time: "8:52" },
    { who: "Павел",    me: true, c: "#FEDE34", t: "Вы лучшие 🙌 Сегодня закрываем 50 добрых дел!", time: "9:02" },
    { who: "Светлана", c: "#F4A574", t: "Я в деле — несу обед волонтёрам в приют 🐾", time: "9:07" },
    { who: "Сергей",   c: "#76D3A0", t: "До цели 8 дел — добьём к вечеру 🔥", time: "9:10" },
    { who: "Ник",      c: "#7FB3F2", t: "Давайте! После работы ещё пару добрых дел успею 🙌", time: "9:15" },
  ];
  // Cloud chat hydrates from the server (below). Local profiles restore saved
  // history (or start empty). Demo/fresh: rich seed.
  const [msgs, setMsgs] = useCS(function () {
    if (cloudId) return [];
    if (live) {
      try { var raw = localStorage.getItem(chatKey); if (raw) return JSON.parse(raw); } catch (e) {}
      return [];
    }
    return SEED;
  });
  const [text, setText] = useCS("");
  const scrollRef = React.useRef(null);
  const fileRef = React.useRef(null);
  // Persist every change under the real profile — messages & photos survive
  // reloads and reopening the chat. On a full localStorage quota, drop the oldest
  // photos (keep all text) rather than failing the save.
  React.useEffect(function () {
    if (!live || cloudId) return; // cloud chat lives on the server, not localStorage
    try { localStorage.setItem(chatKey, JSON.stringify(msgs)); }
    catch (e) {
      try { localStorage.setItem(chatKey, JSON.stringify(msgs.filter(function (m) { return !m.img; }))); } catch (e2) {}
    }
  }, [msgs, live, chatKey, cloudId]);
  // Pin to the latest message by scrolling the chat's OWN container — NOT
  // scrollIntoView, which bubbles up and yanked the page mid open-transition.
  React.useLayoutEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs.length]);
  const myName = live ? (app?.userName || "Вы") : "Павел";
  const nowLabel = () => { try { var d = new Date(); return d.getHours() + ":" + ("0" + d.getMinutes()).slice(-2); } catch (e) { return "сейчас"; } };

  // Map a cloud message row → the UI shape this screen already renders. Uses refs
  // (member roster + my uid) so the realtime handler always sees the latest.
  const mapRow = React.useCallback((r) => {
    const mine = r.user_id === myUidRef.current;
    const prof = memberMapRef.current[r.user_id];
    return {
      id: r.id, _uid: r.user_id, me: mine, cloud: true,
      who: mine ? myName : (prof ? prof.name : "Участник"),
      c: prof ? prof.c : bosUserColor(r.user_id), avatar: prof ? prof.avatar : null,
      t: r.text || undefined, img: r.image_url || undefined, time: bosMsgTime(r.created_at),
    };
  }, [myName]);

  // D4 — cloud chat: load the roster + history, then live-subscribe to new messages.
  React.useEffect(() => {
    if (!cloudId) return;
    let on = true, unsub = function () {};
    cloud.uid().then((u) => { myUidRef.current = u; });
    cloud.teamMembers(cloudId).then((mem) => {
      const map = {};
      (mem || []).forEach((m) => { map[m.id] = { name: m.name || "Участник", avatar: m.avatar, c: bosUserColor(m.id) }; });
      memberMapRef.current = map;
      return cloud.loadMessages(cloudId);
    }).then((rows) => { if (on) setMsgs((rows || []).map(mapRow)); });
    unsub = cloud.subscribeMessages(cloudId, (row) => {
      setMsgs((prev) => prev.some((m) => m.id === row.id) ? prev : prev.concat([mapRow(row)]));
    });
    return () => { on = false; try { unsub(); } catch (e) {} };
  }, [cloudId, mapRow]);

  const push = (m) => setMsgs(list => [...list, { who: myName, me: true, c: "#FEDE34", time: nowLabel(), ...m }]);
  // Append a freshly-sent cloud row (in case realtime is slow), de-duped by id.
  const absorb = (row) => { if (row) setMsgs((prev) => prev.some((m) => m.id === row.id) ? prev : prev.concat([mapRow(row)])); };
  const send = () => {
    const v = text.trim(); if (!v) return;
    setText("");
    if (cloudId) cloud.sendMessage(cloudId, { text: v }).then(absorb);
    else push({ t: v });
  };
  const pickPhoto = () => { if (fileRef.current) fileRef.current.click(); };
  const onFile = (e) => {
    const file = e.target.files && e.target.files[0];
    try { e.target.value = ""; } catch (_) {}
    if (!file) return;
    bosCompressImage(file, 1280, 0.72).then(src => {
      if (cloudId) {
        fetch(src).then(r => r.blob()).then(blob => cloud.uploadChatPhoto(cloudId, blob).then(url => { if (url) cloud.sendMessage(cloudId, { imageUrl: url }).then(absorb); }));
      } else push({ img: src });
    }).catch(() => {});
  };

  const otherBubble = isDark ? "rgba(255,255,255,0.07)" : "#fff";
  const mineBubble  = isDark ? "#fff" : "#0a0a0a";
  const mineText    = isDark ? "#0a0a0a" : "#fff";
  const Photo = ({ p, cap, light }) => (
    <div style={{ marginTop: 2 }}>
      <div style={{ width: 152, height: 104, borderRadius: 14, background: p.g, display: "grid", placeItems: "center", fontSize: 46, boxShadow: "inset 0 -34px 44px rgba(0,0,0,0.14)" }}>{p.e}</div>
      {cap && <div style={{ fontSize: 12.5, marginTop: 5, color: light ? "rgba(255,255,255,0.85)" : "var(--text-2)" }}>{cap}</div>}
    </div>
  );
  const RealPhoto = ({ src, cap, light }) => (
    <div style={{ marginTop: 2 }}>
      <img src={src} alt="" loading="lazy" style={{ width: 188, maxWidth: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 14, display: "block" }} />
      {cap && <div style={{ fontSize: 12.5, marginTop: 5, color: light ? "rgba(255,255,255,0.85)" : "var(--text-2)" }}>{cap}</div>}
    </div>
  );

  return (
    <div className="page-in" style={{ height: "calc(100% + 90px)", margin: "-60px 0 -30px", display: "flex", flexDirection: "column", paddingTop: "max(60px, var(--tg-top-inset, 0px))", overflow: "hidden" }}>
      <div style={{ padding: "0 14px" }}>
        <PageHeader title={team.name} onBack={() => navigate("team-detail", { team })}
          right={<span style={{ fontSize: 12, color: "var(--text-4)", whiteSpace: "nowrap" }}>{(team.members?.length || 4)} 👥</span>} />
      </div>

      <div ref={scrollRef} className="screen-scroll" style={{ flex: 1, minHeight: 0, padding: "2px 14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {live && msgs.length === 0 ? (
          <div style={{ margin: "auto", textAlign: "center", padding: "0 30px" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>Это общий чат команды</div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-4)" }}>Напиши первое сообщение или поделись фото своего прогресса 👋</div>
          </div>
        ) : (
          <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-4)", margin: "2px 0 2px" }}>Сегодня</div>
        )}
        {msgs.map((m, i) => m.me ? (
          <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ maxWidth: "78%", background: mineBubble, color: mineText, borderRadius: "18px 18px 5px 18px", padding: (m.photo || m.img) ? 8 : "9px 13px" }}>
              {m.img ? <RealPhoto src={m.img} cap={m.cap} light/> : m.photo ? <Photo p={m.photo} cap={m.cap} light/> : <div style={{ fontSize: 14.5, lineHeight: 1.4 }}>{m.t}</div>}
              <div style={{ fontSize: 10, opacity: 0.55, textAlign: "right", marginTop: 3 }}>{m.time}</div>
            </div>
          </div>
        ) : (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            {m.avatar && typeof BosAvatar === "function"
              ? <BosAvatar avatar={m.avatar} size={30} style={{ flexShrink: 0 }} />
              : <span style={{ width: 30, height: 30, borderRadius: "50%", background: m.c, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, color: "rgba(0,0,0,0.55)", flexShrink: 0 }}>{(m.who || "?")[0]}</span>}
            <div style={{ maxWidth: "78%", background: otherBubble, borderRadius: "18px 18px 18px 5px", padding: (m.photo || m.img) ? 8 : "9px 13px", boxShadow: isDark ? "none" : "0 1px 2px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: (m.photo || m.img) ? 4 : 2 }}>{m.who}</div>
              {m.img ? <RealPhoto src={m.img} cap={m.cap}/> : m.photo ? <Photo p={m.photo} cap={m.cap}/> : <div style={{ fontSize: 14.5, lineHeight: 1.4, color: "var(--text)" }}>{m.t}</div>}
              <div style={{ fontSize: 10, color: "var(--text-4)", textAlign: "right", marginTop: 3 }}>{m.time}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ flexShrink: 0, background: isDark ? "rgba(18,18,20,0.72)" : "rgba(255,255,255,0.72)", backdropFilter: "blur(28px) saturate(180%)", WebkitBackdropFilter: "blur(28px) saturate(180%)", borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)", padding: "9px 12px calc(9px + var(--bos-safe-bottom, 0px))", display: "flex", alignItems: "flex-end", gap: 8 }}>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
        <button onClick={pickPhoto} className="tap" aria-label="Прикрепить фото" style={{ width: 38, height: 38, borderRadius: "50%", background: isDark ? "rgba(255,255,255,0.10)" : "rgba(120,120,128,0.14)", border: 0, display: "grid", placeItems: "center", flexShrink: 0, color: "var(--text-2)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.6"/><path d="M21 15l-5-5L5 21"/></svg>
        </button>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(); }} placeholder="Сообщение команде…"
          style={{ flex: 1, minWidth: 0, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(120,120,128,0.10)", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.05)", borderRadius: 20, padding: "10px 15px", fontSize: 16, color: "var(--text)", outline: "none", lineHeight: 1.3 }} />
        <button onClick={send} className="tap" aria-label="Отправить" style={{ width: 38, height: 38, borderRadius: "50%", background: text.trim() ? "#FEDE34" : (isDark ? "rgba(255,255,255,0.10)" : "rgba(120,120,128,0.18)"), border: 0, display: "grid", placeItems: "center", flexShrink: 0, transition: "background 0.2s, transform 0.2s", transform: text.trim() ? "scale(1)" : "scale(0.94)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={text.trim() ? "#0a0a0a" : "var(--text-4)"} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>
        </button>
      </div>
    </div>
  );
}

window.TeamChatScreen = TeamChatScreen;
window.CommunityScreen = CommunityScreen;
window.CourseDetailScreen = CourseDetailScreen;
window.TeamCreateScreen = TeamCreateScreen;
window.TeamDetailScreen = TeamDetailScreen;
window.LevelsScreen = LevelsScreen;
window.ContactDetailScreen = ContactDetailScreen;

/* CONTACT DETAIL — public profile of a network member with their
   social-impact history, reviews from people they've helped, and the
   full list of bookable offers. Light theme to match Community. */
function ContactDetailScreen() {
  const { navigate, params } = useNav();
  const { open: openSheet } = useSheet();
  const [booked, setBooked] = useCS({}); // booked offers (by index)
  const [added, setAdded] = useCS(false);
  const userLevel = 8;
  const p = params?.contact || {
    name: "Александра Иванова", initials: "АИ", color: "#e8c8a8",
    city: "Москва", role: "Маркетинг", level: 12, impact: 1840,
    bio: "Цифровой маркетолог, 5 лет. Йога и медитация.",
    tags: ["Йога","Маркетинг","Путешествия"],
    offers: [
      { i: "🧘", t: "Сеанс медитации", d: "30 мин · вт и чт", price: "Бесплатно", lvl: 5 },
      { i: "💼", t: "Консультация по маркетингу",  d: "1 ч · бренд и рост", price: "150 XP/ч", lvl: 10 },
    ],
  };

  // Mock impact history — services this person has delivered
  const history = [
    { i: "🧘", t: "Проведено медитаций", n: 23, sub: "Последняя: вчера с Марией" },
    { i: "💼", t: "Консультации по маркетингу",       n: 8,  sub: "Помогла 8 основателям" },
    { i: "🌬️", t: "Сеансы дыхания",     n: 5,  sub: "Группы по 3–5 человек" },
  ];
  const rating = 4.9;
  const ratingsCount = 36;

  const reviews = [
    { who: "Ник В.",   when: "2 дн. назад",  text: "Самые спокойные 30 минут моей недели. Её объяснение дыхания превратило привычку, которой я боялся, в ту, которую жду.",  stars: 5, color: "#a8b9d4" },
    { who: "Анна К.",   when: "1 нед. назад",  text: "Разобралась с основой лендинга за 45 минут. Прямо, без воды, дала задание, которое я реально выполнила.", stars: 5, color: "#e8a8c8" },
    { who: "Сергей М.", when: "2 нед. назад",  text: "Сеанс медитации был прекрасно выстроен. Запишусь снова.", stars: 5, color: "#c8e8a8" },
  ];

  const offers = (p.offers || []).slice().sort((a, b) => a.lvl - b.lvl);

  return (
    <div className="page-in" style={{ padding: "0 0 24px" }}>
      {/* Identity hero — soft tinted band, no avatar background heaviness */}
      <div style={{
        background: `linear-gradient(160deg, ${p.color}66 0%, ${p.color}22 60%, transparent 100%)`,
        margin: "-60px 0 0",
        padding: "60px 16px 18px",
      }}>
        <div style={{ display: "flex", alignItems: "center", paddingTop: 4, paddingBottom: 14 }}>
          <button onClick={() => navigate("community")} className="tap"
            style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(255,255,255,0.6)", border: 0, display: "grid", placeItems: "center", padding: 0 }}>
            <I.ChevronLeft size={18}/>
          </button>
          <div style={{ flex: 1 }}/>
          <button className="tap" style={{ width: 40, height: 40, borderRadius: 999, background: "rgba(255,255,255,0.6)", border: 0, display: "grid", placeItems: "center", padding: 0 }}>
            <I.MessageCircle size={16}/>
          </button>
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ width: 64, height: 64, borderRadius: "50%", background: p.color, border: "3px solid #fff", display: "grid", placeItems: "center", fontSize: 22, fontWeight: 700, color: "rgba(0,0,0,0.65)", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>{p.initials}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.5px" }}>{p.name}</span>
              <span style={{ fontSize: 10, fontWeight: 700, background: "#0a0a0a", color: "#FEDE34", borderRadius: 999, padding: "2px 8px", letterSpacing: 0.4 }}>L{p.level}</span>
            </div>
            <div style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--text-3)", marginTop: 4 }}>
              <span>📍 {p.city}</span><span>💼 {p.role}</span>
            </div>
          </div>
        </div>

        {/* Stat strip — impact / rating / sessions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16 }}>
          <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 16, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Вклад</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.4px", marginTop: 2 }}>{p.impact.toLocaleString()}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 16, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Рейтинг</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 2 }}>
              <span style={{ fontSize: 19, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.4px" }}>{rating}</span>
              <span style={{ fontSize: 11, color: "var(--text-4)" }}>★ · {ratingsCount}</span>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 16, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Помог</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.4px", marginTop: 2 }}>{history.reduce((s, h) => s + h.n, 0)}</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "18px 16px 0" }}>
        <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.55 }}>{p.bio}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {p.tags.map((tg, j) => <span key={j} style={{ background: "var(--card-2)", borderRadius: 999, padding: "4px 10px", fontSize: 11, color: "var(--text-3)" }}>{tg}</span>)}
        </div>
      </div>

      {/* Offers — bookable services */}
      <div style={{ padding: "22px 16px 0" }}>
        <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 700, marginBottom: 10 }}>Предложения</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {offers.map((o, j) => {
            const locked = userLevel < o.lvl;
            return (
              <div key={j} style={{
                background: "var(--card)", borderRadius: 18, padding: 14,
                display: "flex", alignItems: "center", gap: 12,
                boxShadow: "var(--card-shadow)",
                opacity: locked ? 0.55 : 1,
              }}>
                <span style={{ width: 42, height: 42, borderRadius: 13, background: "var(--card-2)", display: "grid", placeItems: "center", fontSize: 21, flexShrink: 0 }}>{o.i}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", letterSpacing: -0.1 }}>{o.t}</span>
                    {locked && <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-4)", background: "var(--card-2)", borderRadius: 999, padding: "2px 7px", letterSpacing: 0.4 }}>🔒 L{o.lvl}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>{o.d}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: locked ? "var(--text-4)" : "var(--text)" }}>{o.price}</div>
                  {!locked && (booked[j] ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 11, fontWeight: 700, color: "#1E8E4E", background: "rgba(52,199,89,0.14)", borderRadius: 999, padding: "4px 10px" }}><I.Check size={11} strokeWidth={3}/> Записан</span>
                  ) : (
                    <button onClick={() => setBooked(b => ({ ...b, [j]: true }))} className="tap" style={{ marginTop: 4, fontSize: 11, fontWeight: 600, color: "#0a0a0a", background: "#FEDE34", border: 0, borderRadius: 999, padding: "4px 12px" }}>Записаться</button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History of impact — what they've delivered */}
      <div style={{ padding: "22px 16px 0" }}>
        <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 700, marginBottom: 10 }}>История вклада</div>
        <div style={{ background: "var(--card)", borderRadius: 18, boxShadow: "var(--card-shadow)", overflow: "hidden" }}>
          {history.map((h, j) => (
            <div key={j} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderTop: j === 0 ? 0 : "1px solid var(--line)" }}>
              <span style={{ width: 32, height: 32, borderRadius: 10, background: "var(--card-2)", display: "grid", placeItems: "center", fontSize: 16, flexShrink: 0 }}>{h.i}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-2)", letterSpacing: -0.1 }}>{h.t}</div>
                <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 1 }}>{h.sub}</div>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.4px", flexShrink: 0 }}>{h.n}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div style={{ padding: "22px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 700 }}>Отзывы</div>
          <div style={{ fontSize: 11, color: "var(--text-4)" }}>всего {ratingsCount}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {reviews.map((r, j) => (
            <div key={j} style={{ background: "var(--card)", borderRadius: 18, padding: 14, boxShadow: "var(--card-shadow)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 30, height: 30, borderRadius: "50%", background: r.color, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.6)" }}>{r.who.split(" ").map(s => s[0]).join("")}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{r.who}</div>
                  <div style={{ fontSize: 11, color: "var(--text-4)" }}>{r.when}</div>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)", letterSpacing: 1 }}>{"★".repeat(r.stars)}</div>
              </div>
              <div style={{ fontSize: 13.5, color: "var(--text-2)", marginTop: 10, lineHeight: 1.55 }}>{r.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky-feel CTA */}
      <div style={{ padding: "22px 16px 0", display: "flex", gap: 8 }}>
        <button onClick={() => openSheet(<MessageSheet name={p.name}/>)} className="tap" style={{ flex: 1, background: "var(--card)", border: 0, borderRadius: 999, padding: "13px 14px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 14, color: "var(--text-2)", boxShadow: "var(--card-shadow)" }}>
          <I.MessageCircle size={15}/> Написать
        </button>
        <button onClick={() => setAdded(a => !a)} className="tap" style={{ flex: 1, background: added ? "rgba(52,199,89,0.16)" : "#0a0a0a", color: added ? "#1E8E4E" : "#fff", border: 0, borderRadius: 999, padding: "13px 14px", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {added ? <><I.Check size={15} strokeWidth={3}/> В контактах</> : "Добавить"}
        </button>
      </div>
    </div>
  );
}

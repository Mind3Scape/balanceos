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
function NetworkLocked({ navigate, level, xp, xpMax, levelsLeft, weeks, onUnlock, onSwitchToCommunity }) {
  const xpPct = Math.max(0, Math.min(1, xp / xpMax));
  // Pulse animation tick
  const [t, setT] = useCS(0);
  React.useEffect(() => {
    let raf, s = performance.now();
    const tick = (now) => { setT((now - s) / 1000); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const breath = 1 + Math.sin(t * 1.2) * 0.04;

  const paths = [
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
      d: "Запишись на сессию к коучу Balance или партнёру — это засчитывается в XP.",
      cta: "Смотреть партнёров", action: () => onSwitchToCommunity(),
      meta: "+250 XP / сессия",
      accent: "#9bd0ff",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
      {/* HERO — dark banner with breathing lock orb */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(160deg, #0e1a2e 0%, #0a1424 60%, #060912 100%)",
        borderRadius: 28, padding: "22px 22px 20px",
        color: "#fff",
      }}>
        {/* Stars + glow */}
        <div aria-hidden style={{ position: "absolute", inset: 0,
          background: "radial-gradient(circle at 80% 25%, rgba(180,210,255,0.22) 0%, transparent 45%), radial-gradient(circle at 18% 90%, rgba(120,160,210,0.18) 0%, transparent 45%)" }} />

        <div style={{ display: "flex", gap: 16, alignItems: "center", position: "relative" }}>
          {/* Lock orb */}
          <div style={{ width: 96, height: 96, flexShrink: 0, position: "relative", display: "grid", placeItems: "center", transform: `scale(${breath.toFixed(3)})`, transition: "transform 0.2s" }}>
            <div style={{ position: "absolute", inset: -10, borderRadius: "50%", background: "radial-gradient(circle, rgba(180,210,255,0.35) 0%, transparent 60%)", filter: "blur(6px)" }} />
            <div style={{ width: 96, height: 96, borderRadius: "50%",
              background: "radial-gradient(circle at 32% 28%, #e9f1ff 0%, #8eb0d8 38%, #2c4d76 75%, #0a1424 100%)",
              boxShadow: "inset -8px -10px 24px rgba(0,0,0,0.5), 0 0 30px rgba(120,160,210,0.35)",
              display: "grid", placeItems: "center",
            }}>
              <I.Lock size={32} color="#fff" strokeWidth={1.6}/>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "rgba(180,210,255,0.85)", fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase" }}>Нетворк · Уровень 10</div>
            <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 22, lineHeight: 1.15, marginTop: 6, letterSpacing: "-0.3px" }}>
              Создан для<br/>преданных делу.
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)", marginTop: 8, lineHeight: 1.5 }}>
              Знакомься с реальными людьми в своём городе — когда докажешь практику.
            </div>
          </div>
        </div>

        {/* Progress: L{level} → L10 */}
        <div style={{ marginTop: 18, position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#FEDE34,#EF9F14)", display: "grid", placeItems: "center", color: "#0a0a0a", fontWeight: 800, fontSize: 12 }}>{level}</span>
              <span>Уровень {level} · {xp.toLocaleString()} XP</span>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, opacity: 0.85 }}>
              <span>Уровень 10</span>
              <span style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px dashed rgba(255,255,255,0.3)", display: "grid", placeItems: "center", fontSize: 12 }}><I.Lock size={12}/></span>
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden", position: "relative" }}>
            <div style={{
              position: "absolute", inset: 0,
              width: `${((10 - levelsLeft - 1 + xpPct) / 10 * 100).toFixed(1)}%`,
              background: "linear-gradient(90deg, #FEDE34 0%, #EF9F14 100%)",
              borderRadius: 999,
              boxShadow: "0 0 12px rgba(254,222,52,0.55)",
            }} />
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
осталось {levelsLeft} {levelsLeft === 1 ? "уровень" : "уровней"} · около {weeks} недель в твоём темпе
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
            <div style={{ position: "absolute", top: -14, right: -14, width: 70, height: 70, borderRadius: "50%", background: p.accent, opacity: 0.18, filter: "blur(10px)" }}/>
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
          Нам нужно сообщество преданных делу людей, а не шум. Когда вход надо заслужить, пространство остаётся сфокусированным, безопасным и полным тех, с кем правда хочется встретиться.
        </div>
      </div>

      {/* Dev: instant unlock — hidden in design system but useful while reviewing */}
      <button onClick={onUnlock} className="tap" style={{
        background: "transparent", border: "1px dashed rgba(0,0,0,0.15)", color: "var(--text-4)",
        borderRadius: 999, padding: "8px 14px", fontSize: 11, marginTop: 4, alignSelf: "center",
      }}>
Посмотреть открытый Нетворк →
      </button>
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
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", letterSpacing: 0.4 }}>очк. вклада · Уровень {level}</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, marginTop: 4 }}>
            Каждое выполненное для сообщества предложение приносит вклад. Обменяй его на кредиты или повышай свой статус.
          </div>
        </div>
      </div>

      {/* Unlocked offers — chips */}
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, marginBottom: 8 }}>Что ты можешь предложить</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {unlocked.length === 0 && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>Достигни 3 уровня, чтобы открыть первое предложение.</span>}
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
            <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>Уровень {next.lvl} откроет · {next.t}</div>
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
            style={{ width: "100%", marginTop: 14, border: "1px solid rgba(0,0,0,0.1)", borderRadius: 14, padding: 12, fontSize: 14, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box", background: "#f7f7f8" }}/>
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

function CommunityScreen() {
  const { navigate } = useNav();
  const app = useApp();
  // View-state (section / sub-tabs / network unlock) lives in the shared store so
  // it survives navigating into a detail screen and back (the screen remounts).
  const cv = app?.communityView || { section: "discover", discTab: "teams", commTab: "courses", networkUnlocked: false };
  const { section, discTab, commTab, networkUnlocked } = cv;
  const setView = (patch) => app?.setCommunityView(patch);
  const resolve = (v, cur) => (typeof v === "function" ? v(cur) : v);
  const setSection = (v) => setView({ section: resolve(v, section) });
  const setDiscTab = (v) => setView({ discTab: resolve(v, discTab) });
  const setCommTab = (v) => setView({ commTab: resolve(v, commTab) });
  const setNetworkUnlocked = (v) => setView({ networkUnlocked: resolve(v, networkUnlocked) });
  const [activated, setActivated] = useCS({}); // partner activations (by index)

  const userLevel = 8;
  const xpInLevel = 1240;
  const xpForNext = 2000;
  const levelsLeft = 10 - userLevel;
  const weeksToUnlock = 2;

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
  const courses = [
    { id: "overload",     i: "⚡",    accent: "#fef3c7", t: "Перегрузка",      d: "Перенастрой мышление и очисти негативные убеждения.", price: "110 000 ₽", lvl: "Интенсив",   length: "3 дня", cohort: "14 — 16 мар" },
    { id: "breakthrough", i: "🚀",    accent: "#dbe9ff", t: "Прорыв",  d: "Открой новые пути и преодолей пределы.",            price: "110 000 ₽", lvl: "Продвинутый",    length: "7 дней", cohort: "8 — 14 апр" },
    { id: "marathon",     i: "🏃🏼‍♀️", accent: "#d6f3df", t: "Марафон",      d: "21-дневная программа устойчивых привычек.",                price: "110 000 ₽", lvl: "Базовый",  length: "21 день", cohort: "1 — 21 мая" },
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
        <button className={"tap " + (section === "discover" ? "active" : "")} onClick={() => setSection("discover")}>Обзор</button>
        <button className={"tap " + (section === "community" ? "active" : "")} onClick={() => setSection("community")}>Сообщество</button>
      </div>

      {/* Secondary tabs — text + animated underline (distinct treatment) */}
      {section === "discover" ? (
        <UnderlineTabs
          value={discTab}
          onChange={setDiscTab}
          tabs={[{ id: "teams", t: "Команды" }, { id: "network", t: "Нетворк" }]}
        />
      ) : (
        <UnderlineTabs
          value={commTab}
          onChange={setCommTab}
          tabs={[{ id: "courses", t: "Курсы" }, { id: "partners", t: "Партнёры" }]}
        />
      )}

      {section === "discover" && discTab === "teams" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
          {teams.map((t, i) => (
            <div key={i} className="team-card" style={{
              ["--team-accent"]: t.accent,
              borderRadius: 22, padding: 18, position: "relative", overflow: "hidden",
            }}>
              {/* Big semi-transparent emblem top-right */}
              <div aria-hidden className="team-card__emblem" style={{
                position: "absolute", top: -10, right: -6, fontSize: 110, lineHeight: 1,
                pointerEvents: "none", transform: "rotate(8deg)",
              }}>{t.emblem}</div>
              <div style={{ position: "relative" }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: "var(--text)", letterSpacing: "-0.4px" }}>{t.name}</div>
                <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 6, fontWeight: 500 }}>🎯 {t.goal}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{t.date} · {t.members.length} участников</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
                  <span>Прогресс команды</span>
                  <span style={{ color: "var(--text)" }}>{Math.round(t.progress*100)}%</span>
                </div>
                <div style={{ marginTop: 6, height: 8, borderRadius: 999, background: "var(--card-track)", overflow: "hidden" }}>
                  <span className="team-card__fill" style={{ display: "block", height: "100%", width: (t.progress*100)+"%", borderRadius: 999 }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", marginTop: 14, gap: 8 }}>
                  <AvatarStack people={t.members} size={16} max={5} label={false}/>
                  <button onClick={() => navigate("team-detail", { team: t })} className="tap team-card__cta" style={{ marginLeft: "auto", border: 0, borderRadius: 999, padding: "10px 16px", fontSize: 13, fontWeight: 500 }}>
                    Открыть команду
                  </button>
                </div>
              </div>
            </div>
          ))}
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
        </div>
      )}

      {section === "discover" && discTab === "network" && (
        networkUnlocked ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
          {/* Your-impact hero — what YOU offer at your current level */}
          <YourImpactCard level={userLevel} />
          {/* Network header */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "4px 4px 0" }}>
            <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700 }}>Рядом в твоём кругу</div>
            <div style={{ fontSize: 11, color: "var(--text-4)" }}>По вкладу</div>
          </div>
          {network.map((p, i) => <div key={i} data-tour={i === 0 ? "contacts" : undefined}><NetworkPersonCard p={p} userLevel={userLevel} /></div>)}
        </div>
        ) : (
          <div style={{ marginTop: 2 }}>
            <NetworkLocked
              navigate={navigate}
              level={userLevel}
              xp={xpInLevel}
              xpMax={xpForNext}
              levelsLeft={levelsLeft}
              weeks={weeksToUnlock}
              onUnlock={() => setNetworkUnlocked(true)}
              onSwitchToCommunity={() => { setSection("community"); setCommTab("courses"); }}
            />
          </div>
        )
      )}

      {section === "community" && commTab === "courses" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
          {courses.map((c, i) => (
            <button key={i} data-tour={i === 0 ? "course" : undefined} onClick={() => navigate("course-detail", { course: c })} className="tap"
              style={{ background: "var(--card)", borderRadius: 22, padding: 16, boxShadow: "var(--card-shadow)", border: 0, textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <CourseGlass c={c} size={46} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.3px" }}>{c.t}</span>
                    <span style={{ fontSize: 10, padding: "2px 8px", background: "var(--card-2)", borderRadius: 999, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>{c.lvl}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 6, lineHeight: 1.45 }}>{c.d}</div>
                  <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 6, display: "flex", gap: 10 }}>
                    <span>⏱ {c.length}</span>
                    <span>·</span>
                    <span>📅 {c.cohort}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Стоимость</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{c.price}</div>
                </div>
                <span style={{ background: "#0a0a0a", color: "#fff", borderRadius: 999, padding: "10px 18px", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500 }}>
                  О курсе <I.ChevronRight size={14} />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {section === "community" && commTab === "partners" && (
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
  const emblemChoices = ["✨", "🌱", "🔥", "🌊", "🏔", "🚀", "🎯", "🧭"];

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
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Команда креаторов"
            style={{ width: "100%", marginTop: 6, fontSize: 22, fontWeight: 700, color: "var(--text)", border: 0, outline: 0, background: "transparent", padding: 0, letterSpacing: "-0.4px" }} />
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap", position: "relative" }}>
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
            <div style={{ fontSize: 14, color: "var(--text-2)", fontWeight: 500, lineHeight: 1.4 }}>Двигай это привычками</div>
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
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.5 }}>Если команда достигает цели — банк делится 2× обратно. Если нет — XP сгорают. Необязательно, но мощно.</div>
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

      <button className="bos-btn" style={{ marginTop: 28 }} onClick={() => {
        const dur = { week: "Эта неделя", month: "Этот месяц", quarter: "3 месяца", year: "Год" }[duration] || "Этот месяц";
        app?.addTeam({
          name: name.trim() || "Новая команда",
          emblem, accent,
          goal: goalTitle || (target + " " + unit),
          date: dur,
          progress: 0,
          members: activeMembers.map(m => ({ name: m.name, initials: m.initials, color: m.color, pct: 0 })),
        });
        navigate("community");
      }}>Создать команду</button>
    </div>
  );
}

function TeamDetailScreen() {
  const { navigate, params } = useNav();
  const app = useApp();
  const { open: openSheet } = useSheet();
  const [expandedMember, setExpandedMember] = useCS(null);
  const passed = params?.team || { _id: "seed-1", name: "Команда креаторов", emblem: "✨", accent: "#fef3c7", goal: "50 добрых дел за месяц", date: "1 — 31 дек", progress: 0.62, members: [] };
  // Read the LIVE team from the store so a just-added habit appears immediately.
  const t = (app?.teams || []).find(x => x._id === passed._id) || passed;
  const accent = t.accent || "#fef3c7";
  const members = t.members?.length ? t.members : [{name:"Ник",initials:"Н",pct:19,color:"#a8b9d4"}];
  const ranked = [...members].sort((a, b) => (b.pct || 0) - (a.pct || 0)); // leaderboard
  const DEFAULT_TEAM_HABITS = [
    { id: 1, emoji: "🙏", name: "Добрые дела",  isMain: true,  doneToday: 8,  total: 9, weekPct: 0.78, week:[1,1,0,1,1,1,1] },
    { id: 2, emoji: "🧘🏼‍♀️", name: "Групповая медитация", isMain: false, doneToday: 6, total: 9, weekPct: 0.65, week:[1,0,1,1,0,1,1] },
    { id: 3, emoji: "📖", name: "Читаем вместе",       isMain: false, doneToday: 4, total: 9, weekPct: 0.42, week:[0,1,0,1,0,0,1] },
    { id: 4, emoji: "🥗", name: "Здоровое питание",         isMain: false, doneToday: 7, total: 9, weekPct: 0.81, week:[1,1,1,1,0,1,1] },
  ];
  const teamHabits = Array.isArray(t.habits) ? t.habits : DEFAULT_TEAM_HABITS;
  const main = teamHabits.find(h => h.isMain);
  const others = teamHabits.filter(h => !h.isMain);
  const aggregate = teamHabits.length ? Math.round(teamHabits.reduce((s,h) => s + (h.weekPct||0), 0) / teamHabits.length * 100) : 0;
  const openAddHabit = () => openSheet(<TeamHabitSheet team={t} members={members} onAdd={(h) => app?.addTeamHabit(t._id, h)} />);
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Команда" onBack={() => navigate("community")} right={
        <button onClick={() => navigate("team-settings", { team: t })} className="tap" style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--surface-3)", border: 0, display: "grid", placeItems: "center" }}>
          <I.Settings size={18}/>
        </button>
      }/>
      <div style={{
        background: `linear-gradient(135deg, ${accent} 0%, ${accent}66 60%, var(--card-fade) 100%)`,
        color: "var(--text)", borderRadius: 22, padding: 20,
        position: "relative", overflow: "hidden",
      }}>
        <div aria-hidden style={{
          position: "absolute", top: -14, right: -10, fontSize: 150, lineHeight: 1,
          opacity: 0.28, pointerEvents: "none", filter: "saturate(0.9)",
          transform: "rotate(8deg)",
        }}>{t.emblem || "✨"}</div>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)" }}>{t.name}</div>
          <div style={{ fontSize: 14, color: "var(--text-2)", marginTop: 6, fontWeight: 500 }}>🎯 {t.goal}</div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{t.date}</div>
          <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Итог за неделю</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{aggregate}%</span>
          </div>
          <div style={{ height: 8, background: "rgba(255,255,255,0.55)", borderRadius: 999, overflow: "hidden", marginTop: 6 }}>
            <span style={{ display: "block", height: "100%", width: aggregate+"%", background: "var(--card-fill)", borderRadius: 999 }} />
          </div>
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            <div><div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>Привычки</div><div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: "var(--text)" }}>{teamHabits.length}</div></div>
            <div><div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>Участники</div><div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: "var(--text)" }}>{members.length}</div></div>
            <div><div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>Серия</div><div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: "var(--text)" }}>14д 🔥</div></div>
          </div>
        </div>
      </div>

      {/* Team chat — one shared space for the whole team */}
      <button data-tour="team-chat" onClick={() => navigate("team-chat", { team: t })} className="tap" style={{ width: "100%", marginTop: 12, background: "var(--card)", border: 0, borderRadius: 18, padding: 14, boxShadow: "var(--card-shadow)", display: "flex", alignItems: "center", gap: 13, textAlign: "left", color: "var(--text)" }}>
        <span style={{ width: 44, height: 44, borderRadius: 13, background: "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>💬</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 600 }}>Чат команды</div>
          <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Сергей: До цели 8 дел — добьём к вечеру 🔥</div>
        </div>
        <span style={{ background: "#FF3B30", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 999, minWidth: 20, height: 20, padding: "0 6px", display: "grid", placeItems: "center", flexShrink: 0 }}>3</span>
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
        <div style={{ height: 8, background: "rgba(0,0,0,0.12)", borderRadius: 999, overflow: "hidden", marginTop: 6 }}>
          <span style={{ display: "block", height: "100%", width: (main.doneToday/main.total*100)+"%", background: "#0a0a0a" }} />
        </div>
        {/* Member dots */}
        <div style={{ display: "flex", gap: 4, marginTop: 12, flexWrap: "wrap" }}>
          {Array.from({length: main.total}).map((_, i) => (
            <span key={i} style={{
              width: 22, height: 22, borderRadius: "50%",
              background: i < main.doneToday ? "#0a0a0a" : "rgba(0,0,0,0.15)",
              display: "grid", placeItems: "center", color: "#FEDE34", fontSize: 11, fontWeight: 700,
            }}>{i < main.doneToday ? "✓" : ""}</span>
          ))}
        </div>
      </div>
      </>)}

      {/* Other team habits */}
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
              {/* Last 7 days — green when the team hit it that day */}
              <div style={{ display: "flex", gap: 4, marginTop: 7 }}>
                {(h.week || [0,0,0,0,0,0,0]).map((d, di) => (
                  <span key={di} title={["Пн","Вт","Ср","Чт","Пт","Сб","Вс"][di]} style={{
                    width: 13, height: 13, borderRadius: 4,
                    background: d ? "#34C759" : "var(--surface-3)",
                  }}/>
                ))}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{h.doneToday}/{h.total}</div>
              <div style={{ fontSize: 10, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1 }}>сегодня</div>
            </div>
          </div>
        ))}
        <button onClick={openAddHabit} className="tap" style={{ background: "transparent", border: "1px dashed rgba(0,0,0,0.18)", borderRadius: 16, padding: 14, color: "var(--text-3)", fontSize: 14, fontWeight: 500 }}>
          + Добавить привычку команды
        </button>
      </div>

      <div className="section-label" style={{ marginTop: 22 }}>Участники ({members.length}) · по вкладу</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {ranked.map((m,i)=>{
          const isLeader = i === 0 && (m.pct || 0) > 0;
          const expanded = expandedMember === m.name;
          const todayDone = m.todayDone ?? 0;
          const todayTotal = m.todayTotal ?? teamHabits.length;
          return (
          <div key={i} style={{ background: "var(--card)", borderRadius: 16, boxShadow: "var(--card-shadow)", overflow: "hidden" }}>
            <button onClick={() => setExpandedMember(expanded ? null : m.name)} className="tap"
              style={{ width: "100%", background: "transparent", border: 0, padding: 12, display: "flex", alignItems: "center", gap: 12, textAlign: "left", color: "var(--text)" }}>
              <span style={{ position: "relative", width: 40, height: 40, borderRadius: "50%", background: m.color, display: "grid", placeItems: "center", color: "#fff", fontWeight: 600, flexShrink: 0 }}>
                {m.initials}
                {isLeader && <span style={{ position: "absolute", top: -7, right: -5, fontSize: 14 }}>👑</span>}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, display: "flex", alignItems: "center", gap: 7 }}>
                  {m.name}
                  {isLeader && <span style={{ fontSize: 9, fontWeight: 700, color: "#9A7B0A", background: "#FEF3C7", padding: "2px 7px", borderRadius: 999, textTransform: "uppercase", letterSpacing: 0.4 }}>Лидер</span>}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, display: "flex", gap: 10 }}>
                  <span>🔥 {m.streak ?? 0}</span>
                  <span>сегодня {todayDone}/{todayTotal}</span>
                </div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-2)", flexShrink: 0 }}>{m.pct}%</span>
              <I.ChevronRight size={16} color="var(--text-4)" style={{ flexShrink: 0, transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}/>
            </button>
            {expanded && (
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
    </div>
  );
}

/* Team settings — full screen opened from the gear in Team detail. Edits are
   local until "Сохранить" → updateTeam; team detail re-reads the live team by _id. */
function TeamSettingsScreen() {
  const { navigate, params } = useNav();
  const app = useApp();
  const team = params?.team || {};
  const [name, setName] = useCS(team.name || "");
  const [emblem, setEmblem] = useCS(team.emblem || "✨");
  const [accent, setAccent] = useCS(team.accent || "#fef3c7");
  const [goal, setGoal] = useCS(team.goal || "");
  const [priv, setPriv] = useCS(team.vis !== "public");
  const [notify, setNotify] = useCS(team.notify !== false);
  const [members, setMembers] = useCS(team.members || []);
  const emblems = ["✨","🌱","🔥","🌊","🏔","🚀","🎯","🧭"];
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
  const del = () => { navigate("community"); app?.removeTeam(team._id); };
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
      {SUGGEST.filter(p => !members.some(m => m.name === p.name)).length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {SUGGEST.filter(p => !members.some(m => m.name === p.name)).map((p, i) => (
            <button key={i} onClick={() => invite(p)} className="tap" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px 5px 5px", borderRadius: 999, background: "#fff", border: "1px dashed rgba(0,0,0,0.18)", color: "var(--text-3)", fontSize: 12, fontWeight: 500 }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: p.color, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.55)" }}>{p.initials}</span>
              {p.name} <I.Plus size={12}/>
            </button>
          ))}
        </div>
      )}

      <button className="bos-btn" style={{ marginTop: 28 }} onClick={save}>Сохранить</button>
      <button onClick={del} className="tap" style={{ width: "100%", background: "transparent", border: 0, color: "var(--accent-red)", padding: 14, marginTop: 6, fontSize: 15 }}>
        Удалить команду
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
  const app = useApp ? useApp() : null;
  const ach = (typeof window !== "undefined" && window.ACHIEVEMENTS) || [];
  const achEarned = ach.filter(a => a.earned);
  const lvl = 7;
  const xp = 1240;
  const next = 1500;
  const credits = 1240;
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
          <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>Преданный делу</div>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600 }}>
              <span>{xp} XP</span><span>{next} XP</span>
            </div>
            <div style={{ height: 8, background: "rgba(0,0,0,0.15)", borderRadius: 999, overflow: "hidden", marginTop: 6 }}>
              <span style={{ display: "block", height: "100%", width: (xp/next*100)+"%", background: "#0a0a0a" }} />
            </div>
            <div style={{ fontSize: 12, marginTop: 6, opacity: 0.7 }}>{next-xp} XP до 8 уровня · Сосредоточенный</div>
          </div>
        </div>
      </div>

      {/* Credits — spendable on contacts' services in the Network */}
      <SysCard style={{ padding: 16, marginTop: 12, display: "flex", alignItems: "center", gap: 14, borderRadius: 18 }}>
        <span className="bos-sys-chip-bg" style={{ width: 50, height: 50, borderRadius: 14, display: "grid", placeItems: "center", fontSize: 24 }}>🪙</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="bos-sys-text-3" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Кредиты</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 2 }}>{credits.toLocaleString()}</div>
          <div className="bos-sys-text-3" style={{ fontSize: 11.5, marginTop: 1 }}>на услуги наставников в Нетворке</div>
        </div>
        <button onClick={() => { app?.setCommunityView?.({ section: "discover", discTab: "network" }); navigate("community"); }} className="tap" style={{ background: "#FEDE34", color: "#0a0a0a", border: 0, borderRadius: 999, padding: "10px 16px", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>В Нетворк</button>
      </SysCard>

      <div className="section-label" style={{ marginTop: 22 }}>Награды за кредиты</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {rewards.map((r, i) => (
          <SysCard key={i} style={{ padding: 12, display: "flex", alignItems: "center", gap: 12, opacity: r.unlocked ? 1 : 0.55 }}>
            <span className="bos-sys-chip-bg" style={{ width: 42, height: 42, borderRadius: 12, display: "grid", placeItems: "center", fontSize: 22 }}>{r.i}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{r.t}</div>
              <div className="bos-sys-text-3" style={{ fontSize: 11, marginTop: 2 }}>
                {r.unlocked ? `${r.c} кредитов` : `Откроется на уровне ${r.lvl}`}
              </div>
            </div>
            <button disabled={!r.unlocked || credits < r.c} className="tap" style={{ background: r.unlocked && credits >= r.c ? "#FEDE34" : "var(--surface-3)", color: r.unlocked && credits >= r.c ? "#0a0a0a" : "var(--text-4)", border: 0, borderRadius: 999, padding: "8px 14px", fontSize: 12, fontWeight: 600 }}>
              {r.unlocked ? (credits >= r.c ? "Получить" : "Нужно больше") : "🔒"}
            </button>
          </SysCard>
        ))}
      </div>

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

      <div className="section-label" style={{ marginTop: 22 }}>Как зарабатывать XP</div>
      <SysCard style={{ padding: 14, marginTop: 8 }}>
        {[
          { t: "Выполнить привычку", v: "+5 XP" },
          { t: "Серия 7 дней", v: "+50 XP" },
          { t: "Помочь товарищу по команде", v: "+15 XP" },
          { t: "Достичь цели", v: "+200 XP" },
        ].map((r, i, arr) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : 0, fontSize: 14 }}>
            <span>{r.t}</span>
            <span style={{ color: "#c99a1a", fontWeight: 600 }}>{r.v}</span>
          </div>
        ))}
      </SysCard>
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
      { wk: "День 3", h: "Задай минимум", b: "Собери минимальный ежедневный ритуал, который выдержишь в самый худой день." },
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
          <CourseGlass c={c} size={58} />
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

/* ─── TEAM CHAT — one shared chat for the whole team: messages + photos, in the
   flow of doing the goal together. Core team feature; especially useful for
   trainers running cohorts and for family circles. ─── */
function TeamChatScreen() {
  const { navigate, params } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  const isDark = app?.themeOverride === "dark";
  const team = params?.team || { _id: "seed-1", name: "Команда креаторов", emblem: "✨", members: [] };
  const SEED = [
    { who: "Светлана", c: "#e8c8a8", t: "Доброе утро, команда! ☀️ Кто уже отметил доброе дело?", time: "8:14" },
    { who: "Вадим",    c: "#a8d4e8", t: "Я помог соседке с покупками 💪", time: "8:31" },
    { who: "Вадим",    c: "#a8d4e8", photo: { e: "🌅", g: "linear-gradient(135deg,#ffd28a,#ff9a6b)" }, cap: "И пробежку засчитал", time: "8:32" },
    { who: "Ник",      c: "#a8b9d4", t: "Красиво! Тоже выхожу 🏃", time: "8:40" },
    { who: "Павел",    me: true, c: "#FEDE34", t: "Вы лучшие 🙌 Сегодня закрываем 50 добрых дел!", time: "9:02" },
    { who: "Сергей",   c: "#c8e8a8", t: "До цели 8 дел — добьём к вечеру 🔥", time: "9:10" },
  ];
  const [msgs, setMsgs] = useCS(SEED);
  const [text, setText] = useCS("");
  const bottomRef = React.useRef(null);
  React.useEffect(() => { const el = bottomRef.current; if (el && el.scrollIntoView) el.scrollIntoView({ block: "end" }); }, [msgs.length]);
  const push = (m) => setMsgs(list => [...list, { who: "Павел", me: true, c: "#FEDE34", time: "сейчас", ...m }]);
  const send = () => { const v = text.trim(); if (!v) return; push({ t: v }); setText(""); };
  const sendPhoto = () => push({ photo: { e: "📸", g: "linear-gradient(135deg,#cfe6ff,#9bbef0)" }, cap: "Мой прогресс сегодня" });

  const otherBubble = isDark ? "rgba(255,255,255,0.07)" : "#fff";
  const mineBubble  = isDark ? "#fff" : "#0a0a0a";
  const mineText    = isDark ? "#0a0a0a" : "#fff";
  const Photo = ({ p, cap, light }) => (
    <div style={{ marginTop: 2 }}>
      <div style={{ width: 152, height: 104, borderRadius: 14, background: p.g, display: "grid", placeItems: "center", fontSize: 46, boxShadow: "inset 0 -34px 44px rgba(0,0,0,0.14)" }}>{p.e}</div>
      {cap && <div style={{ fontSize: 12.5, marginTop: 5, color: light ? "rgba(255,255,255,0.85)" : "var(--text-2)" }}>{cap}</div>}
    </div>
  );

  return (
    <div className="page-in" style={{ minHeight: "100%", display: "flex", flexDirection: "column", padding: 0 }}>
      <div style={{ padding: "0 14px" }}>
        <PageHeader title={team.name} onBack={() => navigate("team-detail", { team })}
          right={<span style={{ fontSize: 12, color: "var(--text-4)", whiteSpace: "nowrap" }}>{(team.members?.length || 4)} 👥</span>} />
      </div>

      <div style={{ flex: 1, padding: "2px 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-4)", margin: "2px 0 2px" }}>Сегодня</div>
        {msgs.map((m, i) => m.me ? (
          <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ maxWidth: "78%", background: mineBubble, color: mineText, borderRadius: "18px 18px 5px 18px", padding: m.photo ? 8 : "9px 13px" }}>
              {m.photo ? <Photo p={m.photo} cap={m.cap} light/> : <div style={{ fontSize: 14.5, lineHeight: 1.4 }}>{m.t}</div>}
              <div style={{ fontSize: 10, opacity: 0.55, textAlign: "right", marginTop: 3 }}>{m.time}</div>
            </div>
          </div>
        ) : (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <span style={{ width: 30, height: 30, borderRadius: "50%", background: m.c, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, color: "rgba(0,0,0,0.55)", flexShrink: 0 }}>{m.who[0]}</span>
            <div style={{ maxWidth: "78%", background: otherBubble, borderRadius: "18px 18px 18px 5px", padding: m.photo ? 8 : "9px 13px", boxShadow: isDark ? "none" : "0 1px 2px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: m.photo ? 4 : 2 }}>{m.who}</div>
              {m.photo ? <Photo p={m.photo} cap={m.cap}/> : <div style={{ fontSize: 14.5, lineHeight: 1.4, color: "var(--text)" }}>{m.t}</div>}
              <div style={{ fontSize: 10, color: "var(--text-4)", textAlign: "right", marginTop: 3 }}>{m.time}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ position: "sticky", bottom: 0, background: isDark ? "rgba(12,12,14,0.92)" : "rgba(244,244,246,0.92)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderTop: "1px solid var(--line)", padding: "10px 12px calc(10px + var(--bos-safe-bottom, 0px))", display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={sendPhoto} className="tap" aria-label="Фото" style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--surface-3)", border: 0, display: "grid", placeItems: "center", flexShrink: 0, fontSize: 18 }}>📷</button>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(); }} placeholder="Сообщение команде…"
          style={{ flex: 1, minWidth: 0, background: "var(--surface-3)", border: 0, borderRadius: 999, padding: "11px 16px", fontSize: 14.5, color: "var(--text)", outline: "none" }} />
        <button onClick={send} className="tap" aria-label="Отправить" style={{ width: 40, height: 40, borderRadius: "50%", background: text.trim() ? "#0a0a0a" : "var(--surface-3)", border: 0, display: "grid", placeItems: "center", flexShrink: 0, transition: "background 0.2s" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={text.trim() ? "#fff" : "var(--text-4)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
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

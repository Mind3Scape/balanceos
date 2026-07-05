/* core/community-kit.jsx — NEUTRAL shared toolkit extracted from screens/community.jsx (v196 live/demo/core split).
   No product (demo/live) branching — one copy, used by BOTH demos and the live app.
   Moved bricks: BOS_TEAM_PALETTE, CloudTeamsDiscover, DurationPicker, MessageSheet, SplitEditor, TEAM_EMBLEMS, TeamHabitSheet, TeamShareSheet, bosCompressImage, bosConfirmExitTeam, bosMsgTime, bosUserColor */
const BOS_TEAM_PALETTE = ["#7FB3F2", "#F4A574", "#9BD4A8", "#C9A8E8", "#F2A0B4", "#E8C868", "#86C7C2", "#E59BC4"];

/* Liquid-glass icon chip — glossy, dimensional, iOS-26 style. Vivid gradient
   fill + bright top specular + inner shadow + soft coloured glow underneath. */
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
  // Loading (list === null) → a 1-row skeleton in the team-row shape, so the section
  // breathes in instead of popping. Loaded-empty (list === []) → render nothing.
  if (list === null) return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)", padding: "4px 4px 8px" }}>Открытые команды рядом</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--card)", borderRadius: 22, padding: 14, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
        <span className="bos-skel" style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span className="bos-skel" style={{ display: "block", width: "55%", height: 13, borderRadius: 6 }} />
          <span className="bos-skel" style={{ display: "block", width: "35%", height: 10, borderRadius: 6, marginTop: 7 }} />
        </div>
      </div>
    </div>
  );
  if (!list.length) return null;
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
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--card)", borderRadius: 22, padding: 14, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
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
    <div style={{ background: "var(--card)", borderRadius: 22, padding: 16, marginTop: 10, boxShadow: "var(--card-shadow)" }}>
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

      <div style={{ background: "var(--card)", borderRadius: 22, padding: 14, marginTop: 10, boxShadow: "var(--card-shadow)" }}>
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

function bosConfirmExitTeam({ app, team, isOwner, navigate, openSheet, returnTo }) {
  openSheet(
    <ConfirmActionSheet
      emoji={isOwner ? "🗑️" : "👋"}
      title={isOwner ? "Удалить цель?" : "Покинуть цель?"}
      message={isOwner
        ? "Цель «" + (team?.name || "") + "» и весь её прогресс исчезнут у всех участников. Это не отменить."
        : "Ты выйдешь из «" + (team?.name || "") + "». Снова войти можно будет только по приглашению."}
      confirmLabel={isOwner ? "Удалить цель" : "Покинуть"}
      confirmIcon={isOwner ? I.Trash : I.Logout}
      // returnTo = откуда открыли круг (Привычки/Найти). Дефолт "community" сохраняет прежнее поведение.
      onConfirm={async () => { var _r = await bosExitTeam({ app, team, isOwner }); if (_r && _r.ok === false) { try { window.tgHaptic && window.tgHaptic("heavy"); } catch (e) {} return; } navigate(returnTo || "community"); }}
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
        <div style={{ width: 64, height: 64, borderRadius: 22, margin: "0 auto 12px", background: team?.accent || "#fef3c7", display: "grid", placeItems: "center", fontSize: 34 }}>{team?.emblem || "✨"}</div>
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
      <div style={{ background: C.tile, borderRadius: 14, padding: "2px 14px", marginTop: 18 }}>
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


/* ── v197: neutral deps the live forks need (moved from screens/community.jsx) ── */
function TeamRing({ pct, color = "#FEDE34", track, sw = 3, glow }) {
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

/* ── v197: deeper deps for the moved bricks (ConfirmActionSheet, bosExitTeam) ── */
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
  // F7: результат облачной операции ВАЖЕН. Раньше он игнорировался и removeTeam выполнялся всегда —
  // при обрыве сети в облаке ты ОСТАВАЛСЯ участником («призрак»: в режиме «серия у каждого» его 0
  // морозит общую цель ВСЕЙ команде, а UI membership не восстанавливает). Теперь: облачный круг
  // убираем локально ТОЛЬКО если облако подтвердило; обрыв → оставляем круг, юзер повторит онлайн.
  if (team && team.cloudId && window.bosCloud && window.bosCloud.enabled && window.bosCloud.enabled()) {
    var cloudOk = false;
    try {
      if (isOwner) { if (window.bosCloud.deleteTeam) cloudOk = await window.bosCloud.deleteTeam(team.cloudId); }
      else { if (window.bosCloud.leaveTeam) cloudOk = await window.bosCloud.leaveTeam(team.cloudId); }
    } catch (e) { cloudOk = false; }
    if (!cloudOk) return { ok: false };
  }
  if (app && app.removeTeam && team) app.removeTeam(team._id);
  // Копии командных привычек ПЕРЕЖИВАЮТ круг как обычные личные: отвязываем линк (миррор в
  // мёртвый круг больше не нужен) и снимаем с «полки» (shelved) — иначе спрятанная копия
  // застряла бы навсегда без страницы круга, где живёт кнопка «Вернуть к себе».
  try {
    const tid = team && (team.cloudId || team._id);
    ((app && app.habits) || []).forEach((h) => {
      if (!h || !h.teamHabitId || !app.updateHabit) return;
      const linked = (tid && h.teamId === tid) || (team && Array.isArray(team.habits) && team.habits.some((x) => x && x.id === h.teamHabitId));
      if (linked) app.updateHabit(h.id, { teamId: null, teamHabitId: null, shelved: false });
    });
  } catch (e) {}
  return { ok: true };
}
/* Open the iOS confirm sheet for leaving/deleting, wired to bosExitTeam + navigate-back. */

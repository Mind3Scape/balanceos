/* COMMUNITY EXTRA — LIVE-only forks of the remaining Community sub-screens (real
   Telegram user, app.mode === "live" is ALWAYS true here). Giving the live user its
   OWN screen files keeps the two demo modes ('demo' / 'fresh') frozen — future live
   edits can never break the showcase. Sibling file: community_live.jsx
   (CommunityLive + TeamDetailLive); this one carries the six detail screens.

   What the demo/fresh branches contributed (all stripped here):
   • TeamCreateLive — the create form is mode-agnostic; the only demo branch was the
     `app?.mode === "live"` guard around mirroring the new team to the cloud — ALWAYS
     true for the live user, so it's hardcoded on (the cloud-enabled + cloudId guards
     stay). The member-picker chips are the form's own roster (all modes), kept.
   • TeamSettingsLive — drops the demo-only SUGGEST invite chips (gated by
     `app?.mode !== "live"` → always false live) and their array. Keeps the real
     "Пригласить по ссылке" referral button (was gated `mode === "live" && cloudId`).
   • LevelsLive — drops every `app?.mode === "demo"` curated number (lvl 7 / 1240 XP /
     980 credits / invited 2 / Павел's achievement array) and collapses the live ternaries
     to the REAL date-keyed XP model (bosLiveXPLive/bosLevelInfoLive), real earned achievements
     (bosEarnedAchievementsLive) and the real referral count (window.bosCloud.invitedPeople).
     The unused `badges` array is dropped; the rewards catalog + circle milestones are kept.
   • CourseDetailLive — no demo branches; faithful fork of the static programme screen.
   • TeamChatLive — `live` is always true, so the demo/fresh SEED conversation (and the
     emoji-placeholder Photo path / m.photo bubbles it fed) is dropped. Cloud chat
     (cloudId) + the local-live persisted history path stay; real photos use RealPhoto.
   • ContactDetailLive — no demo branches; faithful fork (reads its contact from
     useNav().params), with the iOS-Headline typography polish.

   Everything else reuses the shared globals already defined in community.jsx +
   app-wide (PageHeader, Switch, Segmented, SysCard, AvatarStack, BosAvatar, ShareAppSheet,
   TEAM_EMBLEMS, SplitEditor, DurationPicker, ConfirmActionSheet, TeamShareSheet,
   bosConfirmExitTeam, bosCompressImage, bosUserColor, bosMsgTime, BOS_TEAM_PALETTE,
   the icon object I, the bos* XP helpers, window.bosCloud, hooks useApp/useNav/useSheet,
   and useCS = React.useState). The ONLY new top-level declarations in this file are
   TeamCreateLive, TeamSettingsLive, LevelsLive, CourseDetailLive, TeamChatLive and
   ContactDetailLive. */

function TeamCreateLive() {
  const { navigate, params } = useNav();
  const app = useApp();
  const { open: openSheet } = useSheet();
  // Quick-add team preset (from the Команды tab chip) → {i,t,accent,goalType,goalTitle,target,unit}.
  // Seeds name/emblem/accent + the goal config, so a chip like «30 дней спорта» opens pre-filled.
  const preset = params?.preset || null;
  const [name, setName] = useCS(preset?.t || "");
  const [emblem, setEmblem] = useCS(preset?.i || "✨");
  const [accent, setAccent] = useCS(preset?.accent || "#84A4B8");   // Journal «Грифельный» — calm neutral default (a team needs a visible cover, so not pure black like habits)
  const [duration, setDuration] = useCS("month");
  const [vis, setVis] = useCS("private");
  const [saving, setSaving] = useCS(false);

  // Goal config
  const [goalType, setGoalType] = useCS(preset?.goalType || "collective"); // collective | streak | race
  const [goalTitle, setGoalTitle] = useCS(preset?.goalTitle || "50 добрых дел");
  const [target, setTarget] = useCS(preset?.target || 50);
  const [unit, setUnit] = useCS(preset?.unit || "дел");
  const [linkedHabits, setLinkedHabits] = useCS({
    "🙏": true, "🧘🏼‍♀️": false, "📖": false, "🥗": false, "🏃🏼‍♀️": false,
  });
  const [stakes, setStakes] = useCS(true);
  const [stakeAmount, setStakeAmount] = useCS(100);

  // A real user starts a team as just THEMSELVES — no invented roster (the old
  // Павел/Ник/Светлана… were demo personas leaking into live). Others come in via
  // the «Пригласить» link, and the goal split fills out as they actually join.
  const _youName = (app?.userName || "").trim();
  const allMembers = [
    { name: (_youName ? _youName + " " : "") + "(вы)", initials: (_youName || "В").slice(0, 1).toUpperCase(), color: "#FEDE34", on: true, you: true },
  ];
  const [members, setMembers] = useCS(allMembers);
  const toggleMember = (i) => setMembers(m => m.map((x, j) => j === i ? { ...x, on: !x.on } : x));
  const activeMembers = members.filter(m => m.on);

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
        }}>{bosIcon(emblem, 92, accent)}</div>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 600 }}>Название команды</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Команда создателей"
            style={{ width: "100%", marginTop: 6, fontSize: 22, fontWeight: 700, color: "var(--text)", border: 0, outline: 0, background: "transparent", padding: 0, letterSpacing: "-0.4px" }} />
        </div>
        {/* Emoji/symbol panel + Journal colours — same picker as habits & goals (David). */}
        <button type="button" data-haptic="selection" onClick={() => openSheet(<EmojiPickerLive onPick={setEmblem} current={emblem} accent={accent} />)} className="tap"
          style={{ position: "relative", marginTop: 14, display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.75)", border: 0, borderRadius: 14, padding: "7px 14px 7px 7px", cursor: "pointer", WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)" }}>
          <span style={{ width: 40, height: 40, borderRadius: 12, background: "#fff", display: "grid", placeItems: "center", fontSize: 22, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>{bosIcon(emblem, 24, accent)}</span>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-2)" }}>Сменить иконку</span>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, position: "relative", overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", padding: "6px 2px" }}>
          <label className="tap" data-haptic="selection" style={{ position: "relative", width: 30, height: 30, borderRadius: "50%", flexShrink: 0, cursor: "pointer", boxShadow: (typeof accent === "string" && accent[0] === "#" && !BOS_APPLE_COLORS.includes(accent)) ? "0 0 0 2px #fff, 0 0 0 4px var(--text-3)" : "none", background: "conic-gradient(from 0deg, #FF3B30, #FF9500, #FFCC00, #34C759, #30B0C7, #007AFF, #AF52DE, #FF2D55, #FF3B30)" }}>
            <input type="color" value={(typeof accent === "string" && accent[0] === "#") ? accent : "#84A4B8"} onChange={(e) => setAccent(e.target.value)} aria-label="Свой цвет" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, border: 0, padding: 0, cursor: "pointer" }} />
          </label>
          <span style={{ width: 1, height: 24, background: "rgba(0,0,0,0.12)", flexShrink: 0 }} />
          {BOS_APPLE_COLORS.map((c) => (
            <button key={c} type="button" className="tap" data-haptic="selection" onClick={() => setAccent(c)} aria-label={BOS_APPLE_COLOR_NAMES[c] || "Цвет"}
              style={{ width: 30, height: 30, borderRadius: "50%", background: c, border: 0, flexShrink: 0, cursor: "pointer", boxShadow: accent === c ? "0 0 0 2px #fff, 0 0 0 4px " + c : "none", transition: "box-shadow 0.15s" }} />
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
                borderRadius: 22, padding: 14, display: "flex", alignItems: "center", gap: 12,
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
      <div style={{ background: "var(--card)", borderRadius: 22, padding: 16, marginTop: 10, boxShadow: "var(--card-shadow)" }}>
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
      <div style={{ background: "var(--card)", borderRadius: 22, padding: 16, marginTop: 10, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: "var(--text-2)", fontWeight: 500, lineHeight: 1.4 }}>Двигать цель привычками</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.5 }}>Каждая отметка участника по командной привычке двигает цель на +1 — закрываете её вместе.</div>
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
      <div data-tour="team-stakes" style={{ background: "var(--card)", borderRadius: 22, padding: 16, marginTop: 8, boxShadow: "var(--card-shadow)" }}>
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
      <div style={{ background: "var(--card)", borderRadius: 22, padding: 16, marginTop: 8, boxShadow: "var(--card-shadow)" }}>
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
          <button className="tap" onClick={() => openSheet(<ShareAppSheetLive />)} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 11px", borderRadius: 999,
            background: "transparent", border: "1px dashed rgba(0,0,0,0.18)",
            color: "var(--text-3)", fontSize: 12, fontWeight: 500,
          }}><I.Plus size={12}/> Пригласить</button>
        </div>
      </div>

      <button className="bos-btn" disabled={saving} style={{ marginTop: 20, opacity: saving ? 0.65 : 1 }} onClick={() => {
        if (saving) return;
        setSaving(true);
        if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
        const dur = { week: "Эта неделя", month: "Этот месяц", quarter: "3 месяца", year: "Год" }[duration] || "Этот месяц";
        const nt = app?.addTeam({
          name: name.trim() || "Новая команда",
          emblem, accent, vis, // private / public — preserved from the toggle above
          goal: goalTitle || (target + " " + unit),
          target: Number(target) || 0, current: 0, unit,
          stake: stakes ? (Number(stakeAmount) || 0) : 0, // optional XP wager per person
          date: dur,
          progress: 0,
          members: activeMembers.map(m => ({ name: m.name, initials: m.initials, color: m.color, pct: 0 })),
        });
        // D3 — mirror to the cloud so a public team is discoverable by everyone and
        // can be joined by link. (Live user: the old `app?.mode === "live"` gate is
        // always true, so it's dropped — the cloud-enabled guard stays.) The local team
        // keeps working even if the cloud is off.
        try {
          if (nt && window.bosCloud && window.bosCloud.enabled()) {
            window.bosCloud.createTeam({ name: nt.name, emblem, vis, goalKind: nt.goal, goalTarget: Number(target) || 0, goal: { type: goalType, target: Number(target) || 0, unit: unit, title: goalTitle || (target + " " + unit), stake: stakes ? (Number(stakeAmount) || 0) : 0 } })
              .then((row) => { if (row && row.id && app.updateTeam) app.updateTeam(nt._id, { cloudId: row.id }); });
          }
        } catch (e) {}
        setTimeout(() => navigate("community"), 300);
      }}>{saving ? "Создаём…" : "Создать команду"}</button>
    </div>
  );
}

/* Team settings — full screen opened from the gear in Team detail. Edits are
   local until "Сохранить" → updateTeam; team detail re-reads the live team by _id. */
function TeamSettingsLive() {
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
  const [saving, setSaving] = useCS(false);
  // A cloud team's members live in the cloud — load the REAL roster so the list never shows
  // the stale local cache (the phantom «йога-тест» members). Local teams keep their own.
  React.useEffect(() => {
    if (!(team.cloudId && window.bosCloud && window.bosCloud.enabled() && window.bosCloud.teamMembers)) return;
    let on = true;
    window.bosCloud.teamMembers(team.cloudId).then((mem) => {
      if (!on || !Array.isArray(mem)) return;
      var palette = (typeof BOS_TEAM_PALETTE !== "undefined") ? BOS_TEAM_PALETTE : ["#7FB3F2"];
      setMembers(mem.map((m, j) => ({ id: m.id, name: m.name || "Участник", avatar: m.avatar, initials: (m.name || "У").slice(0, 1).toUpperCase(), color: palette[j % palette.length] })));
    }).catch(() => {});
    return () => { on = false; };
  }, [team.cloudId]);
  const emblems = TEAM_EMBLEMS;
  const accents = ["#fef3c7","#dbe9ff","#d6f3df","#e9dffd","#fde2e2","#ffe1c8","#d4f0eb","#e3e3e3"];
  const removeMember = (i) => setMembers(ms => ms.filter((_, j) => j !== i));
  const save = () => {
    if (saving) return;
    setSaving(true);
    if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
    app?.updateTeam(team._id, { name: name.trim() || team.name, emblem, accent, goal: goal.trim() || team.goal, vis: priv ? "private" : "public", notify, members });
    setTimeout(() => navigate("team-detail", { team }), 300);
  };
  // This screen is owner-only (gated by the gear), so deleting goes through the cloud
  // deleteTeam + a confirm sheet (was a silent local-only removeTeam).
  const del = () => bosConfirmExitTeam({ app, team, isOwner: true, navigate, openSheet });
  const card = { background: "#fff", borderRadius: 22, marginTop: 8, boxShadow: "var(--card-shadow)" };
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Настройки команды" onBack={() => navigate("team-detail", { team })} />

      <div className="section-label">Название</div>
      <input className="bos-input" value={name} onChange={e => setName(e.target.value)} style={{ marginTop: 8 }} />

      {/* Icon = emoji/symbol panel, colour = Journal palette + wheel — one picker across
          habits, goals AND teams (David: «выбор эмоди и цветов как у привычек»). */}
      <div className="section-label" style={{ marginTop: 22 }}>Иконка</div>
      <button onClick={() => openSheet(<EmojiPickerLive onPick={setEmblem} current={emblem} accent={accent} />)} className="tap" data-haptic="selection"
        style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 12, background: "#fff", border: 0, borderRadius: 18, padding: "10px 16px 10px 10px", boxShadow: "var(--card-shadow)", cursor: "pointer" }}>
        <span style={{ width: 52, height: 52, borderRadius: 14, background: (accent && accent[0] === "#") ? accent + "26" : "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 26 }}>{bosIcon(emblem, 28, accent)}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-2)" }}>Сменить иконку</span>
      </button>

      <div className="section-label" style={{ marginTop: 22 }}>Цвет</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", padding: "6px 2px" }}>
        <label className="tap" data-haptic="selection" style={{ position: "relative", width: 36, height: 36, borderRadius: "50%", flexShrink: 0, cursor: "pointer", boxShadow: (typeof accent === "string" && accent[0] === "#" && !BOS_APPLE_COLORS.includes(accent)) ? "0 0 0 2px #fff, 0 0 0 4px var(--text-3)" : "none", background: "conic-gradient(from 0deg, #FF3B30, #FF9500, #FFCC00, #34C759, #30B0C7, #007AFF, #AF52DE, #FF2D55, #FF3B30)" }}>
          <input type="color" value={(typeof accent === "string" && accent[0] === "#") ? accent : "#84A4B8"} onChange={(e) => setAccent(e.target.value)} aria-label="Свой цвет" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, border: 0, padding: 0, cursor: "pointer" }} />
        </label>
        <span style={{ width: 1, height: 28, background: "var(--line)", flexShrink: 0 }} />
        {BOS_APPLE_COLORS.map((c) => (
          <button key={c} className="tap" data-haptic="selection" onClick={() => setAccent(c)} aria-label={BOS_APPLE_COLOR_NAMES[c] || "Цвет"}
            style={{ width: 36, height: 36, borderRadius: "50%", background: c, border: 0, flexShrink: 0, cursor: "pointer", boxShadow: accent === c ? "0 0 0 2px #fff, 0 0 0 4px " + c : "none", transition: "box-shadow 0.15s" }} />
        ))}
      </div>

      <div className="section-label" style={{ marginTop: 22 }}>Цель команды</div>
      <input className="bos-input" value={goal} onChange={e => setGoal(e.target.value)} placeholder="напр. 50 добрых дел" style={{ marginTop: 8 }} />

      <div style={{ ...card, padding: "2px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Приватная команда</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 1 }}>Только по приглашению</div>
          </div>
          <Switch on={priv} onChange={setPriv} />
        </div>
        <div style={{ height: 1, background: "var(--line)" }}/>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Уведомления</div>
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
            <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{m.name}</div>
            <button onClick={() => removeMember(i)} className="tap" aria-label="Убрать" style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface-3)", border: 0, color: "var(--text-3)", fontSize: 17, lineHeight: 1 }}>×</button>
          </div>
        ))}
        {members.length === 0 && <div style={{ fontSize: 13, color: "var(--text-4)", padding: "6px 0" }}>Пока никого. Пригласи друзей ниже.</div>}
      </div>
      {/* Demo's SUGGEST invite chips (gated `app?.mode !== "live"`) are gone — live invites
          everyone through the real referral link below. */}
      {team.cloudId && (
        <button onClick={() => {
          // Telegram team deep-link (t.me/<bot>?startapp=team_<cloudId>) — same link as
          // TeamShareSheetLive; the launch path decodes it → joinViaLink. NOT the github.io
          // /?team= web URL (can't open the Mini App from Telegram).
          var link = (typeof bosTeamInviteLink === "function") ? bosTeamInviteLink(team.cloudId) : ("https://t.me/BalanceOS8_bot?startapp=team_" + team.cloudId);
          var text = "Вести привычки вместе — веселее, и за совместные привычки больше XP ✨ Залетай в команду «" + (team.name || "") + "» в BalanceOS";
          if (window.bosShare) window.bosShare(link, text);
          else { try { navigator.clipboard.writeText(link); } catch (e) {} }
          if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
        }} className="tap" style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 999, background: "#0a0a0a", color: "#fff", border: 0, fontSize: 13, fontWeight: 600 }}>
          <I.Share size={15}/> Пригласить по ссылке
        </button>
      )}

      <button className="bos-btn" disabled={saving} style={{ marginTop: 20, opacity: saving ? 0.65 : 1 }} onClick={save}>{saving ? "Сохраняем…" : "Сохранить"}</button>
      <button onClick={del} className="tap" style={{ width: "100%", background: "transparent", border: 0, color: "var(--accent-red)", padding: 14, marginTop: 6, fontSize: 15, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
        <I.Trash size={17}/> Удалить команду
      </button>
    </div>
  );
}

/* LEVELS / CREDITS — gamification (theme-aware). LIVE: every number comes from the
   REAL date-keyed XP model + real referral circle + real earned achievements; the
   demo's curated 7 / 1240 / 980 / Павел-array are all gone. */
function LevelsLive() {
  const { navigate } = useNav();
  const { open: openSheet } = useSheet();
  const app = useApp ? useApp() : null;
  const isDark = app?.themeOverride === "dark";
  // LIVE: real count of people you've actually invited (referral circle) — same source as
  // the profile orbit.
  const [liveInvited, setLiveInvited] = React.useState(0);
  React.useEffect(() => {
    let on = true;
    if (window.bosCloud && window.bosCloud.invitedPeople) {
      window.bosCloud.invitedPeople().then((list) => { if (on && Array.isArray(list)) setLiveInvited(list.length); }).catch(() => {});
    }
    return () => { on = false; };
  }, []);
  const invited = liveInvited; // people you've drawn into the app
  // Круг влияния — concrete XP, no abstract ×/%. The felt "multiplier" is two
  // plain things: shared habits pay more (+15 vs +10), and growing your circle
  // hits milestones that drop a big lump bonus. No ceiling — milestones keep
  // climbing and every friend always pays +150.
  const CIRCLE_MILESTONES = [{ n: 3, bonus: 300 }, { n: 7, bonus: 700 }, { n: 15, bonus: 1500 }, { n: 30, bonus: 3000 }];
  const nextMile = CIRCLE_MILESTONES.find(t => t.n > invited) || null; // null = past the last listed milestone
  const prevMileN = ([...CIRCLE_MILESTONES].reverse().find(t => t.n <= invited) || { n: 0 }).n;
  const ruPpl = (n, a) => { const m = n % 10, h = n % 100; return a[(m === 1 && h !== 11) ? 0 : (m >= 2 && m <= 4 && (h < 10 || h >= 20)) ? 1 : 2]; };
  // LIVE: real earned ladder (never Павел's curated array).
  const ach = (typeof bosEarnedAchievementsLive === "function") ? bosEarnedAchievementsLive(app) : [];
  const achEarned = ach.filter(a => a.earned);
  // LIVE: real numbers from the date-keyed habit model (T0.2). Titles are shared.
  const _xpLive = bosLiveXPLive(app);
  const _li = bosLevelInfoLive(_xpLive);
  const LEVEL_TITLES = ["Новичок", "Первые шаги", "Набираю ритм", "В потоке", "Стойкость", "Уверенность", "Преданный делу", "Сосредоточенный", "Мастер привычек", "Вдохновитель", "Наставник", "Легенда"];
  const titleFor = (l) => LEVEL_TITLES[Math.min(Math.max(1, l), LEVEL_TITLES.length) - 1];
  const lvl = _li.level;
  const xp = _xpLive;
  const next = _li.next;
  const pctBar = _li.pct;
  const credits = _xpLive; // spendable balance = earned XP for live
  const rUnlocked = (r) => lvl >= r.lvl;
  const rewards = [
    { i: "🎁", t: "Коробка-сюрприз", c: 200, lvl: 5, unlocked: true },
    { i: "🧘🏼‍♀️", t: "Персональная медитация", c: 500, lvl: 6, unlocked: true },
    { i: "📚", t: "Скидка на премиум-курс", c: 800, lvl: 7, unlocked: true },
    { i: "🏃🏼‍♀️", t: "Звонок с коучем (30 мин)", c: 1500, lvl: 9, unlocked: false },
    { i: "🎯", t: "Свой командный вызов", c: 2500, lvl: 10, unlocked: false },
    { i: "✨", t: "Пожизненный AI Pro", c: 5000, lvl: 12, unlocked: false },
  ];
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Уровни" onBack={() => navigate("home")} />
      {/* Level hero — yellow gradient is brand, fixed across themes */}
      <div style={{ background: "linear-gradient(135deg,#FEDE34,#EF9F14)", borderRadius: 22, padding: 22, color: "#0a0a0a", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, background: "radial-gradient(circle, rgba(255,255,255,0.4), transparent 70%)" }}/>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 700, opacity: 0.7 }}>Текущий уровень</div>
          <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: "-2px", lineHeight: 1, marginTop: 6 }}>{lvl}</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{titleFor(lvl)}</div>
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
            <span style={{ color: r.infl ? "#2f8fd6" : "#E0A500", fontWeight: 700 }}>{r.v} XP</span>
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
          <div style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0, display: "grid", placeItems: "center", background: "linear-gradient(135deg,#FEDE34,#EF9F14)", boxShadow: "0 7px 18px rgba(254,222,52,0.34)" }}>
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
            <span style={{ fontWeight: 700, color: "#E0A500" }}>+10 XP</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5, marginTop: 7 }}>
            <span className="bos-sys-text-2">Привычка с другом</span>
            <span style={{ fontWeight: 800, color: "#E0A500" }}>+15 XP</span>
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
              <span style={{ display: "block", height: "100%", width: Math.min(100, Math.max(6, (invited - prevMileN) / (nextMile.n - prevMileN) * 100)) + "%", background: "linear-gradient(90deg,#FEDE34,#EF9F14)", borderRadius: 999 }} />
            </div>
            <div className="bos-sys-text-3" style={{ fontSize: 12.5, marginTop: 8, lineHeight: 1.45 }}>
              Ещё <b style={{ color: "var(--text-2)" }}>{nextMile.n - invited}</b> — и получишь <b style={{ color: "#E0A500" }}>+{nextMile.bonus} XP</b> разом.
            </div>
          </div>
        ) : (
          <div className="bos-sys-text-3" style={{ fontSize: 12.5, marginTop: 14, lineHeight: 1.45 }}>
            Круг можно растить бесконечно — и каждый новый друг приносит тебе <b style={{ color: "#E0A500" }}>+150 XP</b>.
          </div>
        )}

        <button onClick={() => openSheet(<ShareAppSheetLive dark={isDark} />)} className="tap" style={{ width: "100%", marginTop: 14, background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff", border: 0, borderRadius: 999, padding: 12, fontSize: 14.5, fontWeight: 600 }}>Пригласить друга</button>
      </SysCard>

      <div className="section-label" style={{ marginTop: 22 }}>Достижения</div>
      <SysCard className="tap" onClick={() => navigate("achievements", { from: "levels" })} style={{ padding: 14, marginTop: 8, display: "flex", alignItems: "center", gap: 13, cursor: "pointer" }}>
        <span className="bos-sys-chip-bg" style={{ width: 44, height: 44, borderRadius: 14, display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>🏅</span>
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
      <SysCard style={{ padding: 16, marginTop: 22, display: "flex", alignItems: "center", gap: 14, borderRadius: 22 }}>
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
            <span className="bos-sys-chip-bg" style={{ width: 42, height: 42, borderRadius: 14, display: "grid", placeItems: "center", fontSize: 22 }}>{r.i}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{r.t}</div>
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

/* ─── COURSE DETAIL — full programme description. No demo branches; faithful fork. ─── */
function CourseDetailLive() {
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
      <div style={{ background: "var(--card)", borderRadius: 22, padding: "22px 20px 20px", boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ width: 58, height: 58, borderRadius: "50%", background: c.accent, display: "grid", placeItems: "center", fontSize: 28, flexShrink: 0 }}>{c.i}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, padding: "2px 8px", background: "var(--card-2)", borderRadius: 999, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>{c.lvl}</span>
            </div>
            <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 26, lineHeight: 1.15, letterSpacing: "-0.4px", marginTop: 6, fontWeight: 600, color: "var(--text)" }}>{c.t}</div>
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
          <div key={i} style={{ background: "var(--card)", borderRadius: 22, padding: 14, boxShadow: "var(--card-shadow)" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--card-2)", display: "grid", placeItems: "center", fontSize: 18, marginBottom: 8 }}>{it.i}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{it.t}</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 3, lineHeight: 1.45 }}>{it.b}</div>
          </div>
        ))}
      </div>

      {/* COACH */}
      <div className="section-label" style={{ marginTop: 22, padding: "0 4px" }}>Твой коуч</div>
      <div style={{ marginTop: 8, background: "var(--card)", borderRadius: 22, padding: 16, boxShadow: "var(--card-shadow)", display: "flex", gap: 14, alignItems: "center" }}>
        <AvatarStack people={[{ name: "Марк Халверсон", initials: "МХ", color: "#d4b8e8" }]} size={52} max={1} label={false}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Марк Халверсон</div>
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
          <button onClick={() => { setEnrolled(true); if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} } }} className="tap" style={{ background: "var(--card)", color: "#0a0a0a", border: 0, borderRadius: 999, padding: "12px 18px", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
            Записаться <I.ChevronRight size={14}/>
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── TEAM CHAT — one shared chat for the whole team: messages + photos, in the
   flow of doing the goal together. LIVE only, so `live` is always true: the
   demo/fresh SEED conversation (and its emoji-placeholder Photo path) is gone.
   A cloud-linked team gets the REAL shared+realtime chat; a not-yet-synced local
   team keeps the per-team persisted history (survives reloads). ─── */
function TeamChatLive() {
  const { navigate, params } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  const isDark = app?.themeOverride === "dark";
  const team = params?.team || { _id: "seed-1", name: "Команда создателей", emblem: "✨", members: [] };
  // D4 — a cloud-linked team gets the REAL shared+realtime chat; a local-only team
  // (no cloudId yet) keeps the local persisted behaviour below.
  const cloud = (window.bosCloud && window.bosCloud.enabled() && team.cloudId) ? window.bosCloud : null;
  const cloudId = cloud ? team.cloudId : null;
  const memberMapRef = React.useRef({});
  const myUidRef = React.useRef(null);
  const chatKey = "bos:chat:" + (app?.persistId || "live:local") + ":" + (team._id || team.name || "team");
  // Cloud chat hydrates from the server (below). A local team restores saved
  // history (or starts empty). No demo SEED here — this screen is live-only.
  const [msgs, setMsgs] = useCS(function () {
    if (cloudId) return [];
    try { var raw = localStorage.getItem(chatKey); if (raw) return JSON.parse(raw); } catch (e) {}
    return [];
  });
  const [text, setText] = useCS("");
  const scrollRef = React.useRef(null);
  const fileRef = React.useRef(null);
  // Persist every change under the real profile — messages & photos survive
  // reloads and reopening the chat. On a full localStorage quota, drop the oldest
  // photos (keep all text) rather than failing the save.
  React.useEffect(function () {
    if (cloudId) return; // cloud chat lives on the server, not localStorage
    try { localStorage.setItem(chatKey, JSON.stringify(msgs)); }
    catch (e) {
      try { localStorage.setItem(chatKey, JSON.stringify(msgs.filter(function (m) { return !m.img; }))); } catch (e2) {}
    }
  }, [msgs, chatKey, cloudId]);
  // Pin to the latest message by scrolling the chat's OWN container — NOT
  // scrollIntoView, which bubbles up and yanked the page mid open-transition.
  React.useLayoutEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs.length]);
  const myName = app?.userName || "Вы";
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

  // Real member count for the header — from the loaded roster, never a fabricated «4».
  const [memberCount, setMemberCount] = React.useState(null);
  // D4 — cloud chat: load the roster + history, then live-subscribe to new messages.
  React.useEffect(() => {
    if (!cloudId) return;
    let on = true, unsub = function () {};
    cloud.uid().then((u) => { myUidRef.current = u; });
    cloud.teamMembers(cloudId).then((mem) => {
      const map = {};
      (mem || []).forEach((m) => { map[m.id] = { name: m.name || "Участник", avatar: m.avatar, c: bosUserColor(m.id) }; });
      memberMapRef.current = map;
      if (on) setMemberCount((mem || []).length);
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
  // Real photos only — the demo emoji-placeholder Photo path (m.photo) is gone.
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
          right={(() => { const n = memberCount != null ? memberCount : (team.members && team.members.length); return n ? <span style={{ fontSize: 12, color: "var(--text-4)", whiteSpace: "nowrap" }}>{n} 👥</span> : null; })()} />
      </div>

      <div ref={scrollRef} className="screen-scroll" style={{ flex: 1, minHeight: 0, padding: "2px 14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {msgs.length === 0 ? (
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
            <div style={{ maxWidth: "78%", background: mineBubble, color: mineText, borderRadius: "18px 18px 5px 18px", padding: m.img ? 8 : "9px 13px" }}>
              {m.img ? <RealPhoto src={m.img} cap={m.cap} light/> : <div style={{ fontSize: 14.5, lineHeight: 1.4 }}>{m.t}</div>}
              <div style={{ fontSize: 10, opacity: 0.55, textAlign: "right", marginTop: 3 }}>{m.time}</div>
            </div>
          </div>
        ) : (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            {typeof BuddyFaceLive === "function"
              ? <BuddyFaceLive avatar={m.avatar} name={m.who} size={30} />
              : <span style={{ width: 30, height: 30, borderRadius: "50%", background: m.c, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, color: "rgba(0,0,0,0.55)", flexShrink: 0 }}>{(m.who || "?")[0]}</span>}
            <div style={{ maxWidth: "78%", background: otherBubble, borderRadius: "18px 18px 18px 5px", padding: m.img ? 8 : "9px 13px", boxShadow: isDark ? "none" : "0 1px 2px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: m.img ? 4 : 2 }}>{m.who}</div>
              {m.img ? <RealPhoto src={m.img} cap={m.cap}/> : <div style={{ fontSize: 14.5, lineHeight: 1.4, color: "var(--text)" }}>{m.t}</div>}
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
          style={{ flex: 1, minWidth: 0, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(120,120,128,0.10)", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.05)", borderRadius: 22, padding: "10px 15px", fontSize: 16, color: "var(--text)", outline: "none", lineHeight: 1.3 }} />
        <button onClick={send} className="tap" aria-label="Отправить" style={{ width: 38, height: 38, borderRadius: "50%", background: text.trim() ? "#FEDE34" : (isDark ? "rgba(255,255,255,0.10)" : "rgba(120,120,128,0.18)"), border: 0, display: "grid", placeItems: "center", flexShrink: 0, transition: "background 0.2s, transform 0.2s", transform: text.trim() ? "scale(1)" : "scale(0.94)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={text.trim() ? "#0a0a0a" : "var(--text-4)"} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>
        </button>
      </div>
    </div>
  );
}

/* CONTACT DETAIL — public profile of a network member with their social-impact
   history, reviews, and bookable offers. No demo branches; faithful fork (reads its
   contact from useNav().params), with the iOS-Headline typography polish. */
function ContactDetailLive() {
  const { navigate, params } = useNav();
  const { open: openSheet } = useSheet();
  const app = useApp();
  const [booked, setBooked] = useCS({}); // booked offers (by index)
  const [added, setAdded] = useCS(false);
  // YOUR real level (was a hardcoded 8) so an offer's lock reflects actual XP.
  const userLevel = bosLevelInfoLive(bosLiveXPLive(app)).level;
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
          <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 14, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Вклад</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.4px", marginTop: 2 }}>{p.impact.toLocaleString()}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 14, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Рейтинг</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 2 }}>
              <span style={{ fontSize: 19, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.4px" }}>{rating}</span>
              <span style={{ fontSize: 11, color: "var(--text-4)" }}>★ · {ratingsCount}</span>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 14, padding: "10px 12px" }}>
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
                background: "var(--card)", borderRadius: 22, padding: 14,
                display: "flex", alignItems: "center", gap: 12,
                boxShadow: "var(--card-shadow)",
                opacity: locked ? 0.55 : 1,
              }}>
                <span style={{ width: 42, height: 42, borderRadius: 14, background: "var(--card-2)", display: "grid", placeItems: "center", fontSize: 21, flexShrink: 0 }}>{o.i}</span>
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
        <div style={{ background: "var(--card)", borderRadius: 22, boxShadow: "var(--card-shadow)", overflow: "hidden" }}>
          {history.map((h, j) => (
            <div key={j} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderTop: j === 0 ? 0 : "1px solid var(--line)" }}>
              <span style={{ width: 32, height: 32, borderRadius: 14, background: "var(--card-2)", display: "grid", placeItems: "center", fontSize: 16, flexShrink: 0 }}>{h.i}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", letterSpacing: -0.1 }}>{h.t}</div>
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
            <div key={j} style={{ background: "var(--card)", borderRadius: 22, padding: 14, boxShadow: "var(--card-shadow)" }}>
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

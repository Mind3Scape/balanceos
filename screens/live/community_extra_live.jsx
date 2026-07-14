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
  const [accent, setAccent] = useCS(preset?.accent || "#0a0a0a");   // «Стандарт» (графит-нейтраль) по умолчанию; чип-пресет перекрывает
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
    { id: "streak",     e: "🔥", t: "Серия у каждого",  d: "Каждый держит серию — засчитывается, только если прошли все.", example: `напр. все держат серию ${duration === "week" ? 7 : duration === "month" ? 21 : 60} дней` },
    // «Гонка» (race) ВРЕМЕННО убрана из пикера (David: «может вернём позже»). Логика гонки в
    // community_live.jsx цела → вернуть = раскомментировать строку обратно.
    // { id: "race",    e: "🏁", t: "Гонка",              d: "Бок о бок — первый до цели побеждает, остальные получают часть XP.",  example: `напр. первый до ${target} ${unit}` },
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

  const emblemChoices = TEAM_EMBLEMS;

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Совместная цель" onBack={() => navigate("community")} />

      {/* IDENTITY — как в привычках/целях: БЕЛАЯ карточка + СТЕКЛО-плитка, КРАСЯЩАЯСЯ выбранным тоном,
          + единый цвет-пикер (David: «в миссии тоже меняй цвет стекла под иконкой, как в привычках»).
          Дефолт-серый/чёрный → нейтральная плитка; выбрал Apple-цвет → плитка заливается им. */}
      <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 14, marginTop: 8, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button" data-haptic="selection" onClick={() => openSheet(<EmojiPickerLive onPick={setEmblem} current={emblem} accent={accent} />)} className="tap" aria-label="Сменить иконку"
            style={{ width: 56, height: 56, borderRadius: 16, background: (accent && accent !== BOS_GREY && ("" + accent).toLowerCase() !== "#0a0a0a") ? accent + "26" : "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 28, flexShrink: 0, border: 0, cursor: "pointer", transition: "background 0.2s" }}>{bosIcon(emblem, 28, accent)}</button>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Название цели"
            style={{ flex: 1, minWidth: 0, fontSize: 20, fontWeight: 700, color: "var(--text)", border: 0, outline: 0, background: "transparent", padding: 0, letterSpacing: "-0.4px" }} />
        </div>
        {typeof BosColorPickerLive === "function" && <BosColorPickerLive value={accent} onChange={setAccent} />}
      </div>

      {/* SHARED GOAL — без подписи (карточки режима сами объясняют). */}
      <div data-tour="team-modes" style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 22 }}>
        {goalTypes.map(gt => {
          const active = goalType === gt.id;
          return (
            <button key={gt.id} onClick={() => setGoalType(gt.id)} className="tap"
              style={{
                background: "var(--card)", border: active ? "2px solid #0a0a0a" : "1px solid rgba(0,0,0,0.05)",
                borderRadius: 22, padding: 14, display: "flex", alignItems: "center", gap: 12,
                textAlign: "left", boxShadow: "var(--card-shadow)",
              }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: active ? "#0a0a0a" : "#e8e8e8", color: active ? "#fff" : "var(--text)", display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0 }}>{gt.icon ? React.createElement(gt.icon, { size: 19, color: active ? "#fff" : "#0a0a0a", strokeWidth: 1.9 }) : gt.e}</div>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Цель</div>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={target}
                onChange={e => setTarget(parseInt(e.target.value.replace(/\D/g,"")) || 0)}
                style={{ width: "100%", fontSize: 28, fontWeight: 700, color: "var(--text)", border: 0, outline: 0, background: "transparent", padding: 0, marginTop: 2 }}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Единица</div>
              <div style={{ marginTop: 4 }}><BosUnitSelectLive value={unit} onChange={setUnit} /></div>
            </div>
          </div>
        )}
      </div>

      {/* Linked habits — drive the count */}
      <div style={{ background: "var(--card)", borderRadius: 22, padding: 16, marginTop: 10, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: "var(--text-2)", fontWeight: 500, lineHeight: 1.4 }}>Двигать цель привычками</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.5 }}>Каждая отметка участника по общей привычке двигает цель на +1 — закрываете её вместе.</div>
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

      {/* DURATION & VISIBILITY — без подписей блоков. */}
      <div style={{ marginTop: 22 }}><DurationPicker value={duration} onChange={setDuration}/></div>

      <div style={{ marginTop: 14 }}>
        <Segmented value={vis} onChange={setVis} options={[
          {value:"private",label:"Приватная"},{value:"public",label:"Публичная"}
        ]} />
      </div>

      {/* STAKES — optional XP wager, без подписи (внутри «Все ставят XP»). */}
      <div data-tour="team-stakes" style={{ background: "var(--card)", borderRadius: 22, padding: 16, marginTop: 22, boxShadow: "var(--card-shadow)" }}>
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

      {/* INVITE MEMBERS — без подписи блока. */}
      <div style={{ background: "var(--card)", borderRadius: 22, padding: 16, marginTop: 22, boxShadow: "var(--card-shadow)" }}>
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
              <BuddyFaceLive avatar={p.avatar} name={p.name} size={22} />
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
          name: name.trim() || "Совместная цель",
          emblem, accent, vis, // private / public — preserved from the toggle above
          goal: goalTitle || (target + " " + unit),
          type: goalType, // collective | streak | race — store the MODE locally too (was cloud-only → detail couldn't show it)
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
      }}>{saving ? "Создаём…" : "Создать совместную цель"}</button>
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
  // Откуда пользователь пришёл в круг — тянется сквозь (деталь → карандаш → сюда):
  // возврат/сохранение/удаление ведут обратно в его контекст, не в «Сообщество».
  const backFrom = params?.from || "habits";
  const [name, setName] = useCS(team.name || "");
  const [emblem, setEmblem] = useCS(team.emblem || "✨");
  const [accent, setAccent] = useCS(team.accent || "#0a0a0a");
  const [goal, setGoal] = useCS(team.goal || "");
  const [priv, setPriv] = useCS(team.vis !== "public");
  const [notify, setNotify] = useCS(team.notify !== false);
  const [members, setMembers] = useCS(team.members || []);
  // GOAL CONFIG — now editable here too (was create-only → «не все режимы связаны»).
  const [goalType, setGoalType] = useCS(team.type || "collective"); // collective | streak | race
  const [target, setTarget] = useCS(team.target || 0);
  const [unit, setUnit] = useCS(team.unit || "дел");
  const [stakes, setStakes] = useCS((team.stake || 0) > 0);
  const [stakeAmount, setStakeAmount] = useCS(team.stake || 100);
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
  const removeMember = (i) => setMembers(ms => ms.filter((_, j) => j !== i));
  const save = () => {
    if (saving) return;
    setSaving(true);
    if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
    const stakeVal = stakes ? (Number(stakeAmount) || 0) : 0;
    const tgt = Number(target) || 0;
    const goalText = goal.trim() || team.goal;
    const patch = { name: name.trim() || team.name, emblem, accent, goal: goalText, vis: priv ? "private" : "public", notify, members, type: goalType, target: tgt, unit, stake: stakeVal };
    app?.updateTeam(team._id, patch);
    // Persist the goal CONFIG + meta to the cloud (new updateTeam) so the mode/target/ставка
    // survive a reload and feed teamGoalProgress for everyone — was local-only («бутафорски»).
    try {
      if (team.cloudId && window.bosCloud && window.bosCloud.enabled() && window.bosCloud.updateTeam) {
        window.bosCloud.updateTeam(team.cloudId, { name: patch.name, emblem, accent, vis: patch.vis, goalKind: goalText, goalTarget: tgt, goal: { type: goalType, target: tgt, unit, title: goalText, stake: stakeVal, accent } });
      }
    } catch (e) {}
    setTimeout(() => navigate("team-detail", { team: { ...team, ...patch }, from: backFrom }), 300);
  };
  // This screen is owner-only (gated by the gear), so deleting goes through the cloud
  // deleteTeam + a confirm sheet (was a silent local-only removeTeam).
  const del = () => bosConfirmExitTeam({ app, team, isOwner: true, navigate, openSheet, returnTo: backFrom });
  const card = { background: "var(--card, #fff)", borderRadius: 22, marginTop: 8, boxShadow: "var(--card-shadow)" };
  const goalTypes = [
    // Монохромные SVG-иконки режимов (David: «все системные модики чёрно-белые SVG»): счёт=столбики, серия=пламя.
    { id: "collective", icon: I.ChartBar, t: "Общий счёт", d: "Отметки всех складываются в одно число." },
    { id: "streak",     icon: I.Flame,    t: "Серия у каждого", d: "Каждый держит серию — засчитывается, только если прошли все." },
    // «Гонка» временно скрыта (David: «может вернём позже») — вернуть = раскомментировать.
    // { id: "race",    e: "🏁", t: "Гонка", d: "Бок о бок — первый до цели побеждает, остальные получают часть XP." },
  ];
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Настройки цели" onBack={() => navigate("team-detail", { team, from: backFrom })} />

      {/* IDENTITY — тот же вид, что «Создать команду»: БЕЛАЯ карточка + СТЕКЛО-плитка, красящаяся тоном,
          + единый цвет-пикер (David: создание и редактирование = одна логика; «как в привычках»). */}
      <div style={{ background: "var(--card, #fff)", borderRadius: 22, padding: 14, marginTop: 8, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button" data-haptic="selection" onClick={() => openSheet(<EmojiPickerLive onPick={setEmblem} current={emblem} accent={accent} />)} className="tap" aria-label="Сменить иконку"
            style={{ width: 56, height: 56, borderRadius: 16, background: (accent && accent !== BOS_GREY && ("" + accent).toLowerCase() !== "#0a0a0a") ? accent + "26" : "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 28, flexShrink: 0, border: 0, cursor: "pointer", transition: "background 0.2s" }}>{bosIcon(emblem, 28, accent)}</button>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Название цели"
            style={{ flex: 1, minWidth: 0, fontSize: 20, fontWeight: 700, color: "var(--text)", border: 0, outline: 0, background: "transparent", padding: 0, letterSpacing: "-0.4px" }} />
        </div>
        {typeof BosColorPickerLive === "function" && <BosColorPickerLive value={accent} onChange={setAccent} />}
      </div>

      {/* GOAL — режим + цель, ТА ЖЕ логика и вид, что в «Создать команду» (David: связать создание↔настройки). */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 22 }}>
        {goalTypes.map(gt => {
          const active = goalType === gt.id;
          return (
            <button key={gt.id} onClick={() => setGoalType(gt.id)} className="tap"
              style={{ background: "var(--card)", border: active ? "2px solid #0a0a0a" : "1px solid rgba(0,0,0,0.05)", borderRadius: 22, padding: 14, display: "flex", alignItems: "center", gap: 12, textAlign: "left", boxShadow: "var(--card-shadow)" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: active ? "#0a0a0a" : "#e8e8e8", color: active ? "#fff" : "var(--text)", display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0 }}>{gt.icon ? React.createElement(gt.icon, { size: 19, color: active ? "#fff" : "#0a0a0a", strokeWidth: 1.9 }) : gt.e}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{gt.t}</div>
                <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.45 }}>{gt.d}</div>
              </div>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: active ? "#0a0a0a" : "transparent", border: active ? "0" : "1.5px solid var(--text-5)", flexShrink: 0, display: "grid", placeItems: "center" }}>
                {active && <I.Check size={11} color="#fff" strokeWidth={3}/>}
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ background: "var(--card)", borderRadius: 22, padding: 16, marginTop: 10, boxShadow: "var(--card-shadow)" }}>
        <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Чего вы хотите</div>
        <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="50 добрых дел"
          style={{ width: "100%", fontSize: 19, fontWeight: 600, color: "var(--text)", border: 0, outline: 0, padding: "8px 0 12px", background: "transparent", borderBottom: goalType !== "streak" ? "1px solid var(--line)" : "0" }} />
        {goalType !== "streak" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Цель</div>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={target}
                onChange={e => setTarget(parseInt(e.target.value.replace(/\D/g,"")) || 0)}
                style={{ width: "100%", fontSize: 28, fontWeight: 700, color: "var(--text)", border: 0, outline: 0, background: "transparent", padding: 0, marginTop: 2 }}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Единица</div>
              <div style={{ marginTop: 4 }}><BosUnitSelectLive value={unit} onChange={setUnit} /></div>
            </div>
          </div>
        )}
      </div>

      {/* VISIBILITY — Segmented, без подписи. */}
      <div style={{ marginTop: 14 }}>
        <Segmented value={priv ? "private" : "public"} onChange={(v) => setPriv(v === "private")} options={[
          { value: "private", label: "Приватная" }, { value: "public", label: "Публичная" }
        ]} />
      </div>

      {/* NOTIFICATIONS — без подписи (внутри «Когда участники отмечаются»). */}
      <div style={{ background: "var(--card)", borderRadius: 22, padding: 16, marginTop: 14, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: "var(--text-2)", fontWeight: 500 }}>Когда участники отмечаются</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.5 }}>Тихий пуш, когда кто-то закрыл общую привычку.</div>
          </div>
          <Switch on={notify} onChange={setNotify} />
        </div>
      </div>

      {/* STAKES — без подписи (внутри «Все ставят XP»). */}
      <div style={{ background: "var(--card)", borderRadius: 22, padding: 16, marginTop: 14, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: "var(--text-2)", fontWeight: 500 }}>Все ставят XP</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2, lineHeight: 1.5 }}>Дойдёте до цели — банк вернётся вдвое больше. Не дойдёте — ставки сгорают.</div>
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
              <span>{members.length} {members.length === 1 ? "участник" : "участников"}</span>
              <span style={{ fontWeight: 700, color: "var(--text)" }}>банк {stakeAmount * Math.max(1, members.length)} XP</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ ...card, padding: "8px 16px", marginTop: 14 }}>
        {members.map((m, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
            <BuddyFaceLive avatar={m.avatar} name={m.name} size={36} />
            <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{m.name}</div>
            <button onClick={() => removeMember(i)} className="tap" aria-label="Убрать" style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface-3)", border: 0, color: "var(--text-3)", fontSize: 17, lineHeight: 1 }}>×</button>
          </div>
        ))}
        {members.length === 0 && <div style={{ fontSize: 13, color: "var(--text-4)", padding: "6px 0" }}>Пока никого. Пригласи друзей ниже.</div>}
      </div>
      {/* Demo's SUGGEST invite chips (gated `app?.mode !== "live"`) are gone — live invites
          everyone through the real referral link below. */}
      {/* SHARE — в блоке, как всё остальное (David: «кнопка поделиться выбивается»). Telegram team
          deep-link (t.me/<bot>?startapp=team_<cloudId>) — тот же, что у TeamShareSheetLive. */}
      {team.cloudId && (<>
        <div style={{ background: "var(--card)", borderRadius: 22, padding: 16, marginTop: 14, boxShadow: "var(--card-shadow)" }}>
          <div style={{ fontSize: 12, color: "var(--text-4)", lineHeight: 1.45, marginBottom: 12 }}>Пришли ссылку — друг откроет цель в Telegram и присоединится к общей цели. Вы будете видеть прогресс друг друга.</div>
          <button onClick={() => {
            var link = (typeof bosTeamInviteLink === "function") ? bosTeamInviteLink(team.cloudId) : ("https://t.me/BalanceOS8_bot?startapp=team_" + team.cloudId);
            var text = "Вести привычки вместе — веселее, и вы видите прогресс друг друга ✨ Присоединяйся к цели «" + (team.name || "") + "» в BalanceOS";
            if (window.bosShare) window.bosShare(link, text);
            else { try { navigator.clipboard.writeText(link); } catch (e) {} }
            if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
          }} className="tap" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 999, background: "var(--cta, #0a0a0a)", color: "var(--cta-ink, #fff)", border: 0, fontSize: 13.5, fontWeight: 600 }}>
            <I.Share size={15}/> Пригласить по ссылке
          </button>
        </div>
      </>)}

      <button className="bos-btn" disabled={saving} style={{ marginTop: 20, opacity: saving ? 0.65 : 1 }} onClick={save}>{saving ? "Сохраняем…" : "Сохранить"}</button>
      <button onClick={del} className="tap" style={{ width: "100%", background: "transparent", border: 0, color: "var(--accent-red)", padding: 14, marginTop: 6, fontSize: 15, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
        <I.Trash size={17}/> Удалить цель
      </button>
    </div>
  );
}

/* TeamQuickEditSheetLive УДАЛЕНА (David: «отдельная урезанная шторка правки круга лишняя, унифицировать»).
   Карандаш в комнате круга (community_live) теперь открывает ОБЩУЮ GoalFormSheetLive (habits_extra) с
   __isTeam-маппингом — та же шторка, что у обычной цели: save=updateTeam, delete=выход/удаление круга,
   ссылка «Участники и роли →» → team-settings. */

/* LIVE fork of the «add team habit» sheet — uses OUR standard icon picker (EmojiPickerLive:
   эмодзи/символы/палитра), like creating a personal habit, instead of the core sheet's cramped
   12-emoji row (David: «выбор эмодзи не по нашим стандартам — посмотри как делаем привычки»).
   One-sheet host → picker is an in-place SECOND view (form ↔ picker), not a nested sheet.
   Demo keeps the core TeamHabitSheet untouched. */
function TeamHabitSheetLive({ team, members = [], onAdd }) {
  const { close } = useSheet();
  const [view, setView] = useCS("form");
  const [emoji, setEmoji] = useCS("🙏");
  const [name, setName] = useCS("");
  const [movesGoal, setMovesGoal] = useCS(true);
  const [isMain, setIsMain] = useCS(false);
  const [count, setCount] = useCS(1); // НОРМА по умолчанию (раз/день) — тренер задаёт, каждый поправит у себя
  const [picked, setPicked] = useCS(() => members.map((_, i) => i));
  const toggleMember = (i) => setPicked(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);
  const participants = members.filter((_, i) => picked.includes(i)).map(m => ({ name: m.name, initials: m.initials, color: m.color, avatar: m.avatar }));
  const save = () => {
    onAdd && onAdd({ emoji, name: name.trim() || "Новая привычка", isMain, movesGoal, goalPerDay: Math.max(1, count), participants, total: Math.max(1, participants.length || members.length || 1) });
    close();
  };
  if (view === "picker") {
    return (
      <div style={{ padding: "2px 8px 8px", color: "var(--text)" }}>
        <EmojiPickerLive embedded current={emoji} onPick={(e) => { setEmoji(e); setView("form"); }} />
        <button className="tap" onClick={() => setView("form")} style={{ width: "100%", marginTop: 4, background: "transparent", border: 0, color: "var(--text-3)", padding: 12, fontSize: 14.5, fontWeight: 600, cursor: "pointer" }}>Назад</button>
      </div>
    );
  }
  return (
    <div style={{ padding: "2px 20px 8px", color: "var(--text)" }}>
      {/* Единая шапка форм-шторок: ✕ слева, ✓ справа (David: «стандартизировать везде»). */}
      {typeof SheetFormHeadLive === "function"
        ? <SheetFormHeadLive title="Общая привычка" onClose={close} onDone={save} />
        : <div style={{ textAlign: "center", fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>Новая общая привычка</div>}
      <div style={{ textAlign: "center", fontSize: 13.5, color: "var(--text-3)", marginTop: 2 }}>Общая для всех в «{team?.name || "цели"}»</div>
      {/* Идентичность — иконка (тап → пикер) + имя в ОДНОМ блоке (David: «не отдельно сменить иконку и
          название ниже»), как карточка создания личной привычки. */}
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12, background: "var(--surface-3)", borderRadius: 16, padding: 10 }}>
        <button type="button" data-haptic="selection" onClick={() => setView("picker")} className="tap"
          style={{ width: 48, height: 48, borderRadius: 14, background: BOS_TILE_SHEEN + ", var(--card)", boxShadow: bosTileGlass(false), display: "grid", placeItems: "center", fontSize: 24, flexShrink: 0, border: 0, cursor: "pointer" }}>{bosIcon(emoji, 24, null)}</button>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Название привычки" aria-label="Название привычки"
          style={{ flex: 1, minWidth: 0, border: 0, outline: "none", background: "transparent", fontSize: 17, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px", padding: "6px 0" }} />
      </div>
      {/* НОРМА по умолчанию — компактный выбор количества для тренера. Копируется участнику как
          его личная норма, которую он МОЖЕТ поправить под себя (30/50). David. */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "var(--surface-3)", borderRadius: 14, padding: "11px 14px", marginTop: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5 }}>{count} {count === 1 ? "раз" : "раз(а)"} в день</div>
          <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 1 }}>Норма по умолчанию — каждый поправит под себя</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={() => setCount(Math.max(1, count - 1))} className="tap hit44" style={{ width: 32, height: 32, borderRadius: 999, background: "var(--card)", border: 0, display: "grid", placeItems: "center", color: "var(--text-2)" }}><I.Minus size={16} strokeWidth={2.4} /></button>
          <button onClick={() => setCount(count + 1)} className="tap hit44" style={{ width: 32, height: 32, borderRadius: 999, background: "var(--card)", border: 0, display: "grid", placeItems: "center", color: "var(--text-2)" }}><I.Plus size={16} strokeWidth={2.4} /></button>
        </div>
      </div>
      {members.length > 0 && (<>
        <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, margin: "18px 0 8px" }}>Участвуют</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {members.map((m, i) => {
            const on = picked.includes(i);
            return (
              <button key={i} onClick={() => toggleMember(i)} className="tap" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px 5px 5px", borderRadius: 999, background: on ? "#0a0a0a" : "var(--surface-3)", color: on ? "#fff" : "var(--text-3)", border: 0, fontSize: 12, fontWeight: 500 }}>
                <BuddyFaceLive avatar={m.avatar} name={m.name} size={22} />
                {m.name}{on && <I.Check size={12} strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </>)}
      <div style={{ background: "var(--surface-3)", borderRadius: 14, padding: "2px 14px", marginTop: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5 }}>Двигает общую цель</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 1 }}>Отметка участника = +1 к общей цели</div>
          </div>
          <Switch small on={movesGoal} onChange={setMovesGoal} />
        </div>
        <div style={{ height: 1, background: "var(--line)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5 }}>Сделать главной</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 1 }}>Станет «якорем» цели</div>
          </div>
          <Switch small on={isMain} onChange={setIsMain} />
        </div>
      </div>
      {/* Нижней кнопки НЕТ — сохранение через «✓» в шапке (единый язык форм-шторок). */}
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
  // Копилка (кошелёк) = заработано − потрачено. Уровень (hero) считается от ПОЛНОГО _xpLive, и трата его
  // НЕ трогает (David). Плейсхолдер-список «Награды за XP» убран — теперь трата идёт на ПАРТНЁРОВ (живое).
  const credits = (typeof bosLiveSpendableXPLive === "function") ? bosLiveSpendableXPLive(app) : _xpLive;
  const netLeft = Math.max(0, 10 - lvl); // Нетворк открывается с 10 уровня
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

      {/* КОПИЛКА — кошелёк, крупно и со СМЫСЛОМ: отдельная от уровня валюта, её ТРАТЯТ на живое
          (David: «человек понимал, что тратит экспу не чтобы уровень качать, а реально на вещи»). */}
      <SysCard style={{ padding: 18, marginTop: 16, borderRadius: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 52, height: 52, borderRadius: 16, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 26, background: "linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.06)" }}>🪙</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="bos-sys-text-3" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Копилка</div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-1px", lineHeight: 1, marginTop: 3 }}>{credits.toLocaleString()} <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-4)" }}>XP</span></div>
          </div>
        </div>
        <div className="bos-sys-text-3" style={{ fontSize: 12.5, marginTop: 13, lineHeight: 1.45 }}>
          Твоя валюта для <b style={{ color: "var(--text-2)" }}>живого</b> — трать на медитации, танцы, тренировки от партнёров ниже. <b style={{ color: "var(--text-2)" }}>Уровень от траты не падает</b> — он растёт сам.
        </div>
      </SysCard>

      {/* ПАРТНЁРЫ — на что потратить копилку (та же лента, что во «Найти»). */}
      <div style={{ marginTop: 22 }}>
        {typeof PartnersShowcaseLive === "function" && <PartnersShowcaseLive app={app} navigate={navigate} from="levels" />}
      </div>

      {/* НЕТВОРК — большой будущий разлок (с 10 уровня); партнёры выше доступны СРАЗУ (David). */}
      <SysCard style={{ padding: 16, marginTop: 22, display: "flex", alignItems: "center", gap: 13 }}>
        <span style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 22, background: "var(--surface-3)" }}>{netLeft > 0 ? "🔒" : "🌐"}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Нетворк{netLeft > 0 ? " · с 10 уровня" : ""}</div>
          <div className="bos-sys-text-3" style={{ fontSize: 12.5, marginTop: 2, lineHeight: 1.4 }}>
            {netLeft > 0 ? <>Живые созвоны и менторы за XP. Ещё <b style={{ color: "var(--text-2)" }}>{netLeft} {ruPpl(netLeft, ["уровень", "уровня", "уровней"])}</b>.</> : "Открыт — живые созвоны и менторы за XP."}
          </div>
        </div>
        {netLeft <= 0 && <button onClick={() => { app?.setCommunityView?.({ section: "community", commTab: "network" }); navigate("community"); }} className="tap" style={{ background: "var(--cta, #0a0a0a)", color: "var(--cta-ink, #fff)", border: 0, borderRadius: 999, padding: "9px 15px", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>Открыть</button>}
      </SysCard>

      {/* КАК РАСТЁТ УРОВЕНЬ — один компактный справочник (без дублей) + позвать друга. */}
      <SysCard style={{ padding: 14, marginTop: 22 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)", padding: "0 0 4px" }}>Как растёт уровень</div>
        {[
          { t: "Выполнить привычку", v: "+10" },
          { t: "Идеальный день", v: "+30" },
          { t: "Серия 21 день", v: "+120" },
          { t: "Достичь цели", v: "+200" },
          { t: "Привести друга", v: "+150", infl: true },
        ].map((r, i, arr) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : 0, fontSize: 14 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>{r.infl && <span style={{ fontSize: 14 }}>🤝</span>}{r.t}</span>
            <span style={{ color: r.infl ? "#2f8fd6" : "#E0A500", fontWeight: 700 }}>{r.v} XP</span>
          </div>
        ))}
        <button onClick={() => openSheet(<ShareAppSheetLive dark={isDark} />)} className="tap" style={{ width: "100%", marginTop: 12, background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff", border: 0, borderRadius: 999, padding: 12, fontSize: 14.5, fontWeight: 600 }}>Пригласить друга · +150 XP</button>
      </SysCard>

      {/* Достижения — подпись убрана (карточка названа «Ачивки»). */}
      <SysCard className="tap" onClick={() => navigate("achievements", { from: "levels" })} style={{ padding: 14, marginTop: 22, display: "flex", alignItems: "center", gap: 13, cursor: "pointer" }}>
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

    </div>
  );
}

/* ─── COURSE DETAIL — full programme description. No demo branches; faithful fork. ─── */
function CourseDetailLive() {
  const { navigate, params } = useNav();
  const app = useApp();
  const [enrolled, setEnrolled] = useCS(false);
  const c = params?.course || { id: "marathon", i: "🏃🏼‍♀️", accent: "#d6f3df", t: "Марафон", d: "21-дневная программа устойчивых привычек.", price: "110 000 ₽", lvl: "База", length: "21 день", cohort: "1 — 21 мая" };
  // КУРС → КРУГ: записался → программа тренера падает к тебе — КРУГ (команда) в «Цели» + ПРАКТИКА
  // в «Привычки». courseId на круге = защита от дубля при повторном заходе. David: «вступление в курс
  // роняет практику+круг в Привычки». Зеркало GoalSettingsLive/TeamCreateLive (тот же движок круга).
  const alreadyEnrolled = enrolled || (app?.teams || []).some((t) => t.courseId === c.id);
  const enrollCourse = () => {
    if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
    const existing = (app?.teams || []).find((t) => t.courseId === c.id);
    if (existing) { navigate("team-detail", { team: existing }); return; } // уже записан → сразу в круг
    setEnrolled(true);
    const days = parseInt(String(c.length || "").replace(/\D/g, ""), 10) || 21;
    const practiceName = "Практика · " + c.t;
    const teamObj = {
      name: c.t, emblem: c.i, accent: "#0a0a0a", vis: "private", courseId: c.id,
      goal: days + " дней", type: "collective", target: days, current: 0, unit: "дней",
      stake: 0, date: c.cohort || "", progress: 0, members: [],
    };
    const nt = app?.addTeam(teamObj);                    // круг → сразу в «Целях» (работает офлайн)
    const personalHabit = { name: practiceName, emoji: c.i, color: null, days: [1, 1, 1, 1, 1, 1, 1], goalPerDay: 1, reminder: { on: false, time: "09:00" }, log: {} };
    let opened = false;
    try {
      if (nt && window.bosCloud && window.bosCloud.enabled()) {
        window.bosCloud.createTeam({ name: c.t, emblem: c.i, vis: "private", goalKind: teamObj.goal, goalTarget: days, goal: { type: "collective", target: days, unit: "дней", title: c.t } })
          .then(async (row) => {
            if (row && row.id) {
              if (app.updateTeam) app.updateTeam(nt._id, { cloudId: row.id });
              let th = null; try { th = await window.bosCloud.addTeamHabit(row.id, { name: practiceName, emoji: c.i, isMain: true }); } catch (e) {}
              app?.addHabit({ ...personalHabit, teamId: row.id, teamHabitId: th && th.id }); // практика как ЛИЧНАЯ, связана с кругом
            } else { app?.addHabit(personalHabit); }
            navigate("team-detail", { team: { ...nt, cloudId: row && row.id } });
          })
          .catch(() => { app?.addHabit(personalHabit); navigate("team-detail", { team: nt }); });
        opened = true;
      }
    } catch (e) {}
    if (!opened) { app?.addHabit(personalHabit); navigate("team-detail", { team: nt }); } // офлайн/превью
  };

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

      {/* PROGRAMME — подпись ВНУТРИ блока (David). */}
      <div style={{ marginTop: 22, background: "var(--card)", borderRadius: 22, overflow: "hidden", boxShadow: "var(--card-shadow)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)", padding: "14px 18px 2px" }}>Программа</div>
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

      {/* WHAT'S INCLUDED — подпись ВНУТРИ блока (full-width в гриде). */}
      <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ gridColumn: "1 / -1", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)", padding: "0 4px" }}>Что входит</div>
        {includes.map((it, i) => (
          <div key={i} style={{ background: "var(--card)", borderRadius: 22, padding: 14, boxShadow: "var(--card-shadow)" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--card-2)", display: "grid", placeItems: "center", fontSize: 18, marginBottom: 8 }}>{it.i}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{it.t}</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 3, lineHeight: 1.45 }}>{it.b}</div>
          </div>
        ))}
      </div>

      {/* COACH — подпись убрана (карточка коуча самоочевидна: имя + роль). */}
      <div style={{ marginTop: 22, background: "var(--card)", borderRadius: 22, padding: 16, boxShadow: "var(--card-shadow)", display: "flex", gap: 14, alignItems: "center" }}>
        <BuddyFaceLive name="Марк Халверсон" size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Марк Халверсон</div>
          <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>Коуч по привычкам · 1200+ выпускников</div>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 6, lineHeight: 1.5 }}>«Я строю коучинг для тех, кто ненавидит слово «коучинг». Просто появляйся — остальное сделаю я.»</div>
        </div>
      </div>

      {/* FAQ — подпись ВНУТРИ блока. */}
      <div style={{ marginTop: 22, background: "var(--card)", borderRadius: 22, overflow: "hidden", boxShadow: "var(--card-shadow)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-4)", padding: "14px 18px 2px" }}>FAQ</div>
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
        {alreadyEnrolled ? (
          <button onClick={() => { const ex = (app?.teams || []).find((t) => t.courseId === c.id); if (ex) navigate("team-detail", { team: ex }); }} className="tap" style={{ background: "rgba(52,199,89,0.18)", color: "#34C759", border: 0, borderRadius: 999, padding: "12px 18px", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <I.Check size={15} strokeWidth={3}/> Вы записаны
          </button>
        ) : (
          <button onClick={enrollCourse} className="tap" style={{ background: "var(--card)", color: "#0a0a0a", border: 0, borderRadius: 999, padding: "12px 18px", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
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
function TeamChatLive(props) {
  props = props || {};
  const { navigate, params } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  const isDark = app?.themeOverride === "dark";
  // embed=true → чат живёт ВНУТРИ вкладки «Чат» на экране цели (без своей шапки/полноэкранной
  // высоты). Иначе — как раньше: отдельный экран team-chat с PageHeader. Команда берётся из props
  // (встраивание) или из параметров навигации (отдельный экран).
  const embed = !!props.embed;
  const team = props.team || params?.team || { _id: "seed-1", name: "Команда создателей", emblem: "✨", members: [] };
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
    if (cloudId) {
      // Аудит #В2: не теряем сообщение при сбое сети — если не отправилось, ВОЗВРАЩАЕМ текст в
      // поле (только если юзер не начал печатать новое) + тактильная ошибка, а не тихо в никуда.
      cloud.sendMessage(cloudId, { text: v }).then((row) => {
        if (row) { absorb(row); return; }
        setText((cur) => cur ? cur : v);
        if (window.tgHaptic) { try { window.tgHaptic("error"); } catch (e) {} }
      }).catch(() => { setText((cur) => cur ? cur : v); if (window.tgHaptic) { try { window.tgHaptic("error"); } catch (e) {} } });
    } else push({ t: v });
  };
  const pickPhoto = () => { if (fileRef.current) fileRef.current.click(); };
  const onFile = (e) => {
    const file = e.target.files && e.target.files[0];
    try { e.target.value = ""; } catch (_) {}
    if (!file) return;
    bosCompressImage(file, 1280, 0.72).then(src => {
      if (cloudId) {
        // Аудит #В2: сбой загрузки фото больше не проглатывается молча — тактильная ошибка.
        fetch(src).then(r => r.blob()).then(blob => cloud.uploadChatPhoto(cloudId, blob).then(url => {
          if (url) cloud.sendMessage(cloudId, { imageUrl: url }).then(absorb);
          else if (window.tgHaptic) { try { window.tgHaptic("error"); } catch (e) {} }
        })).catch(() => { if (window.tgHaptic) { try { window.tgHaptic("error"); } catch (e) {} } });
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

  // Лента + композер — общие для обоих режимов; отличается только внешняя рамка.
  const feed = (
      <div ref={scrollRef} className="screen-scroll" style={embed
        ? { maxHeight: "56vh", overflowY: "auto", padding: "2px 2px 10px", display: "flex", flexDirection: "column", gap: 10, WebkitOverflowScrolling: "touch" }
        : { flex: 1, minHeight: 0, padding: "2px 14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {msgs.length === 0 ? (
          <div style={{ margin: "auto", textAlign: "center", padding: "0 30px" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>Это ваш общий чат</div>
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
  );
  const composer = (
      <div style={embed
        ? { flexShrink: 0, display: "flex", alignItems: "flex-end", gap: 8, marginTop: 4 }
        : { flexShrink: 0, background: isDark ? "rgba(18,18,20,0.72)" : "rgba(255,255,255,0.72)", backdropFilter: "blur(28px) saturate(180%)", WebkitBackdropFilter: "blur(28px) saturate(180%)", borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)", padding: "9px 12px calc(9px + var(--bos-safe-bottom, 0px))", display: "flex", alignItems: "flex-end", gap: 8 }}>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
        <button onClick={pickPhoto} className="tap" aria-label="Прикрепить фото" style={{ width: 38, height: 38, borderRadius: "50%", background: isDark ? "rgba(255,255,255,0.10)" : "rgba(120,120,128,0.14)", border: 0, display: "grid", placeItems: "center", flexShrink: 0, color: "var(--text-2)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.6"/><path d="M21 15l-5-5L5 21"/></svg>
        </button>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(); }} placeholder="Сообщение своим…"
          style={{ flex: 1, minWidth: 0, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(120,120,128,0.10)", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.05)", borderRadius: 22, padding: "10px 15px", fontSize: 16, color: "var(--text)", outline: "none", lineHeight: 1.3 }} />
        <button onClick={send} className="tap" aria-label="Отправить" style={{ width: 38, height: 38, borderRadius: "50%", background: text.trim() ? "#0a0a0a" : (isDark ? "rgba(255,255,255,0.10)" : "rgba(120,120,128,0.18)"), border: 0, display: "grid", placeItems: "center", flexShrink: 0, transition: "background 0.2s, transform 0.2s", transform: text.trim() ? "scale(1)" : "scale(0.94)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={text.trim() ? "#fff" : "var(--text-4)"} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>
        </button>
      </div>
  );
  // Встраивание в вкладку «Чат» — только лента + композер, без шапки и полноэкранной высоты.
  if (embed) return (<div style={{ display: "flex", flexDirection: "column" }}>{feed}{composer}</div>);

  return (
    <div className="page-in" style={{ height: "calc(100% + 90px)", margin: "-60px 0 -30px", display: "flex", flexDirection: "column", paddingTop: "max(60px, var(--tg-top-inset, 0px))", overflow: "hidden" }}>
      <div style={{ padding: "0 14px" }}>
        <PageHeader title={team.name} onBack={() => navigate("team-detail", { team, from: params?.from })}
          right={(() => { const n = memberCount != null ? memberCount : (team.members && team.members.length); return n ? <span style={{ fontSize: 12, color: "var(--text-4)", whiteSpace: "nowrap" }}>{n} 👥</span> : null; })()} />
      </div>
      {feed}
      {composer}
    </div>
  );
}

/* CONTACT DETAIL — ЧЕСТНЫЙ профиль человека сообщества (Сообщество v2, экран 5).
   Всё на живых данных: статистика Вклад · Подтверждения · Помог (БЕЗ рейтинга-звёзд),
   «Роль подтвердили» (лица), предложения с 🔒 по уровню + бронь, «Следы пользы»
   (карточки без звёзд). params.person = { id, name, avatar, level, teamName, from }. */
function ContactDetailLive() {
  const { navigate, params } = useNav();
  const { open: openSheet } = useSheet();
  const app = useApp();
  const isDark = app?.themeOverride === "dark";
  const person = params?.person || params?.contact || { id: null, name: "Участник", avatar: "default", level: null, teamName: "" };
  const pid = person.id || person.ownerId || null;
  const from = params?.from || (person && person.from) || "community";
  const viewerLevel = (typeof bosLevelInfoLive === "function" && typeof bosLiveXPLive === "function") ? bosLevelInfoLive(bosLiveXPLive(app)).level : 1;
  const week = (typeof bosNetWeek === "function") ? bosNetWeek() : "";
  const cm = (typeof bosUseCircleMembers === "function") ? bosUseCircleMembers(app) : { map: {}, meId: null };

  const [offers, setOffers] = React.useState(null);
  const [confIds, setConfIds] = React.useState([]);   // distinct подтвердившие
  const [helped, setHelped] = React.useState(0);        // получено следов (thanks)
  const [notes, setNotes] = React.useState([]);         // тексты следов пользы
  const [booked, setBooked] = React.useState({});       // offerId -> true (моя бронь на неделю)
  const [tick, setTick] = React.useState(0);
  // Общий круг с этим человеком? Черновики/circle-only вкладов видят ТОЛЬКО свои по кругу —
  // человеку «снаружи» показываем лишь подтверждённое и открытое всем (brief 2026-07-11, P0-3).
  const sharedCircle = !!(pid && cm.map && cm.map[pid]);
  const cmReady = !!cm.map;
  React.useEffect(() => {
    if (!(pid && window.bosCloud && window.bosCloud.enabled() && window.bosCloud.netOffers)) { setOffers([]); return; }
    let on = true;
    window.bosCloud.netOffers(200).then((all) => {
      if (!on) return;
      const mine = (Array.isArray(all) ? all : []).filter((o) => o && o.owner_id === pid && o.active !== false)
        .filter((o) => sharedCircle || (o.status === "confirmed" && o.visibility === "all"));
      setOffers(mine);
      Promise.all(mine.map((o) => (window.bosCloud.netRoleConfirmations ? window.bosCloud.netRoleConfirmations(o.id) : Promise.resolve([])).then((rc) => rc || []).catch(() => []))).then((arr) => {
        if (!on) return; const ids = {}; arr.forEach((rc) => rc.forEach((x) => { ids[x.confirmer_id] = true; })); setConfIds(Object.keys(ids));
      });
      Promise.all(mine.map((o) => (window.bosCloud.netOfferThanks ? window.bosCloud.netOfferThanks(o.id) : Promise.resolve({ notes: [] })).then((t) => (t && t.notes) || []).catch(() => []))).then((arr) => {
        if (!on) return; setNotes([].concat.apply([], arr).slice(0, 6));
      });
    }).catch(() => { if (on) setOffers([]); });
    if (window.bosCloud.netUserThanks) window.bosCloud.netUserThanks(pid).then((n) => { if (on) setHelped(n || 0); });
    if (window.bosCloud.netMyBookings) window.bosCloud.netMyBookings().then((bk) => { if (!on) return; const m = {}; (bk || []).forEach((b) => { if (b && b.week === week) m[b.offer_id] = true; }); setBooked(m); });
    return () => { on = false; };
  }, [pid, tick, cmReady, sharedCircle]);

  const book = (o) => {
    if (!window.bosCloud.netBook || booked[o.id]) return;
    const earned = (typeof bosLiveXPLive === "function") ? bosLiveXPLive(app) : 0;
    window.bosCloud.netBook(o.id, week, earned).then((res) => {
      if (res && res.ok) {
        if (!res.dup && (o.price_xp | 0) > 0 && app && app.noteSpentXP) app.noteSpentXP(o.price_xp);
        setBooked((b) => Object.assign({}, b, { [o.id]: true }));
        if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
      } else if (window.tgHaptic) { try { window.tgHaptic("error"); } catch (e) {} }
    });
  };
  const thank = (o) => { if (typeof ThanksSheetLive === "function") openSheet(<ThanksSheetLive offerId={o.id} toId={pid} toName={person.name} week={week} onDone={() => setTick((n) => n + 1)} />); };

  const list = offers || [];
  const contribN = list.length;
  const confFaces = confIds.map((id) => (cm.map && cm.map[id]) ? { id: id, name: cm.map[id].name, avatar: cm.map[id].avatar } : null).filter(Boolean);
  const first = (person.name || "").split(" ")[0] || "";
  const statCard = { background: "rgba(255,255,255,0.7)", borderRadius: 14, padding: "10px 12px" };
  const statCardD = { background: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)", borderRadius: 14, padding: "10px 12px" };
  const stat = (lbl, val) => (
    <div style={statCardD}>
      <div style={{ fontSize: 10, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>{lbl}</div>
      <div style={{ fontSize: 19, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.4px", marginTop: 2 }}>{val}</div>
    </div>
  );
  const kick = { fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 700, marginBottom: 10 };

  return (
    <div className="page-in" style={{ padding: "0 0 24px" }}>
      {/* Герой — тёплая золотисто-нейтральная лента, лицо = живой стандарт (Memoji на стекле) */}
      <div style={{ background: isDark ? "linear-gradient(160deg, rgba(239,159,20,0.18) 0%, rgba(239,159,20,0.06) 60%, transparent 100%)" : "linear-gradient(160deg, rgba(254,222,52,0.4) 0%, rgba(254,222,52,0.12) 60%, transparent 100%)", margin: "-60px 0 0", padding: "60px 16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", paddingTop: 4, paddingBottom: 14 }}>
          <button onClick={() => navigate(from)} className="tap" aria-label="Назад"
            style={{ width: 40, height: 40, borderRadius: 999, background: isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.65)", border: 0, display: "grid", placeItems: "center", padding: 0, color: "var(--text)" }}>
            <I.ChevronLeft size={18} />
          </button>
          <div style={{ flex: 1 }} />
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          {typeof BuddyFaceLive === "function"
            ? <span style={{ borderRadius: "50%", boxShadow: "0 0 0 3px " + (isDark ? "#15151a" : "#fff") + ", 0 2px 8px rgba(0,0,0,0.08)" }}><BuddyFaceLive avatar={person.avatar} name={person.name} size={64} /></span>
            : <BosAvatar avatar={person.avatar} size={64} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.5px" }}>{person.name}</span>
              {person.level ? <span style={{ fontSize: 10, fontWeight: 700, background: "#0a0a0a", color: "#FEDE34", borderRadius: 999, padding: "2px 8px", letterSpacing: 0.4 }}>L{person.level}</span> : null}
            </div>
            {person.teamName ? <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4 }}>🫂 круг «{person.teamName}»</div> : null}
          </div>
        </div>
        {/* Статистика — Вклад · Подтверждения · Помог (БЕЗ рейтинга-звёзд) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16 }}>
          {stat("Вклад", contribN)}
          {stat("Подтверждения", confIds.length)}
          {stat("Помог", helped)}
        </div>
      </div>

      {/* Роль подтвердили — лица из кругов */}
      {confFaces.length > 0 && (
        <div style={{ padding: "20px 16px 0" }}>
          <div style={kick}>Роль подтвердили</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--card)", borderRadius: 22, padding: "12px 14px", boxShadow: "var(--card-shadow)" }}>
            <div style={{ display: "flex" }}>{confFaces.slice(0, 5).map((f, j) => <span key={f.id} style={{ marginLeft: j ? -8 : 0, borderRadius: "50%", boxShadow: "0 0 0 2px var(--card)" }}><BuddyFaceLive avatar={f.avatar} name={f.name} size={30} /></span>)}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.4 }}>{confFaces.slice(0, 2).map((f) => (f.name || "").split(" ")[0]).join(", ")}{confIds.length > 2 ? (" и ещё " + (confIds.length - 2)) : ""} — из ваших общих кругов</div>
          </div>
        </div>
      )}

      {/* Предложения — бронь; свои (min_level=1) не заперты */}
      <div style={{ padding: "22px 16px 0" }}>
        <div style={kick}>Чем помогает</div>
        {offers === null ? (
          <div style={{ background: "var(--card)", borderRadius: 22, padding: 18, boxShadow: "var(--card-shadow)" }}>{[0, 1].map((i) => <span key={i} className="bos-skel" style={{ display: "block", height: 14, borderRadius: 7, width: i ? "50%" : "72%", marginTop: i ? 10 : 0 }} />)}</div>
        ) : list.length === 0 ? (
          <div style={{ background: "var(--card)", borderRadius: 22, padding: "20px 16px", boxShadow: "var(--card-shadow)", fontSize: 13.5, color: "var(--text-4)", lineHeight: 1.5, textAlign: "center" }}>Пока не делится форматом помощи. Загляни позже — или позови в общее дело.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {list.slice().sort((a, b) => (a.min_level || 1) - (b.min_level || 1)).map((o) => {
              const lvl = o.min_level || 1;
              const locked = viewerLevel < lvl;
              const isBooked = !!booked[o.id];
              const isDraft = o.status === "draft";
              const serverUnavailable = lvl > 1 || (o.price_xp | 0) > 0;
              const priceTxt = (o.price_xp | 0) > 0 ? (o.price_xp + " XP") : "Бесплатно";
              return (
                <div key={o.id} style={{ background: "var(--card)", borderRadius: 22, padding: 14, display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--card-shadow)", opacity: locked ? 0.55 : 1 }}>
                  <span style={{ width: 42, height: 42, borderRadius: 14, background: "var(--surface-3)", display: "grid", placeItems: "center", flexShrink: 0 }}>{typeof BosHelpOfferIconLive === "function" ? <BosHelpOfferIconLive offer={o} size={20} /> : null}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{typeof bosHelpOfferTitleText === "function" ? bosHelpOfferTitleText(o) : o.title}</span>
                      {locked && <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-4)", background: "var(--surface-3)", borderRadius: 999, padding: "2px 7px", letterSpacing: 0.4 }}>🔒 L{lvl}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>{[o.when_text, priceTxt, (o.status === "draft" ? "черновик" : null)].filter(Boolean).join(" · ")}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {isDraft
                      ? <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-4)", background: "var(--surface-3)", borderRadius: 999, padding: "6px 10px" }}>Ждёт подтверждений</span>
                      : serverUnavailable
                      ? <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-4)", background: "var(--surface-3)", borderRadius: 999, padding: "6px 10px" }}>Пока недоступно</span>
                      : locked
                      ? <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-4)" }}>с L{lvl}</span>
                      : isBooked
                        ? <button onClick={() => thank(o)} className="tap" style={{ fontSize: 11.5, fontWeight: 800, color: "#0a0a0a", background: "linear-gradient(135deg,#FEDE34,#EF9F14)", border: 0, borderRadius: 999, padding: "6px 12px", cursor: "pointer" }}>Спасибо ✦</button>
                        : <button onClick={() => book(o)} className="tap" style={{ fontSize: 11.5, fontWeight: 600, color: "var(--cta-ink, #fff)", background: "var(--cta, #0a0a0a)", border: 0, borderRadius: 999, padding: "6px 13px", cursor: "pointer" }}>Записаться</button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Следы пользы — карточки-отзывы БЕЗ звёзд */}
      {notes.length > 0 && (
        <div style={{ padding: "22px 16px 0" }}>
          <div style={kick}>✦ Следы пользы</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {notes.map((n, j) => (
              <div key={j} style={{ background: "var(--card)", borderRadius: 22, padding: "13px 15px", boxShadow: "var(--card-shadow)", display: "flex", gap: 11, alignItems: "flex-start" }}>
                <span style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", background: "radial-gradient(circle at 50% 40%, #FEDE34, #EF9F14)", boxShadow: "0 0 12px rgba(254,222,52,0.5)" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="#0a0a0a"><path d="M12 2.2l2.4 7.4 7.4 2.4-7.4 2.4-2.4 7.4-2.4-7.4-7.4-2.4 7.4-2.4z" /></svg></span>
                <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.5 }}>{n}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ложных CTA нет (brief 2026-07-11, Слой 0): не обещаем чат, которого нет, и не бронируем
          «первое попавшееся» молча — помощь просят выбором КОНКРЕТНОГО формата выше. */}
      <div style={{ padding: "20px 24px 0", fontSize: 11.5, color: "var(--text-5)", lineHeight: 1.5, textAlign: "center" }}>
        {list.length > 0 ? ("Выбери формат выше — запись увидите только вы двое." + (sharedCircle ? " Договориться можно в чате вашего круга." : "")) : ""}
      </div>
    </div>
  );
}

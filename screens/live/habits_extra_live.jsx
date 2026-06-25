/* HABIT / GOAL / INFO — LIVE-only forks (real Telegram user, app.mode === "live"
   is ALWAYS true here). These three screens get dedicated live copies so the two
   demos (demo & fresh) stay FROZEN on the originals in screens/habits.jsx. In each
   fork the `_isLive` / `app?.mode === "live"` checks collapse to their TRUE branch
   and the demo/fresh branches are deleted — DeadlineCalendarLive always uses the
   real "today", the share/invite flow always runs the REAL cloud
   path (createTeam → addTeamHabit → share sheet), and the friend chips start from
   the user's REAL invited circle (no sample faces, no demo cycle-pool). The
   iOS-Headline typography polish is applied: the habit/goal name preview title and
   the «Далее» card title now render at fontWeight 600 + color var(--text) instead
   of the thin 500. Everything else reuses the shared core/ toolkit
   (HabitInviteShareSheet, HABIT_ICONS, HABIT_COLORS, HABIT_COLOR_NAMES,
   WEEKDAY_LABELS, daysSummary, INFO_TOPICS) + the DeadlineCalendarLive fork
   (shared_live.jsx) + framework (PageHeader, Switch, Segmented, I, hooks useApp/useNav/useSheet,
   window.bosCloud, window.tgHaptic). The ONLY new top-level declarations in this
   file are exactly: function HabitSettingsLive, function GoalSettingsLive and
   function InfoLive. */

function HabitSettingsLive() {
  const { navigate, params } = useNav();
  const { open: openSheet } = useSheet();
  const app = useApp();
  const editing = params?.mode === "edit";
  const preset = params?.preset; // quick-add chip → {i: emoji, t: label}
  const [name, setName] = useHS(editing ? params.habit.name : (preset?.t || "Прогулка"));
  const [iconPick, setIconPick] = useHS(editing ? params.habit.emoji : (preset?.i || "👟"));
  const [showIcons, setShowIcons] = useHS(false);
  const [color, setColor] = useHS(editing ? (params.habit.color ?? null) : (preset?.color ?? null));
  const [goal, setGoal] = useHS(editing ? (params.habit.goalPerDay || 1) : 1);
  // Days-of-week schedule — 7-long 0/1 mask, Пн..Вс. Default = every day.
  const [days, setDays] = useHS(editing && Array.isArray(params.habit.days) && params.habit.days.length === 7
    ? params.habit.days.slice()
    : ((preset && Array.isArray(preset.days) && preset.days.length === 7) ? preset.days.slice() : [1, 1, 1, 1, 1, 1, 1]));
  const toggleDay = (i) => setDays(d => d.map((v, j) => j === i ? (v ? 0 : 1) : v));
  // Reminder — a single setting: on/off + a time. Seeded from the habit when editing.
  const [reminderOn, setReminderOn] = useHS(editing ? !!(params.habit.reminder && params.habit.reminder.on) : true);
  const [reminderTime, setReminderTime] = useHS(editing && params.habit.reminder && params.habit.reminder.time ? params.habit.reminder.time : (preset?.time || "09:00"));
  const [shareOn, setShareOn] = useHS(true);
  const [inviteNote, setInviteNote] = useHS(""); // gentle inline note if the invite step can't run
  const [sharedTeam, setSharedTeam] = useHS(null); // the mini-team backing this shared habit (created once)

  // Turn this habit into a SHARED one: a private mini-team + a main team-habit, then
  // hand back the {team, link} so we can open the share sheet. Created at most once
  // (cached in sharedTeam). Returns null + sets a gentle note if the cloud isn't ready.
  const ensureSharedTeam = async () => {
    if (sharedTeam) return sharedTeam;
    const nm = name.trim() || "Новая привычка";
    if (!window.bosCloud || !window.bosCloud.enabled()) {
      setInviteNote("Чтобы звать друзей, войди через Telegram.");
      return null;
    }
    try {
      const team = await window.bosCloud.createTeam({ name: nm, emblem: iconPick, vis: "private" });
      if (!team || !team.id) {
        setInviteNote("Не удалось создать общую привычку — попробуй ещё раз.");
        return null;
      }
      try { await window.bosCloud.addTeamHabit(team.id, { name: nm, emoji: iconPick, isMain: true }); } catch (e) {}
      let ref = "";
      try { ref = (await window.bosCloud.uid()) || ""; } catch (e) {}
      const link = location.origin + location.pathname + "?team=" + team.id + (ref ? "&ref=" + ref : "");
      const made = { team, link };
      setSharedTeam(made); setInviteNote("");
      return made;
    } catch (e) {
      setInviteNote("Не удалось создать общую привычку — попробуй ещё раз.");
      return null;
    }
  };
  // Invite-now (the «Пригласить» button): build the shared team and open the real
  // share sheet. Falls back to a plain referral link if the team step fails.
  const inviteFriend = async () => {
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
    const made = await ensureSharedTeam();
    if (made) { openSheet(<HabitInviteShareSheet habit={{ name: name.trim() || "Новая привычка", emoji: iconPick, color }} link={made.link} />); return; }
    // Fallback: still let them share a plain referral link so the button is never dead.
    if (window.bosCloud && window.bosCloud.enabled()) {
      try {
        const ref = (await window.bosCloud.uid()) || "";
        const link = location.origin + location.pathname + (ref ? "?ref=" + ref : "");
        setInviteNote("");
        openSheet(<HabitInviteShareSheet habit={{ name: name.trim() || "Новая привычка", emoji: iconPick, color }} link={link} />);
      } catch (e) {}
    }
  };
  // Soft pastel palette so each real friend chip still gets a pleasant colour.
  const _FCOLORS = ["#e8c8a8", "#a8b9d4", "#d4b8e8", "#a8d4e8", "#b8e8c8", "#e8b8d4", "#d4c8e8"];
  // LIVE: real invited people (referral circle), nothing pre-selected.
  const [shareFriends, setShareFriends] = useHS([]);
  React.useEffect(() => {
    if (!(window.bosCloud && window.bosCloud.enabled())) return;
    let on = true;
    try {
      window.bosCloud.invitedPeople().then((list) => {
        if (!on || !Array.isArray(list)) return;
        setShareFriends(list.map((p, idx) => {
          const nm = (p && p.username) ? p.username : "Друг";
          return { name: nm, i: nm.charAt(0).toUpperCase(), c: _FCOLORS[idx % _FCOLORS.length], on: false };
        }));
      }).catch(() => {});
    } catch (e) {}
    return () => { on = false; };
  }, []);
  const [type, setType] = useHS("build");

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title={editing ? "Изменить привычку" : "Новая привычка"} onBack={() => navigate("habits")} />
      {/* Name */}
      <div className="section-label">Название</div>
      <input className="bos-input" value={name} onChange={e => setName(e.target.value)} style={{ marginTop: 8 }} />

      {/* Icon + colour — neutral by default; tap a swatch to tint it */}
      <div className="section-label" style={{ marginTop: 22 }}>Иконка и цвет</div>
      <button className="tap" data-no-haptic onClick={() => setShowIcons(v => !v)}
        style={{ width: "100%", background: "#fff", border: 0, borderRadius: 22, padding: 12, display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--card-shadow)", marginTop: 8 }}>
        <div style={{ width: 50, height: 50, borderRadius: 14, background: color ? color + "26" : "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 26, transition: "background 0.2s" }}>{iconPick}</div>
        <div style={{ textAlign: "left", flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 16, color: "var(--text)" }}>{name || "Привычка"}</div>
          <div style={{ fontSize: 13, color: "var(--text-4)" }}>{color ? HABIT_COLOR_NAMES[color] : "Базовый"} · {showIcons ? "выбери иконку" : "сменить иконку"}</div>
        </div>
        <I.ChevronRight size={18} color="var(--text-4)" style={{ transform: showIcons ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      {showIcons && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginTop: 10 }}>
          {HABIT_ICONS.map((e) => {
            const on = e === iconPick;
            return (
              <button key={e} className="tap" data-no-haptic onClick={() => { setIconPick(e); setShowIcons(false); }}
                style={{ aspectRatio: "1/1", borderRadius: 14, fontSize: 24, border: 0, cursor: "pointer",
                  background: on ? (color || "#0a0a0a") : "var(--surface-3)",
                  boxShadow: on ? "0 3px 10px rgba(0,0,0,0.18)" : "none",
                  transform: on ? "scale(1.06)" : "none", transition: "transform 0.12s, background 0.12s" }}>
                {e}
              </button>
            );
          })}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 12, padding: "2px 2px 0", flexWrap: "wrap" }}>
        {HABIT_COLORS.map((c) => (
          <button key={c.id} className="tap" data-no-haptic onClick={() => setColor(c.val)}
            style={{ width: 34, height: 34, borderRadius: "50%", background: c.val || "var(--surface-3)", border: 0, display: "grid", placeItems: "center", cursor: "pointer",
              boxShadow: color === c.val ? "0 0 0 2px var(--bg), 0 0 0 4px var(--text)" : (c.val ? "none" : "inset 0 0 0 1px rgba(0,0,0,0.12)") }}>
            {color === c.val && <I.Check size={15} strokeWidth={3} color={c.val ? "#fff" : "var(--text-2)"} />}
          </button>
        ))}
      </div>

      {/* Goal */}
      <div className="section-label" style={{ marginTop: 22 }}>Цель</div>
      <div style={{ background: "#fff", borderRadius: 22, padding: 16, marginTop: 8, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{goal} {goal === 1 ? "раз" : "раз(а)"}</div>
            <div style={{ fontSize: 13, color: "var(--text-4)" }}>или больше в день</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setGoal(Math.max(1, goal - 1))} className="tap" style={{ width: 32, height: 32, borderRadius: 999, background: "var(--surface-3)", border: 0 }}>−</button>
            <button onClick={() => setGoal(goal + 1)} className="tap" style={{ width: 32, height: 32, borderRadius: 999, background: "var(--surface-3)", border: 0 }}>＋</button>
          </div>
        </div>
        {/* Days-of-week — tap a circle to toggle that day. All on = «каждый день». */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "var(--text-3)" }}>Дни недели</span>
            <span style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 600 }}>{daysSummary(days)}</span>
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
            {WEEKDAY_LABELS.map((w, i) => {
              const on = !!days[i];
              return (
                <button key={i} className="tap" data-no-haptic onClick={() => toggleDay(i)} aria-pressed={on}
                  style={{ flex: 1, aspectRatio: "1/1", maxWidth: 40, borderRadius: "50%", border: 0, cursor: "pointer",
                    fontSize: 12.5, fontWeight: 600, letterSpacing: "-0.2px",
                    background: on ? (color || "#0a0a0a") : "var(--surface-3)",
                    color: on ? "#fff" : "var(--text-4)",
                    boxShadow: on ? "0 2px 6px rgba(0,0,0,0.14)" : "none",
                    transform: on ? "scale(1.04)" : "none", transition: "transform 0.12s, background 0.12s, color 0.12s" }}>
                  {w}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reminders */}
      <div className="section-label" style={{ marginTop: 22 }}>Напоминания</div>
      <div style={{ background: "#fff", borderRadius: 22, padding: 16, marginTop: 8, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, fontSize: 14, color: "var(--text-2)", lineHeight: 1.4 }}>
            Напоминать каждый день
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>{reminderOn ? "Тихий пуш в выбранное время." : "Без напоминаний — отмечай когда удобно."}</div>
          </div>
          <Switch on={reminderOn} onChange={setReminderOn} />
        </div>
        {reminderOn && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 14, color: "var(--text-2)" }}><I.Clock size={16} color="var(--text-3)" /> Время</span>
            {/* Native iOS time wheel, styled to read as one of the app's pills. */}
            <input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value || "09:00")}
              style={{ border: 0, outline: 0, background: "var(--surface-3)", borderRadius: 999, padding: "8px 14px",
                fontSize: 16, fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.2px", WebkitAppearance: "none", appearance: "none", textAlign: "center" }} />
          </div>
        )}
      </div>

      {/* Share with friend — the most natural referral moment: invite anyone into
          your habit. They join → you earn XP and they're in the app. */}
      <div className="section-label" style={{ marginTop: 8 }}>Поделиться с другом</div>
      <div data-tour="invite-friend" style={{ background: "#fff", borderRadius: 22, padding: 16, marginTop: 8, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, fontSize: 14, color: "var(--text-2)", lineHeight: 1.4 }}>
            Делать это вместе
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>Друзья видят, когда ты отмечаешься. Они могут поддержать или подтолкнуть.</div>
          </div>
          <Switch on={shareOn} onChange={setShareOn} />
        </div>
        <div style={{ marginTop: 12, borderRadius: 14, padding: "11px 12px", background: "#edfaf0", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 30, height: 30, borderRadius: "50%", background: "#d6f3df", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 15 }}>🤝</span>
          <div style={{ fontSize: 12.5, color: "#1a7a3a", lineHeight: 1.4 }}><b>+75 XP</b>, когда друг присоединится. А ведёте вместе — каждый шаг <b>+15</b> вместо +10.</div>
        </div>
        {shareOn && <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
          {shareFriends.length === 0 && (
            <span style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.4 }}>Пока некого выбрать — пригласи друга по ссылке.</span>
          )}
          {shareFriends.map((p, i) => (
            <button key={i} onClick={() => setShareFriends(fs => fs.map((x, j) => j === i ? { ...x, on: !x.on } : x))} className="tap" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 11px 5px 5px", borderRadius: 999,
              background: p.on ? "#0a0a0a" : "var(--surface-3)",
              color: p.on ? "#fff" : "var(--text-3)",
              border: 0, fontSize: 12, fontWeight: 500,
            }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: p.c, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.55)" }}>{p.i}</span>
              {p.name}
              {p.on && <I.Check size={12} strokeWidth={3}/>}
            </button>
          ))}
          {/* LIVE: make it REAL — create a shared mini-team + habit and open the share sheet. */}
          <button onClick={() => inviteFriend()} className="tap" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 11px", borderRadius: 999,
            background: "transparent", border: "1px dashed rgba(0,0,0,0.18)",
            color: "var(--text-3)", fontSize: 12, fontWeight: 500,
          }}><I.Plus size={12}/> Пригласить</button>
        </div>}
        {/* Gentle inline note — only when the invite step can't run (no Telegram / cloud off). */}
        {shareOn && inviteNote && (
          <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.4, padding: "0 2px" }}>{inviteNote}</div>
        )}
      </div>

      {/* Habit type */}
      <div className="section-label" style={{ marginTop: 22 }}>Тип привычки</div>
      <div style={{ marginTop: 8 }}>
        <Segmented value={type} onChange={setType} options={[{ value: "build", label: "Развивать" }, { value: "quit", label: "Бросить" }]} />
      </div>

      {/* Add */}
      <button className="bos-btn" style={{ marginTop: 20 }} onClick={async () => {
        const nm = name.trim() || "Новая привычка";
        // Persist the full schedule + reminder on the habit. These extra fields ride
        // along into the live snapshot (addHabit/updateHabit spread whatever you pass).
        const base = {
          emoji: iconPick, name: nm, color,
          days: days.slice(),                                  // 7-long Пн..Вс mask
          goalPerDay: goal,
          reminder: { on: reminderOn, time: reminderTime },
        };
        // SHARED habit: if sharing is on, spin up the mini-team + team-habit and open
        // the share sheet. Guarded — if anything fails, the habit is still saved.
        if (shareOn) {
          const made = await ensureSharedTeam();
          if (made && made.team) { base.shared = true; base.teamId = made.team.id; }
          if (editing) app?.updateHabit(params.habit.id, base);
          else app?.addHabit(base);
          navigate("habits"); // the sheet lives above the router, so it stays open over the list
          if (made && made.link) {
            openSheet(<HabitInviteShareSheet habit={{ name: nm, emoji: iconPick, color }} link={made.link} />);
          }
          return;
        }
        if (editing) app?.updateHabit(params.habit.id, base);
        else app?.addHabit(base);
        navigate("habits");
      }}>
        {editing ? "Сохранить" : "Добавить привычку"}
      </button>
      {editing && (
        <button className="tap" onClick={() => { app?.removeHabit(params.habit.id); navigate("habits"); }}
          style={{ width: "100%", background: "transparent", border: 0, color: "var(--accent-red)", padding: 14, marginTop: 6, fontSize: 15 }}>
          Удалить привычку
        </button>
      )}
    </div>
  );
}

/* ─── GOAL SETTINGS — create / edit a goal (LIVE) ──────────────── */
function GoalSettingsLive() {
  const { navigate, params } = useNav();
  const app = useApp();
  const editing = params?.mode === "edit";
  const g0 = editing ? params.goal : null;
  const [name, setName] = useHS(g0?.name || "Пробежать марафон");
  const [iconPick, setIconPick] = useHS(g0?.emoji || "🎯");
  const [showIcons, setShowIcons] = useHS(false);
  const [target, setTarget] = useHS(g0?.target || 22);
  const [unit, setUnit] = useHS(g0?.unit || "недель");
  const [deadline, setDeadline] = useHS(g0?.deadline || "Месяц");
  const [showCal, setShowCal] = useHS(false);
  const [linkHabit, setLinkHabit] = useHS(true);
  // REAL — the user's own habits, none pre-selected.
  const [linkedHabits, setLinkedHabits] = useHS(() => (app?.habits || []).map((h) => ({ e: h.emoji || "✨", n: h.name, on: false })));
  const toggleLinked = (i) => setLinkedHabits((hs) => hs.map((h, j) => (j === i ? { ...h, on: !h.on } : h)));
  const QUICK_TERMS = ["Неделя", "Месяц", "1 год"];
  const svoyActive = showCal || (!!deadline && !QUICK_TERMS.includes(deadline)); // custom date/range → highlight «Свой срок»

  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title={editing ? "Изменить цель" : "Новая цель"} onBack={() => navigate("habits")} />

      <div className="section-label">Чего ты хочешь</div>
      <input className="bos-input" value={name} onChange={e => setName(e.target.value)} style={{ marginTop: 8 }} placeholder="напр. Пробежать марафон" />

      <div className="section-label" style={{ marginTop: 22 }}>Иконка</div>
      <button className="tap" data-no-haptic onClick={() => setShowIcons(v => !v)}
        style={{ marginTop: 8, width: "100%", background: "#fff", border: 0, borderRadius: 22, padding: 12, display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--card-shadow)" }}>
        <div style={{ width: 50, height: 50, borderRadius: 14, background: "#e8e8e8", display: "grid", placeItems: "center", fontSize: 26 }}>{iconPick}</div>
        <div style={{ textAlign: "left", flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 16, color: "var(--text)" }}>{name || "Цель"}</div>
          <div style={{ fontSize: 13, color: "var(--text-4)" }}>{showIcons ? "выбери иконку" : "нажми, чтобы изменить"}</div>
        </div>
        <I.ChevronRight size={18} color="var(--text-4)" style={{ transform: showIcons ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}/>
      </button>
      {showIcons && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginTop: 10 }}>
          {HABIT_ICONS.map((e) => {
            const on = e === iconPick;
            return (
              <button key={e} className="tap" data-no-haptic onClick={() => { setIconPick(e); setShowIcons(false); }}
                style={{ aspectRatio: "1/1", borderRadius: 14, fontSize: 24, border: 0, cursor: "pointer",
                  background: on ? "#0a0a0a" : "var(--surface-3)",
                  boxShadow: on ? "0 3px 10px rgba(0,0,0,0.18)" : "none",
                  transform: on ? "scale(1.06)" : "none", transition: "transform 0.12s, background 0.12s" }}>
                {e}
              </button>
            );
          })}
        </div>
      )}

      <div className="section-label" style={{ marginTop: 22 }}>Цель (значение)</div>
      <div style={{ background: "#fff", borderRadius: 22, padding: 16, marginTop: 8, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input type="text" inputMode="numeric" pattern="[0-9]*" value={target}
            onChange={e => setTarget(parseInt(e.target.value.replace(/\D/g,"")) || 0)}
            className="goal-num"
            style={{ flex: "0 0 90px", fontSize: 28, fontWeight: 700, color: "var(--text)", border: 0, outline: 0, background: "transparent", padding: 0 }}/>
          <input value={unit} onChange={e => setUnit(e.target.value)}
            style={{ flex: 1, minWidth: 0, fontSize: 18, color: "var(--text-3)", border: 0, outline: 0, background: "transparent", padding: "4px 0" }}/>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 6 }}>От этого числа будет считаться прогресс цели.</div>
      </div>

      <div className="section-label" style={{ marginTop: 22 }}>Срок</div>
      <div style={{ background: "#fff", borderRadius: 22, padding: "14px 16px", marginTop: 8, boxShadow: "var(--card-shadow)", display: "flex", alignItems: "center", gap: 12 }}>
        <I.Calendar size={18} color="var(--text-3)"/>
        <input value={deadline} onChange={e => setDeadline(e.target.value)} placeholder="напр. 14 окт"
          style={{ flex: 1, fontSize: 16, border: 0, outline: 0, background: "transparent" }}/>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <button onClick={() => setShowCal(v => !v)} className="tap" data-no-haptic
          style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, borderRadius: 999, padding: "8px 4px", fontSize: 12.5, whiteSpace: "nowrap",
            background: svoyActive ? "#0a0a0a" : "#fff", color: svoyActive ? "#fff" : "var(--text-3)", border: svoyActive ? "0" : "1px solid rgba(0,0,0,0.06)" }}>
          <I.Calendar size={12}/> Свой срок
        </button>
        {QUICK_TERMS.map((q) => {
          const active = !showCal && deadline === q;
          return (
            <button key={q} onClick={() => { setDeadline(q); setShowCal(false); }} className="tap" data-no-haptic
              style={{ flex: 1, borderRadius: 999, padding: "8px 4px", fontSize: 12.5, whiteSpace: "nowrap", textAlign: "center",
                background: active ? "#0a0a0a" : "#fff", color: active ? "#fff" : "var(--text-3)", border: active ? "0" : "1px solid rgba(0,0,0,0.06)" }}>{q}</button>
          );
        })}
      </div>
      {showCal && <DeadlineCalendarLive onPick={(s) => { setDeadline(s); setShowCal(false); }} />}

      <div className="section-label" style={{ marginTop: 22 }}>Привязать привычку</div>
      <div style={{ background: "#fff", borderRadius: 22, padding: 16, marginTop: 8, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.4 }}>Подкрепи эту цель ежедневной привычкой</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 2 }}>Каждая отметка приближает к цели.</div>
          </div>
          <Switch on={linkHabit} onChange={setLinkHabit}/>
        </div>
        {linkHabit && (
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
            {linkedHabits.length === 0 && (
              <span style={{ fontSize: 12.5, color: "var(--text-4)", lineHeight: 1.4 }}>Сначала создай привычку — потом привяжешь её к цели.</span>
            )}
            {linkedHabits.map((h,i)=>(
              <button key={i} className="tap" data-no-haptic onClick={() => toggleLinked(i)} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 11px 5px 5px", borderRadius: 999,
                background: h.on ? "#0a0a0a" : "#e8e8e8",
                color: h.on ? "#fff" : "var(--text-3)",
                border: 0, fontSize: 12, fontWeight: 500, transition: "background 0.15s, color 0.15s",
              }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center", fontSize: 13 }}>{h.e}</span>
                {h.n}
                {h.on && <I.Check size={12} strokeWidth={3}/>}
              </button>
            ))}
            <button className="tap" onClick={() => navigate("habit-settings", { mode: "create" })} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 11px", borderRadius: 999,
              background: "transparent", border: "1px dashed rgba(0,0,0,0.18)",
              color: "var(--text-3)", fontSize: 12, fontWeight: 500,
            }}><I.Plus size={12}/> Новая привычка</button>
          </div>
        )}
      </div>

      <button className="bos-btn" style={{ marginTop: 20 }} onClick={() => {
        const data = { emoji: iconPick, name: name.trim() || "Новая цель", target: Math.max(1, target), unit, deadline };
        if (editing) app?.updateGoal(g0.id, data);
        else app?.addGoal(data);
        navigate("habits");
      }}>
        {editing ? "Сохранить" : "Создать цель"}
      </button>
      {editing && (
        <button className="tap" onClick={() => { app?.removeGoal(g0.id); navigate("habits"); }}
          style={{ width: "100%", background: "transparent", border: 0, color: "var(--accent-red)", padding: 14, marginTop: 6, fontSize: 15 }}>
          Удалить цель
        </button>
      )}
    </div>
  );
}

/* ─── INFO SCREEN — knowledge articles (LIVE) ──────────────────── */
function InfoLive() {
  const { navigate, params } = useNav();
  const topic = INFO_TOPICS[params?.topic] || INFO_TOPICS["habits-basics"];
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title={topic.title} onBack={() => navigate("habits")} />
      {/* Hero */}
      <div style={{ background: "#fff", borderRadius: 22, padding: "22px 20px", boxShadow: "var(--card-shadow)" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "#e8e8e8", display: "grid", placeItems: "center", fontSize: 30, marginBottom: 12 }}>{topic.emoji}</div>
        <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.4, fontWeight: 600 }}>{topic.eyebrow}</div>
        <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 28, lineHeight: 1.15, letterSpacing: "-0.5px", marginTop: 4, color: "var(--text)" }}>{topic.title}</div>
        <div style={{ fontSize: 15, color: "var(--text-3)", marginTop: 12, lineHeight: 1.55, letterSpacing: "-0.1px" }}>{topic.lede}</div>
      </div>

      {/* Pull quote */}
      <div style={{ background: "#0a0a0a", color: "#fff", borderRadius: 22, padding: "20px 22px", marginTop: 12, position: "relative", overflow: "hidden" }}>
        <div aria-hidden style={{ position: "absolute", top: -10, right: -10, fontSize: 100, opacity: 0.06, fontFamily: "var(--bos-title-font)", lineHeight: 1 }}>"</div>
        <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 18, lineHeight: 1.4, position: "relative" }}>{topic.pull}</div>
      </div>

      {/* Numbered sections */}
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {topic.sections.map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 22, padding: 18, boxShadow: "var(--card-shadow)", display: "flex", gap: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0a0a0a", color: "#fff", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{s.i}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>{s.h}</div>
              <div style={{ fontSize: 14, color: "var(--text-3)", marginTop: 6, lineHeight: 1.55, textWrap: "pretty" }}>{s.b}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button onClick={() => navigate(params?.topic === "goals-101" ? "goal-settings" : "habit-settings", { mode: "create" })} className="tap"
        style={{ width: "100%", background: "#0a0a0a", color: "#fff", border: 0, borderRadius: 999, padding: 16, fontSize: 15, fontWeight: 600, marginTop: 18 }}>
        {params?.topic === "goals-101" ? "Поставить цель" : "Создать привычку"}
      </button>

      {/* Up next */}
      {topic.next && (
        <button onClick={() => navigate("info", { topic: topic.next.topic })} className="tap"
          style={{ marginTop: 12, width: "100%", background: "transparent", border: 0, padding: 0, textAlign: "left" }}>
          <div style={{ background: "#fff", borderRadius: 22, padding: 14, display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--card-shadow)" }}>
            <div style={{ width: 38, height: 38, borderRadius: 14, background: "#e8e8e8", display: "grid", placeItems: "center", fontSize: 20 }}>{topic.next.e}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600 }}>Далее</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{topic.next.t}</div>
            </div>
            <I.ChevronRight size={18} color="var(--text-4)"/>
          </div>
        </button>
      )}
    </div>
  );
}

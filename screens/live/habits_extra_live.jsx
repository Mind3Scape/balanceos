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
   file are exactly: const INFO_TOPICS_LIVE, function HabitSettingsLive,
   function GoalSettingsLive and function InfoLive. INFO_TOPICS_LIVE is a deepened fork
   of core INFO_TOPICS (teams guide added, reading-time removed) so the живые гайды grow
   while the DEMO reader stays frozen on the core originals. */

function HabitSettingsLive() {
  const { navigate, params } = useNav();
  const { open: openSheet } = useSheet();
  const app = useApp();
  const editing = params?.mode === "edit";
  const preset = params?.preset; // quick-add chip → {i: emoji, t: label}
  const [name, setName] = useHS(editing ? params.habit.name : (preset?.t || "Прогулка"));
  const [iconPick, setIconPick] = useHS(editing ? params.habit.emoji : (preset?.i || "👟"));
  // Icon = the EmojiPickerLive panel (opens straight on emojis). The iOS keyboard can't be
  // forced into emoji mode — it opened on ABC, «непонятно что делать» (David) — so we use
  // our own emoji sheet, opened by tapping the tile below.
  // Every habit carries an Apple colour now (coherent with the week-strip). Old null-colour
  // habits resolve to their stable bosHabitColor when edited.
  const [color, setColor] = useHS(editing ? (params.habit.color ?? (typeof bosHabitColor === "function" ? bosHabitColor(params.habit) : "#0a0a0a")) : (preset?.color ?? "#0a0a0a"));
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

      {/* Icon + colour — iOS-26: the icon IS the system emoji keyboard (tap the tile → type
          any emoji), with quick presets; colour is the full Apple palette + a custom wheel.
          Core HABIT_ICONS/HABIT_COLORS stay untouched — this is the live picker only. */}
      <div className="section-label" style={{ marginTop: 22 }}>Иконка и цвет</div>
      <div style={{ background: "#fff", borderRadius: 22, padding: 14, boxShadow: "var(--card-shadow)", marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Tap the tile → an emoji PANEL opens straight on emojis (no ABC keyboard). */}
          <button type="button" data-haptic="selection" onClick={() => openSheet(<EmojiPickerLive onPick={setIconPick} />)}
            style={{ width: 56, height: 56, borderRadius: 16, background: color ? color + "26" : "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 28, flexShrink: 0, border: 0, cursor: "pointer", transition: "background 0.2s" }}>
            {iconPick}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 16, color: "var(--text)" }}>{name || "Привычка"}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 2, lineHeight: 1.35 }}>Нажми на иконку — выбери эмодзи</div>
          </div>
        </div>
        {/* Quick presets — one tap for speed */}
        <div style={{ display: "flex", gap: 8, marginTop: 12, overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", paddingBottom: 2 }}>
          {["🏃","💪","🧘","📖","💧","🍎","😴","🔥","🎯","🌱","☕","✍️"].map((e) => {
            const on = e === iconPick;
            return (
              <button key={e} className="tap" data-haptic="selection" onClick={() => setIconPick(e)}
                style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 12, fontSize: 20, border: 0, cursor: "pointer",
                  background: on ? (color || "#0a0a0a") + "26" : "var(--surface-3)",
                  boxShadow: on ? "inset 0 0 0 2px " + (color || "#0a0a0a") : "none",
                  display: "grid", placeItems: "center", transition: "background 0.12s, box-shadow 0.12s" }}>
                {e}
              </button>
            );
          })}
        </div>
        {/* Apple system palette + custom wheel. The selected swatch has a 4px outset ring —
            the row needs padding so an overflow-x scroller doesn't clip it (David: «колечко
            выпирает и обрезается»). 6px all round > the 4px ring. */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", padding: "6px 6px" }}>
          <label className="tap" data-haptic="selection" style={{ position: "relative", width: 32, height: 32, borderRadius: "50%", flexShrink: 0, cursor: "pointer", boxShadow: (typeof color === "string" && color[0] === "#" && color !== "#0a0a0a" && !BOS_APPLE_COLORS.includes(color)) ? "0 0 0 2px #fff, 0 0 0 4px var(--text-3)" : "none", background: "conic-gradient(from 0deg, #FF3B30, #FF9500, #FFCC00, #34C759, #30B0C7, #007AFF, #AF52DE, #FF2D55, #FF3B30)" }}>
            <input type="color" value={(typeof color === "string" && color[0] === "#") ? color : "#0a0a0a"} onChange={(e) => setColor(e.target.value)} aria-label="Свой цвет"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, border: 0, padding: 0, cursor: "pointer" }} />
          </label>
          <span style={{ width: 1, height: 26, background: "var(--line)", flexShrink: 0 }} />
          {/* Чёрный — СТАНДАРТ (чёрно-белая тема): графитовый градиент, выбран по умолчанию. */}
          <button key="black" className="tap" data-haptic="selection" onClick={() => setColor("#0a0a0a")} aria-label="Чёрный (стандарт)"
            style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(180deg, #46464a, #0a0a0a)", border: 0, flexShrink: 0, cursor: "pointer",
              boxShadow: color === "#0a0a0a" ? "0 0 0 2px #fff, 0 0 0 4px #0a0a0a" : "none", transition: "box-shadow 0.15s" }} />
          {BOS_APPLE_COLORS.map((c) => (
            <button key={c} className="tap" data-haptic="selection" onClick={() => setColor(c)} aria-label={BOS_APPLE_COLOR_NAMES[c] || "Цвет"}
              style={{ width: 32, height: 32, borderRadius: "50%", background: c, border: 0, flexShrink: 0, cursor: "pointer",
                boxShadow: color === c ? "0 0 0 2px #fff, 0 0 0 4px " + c : "none", transition: "box-shadow 0.15s" }} />
          ))}
        </div>
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
            <button onClick={() => setGoal(Math.max(1, goal - 1))} className="tap hit44" style={{ width: 32, height: 32, borderRadius: 999, background: "var(--surface-3)", border: 0, display: "grid", placeItems: "center", color: "var(--text-2)" }}><I.Minus size={16} strokeWidth={2.4}/></button>
            <button onClick={() => setGoal(goal + 1)} className="tap hit44" style={{ width: 32, height: 32, borderRadius: 999, background: "var(--surface-3)", border: 0, display: "grid", placeItems: "center", color: "var(--text-2)" }}><I.Plus size={16} strokeWidth={2.4}/></button>
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

/* LIVE knowledge guides — a deepened fork of core INFO_TOPICS. Each topic carries an accent
   colour + a category kicker (NOT a reading time), a richer lede and pull quote, a CTA target,
   and a «next» that loops habits → teams → goals → habits. The teams guide is the new one
   (core never covered командные привычки). Demo keeps reading core INFO_TOPICS untouched. */
const INFO_TOPICS_LIVE = {
  "habits-basics": {
    emoji: "🌱", accent: "#34C759", kicker: "Привычки",
    title: "Основы привычек",
    lede: "Привычки держатся не на силе воли, а на том, чтобы одно маленькое действие давалось почти без усилий — и повторялось каждый день, пока мозг не перестанет спрашивать «зачем». Вот пять опор, на которых стоит любая прижившаяся привычка.",
    sections: [
      { i: "1", h: "Сделай крошечным", b: "Если привычку не вытянуть в самый трудный день — она слишком большая. Две минуты медитации каждый день побеждают полчаса раз в неделю. Сначала закрепи ритуал, потом наращивай — рост придёт сам." },
      { i: "2", h: "Привяжи к якорю", b: "Поставь новую привычку поверх той, что уже есть: «Налил утренний кофе — пишу одну строку в дневник». Старое действие становится спусковым крючком, и не нужно вспоминать — тело само ведёт." },
      { i: "3", h: "Отмечай каждый день", b: "Серия — это видимое обещание самому себе. Отмечай привычку даже в трудный день, пусть по минимуму. Важна не цифра, а непрерывность: пока цепочка цела, ты — тот, кто это делает." },
      { i: "4", h: "Не пропускай дважды", b: "Один пропуск — это просто жизнь. Два подряд — уже новый паттерн. Сорвался? Единственная задача на завтра — появиться, хотя бы в мини-версии. Возвращайся, а не «начинай с понедельника»." },
      { i: "5", h: "Настрой пространство", b: "Кроссовки — у двери. Телефон — в другой комнате. Привычка живёт в окружении: сделай хорошее очевидным и лёгким, а вредное — неудобным и далёким. Среда сильнее мотивации." },
    ],
    pull: "«Ты не поднимаешься до уровня своих целей. Ты падаешь до уровня своих систем.»",
    cta: "Создать привычку",
    next: { topic: "teams-101", t: "Командные привычки", e: "🤝" },
  },
  "goals-101": {
    emoji: "🎯", accent: "#FF9500", kicker: "Цели",
    title: "Ставь хорошие цели",
    lede: "Цель — это вопрос, на который каждый день отвечают твои привычки. Задашь его точно — и ежедневная работа сама знает, что делать. Размытая цель порождает размытые дни.",
    sections: [
      { i: "1", h: "Результат против процесса", b: "«Пробежать марафон» — результат. «Бегать 4 раза в неделю» — процесс. Результат задаёт направление, но двигают тебя процессы. Поставь цель-результат, а отслеживай ежедневный процесс." },
      { i: "2", h: "Сделай измеримой", b: "«Стать здоровее» — желание. «Спать 7,5 часа 6 ночей в неделю к июлю» — цель. Конкретность = измеримо + срок + честно. Если нельзя проверить «достиг или нет» — это ещё не цель." },
      { i: "3", h: "Разбей на недели", b: "Цель на 12 недель — это 12 недельных целей подряд. Гору не пройти одним шагом; раздели её на холмы, каждый из которых берётся за неделю. Близкий рубеж тянет сильнее далёкого." },
      { i: "4", h: "Привяжи одну привычку", b: "У каждой цели должна быть ежедневная опора. Не можешь назвать привычку, что двигает цель вперёд, — цель будет дрейфовать. Привычка — это цель, переведённая на язык сегодняшнего дня." },
      { i: "5", h: "Празднуй половину пути", b: "Середина — настоящий рубеж, а не «ещё столько же». Отметь её. Мозг, получивший награду за усилие, охотнее приходит и завтра. Без маленьких праздников выдыхаются даже большие цели." },
    ],
    pull: "«Результаты — это мечты. Привычки — это действие, у которого есть адрес.»",
    cta: "Поставить цель",
    next: { topic: "habits-basics", t: "Основы привычек", e: "🌱" },
  },
  "teams-101": {
    emoji: "🤝", accent: "#0A84FF", kicker: "Команда",
    title: "Командные привычки",
    lede: "Команда — это маленький круг людей с ОДНОЙ общей привычкой. Разница с личной простая: личную привычку видишь только ты, а командная — часть общей серии, и твою галочку кто-то ждёт. В одиночку легко договориться с собой и пропустить; но когда привычку держит команда, ты приходишь ради других даже в дни, когда не пришёл бы ради себя. Это не про контроль — про то, что рядом кто-то идёт тем же путём.",
    sections: [
      { i: "1", h: "Личная или командная?", b: "Личная привычка — для того, что зависит только от тебя: сон, дневник, утренняя зарядка. Командная — когда результат общий и держаться вместе легче: спорт с семьёй, учёба с друзьями, практики с клиентами тренинга. Правило простое: пропуск задевает только тебя — делай личной; тянете к одной цели вместе — собирай команду." },
      { i: "2", h: "Один якорь на всех", b: "У команды должна быть ОДНА общая главная привычка — то, что каждый делает каждый день. Не десять разных дел, а один общий ритуал. Общий якорь превращает набор людей в команду." },
      { i: "3", h: "Виден каждый", b: "Общая серия показывает, кто сегодня появился. Это мягкая ответственность: не «тебя накажут», а «тебя ждут». Знать, что твоя галочка нужна не только тебе, — сильнее любого будильника." },
      { i: "4", h: "Зови тех, кто рядом по цели", b: "Маленькая команда из тех, кому правда важно, сильнее большой случайной. Зови друзей, которые разделяют именно эту цель. Трое заряженных дадут больше, чем тридцать наблюдателей." },
      { i: "5", h: "Поддержка, не надзор", b: "Чат команды — место подбодрить и порадоваться, а не отчитать. Кто-то сорвался — верни его поддержкой, а не упрёком. Команда, в которую не стыдно вернуться, не разваливается." },
      { i: "6", h: "Победа — общая", b: "Дошли до недельной цели — отметьте это вместе. Общие маленькие победы умножают мотивацию: твой прогресс заряжает других, а их — тебя. Так привычка перестаёт быть обязанностью и становится «нашим делом»." },
    ],
    pull: "«Хочешь идти быстро — иди один. Хочешь идти далеко — идите вместе.»",
    cta: "Создать команду",
    next: { topic: "goals-101", t: "Ставь хорошие цели", e: "🎯" },
  },
};

/* ─── INFO SCREEN — knowledge articles (LIVE) ──────────────────── */
function InfoLive() {
  const { navigate, params } = useNav();
  const topic = INFO_TOPICS_LIVE[params?.topic] || INFO_TOPICS_LIVE["habits-basics"];
  const accent = topic.accent || "#0a0a0a";
  const goCta = () => {
    if (params?.topic === "teams-101") return navigate("community");
    if (params?.topic === "goals-101") return navigate("goal-settings", { mode: "create" });
    return navigate("habit-settings", { mode: "create" });
  };
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title={topic.title} onBack={() => navigate("habits")} />
      {/* Hero — accent-tinted, dark-aware */}
      <div style={{ background: "var(--card)", borderRadius: 22, padding: "22px 20px", boxShadow: "var(--card-shadow)", position: "relative", overflow: "hidden" }}>
        <div aria-hidden style={{ position: "absolute", top: -34, right: -26, width: 150, height: 150, borderRadius: "50%", background: accent, opacity: 0.10, pointerEvents: "none" }} />
        <div style={{ width: 56, height: 56, borderRadius: 16, background: accent + "1f", display: "grid", placeItems: "center", fontSize: 30, marginBottom: 12, position: "relative" }}>{topic.emoji}</div>
        <div style={{ fontSize: 11, color: accent, textTransform: "uppercase", letterSpacing: 1.6, fontWeight: 700, position: "relative" }}>{topic.kicker}</div>
        <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 28, lineHeight: 1.15, letterSpacing: "-0.5px", marginTop: 5, color: "var(--text)", position: "relative" }}>{topic.title}</div>
        <div style={{ fontSize: 15, color: "var(--text-3)", marginTop: 12, lineHeight: 1.55, letterSpacing: "-0.1px", position: "relative" }}>{topic.lede}</div>
      </div>

      {/* Pull quote */}
      <div style={{ background: "#0a0a0a", color: "#fff", borderRadius: 22, padding: "20px 22px", marginTop: 12, position: "relative", overflow: "hidden" }}>
        <div aria-hidden style={{ position: "absolute", top: -10, right: -10, fontSize: 100, opacity: 0.06, fontFamily: "var(--bos-title-font)", lineHeight: 1 }}>"</div>
        <div aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: accent }} />
        <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 18, lineHeight: 1.4, position: "relative" }}>{topic.pull}</div>
      </div>

      {/* Numbered sections */}
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {topic.sections.map((s, i) => (
          <div key={i} style={{ background: "var(--card)", borderRadius: 22, padding: 18, boxShadow: "var(--card-shadow)", display: "flex", gap: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: accent, color: "#fff", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{s.i}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>{s.h}</div>
              <div style={{ fontSize: 14, color: "var(--text-3)", marginTop: 6, lineHeight: 1.55, textWrap: "pretty" }}>{s.b}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button onClick={goCta} className="tap"
        style={{ width: "100%", background: "#0a0a0a", color: "#fff", border: 0, borderRadius: 999, padding: 16, fontSize: 15, fontWeight: 600, marginTop: 18 }}>
        {topic.cta}
      </button>

      {/* Up next */}
      {topic.next && (
        <button onClick={() => navigate("info", { topic: topic.next.topic })} className="tap"
          style={{ marginTop: 12, width: "100%", background: "transparent", border: 0, padding: 0, textAlign: "left" }}>
          <div style={{ background: "var(--card)", borderRadius: 22, padding: 14, display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--card-shadow)" }}>
            <div style={{ width: 38, height: 38, borderRadius: 14, background: "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 20 }}>{topic.next.e}</div>
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

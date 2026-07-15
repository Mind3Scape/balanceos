function TeamDetailLive() {
  const { navigate, params } = useNav();
  const app = useApp();
  const { open: openSheet } = useSheet();
  const passed = params?.team || { _id: "seed-1", name: "Команда создателей", emblem: "✨", accent: "#fef3c7", goal: "50 добрых дел за месяц", date: "1 — 31 дек", progress: 0, members: [] };
  // Откуда пришли в комнату круга — «Назад» и выход возвращают ИМЕННО туда (David: «после выхода
  // из команды кидает не обратно, а на Найти»). Дефолт "community" сохраняет прежнее поведение.
  const from = params?.from || "community";
  // Read the LIVE team from the store so a just-added habit appears immediately.
  const t = (app?.teams || []).find(x => x._id === passed._id) || passed;
  // ЦВЕТА ПОКА ВЫКЛ (David): единое ЕДВА-серое СТЕКЛО для комнаты круга; включим позже.
  const accent = "#EAEAEF";
  const isDark = app?.themeOverride === "dark";
  // The goal MODE — shown as a chip so the team's rule (общий счёт / серия / гонка) is ALWAYS
  // visible, not hidden behind the async cloud progress (David: «не вижу их отражение»).
  const teamModeMeta = ({ collective: { e: "🌊", t: "Общий счёт" }, streak: { e: "🔥", t: "Серия у каждого" }, race: { e: "🏁", t: "Гонка" } })[t.type || "collective"];
  // LIVE = real user: honest data or empty, NEVER fake standings/activity/calendar —
  // even for a team without a cloud link yet.

  // Real team-chat preview + unread badge for LIVE cloud teams. Guarded on the cloud
  // being enabled AND the team having a cloudId — a freshly-created local team has
  // neither yet, so this stays inert until it syncs.
  const _chatLive = !!(window.bosCloud && window.bosCloud.enabled() && t.cloudId);
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
        // SAME time base on both sides (a device clock drifts vs the server, so on skewed
        // phones a Date.now() compare would stick or never show the badge).
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
    // Погасим значок и на ВНЕШНЕЙ плитке круга (сброс общего кэша непрочитанного).
    try { if (t.cloudId && typeof bosTeamUnreadClear === "function") bosTeamUnreadClear(t.cloudId); } catch (e) {}
  };

  // LIVE teams: load the REAL roster (real names + avatars + roles) from the cloud, so the
  // member list is honest — real teammates, no fabricated standings until real progress exists.
  const _rosterLive = !!(window.bosCloud && window.bosCloud.enabled() && t.cloudId);
  const [cloudRoster, setCloudRoster] = React.useState(() => _bosTeamGet("roster:" + t.cloudId));
  const [meId, setMeId] = React.useState(null); // current user's cloud id — to find myself in the roster
  const [rosterTick, setRosterTick] = React.useState(0);
  React.useEffect(() => {
    if (!_rosterLive) { setMeId(null); return; }
    let on = true;
    window.bosCloud.uid().then((id) => { if (on) setMeId(id || null); }).catch(() => {});
    return () => { on = false; };
  }, [_rosterLive, t.cloudId]);
  // «Баланс круга» — опт-аут владельцем (teams.circle_balance_on). По умолчанию ВКЛ; читаем ЖИВОЕ
  // облачное значение, чтобы участники видели ту же настройку, что выставил владелец (локальная копия
  // владельца тоже несёт t.circleBalanceOn мгновенно). До patch_circle_balance_toggle.sql teamById
  // вернёт undefined → `!== false` → раздел показывается (прежнее поведение, graceful).
  const [circleBalOn, setCircleBalOn] = React.useState(t.circleBalanceOn !== false);
  React.useEffect(() => {
    setCircleBalOn(t.circleBalanceOn !== false);
    if (!(window.bosCloud && window.bosCloud.enabled() && t.cloudId && window.bosCloud.teamById)) return;
    let on = true;
    window.bosCloud.teamById(t.cloudId).then((row) => { if (on && row) setCircleBalOn(row.circleBalanceOn !== false); }).catch(() => {});
    return () => { on = false; };
  }, [t.cloudId, t.circleBalanceOn]);
  React.useEffect(() => {
    if (!_rosterLive) return;
    let on = true;
    window.bosCloud.teamMembers(t.cloudId).then((mem) => {
      if (!on || !Array.isArray(mem)) return;
      var palette = BOS_TEAM_PALETTE;
      // owner first, then members, in join order
      var sorted = mem.slice().sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0));
      setCloudRoster(_bosTeamPut("roster:" + t.cloudId, sorted.map((m, i) => ({ id: m.id, name: m.name || "Участник", avatar: m.avatar, role: m.role, initials: (m.name || "У").slice(0, 1).toUpperCase(), color: palette[i % palette.length] }))));
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
  const [liveTeamHabits, setLiveTeamHabits] = React.useState(() => _bosTeamGet("habits:" + t.cloudId));
  const [habitsTick, setHabitsTick] = React.useState(0);
  const [mainProg, setMainProg] = React.useState(() => _bosTeamGet("mainprog:" + t.cloudId)); // per-member day-map for the anchor habit (who did which day)
  const [goalProg, setGoalProg] = React.useState(() => _bosTeamGet("goal:" + t.cloudId)); // team-goal progress COMPUTED from habit marks (current + per-member contribution)
  const [settlements, setSettlements] = React.useState(null); // { user_id: {xp, won} } — team-goal XP payouts (cloud ledger)
  const settledRef = React.useRef(false);                      // settle-once guard (per mount per reached goal)
  React.useEffect(() => {
    if (!_rosterLive || !window.bosCloud.teamHabitsFull) return;
    let on = true;
    window.bosCloud.teamHabitsFull(t.cloudId).then((hs) => { if (on) setLiveTeamHabits(_bosTeamPut("habits:" + t.cloudId, Array.isArray(hs) ? hs : [])); }).catch(() => {});
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
    const _wantOn = !h.doneByMe;
    window.bosCloud.toggleTeamHabitToday(h.id, _wantOn).then((ok) => {
      // Аудит #8: сервер отклонил запись → откатываем оптимистичную отметку, чтобы галочка не
      // «врала» (стоит, а на сервере пусто). При успехе — просто освежаем с сервера.
      if (ok === false) {
        setLiveTeamHabits((list) => (list || []).map((x) => {
          if (x.id !== h.id) return x;
          const cap = Number.isFinite(x.total) ? x.total : (x.doneToday + 1);
          const doneToday = Math.max(0, Math.min(cap, x.doneToday + (_wantOn ? -1 : 1)));
          return { ...x, doneByMe: !_wantOn, doneToday: doneToday };
        }));
        if (window.tgHaptic) { try { window.tgHaptic("error"); } catch (e) {} }
      }
      setHabitsTick((n) => n + 1);
    });
  };
  const addTeamHabitCloud = (h) => { var first = !(liveTeamHabits && liveTeamHabits.length); window.bosCloud.addTeamHabit(t.cloudId, { ...h, isMain: (h && h.isMain) || first }).then(() => setHabitsTick((n) => n + 1)); };

  // ── «ДЕЛА» СОВМЕСТНОЙ ЦЕЛИ (David: «Дела в совместных целях») ──────────────────
  // Автор (владелец) ставит задания; участник отмечает СВОЁ выполнение + видит «кто уже сделал».
  // Кросс-участниковая синхронизация через облако (patch_team_tasks.sql). Пока таблиц нет →
  // teamTasks() вернёт null → _teamTasksAvail=false → раздел ПРЯЧЕТСЯ (живое не ломается).
  const [teamTaskData, setTeamTaskData] = React.useState(() => _bosTeamGet("tasks:" + t.cloudId));
  const [tasksTick, setTasksTick] = React.useState(0);
  const [newTeamTask, setNewTeamTask] = React.useState("");
  React.useEffect(() => {
    if (!_rosterLive || !window.bosCloud.teamTasks) return;
    let on = true;
    window.bosCloud.teamTasks(t.cloudId).then((d) => { if (on && d) setTeamTaskData(_bosTeamPut("tasks:" + t.cloudId, d)); }).catch(() => {});
    return () => { on = false; };
  }, [_rosterLive, t.cloudId, tasksTick]);
  const _teamTasks = (teamTaskData && Array.isArray(teamTaskData.tasks)) ? teamTaskData.tasks : [];
  const _teamTasksAvail = !!(teamTaskData && Array.isArray(teamTaskData.tasks)); // облако вернуло валидную структуру → таблицы есть
  const _teamTasksTotal = (teamTaskData && teamTaskData.total) || 1; // total приходит из teamTasks(); members определён ниже
  const _teamTasksMine = _teamTasks.filter((x) => x.doneByMe).length;
  const toggleMyTeamTask = (tk) => {
    if (!tk || !tk.id) return;
    const next = !tk.doneByMe;
    setTeamTaskData((d) => (d ? { ...d, tasks: (d.tasks || []).map((x) => (x.id === tk.id ? { ...x, doneByMe: next, doneCount: Math.max(0, (x.doneCount || 0) + (next ? 1 : -1)) } : x)) } : d));
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
    window.bosCloud.toggleTeamTaskMine(tk.id, next).then((ok) => {
      if (ok === false) { setTeamTaskData((d) => (d ? { ...d, tasks: (d.tasks || []).map((x) => (x.id === tk.id ? { ...x, doneByMe: !next, doneCount: Math.max(0, (x.doneCount || 0) + (next ? -1 : 1)) } : x)) } : d)); if (window.tgHaptic) { try { window.tgHaptic("error"); } catch (e) {} } }
      setTasksTick((n) => n + 1);
    });
  };
  const addTeamTaskCloud = () => { const tx = newTeamTask.trim(); if (!tx || !window.bosCloud.addTeamTask) return; setNewTeamTask(""); window.bosCloud.addTeamTask(t.cloudId, tx).then(() => setTasksTick((n) => n + 1)); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } };
  const removeTeamTaskCloud = (id) => { if (!window.bosCloud.removeTeamTask) return; setTeamTaskData((d) => (d ? { ...d, tasks: (d.tasks || []).filter((x) => x.id !== id) } : d)); window.bosCloud.removeTeamTask(id).then(() => setTasksTick((n) => n + 1)); };
  // ── Э3 · ПРОСЬБЫ круга: дело с kind='request', на которое откликаются (volunteer_id). ──
  const _plainTasks = _teamTasks.filter((x) => (x.kind || "task") !== "request");
  const _requests = _teamTasks.filter((x) => x.kind === "request");
  const [newTeamRequest, setNewTeamRequest] = React.useState("");
  const addTeamRequestCloud = () => {
    const tx = newTeamRequest.trim(); if (!tx || !window.bosCloud.addTeamTask) return; setNewTeamRequest("");
    window.bosCloud.addTeamTask(t.cloudId, tx, "request").then(() => setTasksTick((n) => n + 1));
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
  };
  const claimRequest = (tk, on) => {
    if (!tk || !tk.id || !window.bosCloud.claimTeamRequest) return;
    setTeamTaskData((d) => (d ? { ...d, tasks: (d.tasks || []).map((x) => (x.id === tk.id ? { ...x, volunteerMe: on, volunteerId: on ? (meId || "me") : null, volunteerName: on ? "Ты" : null } : x)) } : d));
    if (window.tgHaptic) { try { window.tgHaptic(on ? "success" : "light"); } catch (e) {} }
    window.bosCloud.claimTeamRequest(tk.id, on).then((ok) => { if (ok === false) setTasksTick((n) => n + 1); else setTasksTick((n) => n + 1); });
  };
  // A CLOUD team's roster lives in the cloud; the passed-in t.members is a STALE local
  // cache (the «3 снаружи / 0 внутри» mismatch). Until the real roster loads we show a
  // skeleton — NEVER the stale members, which used to flash phantom people for a beat
  // (David: «проскакивает заполненный демо-вариант»). Mirrors the teamHabits gate below.
  const _rosterLoading = _rosterLive && cloudRoster === null;
  const members = _rosterLive ? (cloudRoster || []) : (t.members?.length ? t.members : []);
  const ranked = members; // live: roster order (owner first), no contribution sort
  // Live: real cloud habits when synced, else the team's own habits, else empty.
  const teamHabits = _rosterLive ? (liveTeamHabits || []) : (Array.isArray(t.habits) ? t.habits : []);
  const main = teamHabits.find(h => h.isMain);
  const others = teamHabits.filter(h => !h.isMain);
  // ADOPT — «приходит как личная» (David): командная привычка становится твоей ЛИЧНОЙ (своё
  // время/значок), отмечаешь её на «Привычки», отметка зеркалится в командный счёт (toggleHabit →
  // toggleTeamHabitToday). Линк = поле teamHabitId. ЭТАП 2: дедуп — если уже ведёшь такую, предложить
  // ПРИВЯЗАТЬ существующую (без дубля, серия/время сохранятся). ЕДИНАЯ отметка: адаптированная
  // привычка отмечается через её личную копию (один источник) — никакого прямого team-write.
  const myHabits = app?.habits || [];
  const _todayK = (typeof bosTodayKey === "function") ? bosTodayKey() : new Date().toISOString().slice(0, 10); // ЛОКАЛЬНЫЙ день (совпадает с личным логом + командным слоем; был UTC → «врал» ночью)
  const adoptedFor = (h) => (h && h.id != null) ? myHabits.find((x) => x.teamHabitId === h.id) : null; // id-guard: у офлайн-команды привычки без id — undefined===undefined ложно матчил первую попавшуюся
  const _dupeFor = (h) => h && myHabits.find((x) => !x.teamHabitId && (x.name || "").trim().toLowerCase() === (h.name || "").trim().toLowerCase());
  const _createLinkedHabit = (h) => { app?.addHabit({ name: h.name, emoji: h.emoji, color: h.color || null, teamId: t.cloudId, teamHabitId: h.id, log: {}, days: [1, 1, 1, 1, 1, 1, 1], goalPerDay: (h.goalPerDay || 1), reminder: { on: false, time: "09:00" } }); if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} } };
  const adoptTeamHabit = (h) => {
    if (!h || !h.id || adoptedFor(h)) return;
    const dupe = _dupeFor(h);
    if (dupe) {
      openSheet(<TeamAdoptChoiceLive dupeName={(dupe.name || "").trim()}
        onLink={() => { app?.updateHabit(dupe.id, { teamId: t.cloudId, teamHabitId: h.id }); }}
        onCreate={() => _createLinkedHabit(h)} />);
    } else { _createLinkedHabit(h); }
  };
  // Mark an ADOPTED team habit = toggle its personal copy (single source → mirrors to team_habit_logs).
  const markAdopted = (h) => { const a = adoptedFor(h); if (!a) return; app?.toggleHabit(a.id); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } setHabitsTick((n) => n + 1); };
  const myDone = (h) => { const a = adoptedFor(h); return a ? !!(a.log && a.log[_todayK]) : !!(h && h.doneByMe); };
  // Per-person "who did which day" for the team ANCHOR habit → feeds the SAME month calendar
  // the personal/shared habits use (data already per-user in team_habit_logs). Light poll.
  const _tCalKey = (d, mi) => { const y = new Date().getFullYear(); return y + "-" + String(mi + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0"); };
  const _mainId = main && main.id;
  React.useEffect(() => {
    let on = true;
    if (!_rosterLive || !_mainId || !window.bosCloud.teamHabitProgress) { setMainProg(null); return; }
    const load = () => window.bosCloud.teamHabitProgress(t.cloudId, _mainId).then((d) => { if (on && d && d.members) setMainProg(_bosTeamPut("mainprog:" + t.cloudId, d.members)); }).catch(() => {});
    load(); const iv = setInterval(load, 20000);
    return () => { on = false; clearInterval(iv); };
  }, [_rosterLive, t.cloudId, _mainId, habitsTick]);
  // Team GOAL progress — computed from the habit marks per mode (collective/streak/race).
  React.useEffect(() => {
    let on = true;
    if (!_rosterLive || !t.cloudId || !window.bosCloud.teamGoalProgress) { setGoalProg(null); return; }
    const load = () => window.bosCloud.teamGoalProgress(t.cloudId).then((d) => { if (on && d) setGoalProg(_bosTeamPut("goal:" + t.cloudId, d)); }).catch(() => {});
    load(); const iv = setInterval(load, 20000);
    return () => { on = false; clearInterval(iv); };
  }, [_rosterLive, t.cloudId, habitsTick]);
  // «НЕБО-НИТЬ»: времена сегодняшних отметок (created_at из team_habit_logs — писался всегда,
  // читается впервые) + возраст круга для «N-й день». Тот же лёгкий полл, что и у прогресса.
  const [skyT, setSkyT] = React.useState(() => _bosTeamGet("sky:" + t.cloudId));
  React.useEffect(() => {
    let on = true;
    if (!_rosterLive || !t.cloudId || !window.bosCloud.teamTodayTimes) { setSkyT(null); return; }
    const load = () => window.bosCloud.teamTodayTimes(t.cloudId).then((d) => { if (on && d) setSkyT(_bosTeamPut("sky:" + t.cloudId, d)); }).catch(() => {});
    load(); const iv = setInterval(load, 25000);
    return () => { on = false; clearInterval(iv); };
  }, [_rosterLive, t.cloudId, habitsTick]);
  // Лица на нить: участник появляется в момент своей ПЕРВОЙ отметки за сегодня.
  // МОЁ присутствие ведётся ЛОКАЛЬНОЙ галочкой (doneByMe), не облаком: отметил любую привычку круга
  // → появляюсь СРАЗУ (fresh=pop, пока облако не доехало); снял галочку → исчезаю в реалтайме, даже
  // если облако ещё держит старую метку (David: «нестабильно появлялась/исчезала»).
  const _iDidCircle = (liveTeamHabits || []).some((h) => h.doneByMe);
  const skyMarks = React.useMemo(() => {
    if (!Array.isArray(members)) return [];
    const _t = (skyT && skyT.times) || {};
    const _pt = (x) => (typeof bosParseTs === "function" ? bosParseTs(x) : new Date(x));
    // Все, кроме меня — из облака (первая отметка за сегодня).
    const out = members.filter((m) => m.id !== meId && _t[m.id]).map((m) => ({ id: m.id, name: m.name, avatar: m.avatar, me: false, ts: _pt(_t[m.id]) }));
    const meM = members.find((m) => m.id === meId);
    if (_iDidCircle && meM) {
      const cloudTs = _t[meId];
      out.push({ id: meM.id, name: meM.name, avatar: meM.avatar, me: true, ts: cloudTs ? _pt(cloudTs) : new Date(), fresh: !cloudTs });
    }
    return out;
  }, [skyT, members, meId, _iDidCircle]);
  // «Живёт N-й день» — возраст круга от created_at (стрейк-механика огня — позже).
  const circleAgeDays = (skyT && skyT.createdAt) ? Math.max(1, Math.floor((Date.now() - new Date(skyT.createdAt).getTime()) / 86400000) + 1) : null;
  // PAYOUT — when a STAKED goal is reached, OPEN the bank: idempotently settle MY row (co-op:
  // +stake; race: leader +bank), refresh the global team-goal XP so the level lifts, then read
  // everyone's payouts for the card. Settle runs once per mount (settledRef); the read re-runs on
  // each goalProg poll so other members' payouts appear as they open the team. Unlock-only —
  // nothing is ever deducted, so missing the goal just means the bank never opened.
  React.useEffect(() => {
    if (!_rosterLive || !t.cloudId || !window.bosCloud.settleTeamGoal) return;
    if (!goalProg || !goalProg.done || !(goalProg.stake > 0)) return;
    let on = true;
    const loadSettle = () => window.bosCloud.teamSettlements(t.cloudId).then((s) => { if (on) setSettlements(s || {}); }).catch(() => {});
    if (settledRef.current) { loadSettle(); }
    else {
      settledRef.current = true;
      window.bosCloud.settleTeamGoal(t.cloudId).then((res) => { if (!on) return; loadSettle(); if (res && res.settled && app && app.refreshTeamGoalXP) app.refreshTeamGoalXP(); }).catch(loadSettle);
    }
    return () => { on = false; };
  }, [_rosterLive, t.cloudId, goalProg]);
  // C+D (David): создание/правка общей привычки = ТА ЖЕ полная форма HabitFormSheetLive (teamFor),
  // а не урезанный TeamHabitSheetLive. onSave(data, editId): editId → updateTeamHabit (прогресс НЕ
  // трогаем — логи по team_habit_id), иначе addTeamHabit. onDelete → removeTeamHabit.
  const saveTeamHabit = (data, editId) => {
    if (editId != null) {
      setLiveTeamHabits((list) => (list || []).map((x) => x.id === editId ? Object.assign({}, x, { name: data.name, emoji: data.emoji, color: data.color, goalPerDay: data.goalPerDay, isMain: data.isMain }) : x));
      if (_rosterLive && window.bosCloud && window.bosCloud.updateTeamHabit) {
        window.bosCloud.updateTeamHabit(editId, data).then((ok) => {
          setHabitsTick((n) => n + 1);   // всегда перечитываем: на экране должна быть правда сервера
          // Молчаливый откат — худшее из поведений (David: «поменял иконку, а она через секунду
          // сама вернулась — как странно»). Если сервер правку не принял, так и говорим.
          if (!ok && typeof InfoSheet === "function") {
            openSheet(<InfoSheet title="Правка не сохранилась" dark={isDark} cta="Понятно"
              body="База не приняла изменение общей привычки, поэтому она осталась прежней. Обычно это нехватка прав на правку в круге — сообщи, и мы поправим." />);
          }
        });
      }
      return;
    }
    if (_rosterLive) addTeamHabitCloud(data); else app?.addTeamHabit(t._id, data);
  };
  const removeTeamHabitH = (id) => {
    setLiveTeamHabits((list) => (list || []).filter((x) => x.id !== id));
    if (_rosterLive && window.bosCloud && window.bosCloud.removeTeamHabit) window.bosCloud.removeTeamHabit(id).then(() => setHabitsTick((n) => n + 1));
  };
  const openAddHabit = () => openSheet(<HabitFormSheetLive mode="create" navigate={navigate} teamFor={{ team: t, suggestMain: !(teamHabits && teamHabits.length), onSave: saveTeamHabit, onDelete: removeTeamHabitH }} />);
  const openEditTeamHabit = (h) => openSheet(<HabitFormSheetLive mode="edit" navigate={navigate} habit={{ id: h.id, name: h.name, emoji: h.emoji, color: h.color || null, goalPerDay: h.goalPerDay || 1, duration: 0, isMain: !!h.isMain }} teamFor={{ team: t, onSave: saveTeamHabit, onDelete: removeTeamHabitH }} />);
  // КТО СЕГОДНЯ В ПОТОКЕ — отметившие якорь сегодня (per-member из mainProg) + я, если отметил.
  // Кормит орбиту (планеты загораются) и честный стат «Сегодня».
  const flowSet = {}; (mainProg || []).forEach((m) => { if (m.days && m.days[_todayK]) flowSet[m.id] = true; });
  if (meId && main && main.doneByMe) flowSet[meId] = true;
  const orbitFaces = (Array.isArray(members) ? members : []).map((m) => ({ id: m.id, avatar: m.avatar, name: m.name, done: !!flowSet[m.id] }));
  const inFlowToday = (Array.isArray(members) ? members : []).filter((m) => flowSet[m.id]).length;
  // ПУЛЬС 2.0 (David): кольцо ЧЕЛОВЕКА на орбите = его зона ответственности — доля закрытых
  // ИМ сегодня привычек круга (2 из 5 → 40% дуги), а центральное кольцо = общий счёт команды.
  // Данные бесплатные: teamHabitsFull уже несёт todayUsers (см. cloud.js). Себя считаем
  // ЛОКАЛЬНО (myDone) — кольцо отвечает на отметку мгновенно, без ожидания опроса.
  const _pulseTotal = teamHabits.length || 0;
  const _pulseFor = (f) => {
    if (!_pulseTotal) return null;
    if (meId && f.id === meId) return teamHabits.filter((h) => myDone(h)).length / _pulseTotal;
    if (!teamHabits.some((h) => Array.isArray(h.todayUsers))) return null; // старый кэш/оффлайн → active-фолбэк
    return teamHabits.filter((h) => Array.isArray(h.todayUsers) && h.todayUsers.indexOf(f.id) !== -1).length / _pulseTotal;
  };
  // ── ЕДИНАЯ СТРАНИЦА ЦЕЛИ (David: «команда = та же цель + блок людей») ──
  // Всё, что ниже, — расчёты для вёрстки-близнеца GoalDetailLive: прогресс/банк/выплаты
  // подняты из бывшей мега-карточки, сами данные и опросы выше НЕ менялись.
  const gpd = goalProg;
  const gUnit = (gpd && gpd.unit) || t.unit || "";
  const gTgt = (gpd && gpd.target) || t.target || 0;
  const gCur = gpd ? gpd.current : (t.current != null ? t.current : Math.round((t.progress || 0) * gTgt));
  const gDone = gTgt > 0 && gCur >= gTgt;
  const gp = gTgt > 0 ? Math.min(1, gCur / gTgt) : (t.progress || 0);
  const gRemaining = Math.max(0, gTgt - gCur);
  const gType = (gpd && gpd.type) || t.type || "collective";
  const modeLabel = ({ streak: "Серия у каждого", race: "Гонка — лидер", collective: "Общий счёт" })[gType] || "Общий счёт";
  const contrib = (gpd && Array.isArray(gpd.members)) ? gpd.members : [];
  const isRace = gType === "race";
  const stake = (gpd && gpd.stake) || t.stake || 0;
  const bank = (gpd && gpd.bank) || (stake * Math.max(1, contrib.length || members.length));
  const payFor = (m, i) => {
    if (!gDone || stake <= 0) return 0;
    if (settlements && settlements[m.id]) return settlements[m.id].xp || 0;
    return isRace ? (i === 0 ? bank : 0) : stake;
  };
  const myPay = (gDone && stake > 0) ? contrib.reduce((acc, m, i) => acc + (m.me ? payFor(m, i) : 0), 0) : 0;
  const gStyle = (typeof bosLoadGoalStyle === "function") ? bosLoadGoalStyle() : { orbits: true };
  // Реальный цвет команды красит кольцо/чеки (как g.color у личной); нейтральный → графит.
  const teamColor = (t.accent && ("" + t.accent).toLowerCase() !== "#0a0a0a" && t.accent !== "#8E8E93" && t.accent !== "#EAEAEF") ? t.accent : null;
  const ringInk = teamColor || (isDark ? "#e6e6ea" : "#0a0a0a");
  const card = isDark
    ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }
    : { background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" };
  const CountC = (typeof Count === "function") ? Count : function (p) { return p.value; };
  // David-редизайн детали общей цели: инфа под орбитой → ЧИПЫ; hero тянется до самого верха (как у
  // партнёра), правка/позвать/ЧАТ стеклом справа В hero. desc = заметка создателя (синкается всем
  // через goal.desc), aiChips = 1-2 честных наблюдения по реальному состоянию цели.
  const desc = (gpd && gpd.desc) || t.desc || "";
  const modeMeta = ({ collective: { e: "🌊", t: "Общий счёт" }, streak: { e: "🔥", t: "Серия у каждого" }, race: { e: "🏁", t: "Гонка" } })[gType] || { e: "🌊", t: "Общий счёт" };
  // ЧИПЫ ОБЩЕЙ ЦЕЛИ (David: прогресс НЕ дублируем — его видно по орбите; показываем ПУЛЬС и важные
  // данные круга): сегодня в деле · лидер/топ-вкладчик · банк · люди. gDone → празднуем. Пусто → зов.
  const _peopleWord = function (n) { return (n % 10 === 1 && n % 100 !== 11) ? "человек" : ((n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? "человека" : "человек"); };
  const teamChips = (function () {
    if (gDone) return [{ t: "🎉 Цель достигнута", hot: true }];
    var out = [];
    if (inFlowToday > 0) out.push({ t: "🔥 сегодня " + inFlowToday + " в деле", hot: true });
    var top = null; (contrib || []).forEach(function (m) { if (m && (top === null || m.value > top.value)) top = m; });
    if (top && top.value > 0) out.push({ t: (isRace ? "🏆 лидер " : "⭐ ") + (top.me ? "Ты" : ("" + (top.name || "")).split(" ")[0]) + " · " + top.value + (gUnit ? " " + gUnit : "") });
    if (stake > 0) out.push({ t: "🪙 банк " + bank + " XP" });
    if (!_rosterLoading) out.push({ t: "👥 " + members.length + " " + _peopleWord(members.length) });
    if (!out.length) out.push({ t: "✨ Позовите людей и начните", hot: true });
    return out.slice(0, 4);
  })();
  const H = bosGoalHero(teamColor, isDark);
  const heroBtn = { width: 38, height: 38, borderRadius: "50%", border: 0, display: "grid", placeItems: "center", cursor: "pointer", background: H.btnBg, color: H.btnInk, flexShrink: 0 };
  const heroChip = { display: "inline-flex", alignItems: "center", gap: 4, background: H.chipBg, borderRadius: 999, padding: "5px 11px", fontSize: 12, fontWeight: 600, color: H.chipInk, whiteSpace: "nowrap" };
  const heroChipAI = Object.assign({}, heroChip, { background: H.chipAiBg, color: H.chipAiInk, boxShadow: H.onDark ? "none" : "0 1px 4px rgba(40,60,110,0.12)" });
  const _threadOff = t.threadOff === true || (t.goal && typeof t.goal === "object" && t.goal.threadOff === true);
  const editGoalLike = { _id: t._id, id: t.id, cloudId: t.cloudId, __isTeam: true, __team: t, name: t.name, emoji: t.emblem, color: t.accent, target: t.target, unit: t.unit, deadline: t.date || t.deadline || "", circle: true, type: t.type, vis: t.vis, stake: t.stake, goal: t.goal, desc: desc, joined: t.joined, circleBalanceOn: circleBalOn, threadOff: _threadOff, habitIds: [] };
  // Сводки для свёрнутых секций единого блока (David: «краткая сводка на каждом»).
  const _myDoneCount = teamHabits.filter((h) => myDone(h)).length;
  const _habitWordT = (n) => (n % 10 === 1 && n % 100 !== 11) ? "привычка" : ((n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? "привычки" : "привычек");

  // ── ДЕНЬ КРУГА ЗАКРЫТ → конфетти ────────────────────────────────────────────
  // Считаем ПО СЕБЕ (_myDoneCount), а не по всем участникам: это праздник моего вклада, а не
  // отчёт за круг. Ловит обе ветки отметки — и «прижитую» привычку (через app.toggleHabit), и
  // прямую запись в облако: обе приземляются в _myDoneCount.
  // Празднуем только РОСТ до полного при открытом экране: облачный опрос на каждом входе заново
  // приносит уже закрытый день, и без этого салют бахал бы при каждом заходе в круг.
  const _teamDoneRef = React.useRef(null);
  React.useEffect(() => {
    const prev = _teamDoneRef.current;
    _teamDoneRef.current = _myDoneCount;
    if (prev == null) return;
    if (_myDoneCount <= prev) return;
    if (!teamHabits.length || _myDoneCount !== teamHabits.length) return;
    if (typeof window.bosCelebrateScope !== "function") return;
    if (!window.bosCelebrateScope("circle:" + (app?.persistId || "") + ":" + (t.cloudId || t._id || t.id))) return;
    // «+30 идеальный день» — ТЕМ ЖЕ ключом дня, что и у главной доски: подарок один на день,
    // какую бы доску ты ни закрыл первой (grantBonusXP идемпотентен по ключу).
    if (app?.grantBonusXP && typeof bosTodayKey === "function") app.grantBonusXP("perfectday:" + bosTodayKey(), 30);
  }, [_myDoneCount, teamHabits.length]);
  // ── ЦЕЛЬ С ТАБАМИ (макет «Цель с табами», David) ──────────────────────────────
  // Одна страница, три состояния: Обзор · Привычки · Чат. Шапка (кольцо-заряд + имя +
  // строка «прогресс · огонь · люди») постоянна; тумблер живёт в блоке содержимого.
  const [tab, setTab] = React.useState("habits"); // David: открываем сразу на «Привычки»
  const chatMode = tab === "chat";
  const unread = (_chatLive && chatPeek && chatPeek.unread) ? chatPeek.unread : 0;
  const pct = Math.round(gp * 100);
  // «огонь» = доля круга, что уже отметилась сегодня (живая, из потока), а не выдуманный %.
  const firePct = (members.length && !_rosterLoading) ? Math.round((inFlowToday / members.length) * 100) : null;
  const headParts = [pct + "%"]
    .concat(firePct != null ? ["огонь " + firePct + "%"] : [])
    .concat(!_rosterLoading ? [members.length + " " + _peopleWord(members.length)] : []);
  const ringCirc = 2 * Math.PI * 26;
  const ringColor = teamColor || "#EF9F14"; // золото-оранж (палитра chrome: бел/чёрн/золото)
  // Круглые стеклянные кнопки чрома (правка/позвать) — настоящий frosted-glass, как остальной хром.
  const _glass = (typeof bosGlassChrome === "function") ? bosGlassChrome(isDark) : {};
  const navBtn = { ..._glass, width: 42, height: 42, borderRadius: 999, border: 0, display: "grid", placeItems: "center", color: isDark ? "#fff" : "#0a0a0a", cursor: "pointer", flexShrink: 0 };
  const _inTG = (typeof window !== "undefined" && window.__TG); // в Telegram есть родная «назад» — свою прячем
  const tabItem = (on) => ({ flex: 1, textAlign: "center", borderRadius: 999, padding: "9px 0", fontSize: 14, fontWeight: on ? 700 : 600, color: on ? "var(--text)" : "var(--text-4)", background: on ? (isDark ? "rgba(255,255,255,0.14)" : "#fff") : "transparent", boxShadow: on ? "0 1px 2px rgba(35,44,93,.06), 0 1px 1px rgba(0,0,0,.04)" : "none", cursor: "pointer", border: 0, fontFamily: "inherit", transition: "background .15s, color .15s" });
  const contentCard = { ...card, borderRadius: 22, padding: 16, marginTop: 12 };
  // Одна строка привычки (макет Ц2): значок + имя/подпись слева, ЧЕКБОКС-отметка СПРАВА.
  // «Вести у себя»/усыновление временно убрано (David: воскресим позже) — тут только отметка круга.
  const renderHabitRow = (h, i) => {
    const done = myDone(h);
    const adopted = adoptedFor(h);
    const markInTeam = () => (adopted ? markAdopted(h) : toggleMyTeamHabit(h));
    return (
      <div key={h.id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 2px", borderTop: i ? "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "var(--line)") : 0 }}>
        <span style={{ width: 34, height: 34, borderRadius: 12, background: h.color ? h.color + "26" : (isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)"), display: "grid", placeItems: "center", fontSize: 17, flexShrink: 0 }}>{bosIcon(h.emoji, 18, h.color)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, color: "var(--text)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}{adopted && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-4)", marginLeft: 7 }}>· у себя</span>}</div>
          <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 1 }}>
            {h.isMain && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginRight: 7 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#EF9F14", display: "inline-block" }} />Якорь</span>}
            {(h.doneToday != null && h.total != null) ? (h.doneToday + " из " + h.total + " сегодня") : "общая привычка"}
          </div>
        </div>
        {_isOwner && (
          <button onClick={() => openEditTeamHabit(h)} className="tap" data-haptic="selection" aria-label="Изменить общую привычку" style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 999, border: 0, background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)", display: "grid", placeItems: "center", color: "var(--text-3)", cursor: "pointer" }}><I.Pencil size={14} strokeWidth={2} /></button>
        )}
        {/* ЧЕКБОКС-отметка — справа (макет). Локальный круг без облака: неактивный кружок. */}
        {_rosterLive ? (
          <button onClick={markInTeam} className="tap" aria-label="Отметить сегодня"
            style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, border: 0, display: "grid", placeItems: "center", cursor: "pointer",
              background: done ? (h.color || ringInk) : (isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)"),
              boxShadow: done ? "none" : "inset 0 0 0 1.5px " + (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.16)") }}>
            {done && <I.Check size={15} strokeWidth={3} color="#fff" />}
          </button>
        ) : (
          <span aria-hidden style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)", boxShadow: "inset 0 0 0 1.5px " + (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.16)") }} />
        )}
      </div>
    );
  };

  return (
    // На вкладке «Чат» страница = полноэкранная flex-колонка (как чат ИИ): низ-композер сам
    // прилипает к клавиатуре. Bleed'им ТОЛЬКО нижние 30px дизайн-паддинга (как AIChatLive),
    // но НЕ safe-area — иначе композер уезжает под home-indicator/клавиатуру и обрезается (David).
    <div className="page-in" style={chatMode ? { padding: "0 16px", height: "calc(100% + 30px)", marginBottom: "-30px", display: "flex", flexDirection: "column", overflow: "hidden" } : { padding: "0 16px 24px" }}>
      {/* НАВИГАЦИЯ: только действия справа — правка(владелец) + позвать. «Назад» не рисуем:
          в Telegram есть родная кнопка (David); в браузере/PWA даём запасную стеклянную слева. */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, minHeight: 42, flexShrink: 0 }}>
        {_inTG
          ? <span />
          : <button onClick={() => navigate(from)} className="tap" aria-label="Назад" style={navBtn}><I.ChevronLeft size={20} strokeWidth={2.4} /></button>}
        <div style={{ display: "flex", gap: 8 }}>
          {_isOwner && <button onClick={() => openSheet(<GoalFormSheetLive mode="edit" circleOn={true} navigate={navigate} returnTo={from} goal={editGoalLike} />)} className="tap" data-haptic="selection" aria-label="Настройки цели" style={navBtn}><I.Pencil size={16} strokeWidth={2} /></button>}
          <button onClick={() => openSheet(<TeamShareSheetLive team={t} />)} className="tap" data-haptic="selection" aria-label="Позвать в круг" style={navBtn}><I.Share size={16} strokeWidth={2} /></button>
        </div>
      </div>

      {/* ШАПКА — постоянна. На «Чате» — КОМПАКТНАЯ строка (маленькое кольцо + имя), чтобы чат
          получил почти весь экран как чат ИИ и не «сжимался» при клавиатуре (David). */}
      {chatMode ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 2px 8px", flexShrink: 0 }}>
          <div style={{ position: "relative", width: 34, height: 34, flexShrink: 0 }}>
            <svg width="34" height="34" viewBox="0 0 58 58">
              <circle cx="29" cy="29" r="26" fill="none" stroke={isDark ? "rgba(255,255,255,0.12)" : "#efefef"} strokeWidth="5" />
              {gp > 0 && <circle cx="29" cy="29" r="26" fill="none" stroke={ringColor} strokeWidth="5" strokeLinecap="round" strokeDasharray={(gp * ringCirc) + " " + ringCirc} transform="rotate(-90 29 29)" />}
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 15, lineHeight: 1 }}>{bosIcon(t.emblem || "👥", 15, null)}</div>
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.3px", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
        </div>
      ) : (
        <div style={{ ...card, borderRadius: 22, padding: 18, display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <div style={{ position: "relative", width: 58, height: 58, flexShrink: 0 }}>
            <svg width="58" height="58" viewBox="0 0 58 58">
              <circle cx="29" cy="29" r="26" fill="none" stroke={isDark ? "rgba(255,255,255,0.12)" : "#efefef"} strokeWidth="4" />
              {gp > 0 && <circle cx="29" cy="29" r="26" fill="none" stroke={ringColor} strokeWidth="4" strokeLinecap="round" strokeDasharray={(gp * ringCirc) + " " + ringCirc} transform="rotate(-90 29 29)" style={{ transition: "stroke-dasharray .6s ease", ...(gDone ? { filter: "drop-shadow(0 0 5px " + ringColor + "80)" } : {}) }} />}
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 24, lineHeight: 1 }}>{bosIcon(t.emblem || "👥", 24, null)}</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.5px", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
            <div style={{ fontSize: 13, color: "var(--text-4)", marginTop: 2 }}>{headParts.join(" · ")}</div>
          </div>
        </div>
      )}

      {/* СОДЕРЖИМОЕ + ТУМБЛЕР: табы живут внутри блока (макет). На «Чате» блок тянется на всю
          оставшуюся высоту (flex:1), чтобы лента заполняла экран, а композер сел на низ.
          Bleed нижнего паддинга страницы (−30) — чтобы отыграть ещё высоты под ленту. */}
      <div style={chatMode ? { ...contentCard, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", marginTop: 0, paddingBottom: 8 } : contentCard}>
        <div style={{ display: "flex", background: isDark ? "rgba(255,255,255,0.06)" : "#efefef", borderRadius: 999, padding: 5, gap: 4, flexShrink: 0 }}>
          <button style={tabItem(tab === "overview")} onClick={() => setTab("overview")} className="tap" data-haptic="selection">Обзор</button>
          <button style={tabItem(tab === "habits")} onClick={() => setTab("habits")} className="tap" data-haptic="selection">Привычки</button>
          <button style={tabItem(tab === "chat")} onClick={() => { setTab("chat"); markChatRead(); }} className="tap" data-haptic="selection">{unread ? "Чат · " + unread : "Чат"}</button>
        </div>

        {/* ── ОБЗОР — орбита + контекст + описание. Коробка ЗАМЕТНО больше самой орбиты, чтобы
            спутники-лица помещались целиком и НЕ обрезались тумблером сверху / текстом снизу
            (David: «увеличь блок, чтобы орбиты помещались хорошо»). Без overflow-обрезки. ── */}
        {tab === "overview" && (
          <div style={{ textAlign: "center", paddingTop: 22 }}>
            {gStyle.orbits ? (
              <div style={{ width: 236, height: 236, margin: "15px auto 15px", display: "grid", placeItems: "center" }}>
                <GoalOrbitMini centerEmoji={t.emblem || "👥"} centerColor={teamColor}
                  habits={teamHabits.map((h) => ({ emoji: h.emoji, color: h.color, done: myDone(h) }))}
                  people={orbitFaces.map((f) => ({ avatar: f.avatar, name: f.name, active: f.done, progress: _pulseFor(f) }))}
                  size={200} dark={isDark} progress={gp} />
              </div>
            ) : (
              <div style={{ position: "relative", width: 150, height: 150, margin: "0 auto" }}>
                <svg width="150" height="150" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="70" cy="70" r="54" fill="none" stroke={isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.08)"} strokeWidth="13" />
                  {gp > 0 && <circle cx="70" cy="70" r="54" fill="none" stroke={ringInk} strokeWidth="13" strokeLinecap="round" strokeDasharray={2 * Math.PI * 54} strokeDashoffset={2 * Math.PI * 54 * (1 - gp)} style={{ transition: "stroke-dashoffset 0.6s ease" }} />}
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 36, lineHeight: 1 }}>{bosIcon(t.emblem || "👥", 34, null)}</div>
              </div>
            )}
            <div style={{ fontSize: 13.5, color: "var(--text-4)", marginTop: 18 }}>{modeMeta.e} {modeMeta.t} · {t.vis === "public" ? "🌐 Открытая" : "🔒 Приватная"}{circleAgeDays ? " · живёт " + circleAgeDays + "-й день" : ""}</div>
            {desc ? <div style={{ fontSize: 14.5, color: "var(--text-3)", lineHeight: 1.5, margin: "10px auto 2px", maxWidth: 300 }}>{desc}</div> : null}
          </div>
        )}

        {/* ── ПРИВЫЧКИ — список привычек круга (люди + календарь идут отдельными блоками ниже) ── */}
        {tab === "habits" && (
          <div style={{ marginTop: 6 }}>
            {[main].concat(others).filter(Boolean).map((h, i) => renderHabitRow(h, i))}
            {teamHabits.length === 0 && (
              <div style={{ padding: "14px 2px 2px", fontSize: 13, color: "var(--text-4)", lineHeight: 1.5 }}>{_isOwner ? "Пока нет общих привычек. Добавь первую — она станет якорем цели." : "Пока нет общих привычек — их добавляет создатель цели."}</div>
            )}
            {_isOwner && (
              <button className="tap" onClick={openAddHabit}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 2px", borderTop: teamHabits.length ? "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "var(--line)") : 0, background: "transparent", border: 0, color: "var(--text-2)", cursor: "pointer" }}>
                <span style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", border: "1.5px dashed " + (isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.18)") }}><I.Plus size={15} strokeWidth={2.4} color={isDark ? "#fff" : "var(--text-2)"} /></span>
                <span style={{ fontSize: 14.5, fontWeight: 600 }}>Привычка для этой цели</span>
              </button>
            )}
          </div>
        )}

        {/* ── ЧАТ — лента круга прямо тут. Держим СМОНТИРОВАННЫМ всегда (display), чтобы при
            возврате на вкладку не мигало «пусто → прогрузка» и блок не скакал (David).
            На активной вкладке — flex:1, чтобы лента заполнила экран, композер сел на низ. ── */}
        <div style={{ marginTop: 12, display: chatMode ? "flex" : "none", flexDirection: "column", flex: chatMode ? 1 : "none", minHeight: 0 }}>
          {typeof TeamChatLive === "function"
            ? <TeamChatLive embed active={chatMode} team={t}
                sysEvents={[].concat(
                  (skyT && skyT.createdAt) ? [{ kind: "created", ts: new Date(skyT.createdAt).getTime() }] : [],
                  (skyMarks || []).map((m) => ({ kind: "mark", ts: (m.ts instanceof Date ? m.ts.getTime() : new Date(m.ts).getTime()), name: m.me ? "Ты" : ("" + (m.name || "")).split(" ")[0], me: !!m.me })))} />
            : <div style={{ padding: "20px 2px", fontSize: 13, color: "var(--text-4)", textAlign: "center" }}>Чат недоступен</div>}
        </div>
      </div>

      {/* Люди + календарь — отдельный блок под табами (только на вкладке «Привычки», макет Ц2).
          Тап по лицу фильтрует календарь на человека. Живёт только у облачных кругов. */}
      {tab === "habits" && _rosterLive && (
        <BosBlock name="team-people-calendar">
          {/* Заявки на вступление — владельцу, только когда есть ожидающие (иначе экран = макет). */}
          {_isOwner && pending.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div className="section-label">Заявки на вступление ({pending.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {pending.map((p) => (
                  <div key={p.id} style={{ ...card, borderRadius: 22, padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
                    <BuddyFaceLive avatar={p.avatar} name={p.name} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{p.name || "Гость"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 1 }}>хочет вступить</div>
                    </div>
                    <button onClick={() => approveReq(p.id)} className="tap" style={{ flexShrink: 0, background: "var(--cta, #0a0a0a)", color: "var(--cta-ink, #fff)", border: 0, borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 600 }}>Принять</button>
                    <button onClick={() => rejectReq(p.id)} className="tap" aria-label="Отклонить" style={{ flexShrink: 0, background: "var(--surface-3)", color: "var(--text-3)", border: 0, borderRadius: 999, width: 34, height: 34, fontSize: 16, lineHeight: 1 }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <CirclePeopleCalendarBlockLive mainProg={mainProg} members={members} meId={meId} navigate={navigate}
            teamName={t.name} isDark={isDark} accent={ringInk} />
          {/* Позвать людей — один спокойный CTA под блоками (макет «КРУГ — идеал»). */}
          <button onClick={() => openSheet(<TeamShareSheetLive team={t} />)} className="tap" style={{ width: "100%", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", border: 0, borderRadius: 22, background: "var(--card)", boxShadow: "var(--card-shadow)", color: "var(--text-2)", cursor: "pointer", fontSize: 14.5, fontWeight: 600 }}>
            <span style={{ width: 26, height: 26, borderRadius: "50%", display: "grid", placeItems: "center", border: "1.5px dashed " + (isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.18)") }}><I.Plus size={14} strokeWidth={2.4} color={isDark ? "#fff" : "var(--text-2)"} /></span>
            Позвать людей
          </button>
        </BosBlock>
      )}

      {/* «Покинуть цель» убрана (David): выйти = зажать круг на главной и удалить у себя —
          это и есть покидание. Отдельная красная кнопка внутри не нужна. */}
    </div>
  );
}

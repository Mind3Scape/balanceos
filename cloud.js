/* BalanceOS — cloud layer (T1).  window.bosCloud
   Local-first: the app works fully offline via store.js. This syncs on top when
   Supabase is configured AND the user is signed in. EVERYTHING here is guarded —
   any cloud failure degrades silently to local-only, so the app never breaks.

   Identity:
     • inside Telegram → real account via the tg-auth Edge Function (validated initData)
     • in a browser    → anonymous account (so web visitors still persist + sync)
*/
(function () {
  var URL = (window.SUPABASE_URL || "").replace(/\/$/, "");
  var KEY = window.SUPABASE_ANON_KEY || "";
  var sb = null, _uid = null;

  function client() {
    if (sb) return sb;
    if (!URL || !KEY || !window.supabase || !window.supabase.createClient) return null;
    try { sb = window.supabase.createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true } }); }
    catch (e) { sb = null; }
    return sb;
  }
  function inTelegram() { try { return !!(window.__TG && window.__TG.initData); } catch (e) { return false; } }

  async function currentUser() {
    var c = client(); if (!c) return null;
    try { var r = await c.auth.getUser(); return (r && r.data && r.data.user) || null; } catch (e) { return null; }
  }
  async function uid() {
    if (_uid) return _uid;
    var u = await currentUser(); _uid = u ? u.id : null; return _uid;
  }

  // Sign in (idempotent). referredBy = id of the person whose invite link brought you.
  async function signIn(referredBy) {
    var c = client(); if (!c) return null;
    var existing = await currentUser(); if (existing) { _uid = existing.id; try { flushQueue(); } catch (e) {} return existing; }
    if (inTelegram()) {
      try {
        var resp = await fetch(URL + "/functions/v1/tg-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + KEY, "apikey": KEY },
          body: JSON.stringify({ initData: window.__TG.initData, referredBy: referredBy || null }),
        });
        var j = await resp.json();
        if (j && j.email && j.otp) {
          var v = await c.auth.verifyOtp({ email: j.email, token: j.otp, type: "email" });
          if (v && v.data && v.data.user) { _uid = v.data.user.id; return v.data.user; }
        }
      } catch (e) { /* fall through to local */ }
      return null;
    }
    try { var a = await c.auth.signInAnonymously(); if (a && a.data && a.data.user) { _uid = a.data.user.id; return a.data.user; } }
    catch (e) {}
    return null;
  }

  async function loadProfile() {
    var c = client(); var id = await uid(); if (!c || !id) return null;
    try { var r = await c.from("profiles").select("username,avatar,referred_by").eq("id", id).maybeSingle(); return r.data || null; }
    catch (e) { return null; }
  }
  async function saveProfile(p) {
    var c = client(); var id = await uid(); if (!c || !id) return false;
    try { var r = await c.from("profiles").update({ username: (p && p.username) || "", avatar: (p && p.avatar) || null }).eq("id", id); return !r.error; }
    catch (e) { return false; }
  }
  // People you've brought in (orbit): profiles referred by you, in invite order.
  async function invitedPeople() {
    var c = client(); var id = await uid(); if (!c || !id) return [];
    try { var r = await c.from("profiles").select("id,username,avatar,created_at").eq("referred_by", id).order("created_at", { ascending: true }); return r.data || []; }
    catch (e) { return []; }
  }
  // My short, pretty referral code (profiles.ref_code). Null if the column/code isn't there
  // yet (before patch_ref_codes.sql is run) — callers fall back to the raw uid via inviteCode().
  var _refCode = null;
  async function refCode() {
    if (_refCode) return _refCode;
    var c = client(); var id = await uid(); if (!c || !id) return null;
    try { var r = await c.from("profiles").select("ref_code").eq("id", id).maybeSingle(); _refCode = (r.data && r.data.ref_code) || null; return _refCode; }
    catch (e) { return null; }
  }
  // The token for an invite link: the pretty ref_code when available, else the raw uid (so
  // links keep working before the patch is deployed). tg-auth resolves either.
  async function inviteCode() {
    try { var c = await refCode(); if (c) return c; } catch (e) {}
    try { return await uid(); } catch (e) { return null; }
  }
  async function signOut() { var c = client(); _uid = null; _q = []; _qSave(); if (c) { try { await c.auth.signOut(); } catch (e) {} } }

  // ── DURABLE WRITE QUEUE ─────────────────────────────────────────────────────
  // Local-first stays the source of truth; cloud writes are a background mirror. A flaky network used
  // to drop a mirror write SILENTLY (fire-and-forget) → cloud quietly diverged. Now a FAILED write is
  // queued (persisted to localStorage so it survives a reload), COALESCED BY KEY (newest desired state
  // per key replaces the old → no pile-up), and retried on `online`, on app foreground, on sign-in, and
  // after any successful write (network is clearly up). Every op is an idempotent upsert/delete, so
  // replay is always safe. Per-user: cleared on signOut; the CURRENT uid is used at replay time.
  var QKEY = "bos_sync_queue_v1";
  var _q = [];
  try { _q = JSON.parse(localStorage.getItem(QKEY) || "[]"); if (!Array.isArray(_q)) _q = []; } catch (e) { _q = []; }
  function _qSave() { try { localStorage.setItem(QKEY, JSON.stringify(_q)); } catch (e) {} }
  function _qAdd(op) {
    _q = _q.filter(function (o) { return o.key !== op.key; });           // latest state per key wins
    if (op.type === "deleteHabit") _q = _q.filter(function (o) { return o.key !== "upsertHabit:" + op.args.cloudId; }); // delete supersedes a pending create
    if (op.type === "deleteGoal")  _q = _q.filter(function (o) { return o.key !== "upsertGoal:" + op.args.cloudId; });
    _q.push(op); _qSave();
  }
  // The ONE place that performs each cloud write — used both for the live write AND for replay.
  async function runOp(op) {
    var c = client(); var id = await uid(); if (!c || !id) return false;
    var a = op.args || {};
    try {
      switch (op.type) {
        case "habitLog":
          if (a.on) { var r = await c.from("habit_logs").upsert({ habit_id: a.cloudId, user_id: id, day: a.day }, { onConflict: "habit_id,day", ignoreDuplicates: true }); return !r.error; }
          { var rd = await c.from("habit_logs").delete().eq("habit_id", a.cloudId).eq("day", a.day); return !rd.error; }
        case "upsertHabit": { var ru = await c.from("habits").upsert({ id: a.cloudId, user_id: id, data: a.data, sort: a.sort || 0 }, { onConflict: "id" }); return !ru.error; }
        case "deleteHabit": { var rh = await c.from("habits").delete().eq("id", a.cloudId); return !rh.error; }
        case "upsertGoal":  { var rg = await c.from("goals").upsert({ id: a.cloudId, user_id: id, data: a.data, sort: a.sort || 0 }, { onConflict: "id" }); return !rg.error; }
        case "deleteGoal":  { var rdg = await c.from("goals").delete().eq("id", a.cloudId); return !rdg.error; }
        case "sharedLog":
          if (a.on) { var rs = await c.from("shared_habit_logs").upsert({ code: a.code, user_id: id, day: a.day }, { onConflict: "code,user_id,day", ignoreDuplicates: true }); return !rs.error; }
          { var rsd = await c.from("shared_habit_logs").delete().eq("code", a.code).eq("user_id", id).eq("day", a.day); return !rsd.error; }
        case "snapshot": {
          var rp = await c.from("user_state").upsert({ id: id, snapshot: a.env, updated_at: new Date().toISOString() }, { onConflict: "id" });
          if (!rp.error) return true;
          var rp2 = await c.from("profiles").update({ snapshot: a.env }).eq("id", id); return !rp2.error; // pre-patch fallback
        }
      }
    } catch (e) { return false; }
    return false;
  }
  // Try an op now; on failure queue it for retry. On success, drain any backlog (the network is up).
  async function _durable(op) {
    var ok = await runOp(op);
    if (ok) { if (_q.length) { flushQueue(); } return true; }
    _qAdd(op); return false;
  }
  var _flushing = false;
  async function flushQueue() {
    if (_flushing || !_q.length || !client()) return;
    _flushing = true;
    try {
      var pending = _q.slice();
      for (var i = 0; i < pending.length; i++) {
        var ok = await runOp(pending[i]);
        if (ok) { var k = pending[i].key; _q = _q.filter(function (o) { return o.key !== k; }); _qSave(); }
        else break; // still failing (offline / server down) — keep the rest for the next trigger
      }
    } catch (e) {} finally { _flushing = false; }
  }
  try {
    window.addEventListener("online", function () { flushQueue(); });
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") flushQueue(); });
  } catch (e) {}

  // ── D2 · cross-device snapshot ──────────────────────────────────────────────
  // The whole life-blob (habits, goals, teams, mood history, widgets…) is mirrored
  // into a single `snapshot jsonb` column on the user's profile row. Last-write-wins
  // by device save-time. If the column doesn't exist yet (David hasn't run the 1-line
  // ALTER), these just return false/null and the app stays perfectly local — no break.
  // PRIVATE mirror: the life-blob (incl. the journal) lives in user_state (RLS = owner only), NOT the
  // world-readable profiles table; runOp("snapshot") falls back to the old profiles column pre-patch.
  // DURABLE + coalesced under the single key "snapshot" → only the LATEST blob is ever retried
  // (last-write-wins, which is the blob's semantics), so the journal can't be silently lost.
  async function saveSnapshot(data) {
    var env = { savedAt: Date.now(), data: data || {} };
    return _durable({ type: "snapshot", key: "snapshot", args: { env: env } });
  }
  async function loadSnapshot() {
    var c = client(); var id = await uid(); if (!c || !id) return null;
    try {
      var r = await c.from("user_state").select("snapshot").eq("id", id).maybeSingle();
      if (!r.error && r.data && r.data.snapshot) return r.data.snapshot; // { savedAt, data }
    } catch (e) {}
    try { var r2 = await c.from("profiles").select("snapshot").eq("id", id).maybeSingle(); return (r2 && r2.data && r2.data.snapshot) || null; } catch (e2) { return null; }
  }

  // ── ЛИЧНЫЕ ПРИВЫЧКИ/ЦЕЛИ как строки (растущие отметки вынесены из блоба) ─────
  // Приложение остаётся local-first (телефон хранит привычки целиком); сюда уезжают
  // строки. loadHabits/loadGoals: null = не смог прочитать (звонящий оставит локальные
  // данные), [] = реально пусто. cloudId = стабильный облачный ключ привычки.
  async function loadHabits() {
    var c = client(); var id = await uid(); if (!c || !id) return null;
    try {
      // STABLE order: sort, then created_at — without the created_at tiebreak, habits that share
      // the default sort=0 come back in arbitrary order every fetch → they «swap places» on each
      // app open (David: «привычки меняются местами когда захожу/выхожу»). created_at = creation order.
      var hs = await c.from("habits").select("id,data,sort,created_at").order("sort", { ascending: true }).order("created_at", { ascending: true });
      if (hs.error) return null;
      var lg = await c.from("habit_logs").select("habit_id,day");
      var rows = (lg && lg.data) || [];
      return (hs.data || []).map(function (h) {
        var log = {};
        rows.forEach(function (r) { if (r.habit_id === h.id) log["" + r.day] = true; });
        return Object.assign({}, h.data || {}, { cloudId: h.id, sort: h.sort || 0, log: log });
      });
    } catch (e) { return null; }
  }
  // Writes are DURABLE now: try immediately, queue-and-retry on failure (see runOp/_durable). Strip
  // local-only fields before mirroring; the queued args carry exactly what runOp re-sends.
  async function upsertHabit(h) {
    if (!h || !h.cloudId) return false;
    var data = Object.assign({}, h); delete data.id; delete data.cloudId; delete data.log; delete data.done; delete data.streak; delete data.sort;
    return _durable({ type: "upsertHabit", key: "upsertHabit:" + h.cloudId, args: { cloudId: h.cloudId, data: data, sort: h.sort || 0 } });
  }
  async function deleteHabit(cloudId) {
    if (!cloudId) return false;
    return _durable({ type: "deleteHabit", key: "deleteHabit:" + cloudId, args: { cloudId: cloudId } });
  }
  // Toggle ONE day's mark (idempotent — the (habit_id,day) PK makes re-tap safe).
  async function toggleHabitLog(cloudId, day, on) {
    if (!cloudId || !day) return false;
    return _durable({ type: "habitLog", key: "habitLog:" + cloudId + ":" + day, args: { cloudId: cloudId, day: day, on: !!on } });
  }
  async function loadGoals() {
    var c = client(); var id = await uid(); if (!c || !id) return null;
    try {
      var gs = await c.from("goals").select("id,data,sort,created_at").order("sort", { ascending: true }).order("created_at", { ascending: true });
      if (gs.error) return null;
      return (gs.data || []).map(function (g) { return Object.assign({}, g.data || {}, { cloudId: g.id, sort: g.sort || 0 }); });
    } catch (e) { return null; }
  }
  async function upsertGoal(g) {
    if (!g || !g.cloudId) return false;
    var data = Object.assign({}, g); delete data.id; delete data.cloudId; delete data.sort;
    return _durable({ type: "upsertGoal", key: "upsertGoal:" + g.cloudId, args: { cloudId: g.cloudId, data: data, sort: g.sort || 0 } });
  }
  async function deleteGoal(cloudId) {
    if (!cloudId) return false;
    return _durable({ type: "deleteGoal", key: "deleteGoal:" + cloudId, args: { cloudId: cloudId } });
  }

  // ── D3 · команды в облаке (создать / найти / вступить) ──────────────────────
  async function myTeamIds() {
    var c = client(); var id = await uid(); if (!c || !id) return [];
    try { var r = await c.from("team_members").select("team_id").eq("user_id", id).neq("role", "pending"); return (r.data || []).map(function (m) { return m.team_id; }); }
    catch (e) { return []; }
  }
  // Create a real cloud team (you become owner + first member). Returns the row (with id).
  async function createTeam(t) {
    var c = client(); var id = await uid(); if (!c || !id) return null;
    // E: prefer the SECURITY DEFINER function (owner + first member atomically). Falls back
    // to the old direct insert if the function isn't deployed yet → no breakage pre-SQL.
    var row = null;
    try {
      var rpc = await c.rpc("create_team", { p_name: (t && t.name) || "Команда", p_emblem: (t && t.emblem) || "✨", p_vis: (t && t.vis) || "private", p_goal_kind: (t && t.goalKind) || null, p_goal_target: (t && t.goalTarget) || null });
      if (!rpc.error && rpc.data) row = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
    } catch (e) {}
    if (!row) {
      try {
        var ins = await c.from("teams").insert({ name: (t && t.name) || "Команда", emblem: (t && t.emblem) || "✨", vis: (t && t.vis) || "private", owner_id: id, goal_kind: (t && t.goalKind) || null, goal_target: (t && t.goalTarget) || null }).select().single();
        if (!ins.error && ins.data) { row = ins.data; await c.from("team_members").insert({ team_id: row.id, user_id: id, role: "owner" }); }
      } catch (e) {}
    }
    // Store the GOAL CONFIG ({type,target,unit,title}) so team-goal progress can be COMPUTED
    // from the habit marks per mode (collective/streak/race). No-op until patch_team_goal.sql
    // adds the column — the team still works without it.
    if (row && row.id && t && t.goal) { try { await c.from("teams").update({ goal: t.goal }).eq("id", row.id); } catch (e) {} }
    return row;
  }
  // Public teams you're NOT in yet (with member counts) — the discovery list.
  async function discoverTeams() {
    var c = client(); var id = await uid(); if (!c || !id) return [];
    try {
      var r = await c.from("teams").select("id,name,emblem,vis,owner_id,goal_kind,goal_target,team_members(count)").eq("vis", "public").order("created_at", { ascending: false }).limit(40);
      var rows = r.data || []; var mine = await myTeamIds();
      return rows.filter(function (t) { return mine.indexOf(t.id) < 0; }).map(function (t) {
        return { id: t.id, name: t.name, emblem: t.emblem, vis: t.vis, owner_id: t.owner_id, goalKind: t.goal_kind, goalTarget: t.goal_target, members: (t.team_members && t.team_members[0] && t.team_members[0].count) || 0 };
      });
    } catch (e) { return []; }
  }
  // Join a team by id (idempotent) — used by the discovery list AND ?team= invite links.
  async function joinTeam(teamId) {
    var c = client(); var id = await uid(); if (!c || !id || !teamId) return null;
    try {
      await c.from("team_members").upsert({ team_id: teamId, user_id: id, role: "member" }, { onConflict: "team_id,user_id", ignoreDuplicates: true });
      var r = await c.from("teams").select("id,name,emblem,vis,owner_id,goal_kind,goal_target").eq("id", teamId).maybeSingle();
      return r.data || null;
    } catch (e) { return null; }
  }
  // E: instant join by invite link («по ссылке — сразу»). Returns the team row.
  async function joinViaLink(teamId) {
    var c = client(); var id = await uid(); if (!c || !id || !teamId) return null;
    try {
      var rpc = await c.rpc("join_team_link", { t: teamId });
      if (!rpc.error && rpc.data) return Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
    } catch (e) {}
    // fallback (pre-SQL): direct member upsert + read the team back
    try {
      await c.from("team_members").upsert({ team_id: teamId, user_id: id, role: "member" }, { onConflict: "team_id,user_id", ignoreDuplicates: true });
      var r = await c.from("teams").select("id,name,emblem,vis,owner_id,goal_kind,goal_target").eq("id", teamId).maybeSingle();
      // RLS can lag a beat right after the membership insert — retry the read once.
      if (!r.data) { await new Promise(function (res) { setTimeout(res, 450); }); r = await c.from("teams").select("id,name,emblem,vis,owner_id,goal_kind,goal_target").eq("id", teamId).maybeSingle(); }
      // The join itself succeeded — never return null (so the caller still adds the team + cleans the URL).
      return r.data || { id: teamId, name: "Команда" };
    } catch (e) { return { id: teamId, name: "Команда" }; }
  }
  // E: request to join from search/discover («из поиска — по заявке»).
  // Returns { pending:true } when a real request was filed; { joined:true } on the pre-SQL fallback.
  async function requestJoin(teamId) {
    var c = client(); var id = await uid(); if (!c || !id || !teamId) return null;
    try {
      var rpc = await c.rpc("request_join", { t: teamId });
      if (!rpc.error) return { pending: true };
    } catch (e) {}
    // fallback (pre-SQL): no approval system yet → join directly
    try {
      await c.from("team_members").upsert({ team_id: teamId, user_id: id, role: "member" }, { onConflict: "team_id,user_id", ignoreDuplicates: true });
      return { pending: false, joined: true };
    } catch (e) { return null; }
  }
  // E: owner approves / rejects a pending request.
  async function approveMember(teamId, userId) {
    var c = client(); if (!c || !teamId || !userId) return false;
    try { var r = await c.rpc("approve_member", { t: teamId, u: userId }); return !r.error; } catch (e) { return false; }
  }
  async function rejectMember(teamId, userId) {
    var c = client(); if (!c || !teamId || !userId) return false;
    try { var r = await c.rpc("reject_member", { t: teamId, u: userId }); return !r.error; } catch (e) { return false; }
  }
  // E: pending join requests for a team (the owner sees them via RLS).
  async function pendingRequests(teamId) {
    var c = client(); if (!c || !teamId) return [];
    try {
      var r = await c.from("team_members").select("user_id,role,profiles(username,avatar)").eq("team_id", teamId).eq("role", "pending");
      return (r.data || []).map(function (m) { return { id: m.user_id, name: (m.profiles && m.profiles.username) || "Гость", avatar: (m.profiles && m.profiles.avatar) || "default" }; });
    } catch (e) { return []; }
  }
  // The real people in a team (id, role, name, avatar) — for the roster + chat.
  async function teamMembers(teamId) {
    var c = client(); if (!c || !teamId) return [];
    try {
      var r = await c.from("team_members").select("user_id,role,profiles(username,avatar)").eq("team_id", teamId);
      return (r.data || []).map(function (m) { return { id: m.user_id, role: m.role, name: (m.profiles && m.profiles.username) || "", avatar: (m.profiles && m.profiles.avatar) || "default" }; });
    } catch (e) { return []; }
  }

  // E: leave a team (any member). RPC-first (SECURITY DEFINER) with a direct-delete fallback.
  // An OWNER who wants out should use deleteTeam (leaving would orphan the team).
  async function leaveTeam(teamId) {
    var c = client(); var id = await uid(); if (!c || !id || !teamId) return false;
    try { var rpc = await c.rpc("leave_team", { t: teamId }); if (!rpc.error) return true; } catch (e) {}
    try { var r = await c.from("team_members").delete().eq("team_id", teamId).eq("user_id", id); return !r.error; } catch (e) { return false; }
  }
  // E: owner deletes the whole team (cascades members/habits/logs/messages). RPC-first.
  async function deleteTeam(teamId) {
    var c = client(); var id = await uid(); if (!c || !id || !teamId) return false;
    try { var rpc = await c.rpc("delete_team", { t: teamId }); if (!rpc.error) return true; } catch (e) {}
    try { var r = await c.from("teams").delete().eq("id", teamId).eq("owner_id", id); return !r.error; } catch (e) { return false; }
  }

  // ── РЕАЛЬНЫЕ ОБЩИЕ ПРИВЫЧКИ КОМАНДЫ ─────────────────────────────────────────
  // Each team habit with REAL stats: doneToday (members who marked today), total
  // (member count), doneByMe, weekPct (avg member-completion over the last 7 days).
  async function teamHabitsFull(teamId) {
    var c = client(); var me = await uid(); if (!c || !teamId) return [];
    try {
      var hs = await c.from("team_habits").select("id,name,emoji,is_main").eq("team_id", teamId).order("created_at", { ascending: true });
      var habits = (hs.data) || []; if (!habits.length) return [];
      var ids = habits.map(function (h) { return h.id; });
      var since = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
      var lg = await c.from("team_habit_logs").select("team_habit_id,user_id,day").in("team_habit_id", ids).gte("day", since);
      var rows = (lg.data) || [];
      var mem = await teamMembers(teamId); var total = mem.length || 1;
      var today = new Date().toISOString().slice(0, 10);
      return habits.map(function (h) {
        var hl = rows.filter(function (r) { return r.team_habit_id === h.id; });
        var todayUsers = {}; hl.forEach(function (r) { if (r.day === today) todayUsers[r.user_id] = 1; });
        var weekSum = 0;
        for (var d = 0; d < 7; d++) {
          var day = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
          var u = {}; hl.forEach(function (r) { if (r.day === day) u[r.user_id] = 1; });
          weekSum += total ? Object.keys(u).length / total : 0;
        }
        return { id: h.id, name: h.name, emoji: h.emoji || "✨", isMain: !!h.is_main, doneToday: Object.keys(todayUsers).length, total: total, doneByMe: !!(me && todayUsers[me]), weekPct: weekSum / 7 };
      });
    } catch (e) { return []; }
  }
  async function addTeamHabit(teamId, h) {
    var c = client(); if (!c || !teamId) return null;
    try { var r = await c.from("team_habits").insert({ team_id: teamId, name: (h && h.name) || "Привычка", emoji: (h && h.emoji) || "✨", is_main: !!(h && h.isMain) }).select().single(); return r.data || null; } catch (e) { return null; }
  }
  // Toggle MY "done today" mark on a team habit.
  async function toggleTeamHabitToday(habitId, on) {
    var c = client(); var me = await uid(); if (!c || !me || !habitId) return false;
    var today = new Date().toISOString().slice(0, 10);
    try {
      if (on) { await c.from("team_habit_logs").upsert({ team_habit_id: habitId, user_id: me, day: today }, { onConflict: "team_habit_id,user_id,day", ignoreDuplicates: true }); }
      else { await c.from("team_habit_logs").delete().eq("team_habit_id", habitId).eq("user_id", me).eq("day", today); }
      return true;
    } catch (e) { return false; }
  }

  // ── D4 · живой чат команды (сообщения + фото + realtime) ─────────────────────
  async function loadMessages(teamId, limit) {
    var c = client(); if (!c || !teamId) return [];
    try { var r = await c.from("messages").select("id,user_id,text,image_url,created_at").eq("team_id", teamId).order("created_at", { ascending: true }).limit(limit || 200); return r.data || []; }
    catch (e) { return []; }
  }
  async function sendMessage(teamId, msg) {
    var c = client(); var id = await uid(); if (!c || !id || !teamId) return null;
    try { var r = await c.from("messages").insert({ team_id: teamId, user_id: id, text: (msg && msg.text) || null, image_url: (msg && msg.imageUrl) || null }).select().single(); return r.data || null; }
    catch (e) { return null; }
  }
  // Realtime: calls onInsert(row) for every new message in this team. Returns unsubscribe().
  function subscribeMessages(teamId, onInsert) {
    var c = client(); if (!c || !teamId) return function () {};
    try {
      var ch = c.channel("msg:" + teamId)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: "team_id=eq." + teamId }, function (p) { try { onInsert(p.new); } catch (e) {} })
        .subscribe();
      return function () { try { c.removeChannel(ch); } catch (e) {} };
    } catch (e) { return function () {}; }
  }
  // Upload a (already-compressed) chat photo → returns its public URL.
  async function uploadChatPhoto(teamId, blob, ext) {
    var c = client(); var id = await uid(); if (!c || !id || !blob) return null;
    try {
      var path = teamId + "/" + id + "_" + Date.now() + "." + (ext || "jpg");
      var up = await c.storage.from("chat-photos").upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: false });
      if (up.error) return null;
      var pub = c.storage.from("chat-photos").getPublicUrl(path);
      return (pub && pub.data && pub.data.publicUrl) || null;
    } catch (e) { return null; }
  }

  // ── ОБЩИЕ ПРИВЫЧКИ (habit buddy: одна привычка — двое, видят отметки друг друга) ──
  // НЕ команда (никакого чата). Создатель пишет shared_habits + себя в members; друг по
  // ссылке hb_<code> вступает; обе стороны пишут свои отметки в shared_habit_logs → общий
  // календарь. Всё guarded: до запуска patch_shared_habits.sql тихо no-op (фича спит).
  async function createSharedHabit(h) {
    var c = client(); var id = await uid(); if (!c || !id || !h || !h.code) return null;
    try {
      await c.from("shared_habits").upsert({ code: h.code, name: h.name || "Привычка", emoji: h.emoji || "✨", color: h.color || null, owner_id: id }, { onConflict: "code", ignoreDuplicates: true });
      await c.from("shared_habit_members").upsert({ code: h.code, user_id: id }, { onConflict: "code,user_id", ignoreDuplicates: true });
      return { code: h.code };
    } catch (e) { return null; }
  }
  async function joinSharedHabit(code) {
    var c = client(); var id = await uid(); if (!c || !id || !code) return null;
    try {
      await c.from("shared_habit_members").upsert({ code: code, user_id: id }, { onConflict: "code,user_id", ignoreDuplicates: true });
      var r = await c.from("shared_habits").select("code,name,emoji,color,owner_id").eq("code", code).maybeSingle();
      var sh = (r && r.data) || { code: code, name: "Привычка" };
      // Who invited you (the habit's creator) — powers the welcome sheet «X зовёт вести вместе».
      if (sh.owner_id) { try { var op = await c.from("profiles").select("username,avatar").eq("id", sh.owner_id).maybeSingle(); if (op && op.data) { sh.ownerName = op.data.username || ""; sh.ownerAvatar = op.data.avatar || "default"; } } catch (e2) {} }
      return sh;
    } catch (e) { return { code: code, name: "Привычка" }; }
  }
  async function setSharedLog(code, day, on) {
    if (!code || !day) return false;
    return _durable({ type: "sharedLog", key: "sharedLog:" + code + ":" + day, args: { code: code, day: day, on: !!on } });
  }
  // Bulk-mirror MANY of your days into the shared log at once (idempotent) — backfills your existing
  // streak so buddies see your PAST days, not only new ones. RLS lets you write your own rows, so no
  // SQL patch is needed. Best-effort: any failure just leaves the shared calendar as-is.
  async function setSharedLogBulk(code, days) {
    var c = client(); var id = await uid(); if (!c || !id || !code || !days || !days.length) return false;
    try {
      var rows = days.map(function (d) { return { code: code, user_id: id, day: d }; });
      var r = await c.from("shared_habit_logs").upsert(rows, { onConflict: "code,user_id,day", ignoreDuplicates: true });
      return !r.error;
    } catch (e) { return false; }
  }
  // Members (REAL name+avatar from profiles) + everyone's marked days → the shared calendar.
  async function sharedHabitProgress(code) {
    var c = client(); var me = await uid(); if (!c || !code) return null;
    try {
      var mem = await c.from("shared_habit_members").select("user_id,profiles(username,avatar)").eq("code", code);
      if (mem.error) return null;
      var logs = await c.from("shared_habit_logs").select("user_id,day").eq("code", code);
      var rows = (logs && logs.data) || [];
      // Owner — so the client knows whether I may REMOVE members (only the owner can; swipe-remove
      // is shown only to them so it never offers an action RLS would refuse).
      var sh = await c.from("shared_habits").select("owner_id").eq("code", code).maybeSingle();
      var ownerId = (sh && sh.data && sh.data.owner_id) || null;
      var members = (mem.data || []).map(function (m) {
        var days = {}; rows.forEach(function (r) { if (r.user_id === m.user_id) days["" + r.day] = true; });
        return { id: m.user_id, me: m.user_id === me, isOwner: ownerId != null && m.user_id === ownerId, name: (m.profiles && m.profiles.username) || "Друг", avatar: (m.profiles && m.profiles.avatar) || "default", days: days };
      });
      members.sort(function (a, b) { return (b.me ? 1 : 0) - (a.me ? 1 : 0); }); // self first
      return { members: members, ownerId: ownerId };
    } catch (e) { return null; }
  }
  // Owner removes a member from a shared habit (David: «свайп влево на человеке → убрать из
  // привычки»). RLS lets the OWNER delete anyone (or a member delete themselves). `.select()` so we
  // KNOW a row was actually deleted — an RLS-blocked delete matches 0 rows and returns NO error, so
  // length>0 is the real success signal (before patch_remove_shared_member.sql runs → 0 → false).
  async function removeSharedHabitMember(code, userId) {
    var c = client(); var me = await uid(); if (!c || !me || !code || !userId) return false;
    try { var r = await c.from("shared_habit_members").delete().eq("code", code).eq("user_id", userId).select(); return !r.error && !!(r.data && r.data.length); } catch (e) { return false; }
  }

  // Team-habit per-person day-map (WHO did WHICH day). The data is already per-user in
  // team_habit_logs — this just exposes it in the SAME shape as sharedHabitProgress so the
  // team detail can reuse the same per-person calendar/card. Members come from the roster
  // (so people who haven't marked yet still appear, with empty days + real avatar).
  async function teamHabitProgress(teamId, habitId) {
    var c = client(); var me = await uid(); if (!c || !teamId || !habitId) return null;
    try {
      var mem = await c.from("team_members").select("user_id,role,profiles(username,avatar)").eq("team_id", teamId).neq("role", "pending");
      if (mem.error) return null;
      var lg = await c.from("team_habit_logs").select("user_id,day").eq("team_habit_id", habitId);
      var rows = (lg && lg.data) || [];
      var members = (mem.data || []).map(function (m) {
        var days = {}; rows.forEach(function (r) { if (r.user_id === m.user_id) days["" + r.day] = true; });
        return { id: m.user_id, me: m.user_id === me, name: (m.profiles && m.profiles.username) || "Участник", avatar: (m.profiles && m.profiles.avatar) || "default", days: days };
      });
      members.sort(function (a, b) { return (b.me ? 1 : 0) - (a.me ? 1 : 0); }); // self first
      return { members: members };
    } catch (e) { return null; }
  }

  // Current consecutive-day streak ending today (or yesterday, if today isn't marked yet)
  // from a {dayKey:true} set. Used to derive the «серия у каждого» goal mode.
  function _bosStreakDays(daySet) {
    var d = new Date(); d.setHours(0, 0, 0, 0);
    var k = function (dt) { return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0"); };
    if (!daySet[k(d)]) { d.setDate(d.getDate() - 1); if (!daySet[k(d)]) return 0; }
    var s = 0; while (daySet[k(d)]) { s++; d.setDate(d.getDate() - 1); }
    return s;
  }
  // TEAM GOAL progress — COMPUTED FROM THE HABIT MARKS (David: «цель считается из привычек»),
  // per the stored mode. Reads teams.goal config + ALL team-habit logs + roster, returns the
  // aggregate `current` and EACH member's contribution (avatar/name + value):
  //   collective — value = #отметок, current = сумма всех (each mark = +1)
  //   race       — value = #отметок, current = у лидера (max)
  //   streak     — value = его серия, current = МИН серия (команда проходит если держат все)
  async function teamGoalProgress(teamId) {
    var c = client(); var me = await uid(); if (!c || !teamId) return null;
    try {
      // `goal` jsonb may not exist yet (before patch_team_goal.sql) — selecting it would error
      // the whole query, so fall back to goal_target only. Works pre- AND post-deploy.
      var goal = {}, gt = 0;
      var tr = await c.from("teams").select("goal,goal_target").eq("id", teamId).maybeSingle();
      if (!tr.error && tr.data) { goal = tr.data.goal || {}; gt = tr.data.goal_target || 0; }
      else { var tr2 = await c.from("teams").select("goal_target").eq("id", teamId).maybeSingle(); if (!tr2.error && tr2.data) gt = tr2.data.goal_target || 0; }
      var type = goal.type || "collective";
      var target = Number(goal.target != null ? goal.target : gt) || 0;
      var unit = goal.unit || "";
      var stake = Number(goal.stake) || 0; // optional XP wager per person (teams.goal.stake)
      var hs = await c.from("team_habits").select("id").eq("team_id", teamId);
      var hids = ((hs && hs.data) || []).map(function (h) { return h.id; });
      var rows = [];
      if (hids.length) { var lg = await c.from("team_habit_logs").select("user_id,day").in("team_habit_id", hids); rows = (lg && lg.data) || []; }
      var mem = await c.from("team_members").select("user_id,role,profiles(username,avatar)").eq("team_id", teamId).neq("role", "pending");
      var members = ((mem && mem.data) || []).map(function (m) {
        var daySet = {}, marks = 0;
        rows.forEach(function (r) { if (r.user_id === m.user_id) { marks++; daySet["" + r.day] = true; } });
        return { id: m.user_id, me: m.user_id === me, name: (m.profiles && m.profiles.username) || "Участник", avatar: (m.profiles && m.profiles.avatar) || "default", marks: marks, streak: _bosStreakDays(daySet) };
      });
      var current = 0, pick = function (x) { return x.marks; };
      if (type === "streak") { pick = function (x) { return x.streak; }; current = members.length ? Math.min.apply(null, members.map(function (m) { return m.streak; })) : 0; }
      else if (type === "race") { current = members.length ? Math.max.apply(null, members.map(function (m) { return m.marks; })) : 0; }
      else { current = members.reduce(function (a, m) { return a + m.marks; }, 0); } // collective
      var out = members.map(function (m) { return { id: m.id, me: m.me, name: m.name, avatar: m.avatar, value: pick(m) }; });
      if (type === "race") out.sort(function (a, b) { return b.value - a.value; });
      else out.sort(function (a, b) { return (b.me ? 1 : 0) - (a.me ? 1 : 0); });
      var bank = stake * members.length;        // co-op: each gets stake; race: leader takes bank
      var done = target > 0 && current >= target;
      return { type: type, target: target, unit: unit, current: current, stake: stake, bank: bank, done: done, members: out };
    } catch (e) { return null; }
  }

  // SETTLE a reached team goal — idempotent, OWN-write (each member opens their own payout when
  // they next view the team). Unlock-only: nothing was deducted, so a win just OPENS bonus XP.
  // Co-op (collective/streak): I award MYSELF +stake. Race: only the LEADER (max value, id-tiebreak
  // so every client agrees) awards themselves the whole BANK; everyone else wins nothing. Returns
  // the outcome for the celebration, or null if the goal isn't reached / has no stake.
  async function settleTeamGoal(teamId) {
    var c = client(); var me = await uid(); if (!c || !me || !teamId) return null;
    try {
      var prog = await teamGoalProgress(teamId);
      if (!prog || !prog.done || !(prog.stake > 0)) return null;
      var xp = prog.stake, won = true;
      if (prog.type === "race") {
        var leader = null;
        (prog.members || []).forEach(function (m) {
          if (!leader || m.value > leader.value || (m.value === leader.value && ("" + m.id) < ("" + leader.id))) leader = m;
        });
        if (!leader || leader.id !== me) return { settled: false, won: false, xp: 0, type: prog.type, bank: prog.bank, stake: prog.stake };
        xp = prog.bank || prog.stake;
      }
      var r = await c.from("team_goal_settlements").upsert({ team_id: teamId, user_id: me, xp: xp, won: won }, { onConflict: "team_id,user_id", ignoreDuplicates: true });
      if (r.error) return null;
      return { settled: true, won: won, xp: xp, type: prog.type, bank: prog.bank, stake: prog.stake };
    } catch (e) { return null; }
  }
  // My total team-goal winnings (sum of my settlement rows) → feeds the DISPLAYED live XP/level.
  async function myTeamGoalXP() {
    var c = client(); var id = await uid(); if (!c || !id) return 0;
    try {
      var r = await c.from("team_goal_settlements").select("xp").eq("user_id", id);
      if (r.error || !r.data) return 0;
      return r.data.reduce(function (a, row) { return a + (row.xp || 0); }, 0);
    } catch (e) { return 0; }
  }
  // All payouts for ONE team (members read their team's settlements via RLS) → the per-member
  // «кто сколько получил» on the goal card. Returns a map { user_id: { xp, won } }.
  async function teamSettlements(teamId) {
    var c = client(); if (!c || !teamId) return {};
    try {
      var r = await c.from("team_goal_settlements").select("user_id,xp,won").eq("team_id", teamId);
      var out = {}; ((r && r.data) || []).forEach(function (s) { out[s.user_id] = { xp: s.xp || 0, won: !!s.won }; });
      return out;
    } catch (e) { return {}; }
  }

  window.bosCloud = {
    enabled: function () { return !!client(); },
    inTelegram: inTelegram,
    signIn: signIn, uid: uid, currentUser: currentUser,
    loadProfile: loadProfile, saveProfile: saveProfile, invitedPeople: invitedPeople, refCode: refCode, inviteCode: inviteCode,
    saveSnapshot: saveSnapshot, loadSnapshot: loadSnapshot,
    loadHabits: loadHabits, upsertHabit: upsertHabit, deleteHabit: deleteHabit, toggleHabitLog: toggleHabitLog,
    loadGoals: loadGoals, upsertGoal: upsertGoal, deleteGoal: deleteGoal,
    createTeam: createTeam, discoverTeams: discoverTeams, joinTeam: joinTeam,
    joinViaLink: joinViaLink, requestJoin: requestJoin, approveMember: approveMember, rejectMember: rejectMember, pendingRequests: pendingRequests,
    teamMembers: teamMembers, myTeamIds: myTeamIds, leaveTeam: leaveTeam, deleteTeam: deleteTeam,
    teamHabitsFull: teamHabitsFull, addTeamHabit: addTeamHabit, toggleTeamHabitToday: toggleTeamHabitToday,
    createSharedHabit: createSharedHabit, joinSharedHabit: joinSharedHabit, setSharedLog: setSharedLog, setSharedLogBulk: setSharedLogBulk, sharedHabitProgress: sharedHabitProgress, removeSharedHabitMember: removeSharedHabitMember,
    teamHabitProgress: teamHabitProgress, teamGoalProgress: teamGoalProgress,
    settleTeamGoal: settleTeamGoal, myTeamGoalXP: myTeamGoalXP, teamSettlements: teamSettlements,
    loadMessages: loadMessages, sendMessage: sendMessage, subscribeMessages: subscribeMessages, uploadChatPhoto: uploadChatPhoto,
    signOut: signOut,
    _client: client,
  };
})();

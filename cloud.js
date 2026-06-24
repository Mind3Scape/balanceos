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
    var existing = await currentUser(); if (existing) { _uid = existing.id; return existing; }
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
  async function signOut() { var c = client(); _uid = null; if (c) { try { await c.auth.signOut(); } catch (e) {} } }

  // ── D2 · cross-device snapshot ──────────────────────────────────────────────
  // The whole life-blob (habits, goals, teams, mood history, widgets…) is mirrored
  // into a single `snapshot jsonb` column on the user's profile row. Last-write-wins
  // by device save-time. If the column doesn't exist yet (David hasn't run the 1-line
  // ALTER), these just return false/null and the app stays perfectly local — no break.
  async function saveSnapshot(data) {
    var c = client(); var id = await uid(); if (!c || !id) return false;
    var env = { savedAt: Date.now(), data: data || {} };
    // PRIVATE mirror: the life-blob (incl. the journal) lives in user_state — RLS = owner
    // only — NOT in the world-readable profiles table. Falls back to the old column until
    // patch_privacy_snapshot.sql has run, so deploy order can't lose data.
    try {
      var r = await c.from("user_state").upsert({ id: id, snapshot: env, updated_at: new Date().toISOString() }, { onConflict: "id" });
      if (!r.error) return true;
    } catch (e) {}
    try { var r2 = await c.from("profiles").update({ snapshot: env }).eq("id", id); return !r2.error; } catch (e2) { return false; }
  }
  async function loadSnapshot() {
    var c = client(); var id = await uid(); if (!c || !id) return null;
    try {
      var r = await c.from("user_state").select("snapshot").eq("id", id).maybeSingle();
      if (!r.error && r.data && r.data.snapshot) return r.data.snapshot; // { savedAt, data }
    } catch (e) {}
    try { var r2 = await c.from("profiles").select("snapshot").eq("id", id).maybeSingle(); return (r2 && r2.data && r2.data.snapshot) || null; } catch (e2) { return null; }
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
    try {
      var rpc = await c.rpc("create_team", { p_name: (t && t.name) || "Команда", p_emblem: (t && t.emblem) || "✨", p_vis: (t && t.vis) || "private", p_goal_kind: (t && t.goalKind) || null, p_goal_target: (t && t.goalTarget) || null });
      if (!rpc.error && rpc.data) return Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
    } catch (e) {}
    try {
      var ins = await c.from("teams").insert({ name: (t && t.name) || "Команда", emblem: (t && t.emblem) || "✨", vis: (t && t.vis) || "private", owner_id: id, goal_kind: (t && t.goalKind) || null, goal_target: (t && t.goalTarget) || null }).select().single();
      if (ins.error || !ins.data) return null;
      await c.from("team_members").insert({ team_id: ins.data.id, user_id: id, role: "owner" });
      return ins.data;
    } catch (e) { return null; }
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

  window.bosCloud = {
    enabled: function () { return !!client(); },
    inTelegram: inTelegram,
    signIn: signIn, uid: uid, currentUser: currentUser,
    loadProfile: loadProfile, saveProfile: saveProfile, invitedPeople: invitedPeople,
    saveSnapshot: saveSnapshot, loadSnapshot: loadSnapshot,
    createTeam: createTeam, discoverTeams: discoverTeams, joinTeam: joinTeam,
    joinViaLink: joinViaLink, requestJoin: requestJoin, approveMember: approveMember, rejectMember: rejectMember, pendingRequests: pendingRequests,
    teamMembers: teamMembers, myTeamIds: myTeamIds, leaveTeam: leaveTeam, deleteTeam: deleteTeam,
    teamHabitsFull: teamHabitsFull, addTeamHabit: addTeamHabit, toggleTeamHabitToday: toggleTeamHabitToday,
    loadMessages: loadMessages, sendMessage: sendMessage, subscribeMessages: subscribeMessages, uploadChatPhoto: uploadChatPhoto,
    signOut: signOut,
    _client: client,
  };
})();

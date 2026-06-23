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
    try {
      var r = await c.from("profiles").update({ snapshot: { savedAt: Date.now(), data: data || {} } }).eq("id", id);
      return !r.error;
    } catch (e) { return false; }
  }
  async function loadSnapshot() {
    var c = client(); var id = await uid(); if (!c || !id) return null;
    try {
      var r = await c.from("profiles").select("snapshot").eq("id", id).maybeSingle();
      return (r && r.data && r.data.snapshot) || null; // { savedAt, data } | null
    } catch (e) { return null; }
  }

  window.bosCloud = {
    enabled: function () { return !!client(); },
    inTelegram: inTelegram,
    signIn: signIn, uid: uid, currentUser: currentUser,
    loadProfile: loadProfile, saveProfile: saveProfile, invitedPeople: invitedPeople,
    saveSnapshot: saveSnapshot, loadSnapshot: loadSnapshot,
    signOut: signOut,
    _client: client,
  };
})();

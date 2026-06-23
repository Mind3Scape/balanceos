/* BalanceOS — local-first persistence (the app's spine).

   Saves one snapshot per profile to localStorage so a real user's life
   (habits, goals, teams, journal, level) survives a reload. The DEMO profile
   is deliberately never persisted — a reload must always snap back to Павел's
   pristine showcase.

   This is the seam the cloud (Supabase) plugs into later behind the SAME
   has/load/save calls: today it's localStorage, tomorrow the local cache is
   mirrored to Postgres — the AppProvider above it never has to change.

   Loads harmlessly everywhere: pure browser localStorage, no dependencies,
   no-op-safe in private-mode/quota-exceeded (every call is try-wrapped). */
(function () {
  "use strict";
  var NS = "bos:profile:";
  var SCHEMA = 1; // bump when the snapshot shape changes → old snapshots are ignored (clean reseed), never half-read

  function key(id) { return NS + id; }

  window.bosStore = {
    schema: SCHEMA,

    // Is there a saved snapshot for this profile?
    has: function (id) {
      try { return !!id && !!localStorage.getItem(key(id)); } catch (e) { return false; }
    },

    // Load a profile snapshot → the saved data object, or null if absent/stale/corrupt.
    load: function (id) {
      try {
        var raw = id && localStorage.getItem(key(id));
        if (!raw) return null;
        var p = JSON.parse(raw);
        if (!p || p.v !== SCHEMA) return null; // wrong/old schema → treat as absent
        return p.data || null;
      } catch (e) { return null; }
    },

    // Save a profile snapshot. Wrapped: a full disk / private mode just no-ops.
    save: function (id, data) {
      try {
        if (!id) return false;
        localStorage.setItem(key(id), JSON.stringify({ v: SCHEMA, at: Date.now(), data: data }));
        return true;
      } catch (e) { return false; }
    },

    // Wipe a profile (e.g. "start over" / sign out).
    clear: function (id) {
      try { if (id) localStorage.removeItem(key(id)); } catch (e) {}
    },
  };
})();

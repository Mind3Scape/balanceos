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
    var u = await currentUser(); _uid = u ? u.id : null;
    try { if (_uid) localStorage.setItem("bos:lastUid", _uid); } catch (e) {}
    return _uid;
  }
  // Синхронный доступ к уже известному uid (после авторизации _uid закэширован). Нужен, чтобы лица
  // круга СРАЗУ знали «меня» и на первом рендере НЕ мелькал свой аватар среди чужих (David).
  function uidSync() { return _uid; }

  // Sign in (idempotent). referredBy = id of the person whose invite link brought you.
  async function signIn(referredBy) {
    var c = client(); if (!c) return null;
    var existing = await currentUser();
    if (existing) {
      _uid = existing.id;
      // МОСТ ПРИГЛАШЕНИЯ ДЛЯ СТАРОЖИЛОВ (баг «друг не появился на орбите»): человек, УЖЕ
      // залогиненный, открыл ссылку друга → referredBy пришёл из bosReferralId, НО сессия уже
      // есть, поэтому tg-auth ниже НЕ вызывался и referred_by никогда не проставлялся. Досылаем
      // referredBy в tg-auth отдельным вызовом: сервисной ролью он допишет referred_by ТОЛЬКО
      // пока он пуст (никогда не перетирает уже существующего пригласившего), OTP игнорируем —
      // сессия уже есть. Fire-and-forget, чтобы не тормозить вход. Гард от само-реферала по uid.
      if (referredBy && referredBy !== existing.id && inTelegram()) {
        try {
          fetch(URL + "/functions/v1/tg-auth", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + KEY, "apikey": KEY },
            body: JSON.stringify({ initData: window.__TG.initData, referredBy: referredBy }),
          }).catch(function () {});
        } catch (e) {}
      }
      try { flushQueue(); flushLedgerBacklog(); } catch (e) {}
      return existing;
    }
    if (inTelegram()) {
      // Гард само-реферала и на «свежей» двери (ветка без активной сессии): если ссылка несёт МОЙ
      // же прежний uid (открыл собственную ссылку hb_<code>__<uid> после того, как сессия протухла),
      // реферал сбрасываем — иначе сервер запишет «сам себя пригласил» → двойники в друзьях/на орбите.
      var _lastUid = null; try { _lastUid = localStorage.getItem("bos:lastUid"); } catch (e) {}
      var _refSafe = (referredBy && referredBy !== _lastUid) ? referredBy : null;
      try {
        var resp = await fetch(URL + "/functions/v1/tg-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + KEY, "apikey": KEY },
          body: JSON.stringify({ initData: window.__TG.initData, referredBy: _refSafe }),
        });
        var j = await resp.json();
        if (j && j.email && j.otp) {
          var v = await c.auth.verifyOtp({ email: j.email, token: j.otp, type: "email" });
          if (v && v.data && v.data.user) { _uid = v.data.user.id; try { if (_uid) localStorage.setItem("bos:lastUid", _uid); } catch (e) {} return v.data.user; }
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
  // Имя/аватар — через НАДЁЖНУЮ очередь (аудит #В2): при обрыве сети не теряются, долетят на
  // online/visible (как привычки/цели). Ключ «saveProfile» коалесится → уедет последнее значение.
  async function saveProfile(p) {
    return _durable({ type: "saveProfile", key: "saveProfile", args: { username: (p && p.username) || "", avatar: (p && p.avatar) || null } });
  }
  // «Чем могу быть полезен» (profiles.offer) — короткое предложение помощи, которое видит твой круг.
  // НАДЁЖНАЯ очередь как saveProfile (коалес по ключу «saveOffer» → уедет последнее значение), но с
  // graceful-drop до patch_profile_offer.sql: если колонки ещё нет, runOp роняет оп как «успех», чтобы
  // отсутствующая колонка НЕ заклинила общую очередь синка (та останавливается на первой ошибке).
  async function saveOffer(text) {
    return _durable({ type: "saveOffer", key: "saveOffer", args: { offer: ("" + (text || "")).trim().slice(0, 200) } });
  }
  // Свежесть «кто затих» (profiles.last_active) — метка активности (отметка привычки / вход). НЕ через
  // очередь (это сердцебиение, потерять одну не жалко): прямая запись, тихий no-op при ошибке/отсутствии
  // колонки. Троттл ~1/час через localStorage, чтобы не бить в БД на каждую отметку/фокус.
  async function touchActive() {
    try {
      var last = 0; try { last = parseInt(localStorage.getItem("bos:lastActive:touch") || "0", 10) || 0; } catch (e) {}
      if (Date.now() - last < 3600000) return; // не чаще раза в час
      var c = client(); var id = await uid(); if (!c || !id) return;
      var r = await c.from("profiles").update({ last_active: new Date().toISOString() }).eq("id", id);
      // Метку троттла ставим только на реальную запись — если колонки ещё нет (до ALTER), НЕ помечаем,
      // тогда после применения патча первая же активность долетит, а не будет ждать час.
      if (!r.error) { try { localStorage.setItem("bos:lastActive:touch", "" + Date.now()); } catch (e2) {} }
    } catch (e) {}
  }
  // «Пульс дня»: валентность сегодняшнего состояния (0..6) вливается в общий баланс окружения.
  // Приватность в ДАННЫХ: строку day_pulse не может прочитать никто (RLS без select) — наружу
  // отдаёт только серверный агрегат bos_env_pulse, и только когда влились ≥3. show_face =
  // «показывать меня в круге» (точка у лица); сам тон не раскрывается никогда. Прямая запись
  // как touchActive: тихий no-op до применения patch_day_pulse.sql.
  async function savePulse(day, bucket, showFace) {
    try {
      var c = client(); var id = await uid(); if (!c || !id || !day || bucket == null) return;
      await c.from("day_pulse").upsert({ uid: id, day: day, bucket: Math.max(0, Math.min(6, Math.round(bucket))), show_face: !!showFace, updated_at: new Date().toISOString() }, { onConflict: "uid,day" });
    } catch (e) {}
  }
  // Агрегат пульса круга: {marked, avg?, faces:[uid]} либо null (нет патча/сети). Мой uid
  // добавляется сам; день — локальная дата клиента (bosTodayKey), не серверный UTC.
  async function envPulse(ids, day) {
    try {
      var c = client(); var id = await uid(); if (!c || !id || !day) return null;
      var all = [id].concat((ids || []).filter(function (x) { return x && x !== id; })).slice(0, 60);
      var r = await c.rpc("bos_env_pulse", { p_uids: all, p_day: day });
      if (r.error || !r.data) return null;
      return r.data;
    } catch (e) { return null; }
  }
  // People you've brought in (orbit): profiles referred by you, in invite order.
  async function invitedPeople() {
    var c = client(); var id = await uid(); if (!c || !id) return [];
    try { var r = await c.from("profiles").select("id,username,avatar,created_at").eq("referred_by", id).order("created_at", { ascending: true }); return (r.data || []).filter(function (p) { return p && p.id !== id; }); } // self-фильтр: себя среди «кого пригласил» не показываем (баг «Давид пригласил Давид»)
    catch (e) { return []; }
  }
  // СТРОГИЙ источник людей для «Баланса окружения». Старые invitedPeople/myInviter намеренно
  // local-first и при сбое возвращают []/null — для обычных экранов это удобно, но аналитика тогда
  // не отличает «друзей нет» от «сеть не ответила». Здесь статус является частью контракта:
  //   ready   — оба источника прочитаны; пустой people действительно означает пустоту;
  //   partial — один источник прочитан, второй нет (показывать найденное с оговоркой);
  //   error   — ни один источник не подтверждён (не выдавать [] за факт).
  async function envPeopleStrict() {
    var c = client(); var id = await uid();
    if (!c || !id) return { status: "error", people: [], failed: ["auth"] };

    var people = [], failed = [], inviteesOK = false, inviterOK = false;
    try {
      var invited = await c.from("profiles").select("id,username,avatar,created_at").eq("referred_by", id).order("created_at", { ascending: true });
      if (!invited || invited.error || !Array.isArray(invited.data)) failed.push("invitees");
      else {
        inviteesOK = true;
        ((invited && invited.data) || []).forEach(function (p) {
          if (p && p.id && p.id !== id) people.push({ id: p.id, username: p.username || "", avatar: p.avatar || null, created_at: p.created_at || null, relation: "invitee", mine: true });
        });
      }
    } catch (e) { failed.push("invitees"); }

    try {
      var mine = await c.from("profiles").select("referred_by").eq("id", id).maybeSingle();
      if (!mine || mine.error || !mine.data) failed.push("inviter");
      else {
        var rid = mine && mine.data && mine.data.referred_by;
        if (!rid || rid === id) inviterOK = true;
        else {
          var inviter = await c.from("profiles").select("id,username,avatar").eq("id", rid).maybeSingle();
          if (!inviter || inviter.error || !inviter.data) failed.push("inviter");
          else {
            inviterOK = true;
            if (inviter && inviter.data && inviter.data.id && inviter.data.id !== id) {
              people.unshift({ id: inviter.data.id, username: inviter.data.username || "", avatar: inviter.data.avatar || null, relation: "inviter", inviter: true });
            }
          }
        }
      }
    } catch (e) { failed.push("inviter"); }

    // Защита от исторического само-реферала и дубля, если человек оказался с двух сторон связи.
    var seen = {}, unique = [];
    people.forEach(function (p) { if (p && p.id && p.id !== id && !seen[p.id]) { seen[p.id] = true; unique.push(p); } });
    var status = inviteesOK && inviterOK ? "ready" : ((inviteesOK || inviterOK) ? "partial" : "error");
    return { status: status, people: unique, failed: failed };
  }
  // The person who brought ME in (my profiles.referred_by → their profile), so the
  // newcomer sees their inviter on the orbit from day one — the bridge works both ways.
  // КЭШ: данные почти write-once, а ходили мы за ними 2 ПОСЛЕДОВАТЕЛЬНЫХ запроса — с «Я», из
  // Вселенной и из шелла, каждый раз заново. Теперь: мгновенно из памяти/localStorage, сеть —
  // один раз за сессию фоном (авто-привязка referred_by могла появиться позже — фон подхватит).
  var _inviterMem;            // undefined = в этой сессии ещё не знаем; null = пригласившего нет
  var _inviterFly = null;
  function _inviterRefresh(c, id) {
    if (_inviterFly) return _inviterFly;
    _inviterFly = (async function () {
      try {
        var me = await c.from("profiles").select("referred_by").eq("id", id).maybeSingle();
        var rid = me.data && me.data.referred_by;
        if (rid && rid === id) rid = null; // никогда не «сам себя пригласил» (баг «Давид пригласил Давид»)
        var out = null;
        if (rid) { var r = await c.from("profiles").select("id,username,avatar").eq("id", rid).maybeSingle(); out = r.data || null; }
        _inviterMem = out;
        try { localStorage.setItem("bos:cache:inviter", JSON.stringify(out)); } catch (e) {}
        return out;
      } catch (e) { return _inviterMem === undefined ? null : _inviterMem; }
    })();
    return _inviterFly;
  }
  async function myInviter() {
    var c = client(); var id = await uid(); if (!c || !id) return null;
    if (_inviterMem !== undefined) return _inviterMem;
    var raw = null; try { raw = localStorage.getItem("bos:cache:inviter"); } catch (e) {}
    if (raw != null) {
      try { _inviterMem = JSON.parse(raw); } catch (e) { _inviterMem = undefined; }
      if (_inviterMem !== undefined) { _inviterRefresh(c, id); return _inviterMem; }
    }
    return await _inviterRefresh(c, id);
  }
  // PUBLIC orbit for the «Вселенная»: a person's level + their habit ICONS (emoji+colour) + how many
  // people are on their orbit, so others render as REAL orbits (icons + faces), not anonymous beads.
  // profiles is world-readable → friends in your circle can read it. ONE column needed:
  //   alter table public.profiles add column if not exists pub_orbit jsonb;
  // Until David runs it, this no-ops gracefully (systems just stay empty). Only emoji+colour are
  // published (no habit NAMES) — the orbit shows icons, so names never leave the device.
  async function savePublicStats(s) {
    var c = client(); var id = await uid(); if (!c || !id || !s) return false;
    // МЕРЖ с последней опубликованной витриной: pub_orbit пишем ТОЛЬКО мы сами, так что локальная
    // копия авторитетна. Коллер, не знающий поля (Главная не знает `people`), НЕ затирает нулём то,
    // что опубликовал экран «Я» — иначе каждый заход на Главную стирал бы планеты у друзей.
    var last = {}, lastRaw = null; try { lastRaw = localStorage.getItem("bos:pubOrbit:last"); last = JSON.parse(lastRaw || "{}") || {}; } catch (e) {}
    var hb = Array.isArray(s.habits) ? s.habits : (Array.isArray(last.habits) ? last.habits : []);
    // faces = РЕАЛЬНЫЕ аватарки людей на твоей орбите (David: «настоящие аватарки, а не старый мемоджи в
    // очках»). Шлёт их ТОЛЬКО экран «Я» (он знает людей с аватарами); Главная faces не шлёт → тот же мерж
    // с последней витриной, что и people, чтобы Главная не затирала лица нулём.
    var fc = Array.isArray(s.faces) ? s.faces : (Array.isArray(last.faces) ? last.faces : []);
    var blob = {
      level: (s.level == null ? last.level : s.level) | 0,
      lvlPct: (s.lvlPct == null ? last.lvlPct : s.lvlPct) | 0,
      goals: (s.goals == null ? last.goals : s.goals) | 0,
      people: (s.people == null ? last.people : s.people) | 0,
      habits: hb.slice(0, 12).map(function (h) { return { e: ("" + ((h && h.e) || "✨")).slice(0, 8), c: (h && h.c) || null }; }),
      faces: fc.slice(0, 10).map(function (a) { return ("" + (a || "default")).slice(0, 40); }),
    };
    var blobStr = JSON.stringify(blob);
    // ДЕДУП: «Я» и Главная публикуют витрину при КАЖДОМ заходе — если ничего не изменилось, не
    // трогаем ни сеть, ни диск. Метку пишем ПОСЛЕ удачного апдейта (раньше — до), чтобы обрыв
    // сети не «съедал» повтор: не долетело → метка старая → следующий заход дошлёт.
    if (blobStr === lastRaw) return true;
    try {
      var r = await c.from("profiles").update({ pub_orbit: blob }).eq("id", id);
      if (!r.error) { try { localStorage.setItem("bos:pubOrbit:last", blobStr); } catch (e2) {} }
      return !r.error;
    } catch (e) { return false; }
  }
  // Map id → { level, habits:[{e,c}], goals, people } for a set of users (invited + circle members).
  // Falls back to {} if the column doesn't exist yet, so the universe still renders pre-ALTER.
  async function profilesPublic(ids) {
    var c = client(); if (!c || !ids || !ids.length) return {};
    try {
      // offer (patch_profile_offer.sql) и last_active (patch_profile_last_active.sql) — независимые
      // колонки, каждая своим патчем; селектим СЛОЯМИ (обе → offer → last_active → база), чтобы каждая
      // фича светилась, как только прогнан ЕЁ патч, и ничего не ломалось до ALTER (не рушит Вселенную).
      var cols = ["id,pub_orbit,offer,last_active", "id,pub_orbit,offer", "id,pub_orbit,last_active", "id,pub_orbit"];
      var r = null;
      for (var i = 0; i < cols.length; i++) { r = await c.from("profiles").select(cols[i]).in("id", ids); if (!r.error) break; }
      if (!r || r.error || !r.data) return {};
      var out = {}; r.data.forEach(function (p) { var o = p.pub_orbit || {}; out[p.id] = { level: o.level || 0, lvlPct: o.lvlPct || 2, habits: Array.isArray(o.habits) ? o.habits : [], goals: o.goals || 0, people: o.people || 0, faces: Array.isArray(o.faces) ? o.faces : [], offer: p.offer || null, lastActive: p.last_active || null }; }); return out;
    } catch (e) { return {}; }
  }
  // ВСЕ пользователи для «Вселенной»: каждый, кто опубликовал витрину орбиты (pub_orbit not null).
  // Анонимно — отдаём аватар-глиф + уровень + значки привычек + число людей, БЕЗ имени/ника (David:
  // показываем всех всем, анонимно). Кап на всякий случай; порядок не важен — раскладка сама разбросает.
  async function allPublic(limit) {
    var c = client(); if (!c) return [];
    var me = null; try { me = await uid(); } catch (e) {}
    try {
      // referred_by = id того, кто привёл этого человека (world-readable, это ID а не имя →
      // остаётся анонимно). Отдаём как referredBy для слоя «Связи»/созвездий во «Вселенной».
      // Graceful: если колонки нет (до ALTER) — Supabase просто не вернёт поле → referredBy=null.
      var r = await c.from("profiles").select("id,avatar,pub_orbit,referred_by,offer").not("pub_orbit", "is", null).limit(limit || 240);
      if (r.error) r = await c.from("profiles").select("id,avatar,pub_orbit,referred_by").not("pub_orbit", "is", null).limit(limit || 240); // до patch_profile_offer.sql
      if (r.error || !r.data) return [];
      return r.data.filter(function (p) { return p && p.id && p.id !== me; }).map(function (p) {
        var o = p.pub_orbit || {};
        return { id: p.id, avatar: p.avatar || "default", name: "", level: o.level || 0, lvlPct: o.lvlPct || 2, habits: Array.isArray(o.habits) ? o.habits : [], goals: o.goals || 0, people: o.people || 0, faces: Array.isArray(o.faces) ? o.faces : [], referredBy: (p.referred_by && p.referred_by !== p.id) ? p.referred_by : null, offer: p.offer || null }; // referredBy!==id: само-реферал не рисует связь-петлю на себя
      });
    } catch (e) { return []; }
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
    if (op.type === "deleteHabit") { var _hlp = "habitLog:" + op.args.cloudId + ":"; _q = _q.filter(function (o) { return o.key !== "upsertHabit:" + op.args.cloudId && o.key.indexOf(_hlp) !== 0; }); } // delete supersedes pending create И его отметки — иначе offline «создал→отметил→удалил» оставлял habitLog-оп, который на реплее упирался в FK удалённой привычки и НАВСЕГДА глушил очередь синка (break)
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
        case "saveProfile": { var rpf = await c.from("profiles").update({ username: a.username || "", avatar: a.avatar || null }).eq("id", id); return !rpf.error; }
        case "saveOffer": {
          var rof = await c.from("profiles").update({ offer: (a.offer || "").slice(0, 200) }).eq("id", id);
          if (!rof.error) return true;
          // Колонки offer ещё нет (до patch_profile_offer.sql) → роняем оп как «успех», иначе он навсегда
          // заклинил бы очередь синка (flushQueue стоп на первой ошибке). Записать всё равно некуда.
          if (_isMissingCol(rof.error)) return true;
          return false; // обычная сеть/сервер — ретрай
        }
        case "sharedLog":
          if (a.on) {
            // Время отметки пишет КЛИЕНТ (a.ts = момент нажатия): серверный default врёт после
            // ретраев очереди, а у строк из-под старого кода/патча — вовсе время миграции.
            // Слоёно: колонки created_at может не быть до patch_sky_thread.sql → повтор без неё.
            if (a.ts) { var rs1 = await c.from("shared_habit_logs").upsert({ code: a.code, user_id: id, day: a.day, created_at: a.ts }, { onConflict: "code,user_id,day", ignoreDuplicates: true }); if (!rs1.error) return true; }
            var rs = await c.from("shared_habit_logs").upsert({ code: a.code, user_id: id, day: a.day }, { onConflict: "code,user_id,day", ignoreDuplicates: true }); return !rs.error;
          }
          { var rsd = await c.from("shared_habit_logs").delete().eq("code", a.code).eq("user_id", id).eq("day", a.day); return !rsd.error; }
        case "snapshot": {
          var rp = await c.from("user_state").upsert({ id: id, snapshot: a.env, updated_at: new Date().toISOString() }, { onConflict: "id" });
          if (!rp.error) return true;
          var rp2 = await c.from("profiles").update({ snapshot: a.env }).eq("id", id); return !rp2.error; // pre-patch fallback
        }
        case "ledgerSpend": {
          // Этап 1 «Серверная правда»: КАЖДАЯ трата XP — строка в серверном журнале
          // (sql/patch_xp_wallet.sql). Идемпотентно по ref → повтор очереди безопасен.
          var rl = await c.rpc("bos_spend_xp", { p_amount: a.amount, p_ref: a.ref || null, p_kind: a.kind || "spend", p_earned: (a.earned == null ? null : a.earned), p_meta: a.meta || {} });
          if (!rl.error) return true; // ok/dup/insufficient — журнал ответил, очередь чиста
          // Патч ещё не применён (функции нет) → НЕ клиним общую очередь: убираем оп в отдельный
          // запасник и дольём его первой же успешной записью после применения патча.
          if (_isMissingFn(rl.error)) { _ledgerPark(op.args); return true; }
          return false; // сеть/сервер — обычный ретрай
        }
      }
    } catch (e) { return false; }
    return false;
  }
  // ── Запасник журнала (патч кошелька ещё не применён) ─────────────────────
  var LKEY = "bos_ledger_backlog_v1";
  function _ledgerLoad() { try { var v = JSON.parse(localStorage.getItem(LKEY) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function _ledgerSave(list) { try { localStorage.setItem(LKEY, JSON.stringify(list)); } catch (e) {} }
  function _ledgerPark(args) {
    var list = _ledgerLoad();
    if (args && args.ref && list.some(function (x) { return x && x.ref === args.ref; })) return; // дубль
    list.push(args); _ledgerSave(list);
  }
  function _isMissingFn(err) {
    var m = ((err && (err.code || "")) + " " + (err && (err.message || ""))).toLowerCase();
    return m.indexOf("pgrst202") >= 0 || m.indexOf("could not find the function") >= 0 || m.indexOf("does not exist") >= 0;
  }
  // Ошибка «колонки нет» (PostgREST): schema-cache miss PGRST204 / undefined_column 42703 / текст
  // «could not find the 'X' column» / «column ... does not exist». Для graceful-drop записей до ALTER.
  function _isMissingCol(err) {
    var m = ((err && (err.code || "")) + " " + (err && (err.message || ""))).toLowerCase();
    return m.indexOf("pgrst204") >= 0 || m.indexOf("42703") >= 0 || (m.indexOf("column") >= 0 && (m.indexOf("does not exist") >= 0 || m.indexOf("could not find") >= 0 || m.indexOf("schema cache") >= 0));
  }
  var _ledgerFlushing = false;
  async function flushLedgerBacklog() {
    if (_ledgerFlushing) return;
    var list = _ledgerLoad(); if (!list.length) return;
    var c = client(); if (!c) return;
    _ledgerFlushing = true;
    try {
      for (var i = 0; i < list.length; i++) {
        var a = list[i];
        var r = await c.rpc("bos_spend_xp", { p_amount: a.amount, p_ref: a.ref || null, p_kind: a.kind || "spend", p_earned: null, p_meta: a.meta || {} });
        if (r.error) break; // функции всё ещё нет / сеть — попробуем в другой раз
        list.splice(i, 1); i--; _ledgerSave(list);
      }
    } catch (e) {} finally { _ledgerFlushing = false; }
  }
  // Try an op now; on failure queue it for retry. On success, drain any backlog (the network is up).
  async function _durable(op) {
    var ok = await runOp(op);
    if (ok) {
      // Прямая запись удалась → она авторитетна. Вычищаем ЛЮБОЙ застрявший queued-оп с тем же
      // ключом (более старое значение), иначе flushQueue ниже переиграл бы его ПОВЕРХ свежего
      // (например «неубиваемая» отметка: off записался, а в очереди висел старый on). Та же
      // философия, что _qAdd — «последнее состояние по ключу побеждает».
      _q = _q.filter(function (o) { return o.key !== op.key; }); _qSave();
      if (_q.length) { flushQueue(); }
      return true;
    }
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
    window.addEventListener("online", function () { flushQueue(); flushLedgerBacklog(); });
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") { flushQueue(); flushLedgerBacklog(); touchActive(); } });
    touchActive(); // «вход» — метка свежести при загрузке (троттл ~1/час внутри)
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
    if (on) { try { touchActive(); } catch (e) {} } // отметка = активность → метка свежести (троттл внутри)
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
  // ПОЛНАЯ правда о моих кругах — для сверки после гидрации (v594, после пропажи «Крипто
  // монстров»): членство (без pending) + круги, где я владелец (страховка для легаси-владельца
  // без строки участника). null = не дозвонились: звонящий обязан НЕ трогать локальный список
  // («пусто из-за обрыва ≠ правда», урок v583). [] = точно ни одного круга.
  async function myTeamsLive() {
    var c = client(); var id = await uid(); if (!c || !id) return null;
    try {
      // circle_balance_on — тумблер «Баланс круга»; селектим слоями (до patch_circle_balance_toggle.sql
      // колонки нет → падаем на прежний селект, чтобы гидрация команд НЕ ломалась, урок v583/v594).
      var m = await c.from("team_members").select("role,teams(id,name,emblem,vis,owner_id,goal_kind,goal_target,goal,circle_balance_on,created_at)").eq("user_id", id).neq("role", "pending");
      if (m.error) m = await c.from("team_members").select("role,teams(id,name,emblem,vis,owner_id,goal_kind,goal_target,goal,created_at)").eq("user_id", id).neq("role", "pending");
      if (m.error) return null;
      var own = await c.from("teams").select("id,name,emblem,vis,owner_id,goal_kind,goal_target,goal,circle_balance_on,created_at").eq("owner_id", id);
      if (own.error) own = await c.from("teams").select("id,name,emblem,vis,owner_id,goal_kind,goal_target,goal,created_at").eq("owner_id", id);
      if (own.error) return null;
      var out = [], seen = {};
      (m.data || []).forEach(function (r) { var t = r && r.teams; if (t && t.id && !seen[t.id]) { seen[t.id] = 1; t.circleBalanceOn = t.circle_balance_on; t.createdAt = t.created_at; out.push({ role: r.role || "member", team: t }); } });
      (own.data || []).forEach(function (t) { if (t && t.id && !seen[t.id]) { seen[t.id] = 1; t.circleBalanceOn = t.circle_balance_on; t.createdAt = t.created_at; out.push({ role: "owner", team: t }); } });
      return out;
    } catch (e) { return null; }
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
  // Публичные круги ЧУЖИХ людей (витрина «Открытые круги»). Свои круги СЮДА НЕ попадают: они
  // на главной, а витрина — чтобы находить чужое. Фильтр по owner_id (стабильный uid, БЕЗ race
  // myTeamIds → нет «то появляется, то исчезает») заодно убирает старые «удалённые-но-в-облаке»
  // круги-сироты владельца из его вида. Членство (не владелец) фильтрует клиент по app.teams.
  async function discoverTeams() {
    var c = client(); var id = await uid(); if (!c) return [];
    try {
      var r = await c.from("teams").select("id,name,emblem,vis,owner_id,goal_kind,goal_target,circle_balance_on,created_at,team_members(count)").eq("vis", "public").order("created_at", { ascending: false }).limit(60);
      if (r.error) r = await c.from("teams").select("id,name,emblem,vis,owner_id,goal_kind,goal_target,created_at,team_members(count)").eq("vis", "public").order("created_at", { ascending: false }).limit(60); // до ALTER circle_balance_on
      if (r.error) r = await c.from("teams").select("id,name,emblem,vis,owner_id,goal_kind,goal_target,created_at").eq("vis", "public").order("created_at", { ascending: false }).limit(60); // если embed team_members падает под RLS
      var rows = (r && r.data) || [];
      return rows.filter(function (t) { return !(id && t.owner_id === id); }).map(function (t) {
        return { id: t.id, name: t.name, emblem: t.emblem, vis: t.vis, owner_id: t.owner_id, goalKind: t.goal_kind, goalTarget: t.goal_target, circleBalanceOn: t.circle_balance_on, createdAt: t.created_at, members: (t.team_members && t.team_members[0] && t.team_members[0].count) || 0 };
      });
    } catch (e) { return []; }
  }
  // ПОИСК открытых кругов по имени (Сообщество: строка поиска над лентой). Тот же
  // формат ответа, что у discoverTeams — CloudTeamsDiscoverLive ест обоих.
  async function searchTeams(q) {
    var c = client(); if (!c || !q) return [];
    try {
      var r = await c.from("teams").select("id,name,emblem,vis,owner_id,goal_kind,goal_target,created_at,team_members(count)").eq("vis", "public").ilike("name", "%" + q + "%").limit(20);
      if (r.error) r = await c.from("teams").select("id,name,emblem,vis,owner_id,goal_kind,goal_target,created_at").eq("vis", "public").ilike("name", "%" + q + "%").limit(20);
      var rows = (r && r.data) || [];
      return rows.map(function (t) {
        return { id: t.id, name: t.name, emblem: t.emblem, vis: t.vis, owner_id: t.owner_id, goalKind: t.goal_kind, goalTarget: t.goal_target, createdAt: t.created_at, members: (t.team_members && t.team_members[0] && t.team_members[0].count) || 0 };
      });
    } catch (e) { return []; }
  }
  // «Сейчас N человек держат практики» — живая строка Сообщества (VISION: вместо ленты).
  // RPC bos_active_today (sql/patch_pulse_line.sql, security definer) считает distinct-людей
  // с отметкой за сегодня по всем трём журналам; до патча/при ошибке → null (строка скрыта).
  async function activeToday() {
    var c = client(); var id = await uid(); if (!c || !id) return null;
    try {
      var r = await c.rpc("bos_active_today");
      if (r.error) return null;
      var n = (typeof r.data === "number") ? r.data : parseInt(r.data, 10);
      return isNaN(n) ? null : n;
    } catch (e) { return null; }
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
      // Аудит #7: НЕ считать ещё-не-принятых (role=pending) участниками — иначе они светятся
      // в ростере и завышают счётчики «N из M сделали» и кольца. Заявки живут отдельно
      // (pendingRequests). Принятые (owner/admin/member) — остаются.
      // joined_at — «в круге с …» в карточке человека + «хрупкое окно» новичка в кабинете
      // ведущего (комната круга v2). Столбец в схеме с рождения, фолбэк не нужен.
      var r = await c.from("team_members").select("user_id,role,joined_at,profiles(username,avatar)").eq("team_id", teamId).neq("role", "pending");
      return (r.data || []).map(function (m) { return { id: m.user_id, role: m.role, joinedAt: m.joined_at || null, name: (m.profiles && m.profiles.username) || "", avatar: (m.profiles && m.profiles.avatar) || "default" }; });
    } catch (e) { return []; }
  }
  // Лёгкий и строгий roster для «Баланса окружения»: только id ПРИНЯТЫХ участников.
  // teamMembers() сохраняет старый graceful-контракт [], а здесь ready+[] означает именно
  // успешный пустой результат; ошибка/нет авторизации всегда возвращаются отдельным status.
  async function teamMemberIdsStrict(teamId) {
    var c = client(); var me = await uid();
    if (!c || !me || !teamId) return { status: "error", ids: [] };
    try {
      var r = await c.from("team_members").select("user_id,role").eq("team_id", teamId).neq("role", "pending");
      if (!r || r.error || !Array.isArray(r.data)) return { status: "error", ids: [] };
      var seen = {}, ids = [];
      r.data.forEach(function (m) {
        var id = m && m.user_id;
        if (id && id !== me && m.role !== "pending" && !seen[id]) { seen[id] = true; ids.push(id); }
      });
      return { status: "ready", ids: ids };
    } catch (e) { return { status: "error", ids: [] }; }
  }
  async function teamMembersStrict(teamId) {
    var c = client(); if (!c || !teamId) return { status: "error", people: [] };
    try {
      var r = await c.from("team_members").select("user_id,role,profiles(username,avatar)").eq("team_id", teamId).neq("role", "pending");
      if (!r || r.error || !Array.isArray(r.data)) return { status: "error", people: [] };
      var seen = {}, people = [];
      r.data.forEach(function (m) {
        if (!m || !m.user_id || m.role === "pending" || seen[m.user_id]) return;
        seen[m.user_id] = true;
        people.push({ id: m.user_id, role: m.role, name: (m.profiles && m.profiles.username) || "", avatar: (m.profiles && m.profiles.avatar) || "default" });
      });
      return { status: "ready", people: people };
    } catch (e) { return { status: "error", people: [] }; }
  }
  // One team by id (уведомление «тебя приняли»: постучался → одобрили → надо показать
  // имя круга и дать открыть его; читается, когда ты уже член — RLS пропустит).
  async function teamById(teamId) {
    var c = client(); if (!c || !teamId) return null;
    try {
      // circle_balance_on слоями (до ALTER — прежний селект). row.circleBalanceOn (camelCase) для
      // гейта секции «Баланс круга»; undefined до ALTER → гейт `!== false` → раздел показывается.
      var r = await c.from("teams").select("id,name,emblem,vis,goal_target,circle_balance_on").eq("id", teamId).maybeSingle();
      if (r.error) r = await c.from("teams").select("id,name,emblem,vis,goal_target").eq("id", teamId).maybeSingle();
      var row = r.data || null;
      if (row) row.circleBalanceOn = row.circle_balance_on;
      return row;
    } catch (e) { return null; }
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
  // E: owner edits the team — name/emblem/visibility AND the goal CONFIG ({type,target,unit,title,stake}).
  // Was missing entirely, so settings edits never reached the cloud (looked «бутафорски»): the mode/target
  // now SURVIVE a reload and drive teamGoalProgress for everyone. Owner-gated (RLS + owner_id filter).
  async function updateTeam(teamId, patch) {
    var c = client(); var id = await uid(); if (!c || !id || !teamId || !patch) return false;
    var upd = {};
    if (patch.name != null) upd.name = patch.name;
    if (patch.emblem != null) upd.emblem = patch.emblem;
    if (patch.vis != null) upd.vis = patch.vis;
    if (patch.goalKind != null) upd.goal_kind = patch.goalKind;
    if (patch.goalTarget != null) upd.goal_target = patch.goalTarget;
    if (patch.goal != null) upd.goal = patch.goal; // jsonb config — same shape createTeam writes
    // Цвет (accent) круга — кладём ВНУТРЬ jsonb goal (David 2026-07-11: «цвет у друга старый» — раньше
    // accent писался только локально, в облако не уходил → у других не синхронизировался). Отдельной
    // колонки нет — прячем в уже синхронизируемый goal, без правки схемы БД.
    if (patch.accent != null) upd.goal = Object.assign({}, upd.goal || (patch.goal || {}), { accent: patch.accent });
    if (patch.circleBalanceOn != null) upd.circle_balance_on = !!patch.circleBalanceOn; // тумблер «Баланс круга» (опт-аут владельцем)
    try {
      var r = await c.from("teams").update(upd).eq("id", teamId).eq("owner_id", id);
      if (!r.error) return true;
      // GRACEFUL до patch_circle_balance_toggle.sql: колонки circle_balance_on ещё нет → повторяем
      // БЕЗ неё, чтобы правка имени/значка/цели всё равно сохранилась (не падала из-за одной колонки).
      if (upd.circle_balance_on !== undefined) {
        delete upd.circle_balance_on;
        if (!Object.keys(upd).length) return false;
        var r2 = await c.from("teams").update(upd).eq("id", teamId).eq("owner_id", id);
        return !r2.error;
      }
      return false;
    } catch (e) { return false; }
  }

  // ── РЕАЛЬНЫЕ ОБЩИЕ ПРИВЫЧКИ КОМАНДЫ ─────────────────────────────────────────
  // Each team habit with REAL stats: doneToday (members who marked today), total
  // (member count), doneByMe, weekPct (avg member-completion over the last 7 days).
  async function teamHabitsFull(teamId) {
    var c = client(); var me = await uid(); if (!c || !teamId) return [];
    try {
      var hs = await c.from("team_habits").select("id,name,emoji,is_main,goal_per_day,color").eq("team_id", teamId).order("created_at", { ascending: true });
      if (hs.error) hs = await c.from("team_habits").select("id,name,emoji,is_main,goal_per_day").eq("team_id", teamId).order("created_at", { ascending: true }); // pre-SQL: нет колонки color
      if (hs.error) hs = await c.from("team_habits").select("id,name,emoji,is_main").eq("team_id", teamId).order("created_at", { ascending: true }); // pre-SQL: нет и goal_per_day → graceful fallback
      var habits = (hs.data) || []; if (!habits.length) return [];
      var ids = habits.map(function (h) { return h.id; });
      var since = _localDay(new Date(Date.now() - 6 * 86400000));
      var lg = await c.from("team_habit_logs").select("team_habit_id,user_id,day").in("team_habit_id", ids).gte("day", since);
      var rows = (lg.data) || [];
      var mem = await teamMembers(teamId); var total = mem.length || 1;
      var today = _localDay();
      return habits.map(function (h) {
        var hl = rows.filter(function (r) { return r.team_habit_id === h.id; });
        var todayUsers = {}; hl.forEach(function (r) { if (r.day === today) todayUsers[r.user_id] = 1; });
        var weekSum = 0;
        for (var d = 0; d < 7; d++) {
          var day = _localDay(new Date(Date.now() - d * 86400000));
          var u = {}; hl.forEach(function (r) { if (r.day === day) u[r.user_id] = 1; });
          weekSum += total ? Object.keys(u).length / total : 0;
        }
        // todayUsers как СПИСОК id — клиент строит «пульс» каждого участника (доля закрытых
        // им сегодня привычек круга) без единого лишнего запроса: логи уже пришли выше.
        return { id: h.id, name: h.name, emoji: h.emoji || "✨", isMain: !!h.is_main, goalPerDay: (h.goal_per_day || 1), color: h.color || null, doneToday: Object.keys(todayUsers).length, total: total, doneByMe: !!(me && todayUsers[me]), todayUsers: Object.keys(todayUsers), weekPct: weekSum / 7 };
      });
    } catch (e) { return []; }
  }
  async function addTeamHabit(teamId, h) {
    var c = client(); if (!c || !teamId) return null;
    var _base = { team_id: teamId, name: (h && h.name) || "Привычка", emoji: (h && h.emoji) || "✨", is_main: !!(h && h.isMain) };
    var _gpd = (h && h.goalPerDay) ? Math.max(1, h.goalPerDay) : null;
    var _col = (h && typeof h.color === "string" && h.color[0] === "#") ? h.color : null;
    // Слоями от полного к базовому — колонок goal_per_day/color может ещё не быть (pre-SQL) → graceful.
    var attempts = [];
    if (_gpd != null && _col != null) attempts.push(Object.assign({}, _base, { goal_per_day: _gpd, color: _col }));
    if (_gpd != null) attempts.push(Object.assign({}, _base, { goal_per_day: _gpd }));
    attempts.push(_base);
    for (var i = 0; i < attempts.length; i++) {
      try { var r = await c.from("team_habits").insert(attempts[i]).select().single(); if (!r.error && r.data) return r.data; } catch (e) {}
    }
    return null;
  }
  // E: ПРАВКА определения общей привычки (имя/значок/норма/якорь/цвет). Логи привязаны к
  // (team_habit_id,user_id,day) — правка строки НЕ трогает прогресс участников (David: «без вайпа»).
  // Owner-gated через RLS. Слоями (full→base) — colun color/goal_per_day может не быть.
  async function updateTeamHabit(habitId, patch) {
    var c = client(); var id = await uid(); if (!c || !id || !habitId || !patch) return false;
    var full = {};
    if (patch.name != null) full.name = patch.name;
    if (patch.emoji != null) full.emoji = patch.emoji;
    if (patch.isMain != null) full.is_main = !!patch.isMain;
    if (patch.goalPerDay != null) full.goal_per_day = Math.max(1, patch.goalPerDay);
    if (typeof patch.color === "string" && patch.color[0] === "#") full.color = patch.color;
    if (!Object.keys(full).length) return false;
    var base = {}; ["name", "emoji", "is_main"].forEach(function (k) { if (full[k] != null) base[k] = full[k]; });
    var attempts = [full]; if (Object.keys(base).length && Object.keys(base).length < Object.keys(full).length) attempts.push(base);
    for (var i = 0; i < attempts.length; i++) {
      // Аудит #8 (тот же урок, что у toggleTeamHabitToday ниже — сюда его не донесли): при отказе
      // RLS Supabase НЕ бросает исключение и НЕ кладёт error — он просто НЕ ТРОГАЕТ ни одной
      // строки. Прежнее `if (!r.error) return true` рапортовало успех о записи, которой не было:
      // правка иконки жила ровно до следующей загрузки списка и «сама возвращалась» через секунду
      // (David). Спрашиваем .select("id") и верим только РЕАЛЬНО обновлённым строкам.
      try {
        var r = await c.from("team_habits").update(attempts[i]).eq("id", habitId).select("id");
        if (!r.error && r.data && r.data.length) return true;
      } catch (e) {}
    }
    return false;
  }
  // Удалить общую привычку целиком (её логи каскадом). Только владелец (RLS).
  async function removeTeamHabit(habitId) {
    var c = client(); var id = await uid(); if (!c || !id || !habitId) return false;
    try { var r = await c.from("team_habits").delete().eq("id", habitId); return !r.error; } catch (e) { return false; }
  }
  // Toggle MY "done today" mark on a team habit.
  async function toggleTeamHabitToday(habitId, on) {
    var c = client(); var me = await uid(); if (!c || !me || !habitId) return false;
    var today = _localDay();
    try {
      // Аудит #8: Supabase при отказе (RLS/ограничение) НЕ бросает исключение, а возвращает
      // { error } — раньше мы всё равно возвращали true, и галочка «врала» (стоит, а на сервере
      // пусто → пропадала при след. загрузке). Теперь честно возвращаем успех записи.
      var r;
      // created_at пишет КЛИЕНТ — момент нажатия, а не серверный default (для «Таймлайна»).
      if (on) { r = await c.from("team_habit_logs").upsert({ team_habit_id: habitId, user_id: me, day: today, created_at: new Date().toISOString() }, { onConflict: "team_habit_id,user_id,day", ignoreDuplicates: true }); }
      else { r = await c.from("team_habit_logs").delete().eq("team_habit_id", habitId).eq("user_id", me).eq("day", today); }
      return !(r && r.error);
    } catch (e) { return false; }
  }

  // ── РЕАЛЬНЫЕ «ДЕЛА» СОВМЕСТНОЙ ЦЕЛИ ──────────────────────────────────────────
  // Автор (владелец цели) ставит задания; каждый участник отмечает СВОЁ выполнение и видит,
  // «кто уже сделал». teamTasks → null, если таблиц team_tasks ещё нет (pre-SQL) → клиент
  // прячет раздел «Дела» (живое не ломается). После patch_team_tasks.sql раздел оживает.
  async function teamTasks(teamId) {
    var c = client(); var me = await uid(); if (!c || !teamId) return null;
    try {
      // kind/volunteer_id (Э3) читаем с фолбэком: до community_v2-патча столбцов нет → без них.
      var ts = await c.from("team_tasks").select("id,text,sort,created_at,kind,volunteer_id").eq("team_id", teamId).order("sort", { ascending: true }).order("created_at", { ascending: true });
      if (ts.error) ts = await c.from("team_tasks").select("id,text,sort,created_at").eq("team_id", teamId).order("sort", { ascending: true }).order("created_at", { ascending: true });
      if (ts.error) return null; // таблиц ещё нет → graceful: раздел скрыт
      var tasks = ts.data || [];
      var mem = await teamMembers(teamId); var total = mem.length || 1;
      var byId = {}; mem.forEach(function (m) { byId[m.id] = m; });
      if (!tasks.length) return { total: total, tasks: [] };
      var ids = tasks.map(function (t) { return t.id; });
      var dn = await c.from("team_task_done").select("task_id,user_id").in("task_id", ids);
      var rows = (dn.data) || [];
      return { total: total, tasks: tasks.map(function (t) {
        var du = rows.filter(function (r) { return r.task_id === t.id; }).map(function (r) { return r.user_id; });
        var vol = t.volunteer_id ? byId[t.volunteer_id] : null;
        return { id: t.id, text: t.text, kind: t.kind || "task", volunteerId: t.volunteer_id || null, volunteerName: vol ? vol.name : null, volunteerAvatar: vol ? vol.avatar : null, volunteerMe: !!(me && t.volunteer_id === me), doneUsers: du, doneCount: du.length, doneByMe: !!(me && du.indexOf(me) >= 0) };
      }) };
    } catch (e) { return null; }
  }
  // Добавить дело/просьбу. kind='task' — только владелец (RLS); kind='request' — любой участник.
  async function addTeamTask(teamId, text, kind) {
    var c = client(); if (!c || !teamId || !text) return null;
    try {
      var row = { team_id: teamId, text: ("" + text).slice(0, 200) };
      if (kind) row.kind = kind;
      var r = await c.from("team_tasks").insert(row).select().single();
      if (r.error && kind) { delete row.kind; r = await c.from("team_tasks").insert(row).select().single(); } // до Э3-патча столбца нет
      return (!r.error && r.data) ? r.data : null;
    } catch (e) { return null; }
  }
  // Откликнуться на просьбу / снять отклик. «Я вызвался» ≠ «меня выбрали» (brief 2026-07-11):
  // атомарный RPC bos_claim_request берёт просьбу ТОЛЬКО если она ещё свободна — последний
  // тап не перезаписывает первого. До patch_help_trust_p0.sql RPC нет → фолбэк на прежний
  // update (там гонка остаётся, но клиент хотя бы честно перечитает список по false).
  async function claimTeamRequest(taskId, on) {
    var c = client(); var me = await uid(); if (!c || !me || !taskId) return false;
    try {
      var rpc = await c.rpc("bos_claim_request", { p_task: taskId, p_on: !!on });
      if (!rpc.error) { var d = rpc.data || {}; return d.ok === true; }
    } catch (e) {}
    try {
      var q = c.from("team_tasks").update({ volunteer_id: on ? me : null }).eq("id", taskId);
      q = on ? q.is("volunteer_id", null) : q.eq("volunteer_id", me); // не перезаписывать и не снимать ЧУЖОЙ отклик
      var r = await q; return !(r && r.error);
    } catch (e) { return false; }
  }
  // Владелец удаляет задание (его отметки каскадом). RLS: delete только owner.
  async function removeTeamTask(taskId) {
    var c = client(); var id = await uid(); if (!c || !id || !taskId) return false;
    try { var r = await c.from("team_tasks").delete().eq("id", taskId); return !r.error; } catch (e) { return false; }
  }
  // Участник ставит/снимает СВОЮ отметку «выполнил». RLS: пишет/удаляет только свою строку.
  async function toggleTeamTaskMine(taskId, on) {
    var c = client(); var me = await uid(); if (!c || !me || !taskId) return false;
    try {
      var r;
      if (on) { r = await c.from("team_task_done").upsert({ task_id: taskId, user_id: me }, { onConflict: "task_id,user_id", ignoreDuplicates: true }); }
      else { r = await c.from("team_task_done").delete().eq("task_id", taskId).eq("user_id", me); }
      return !(r && r.error);
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
  // ЛЁГКИЙ счёт непрочитанных для шторки/точки: count-only HEAD-запрос вместо полной ленты
  // (раньше сборщик тянул до 200 строк текста НА КАЖДЫЙ круг только чтобы посчитать) + одно
  // последнее чужое сообщение для превью. При сотнях людей это главная экономия чтения.
  async function unreadMessages(teamId, sinceMs) {
    var c = client(); var id = await uid(); if (!c || !teamId) return null;
    try {
      var sinceIso = new Date(sinceMs || 0).toISOString();
      var cnt = await c.from("messages").select("id", { count: "exact", head: true })
        .eq("team_id", teamId).neq("user_id", id).gt("created_at", sinceIso);
      if (cnt.error) return null;
      var n = cnt.count || 0;
      if (!n) return { count: 0, last: null };
      var lr = await c.from("messages").select("id,user_id,text,image_url,created_at")
        .eq("team_id", teamId).neq("user_id", id).order("created_at", { ascending: false }).limit(1);
      return { count: n, last: (lr.data && lr.data[0]) || null };
    } catch (e) { return null; }
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
    var sh = null;
    // RPC-first (patch_privacy_shared_habits): код = приглашение → SECURITY DEFINER вписывает и
    // возвращает ТУ привычку (перечисление чужих кодов закрыто). Graceful: нет функции (до патча) →
    // старый прямой путь upsert+select (пока read-политика ещё using(true) он работает).
    try {
      var rp = await c.rpc("join_shared", { c: code });
      if (rp && !rp.error && rp.data) { var d = Array.isArray(rp.data) ? rp.data[0] : rp.data; if (d && d.code) sh = { code: d.code, name: d.name, emoji: d.emoji, color: d.color, owner_id: d.owner_id }; }
    } catch (e) {}
    if (!sh) {
      try {
        await c.from("shared_habit_members").upsert({ code: code, user_id: id }, { onConflict: "code,user_id", ignoreDuplicates: true });
        var r = await c.from("shared_habits").select("code,name,emoji,color,owner_id").eq("code", code).maybeSingle();
        sh = (r && r.data) || { code: code, name: "Привычка" };
      } catch (e) { return { code: code, name: "Привычка" }; }
    }
    // Who invited you (the habit's creator) — powers the welcome sheet «X зовёт вести вместе».
    if (sh && sh.owner_id) { try { var op = await c.from("profiles").select("username,avatar").eq("id", sh.owner_id).maybeSingle(); if (op && op.data) { sh.ownerName = op.data.username || ""; sh.ownerAvatar = op.data.avatar || "default"; } } catch (e2) {} }
    return sh || { code: code, name: "Привычка" };
  }
  async function setSharedLog(code, day, on) {
    if (!code || !day) return false;
    // ts = момент нажатия (для «Таймлайна»): очередь может доехать позже, но время отметки честное.
    return _durable({ type: "sharedLog", key: "sharedLog:" + code + ":" + day, args: { code: code, day: day, on: !!on, ts: new Date().toISOString() } });
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
      // created_at — время отметки для «небо-нити» (patch_sky_thread.sql). До патча колонки нет —
      // слоёный фолбэк: селект без неё, нить просто не увидит времён (счёт дня работает всегда).
      var logs = await c.from("shared_habit_logs").select("user_id,day,created_at").eq("code", code);
      if (logs.error) logs = await c.from("shared_habit_logs").select("user_id,day").eq("code", code);
      var rows = (logs && logs.data) || [];
      // Owner — so the client knows whether I may REMOVE members (only the owner can; swipe-remove
      // is shown only to them so it never offers an action RLS would refuse).
      var sh = await c.from("shared_habits").select("owner_id").eq("code", code).maybeSingle();
      var ownerId = (sh && sh.data && sh.data.owner_id) || null;
      var today = _localDay();
      var members = (mem.data || []).map(function (m) {
        var days = {}, todayAt = null;
        rows.forEach(function (r) {
          if (r.user_id !== m.user_id) return;
          days["" + r.day] = true;
          if ("" + r.day === today && r.created_at && (!todayAt || r.created_at < todayAt)) todayAt = r.created_at;
        });
        return { id: m.user_id, me: m.user_id === me, isOwner: ownerId != null && m.user_id === ownerId, name: (m.profiles && m.profiles.username) || "Друг", avatar: (m.profiles && m.profiles.avatar) || "default", days: days, todayAt: todayAt };
      });
      members.sort(function (a, b) { return (b.me ? 1 : 0) - (a.me ? 1 : 0); }); // self first
      return { members: members, ownerId: ownerId };
    } catch (e) { return null; }
  }
  // Строгая лёгкая выборка участников общей привычки — без профилей и календарей.
  // Нужна аналитике связей, где null/[] после сетевой ошибки нельзя выдавать за «никого нет».
  async function sharedHabitMemberIdsStrict(code) {
    var c = client(); var me = await uid();
    if (!c || !me || !code) return { status: "error", ids: [] };
    try {
      var r = await c.from("shared_habit_members").select("user_id").eq("code", code);
      if (!r || r.error || !Array.isArray(r.data)) return { status: "error", ids: [] };
      var seen = {}, ids = [];
      r.data.forEach(function (m) {
        var id = m && m.user_id;
        if (id && id !== me && !seen[id]) { seen[id] = true; ids.push(id); }
      });
      return { status: "ready", ids: ids };
    } catch (e) { return { status: "error", ids: [] }; }
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

  // «НЕБО-НИТЬ» (лента дня в комнате круга): времена СЕГОДНЯШНИХ отметок каждого участника +
  // возраст круга. created_at в team_habit_logs писался всегда — его просто никто не читал.
  // По человеку берём его ПЕРВУЮ отметку за сегодня («когда пришёл»), не последнюю.
  // «Пульс круга» для ВНЕШНЕЙ карточки (David 2026-07-15). Отметки чужого круга закрыты RLS —
  // клиент получил бы 0 строк МОЛЧА, и живой круг выглядел бы мёртвым. Поэтому агрегат считает
  // сервер: bos_circle_pulse (supabase/patch_circle_pulse.sql) отдаёт только «сколько людей
  // сегодня», поминутную раскладку дня (без имён) и час пик за 30 дней. Работает лишь для
  // ОТКРЫТЫХ кругов — для своих участник и так читает отметки напрямую (teamTodayTimes).
  // День шлём СВОЙ, локальный: по UTC сервер ошибся бы на сутки (тот же приём, что в day_pulse).
  // Патч не прогнан → rpc вернёт ошибку → null → карточка просто не покажет живое (не соврёт).
  var _pulseCache = {};
  async function circlePulse(teamId) {
    var c = client();
    if (!c || !teamId) return null;
    var hit = _pulseCache[teamId];
    if (hit && Date.now() - hit.at < 120000) return hit.v;   // 2 мин: лента круче не обновляется
    try {
      var r = await c.rpc("bos_circle_pulse", { p_team: teamId, p_day: _localDay() });
      if (r.error || !r.data) return null;
      var v = { todayN: r.data.todayN || 0, mins: Array.isArray(r.data.mins) ? r.data.mins : [], peak: (r.data.peak == null ? null : r.data.peak) };
      _pulseCache[teamId] = { at: Date.now(), v: v };
      return v;
    } catch (e) { return null; }
  }
  async function teamTodayTimes(teamId) {
    var c = client(); var me = await uid();
    if (!c || !me || !teamId) return { times: {}, createdAt: null };
    try {
      var out = { times: {}, createdAt: null };
      try {
        var tm = await c.from("teams").select("created_at").eq("id", teamId).maybeSingle();
        if (tm && tm.data && tm.data.created_at) out.createdAt = tm.data.created_at;
      } catch (e0) {}
      var th = await c.from("team_habits").select("id").eq("team_id", teamId);
      var ids = ((th && th.data) || []).map(function (r) { return r.id; });
      if (!ids.length) return out;
      var lg = await c.from("team_habit_logs").select("user_id,created_at").in("team_habit_id", ids).eq("day", _localDay());
      var rows = (lg && lg.data) || [];
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i]; if (!r || !r.user_id || !r.created_at) continue;
        if (!out.times[r.user_id] || r.created_at < out.times[r.user_id]) out.times[r.user_id] = r.created_at;
      }
      return out;
    } catch (e) { return { times: {}, createdAt: null }; }
  }

  // ── КОМНАТА КРУГА (макет И/К, 2026-07-16) — три источника живого ────────────────
  // Логи круга за N дней ОДНИМ запросом: [{u,h,day}] — кормят серию круга, «Ритм» привычки,
  // журнал ведущего и карточку человека. Читают только участники (RLS team_habit_logs_read);
  // про ЧУЖОЙ круг наружу говорит только агрегат bos_circle_pulse — здесь честный null.
  async function teamLogsRange(teamId, days) {
    var c = client(); if (!c || !teamId) return null;
    try {
      var th = await c.from("team_habits").select("id").eq("team_id", teamId);
      var ids = ((th && th.data) || []).map(function (r) { return r.id; });
      if (!ids.length) return { rows: [] };
      var since = new Date(); since.setDate(since.getDate() - Math.max(0, (days || 31) - 1));
      // ПАГИНАЦИЯ: Supabase молча режет ответ на 1000 строк — на круге 150×3×31 это треть
      // данных, и серия круга/журнал ведущего посчитались бы «честно неверно». Листаем до конца
      // (потолок 15к строк — страховка от бесконечного цикла, реальный месяц круга меньше).
      var out = [], from = 0, PAGE = 1000;
      while (from < 15000) {
        var lg = await c.from("team_habit_logs").select("user_id,team_habit_id,day").in("team_habit_id", ids).gte("day", _localDay(since)).order("day", { ascending: false }).range(from, from + PAGE - 1);
        if (lg.error || !Array.isArray(lg.data)) return from === 0 ? null : { rows: out };
        lg.data.forEach(function (r) { out.push({ u: r.user_id, h: r.team_habit_id, day: r.day }); });
        if (lg.data.length < PAGE) break;
        from += PAGE;
      }
      return { rows: out };
    } catch (e) { return null; }
  }
  // МОЙ год в привычке круга: дни моих отметок этой привычки с 1 января. Крошечный запрос
  // (только свои строки) — годовой вид «Ритма» не тянет чужие тысячи строк.
  async function teamMyHabitYear(habitId) {
    var c = client(); var me = await uid(); if (!c || !me || !habitId) return null;
    try {
      var y = new Date().getFullYear() + "-01-01";
      var r = await c.from("team_habit_logs").select("day").eq("team_habit_id", habitId).eq("user_id", me).gte("day", y);
      if (r.error || !Array.isArray(r.data)) return null;
      var out = {}; r.data.forEach(function (x) { if (x && x.day) out[x.day] = true; });
      return out;
    } catch (e) { return null; }
  }
  // Сегодняшние отметки СО ВРЕМЕНЕМ: [{u,h,at}] — пульс дня (строки «закрыл(а)», пачки,
  // «ты в 06:58», волна нити). team_habit_logs.created_at писался всегда.
  async function teamDayFeed(teamId) {
    var c = client(); if (!c || !teamId) return null;
    try {
      var th = await c.from("team_habits").select("id").eq("team_id", teamId);
      var ids = ((th && th.data) || []).map(function (r) { return r.id; });
      if (!ids.length) return { rows: [] };
      // Та же пагинация, что в teamLogsRange: день большого круга может перерасти лимит 1000.
      var out = [], from = 0, PAGE = 1000;
      while (from < 5000) {
        var lg = await c.from("team_habit_logs").select("user_id,team_habit_id,created_at").in("team_habit_id", ids).eq("day", _localDay()).order("created_at", { ascending: true }).range(from, from + PAGE - 1);
        if (lg.error || !Array.isArray(lg.data)) return from === 0 ? null : { rows: out };
        lg.data.forEach(function (r) { out.push({ u: r.user_id, h: r.team_habit_id, at: r.created_at }); });
        if (lg.data.length < PAGE) break;
        from += PAGE;
      }
      return { rows: out };
    } catch (e) { return null; }
  }
  // «Подбодрить» 🔥 — таблица team_cheers (patch_circle_room.sql). До патча таблицы нет →
  // null → клиент честно прячет огоньки (паттерн teamTasks). Один огонёк человеку в день —
  // держит УНИКАЛЬНЫЙ ключ в самой таблице, не клиент.
  async function teamCheersToday(teamId) {
    var c = client(); var me = await uid(); if (!c || !me || !teamId) return null;
    try {
      var r = await c.from("team_cheers").select("from_user,to_user,created_at").eq("team_id", teamId).eq("day", _localDay());
      if (r.error || !Array.isArray(r.data)) return null;
      return { me: me, rows: r.data.map(function (x) { return { from: x.from_user, to: x.to_user, at: x.created_at }; }) };
    } catch (e) { return null; }
  }
  async function sendTeamCheer(teamId, toUser) {
    var c = client(); var me = await uid(); if (!c || !me || !teamId || !toUser || toUser === me) return false;
    try {
      var r = await c.from("team_cheers").upsert({ team_id: teamId, from_user: me, to_user: toUser, day: _localDay() }, { onConflict: "team_id,from_user,to_user,day", ignoreDuplicates: true });
      return !(r && r.error);
    } catch (e) { return false; }
  }

  // Current consecutive-day streak ending today (or yesterday, if today isn't marked yet)
  // from a {dayKey:true} set. Used to derive the «серия у каждого» goal mode.
  // ЛОКАЛЬНЫЙ день-ключ YYYY-MM-DD (как bosTodayKey в shell + как ключи _bosStreakDays). Командный
  // слой раньше писал/читал день по UTC (toISOString) — расходилось с личными логами (локальные) и
  // с _bosStreakDays: ночью в РФ отметка уходила «не в тот день», а «снять» после полуночи стирала
  // вчерашний вклад. Теперь весь командный слой считает день ЛОКАЛЬНО → сходится везде.
  function _localDay(dt) { var d = dt || new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
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
      var desc = (goal && typeof goal.desc === "string") ? goal.desc : ""; // заметка создателя под целью (teams.goal.desc) — синкается всем
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
      return { type: type, target: target, unit: unit, current: current, stake: stake, bank: bank, done: done, desc: desc, members: out };
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
        // Аудит #В3: банк гонки выплачивается ОДИН раз НА КОМАНДУ. Ключ идемпотентности —
        // (team_id,user_id), поэтому при смене лидера НОВЫЙ лидер получал бы банк повторно.
        // Защита: если won-строка по этой команде уже есть — банк забран, повторно не платим.
        try {
          var paid = await c.from("team_goal_settlements").select("user_id").eq("team_id", teamId).eq("won", true).limit(1);
          if (paid && paid.data && paid.data.length) return { settled: false, won: false, xp: 0, type: prog.type, bank: prog.bank, stake: prog.stake, alreadyPaid: true };
        } catch (e) {}
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

  // ── Этап 1 «Серверная правда»: XP-кошелёк (публичное API) ────────────────
  // spendLedger — положить трату в серверный журнал ЧЕРЕЗ надёжную очередь:
  // офлайн/сбой → доедет позже; патч не применён → запасник; ref = идемпотентность.
  async function spendLedger(a) {
    if (!a || !((a.amount | 0) > 0)) return false;
    var key = "ledger:" + (a.ref || ("t" + Date.now() + ":" + Math.random().toString(36).slice(2, 7)));
    return _durable({ type: "ledgerSpend", key: key, args: { amount: a.amount | 0, ref: a.ref || null, kind: a.kind || "spend", earned: (a.earned == null ? null : (a.earned | 0)), meta: a.meta || {} } });
  }
  // wallet — серверная сводка {spent, credited, ops} | null (патч не применён / офлайн).
  async function wallet() {
    var c = client(); if (!c) return null;
    try { var r = await c.rpc("bos_wallet"); if (r.error) return null; return r.data || null; } catch (e) { return null; }
  }

  // ── Напоминания привычек (пуш через бота) ────────────────────────────────────
  // Клиент публикует своё расписание в таблицу habit_reminders (со СВОИМ tz_offset —
  // сервер не знает пояс). Планировщик (edge-функция remind + cron) читает её и в нужную
  // локальную минуту шлёт сообщение ботом на profiles.tg_id. Всё graceful: если патч
  // habit_reminders ещё не прогнан — upsert вернёт {error} → false, ничего не ломается.
  async function upsertReminder(hkey, r) {
    var c = client(); var id = await uid(); if (!c || !id || !hkey || !r) return false;
    try {
      var row = {
        user_id: id, hkey: String(hkey),
        name: r.name || "Привычка", emoji: r.emoji || null,
        time: r.time || "09:00",
        days: (Array.isArray(r.days) && r.days.length === 7) ? r.days : null,
        tz_offset: (typeof r.tzOffset === "number") ? r.tzOffset : 0,
        active: r.active !== false,
        updated_at: new Date().toISOString(),
      };
      var res = await c.from("habit_reminders").upsert(row, { onConflict: "user_id,hkey" });
      return !(res && res.error);
    } catch (e) { return false; }
  }
  async function deleteReminder(hkey) {
    var c = client(); var id = await uid(); if (!c || !id || !hkey) return false;
    try { var res = await c.from("habit_reminders").delete().eq("user_id", id).eq("hkey", String(hkey)); return !(res && res.error); }
    catch (e) { return false; }
  }
  // УМНЫЙ ПУШ: привычку отметили сегодня → гасим сегодняшнее напоминание (ставим last_sent_day =
  // локальный день), чтобы бот не дёргал зря. Тот же локальный день, что считает функция remind.
  function _localDayStr() {
    var d = new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  async function markReminderDone(hkey) {
    var c = client(); var id = await uid(); if (!c || !id || !hkey) return false;
    try { var res = await c.from("habit_reminders").update({ last_sent_day: _localDayStr() }).eq("user_id", id).eq("hkey", String(hkey)); return !(res && res.error); }
    catch (e) { return false; }
  }
  // Публикуем свой часовой пояс в профиль (минуты от UTC, Москва = +180) — чтобы вечерний
  // чек-ин слался в ЛОКАЛЬНЫЕ ~20:00. Graceful: нет колонки tz_offset → тихий no-op.
  async function saveTz(offset) {
    var c = client(); var id = await uid(); if (!c || !id) return false;
    try { var res = await c.from("profiles").update({ tz_offset: (typeof offset === "number") ? offset : 0 }).eq("id", id); return !(res && res.error); }
    catch (e) { return false; }
  }

  // ── SKILL NETWORK v1 · future patch_skill_network_v1.sql ─────────────────────
  // This API is deliberately separate from the legacy offer helpers below. Missing tables/RPCs,
  // auth or network never fall back to the old free-form model: reads return an explicit status,
  // mutations return {ok:false,err}. That keeps a half-deployed patch from publishing or booking
  // something under weaker legacy rules.
  var _NET_SKILL_OFFER_FIELDS = "id,owner_id,emoji,title,descr,price_xp,min_level,slots_week,when_text,active,status,visibility,kind,skill_id,skill_key,interaction_key,outcome_key,mode,created_at";
  var _NET_SKILL_EPISODE_FIELDS = "id,offer_id,owner_id,booker_id,week,price_xp,kind,status,request_note,provider_done_at,recipient_done_at,created_at,network_offers!inner(id,kind,skill_id,skill_key,interaction_key,outcome_key,mode,title,emoji)";

  function _netV1Err(err) {
    var code = ((err && err.code) || "").toLowerCase();
    var msg = ((err && err.message) || "").toLowerCase();
    if (code === "pgrst202" || code === "pgrst204" || code === "pgrst205" || code === "42p01" || code === "42703" ||
        msg.indexOf("could not find the function") >= 0 || msg.indexOf("does not exist") >= 0 || msg.indexOf("schema cache") >= 0) return "unavailable";
    if (code === "auth" || code.indexOf("jwt") >= 0 || msg.indexOf("not authenticated") >= 0) return "auth";
    if (code === "42501" || msg.indexOf("permission denied") >= 0) return "forbidden";
    if (msg.indexOf("fetch") >= 0 || msg.indexOf("network") >= 0 || msg.indexOf("timeout") >= 0) return "network";
    return "server";
  }
  function _netV1ReadFail(key, err, extra) {
    var out = { status: "error", err: _netV1Err(err) }; out[key] = [];
    if (extra) Object.keys(extra).forEach(function (k) { out[k] = extra[k]; });
    return out;
  }
  function _netV1Parse(data) {
    if (typeof data !== "string") return data;
    try { return JSON.parse(data); } catch (e) { return data; }
  }
  function _netV1Mutation(res) {
    if (!res || res.error) return { ok: false, err: _netV1Err(res && res.error) };
    var data = _netV1Parse(res.data);
    if (data && typeof data === "object" && !Array.isArray(data)) {
      var out = Object.assign({}, data);
      if (out.ok == null) out.ok = !out.err;
      return out;
    }
    return { ok: true, data: data == null ? null : data };
  }
  function _netV1Id(v) { return (typeof v === "string" && v.trim()) ? v.trim() : null; }
  function _netV1Page(opts, max) {
    opts = opts || {}; max = max || 100;
    return { limit: Math.max(1, Math.min(max, (opts.limit | 0) || 40)), offset: Math.max(0, opts.offset | 0) };
  }
  async function _netV1Rpc(name, args) {
    var c = client(); var id = await uid();
    if (!c || !id) return { ok: false, err: "auth" };
    try { return _netV1Mutation(await c.rpc(name, args || {})); }
    catch (e) { return { ok: false, err: _netV1Err(e) }; }
  }

  // Safe catalogue. The future patch owns taxonomy and ordering; the client never invents skills.
  async function netSkillsCatalog() {
    var c = client(); var id = await uid();
    if (!c || !id) return _netV1ReadFail("skills", { code: "auth", message: "not authenticated" });
    try {
      var r = await c.from("skill_catalog").select("*");
      if (!r || r.error || !Array.isArray(r.data)) return _netV1ReadFail("skills", r && r.error);
      var skills = r.data.filter(function (s) { return s && s.active !== false; });
      skills.sort(function (a, b) { return ((a.sort_order | 0) - (b.sort_order | 0)) || String(a.title || a.name || "").localeCompare(String(b.title || b.name || ""), "ru"); });
      return { status: "ready", skills: skills };
    } catch (e) { return _netV1ReadFail("skills", e); }
  }
  // Own claims/evidence only. RLS in patch_skill_network_v1.sql remains the authority.
  async function loadMySkills() {
    var c = client(); var id = await uid();
    if (!c || !id) return _netV1ReadFail("skills", { code: "auth", message: "not authenticated" });
    try {
      var r = await c.from("user_skills").select("*").eq("owner_id", id);
      if (!r || r.error || !Array.isArray(r.data)) return _netV1ReadFail("skills", r && r.error);
      var skills = r.data.slice().sort(function (a, b) { return String(a.created_at || a.claimed_at || "").localeCompare(String(b.created_at || b.claimed_at || "")); });
      return { status: "ready", skills: skills };
    } catch (e) { return _netV1ReadFail("skills", e); }
  }
  async function claimSkill(skillId) {
    skillId = _netV1Id(skillId); if (!skillId) return { ok: false, err: "skill" };
    return _netV1Rpc("bos_claim_skill", { p_skill: skillId });
  }

  // Conscious Network identity lookup. Unlike allPublic() this is called only for owners already
  // present in Network and returns first name. Requested IDs are bounded/chunked; no world dump.
  // A future server-owned profiles.level wins; until it exists, public pub_orbit.level is labelled.
  async function netProfiles(ownerIds) {
    var c = client(); var me = await uid();
    if (!c || !me) return _netV1ReadFail("profiles", { code: "auth", message: "not authenticated" });
    var seen = {}, ids = [];
    (Array.isArray(ownerIds) ? ownerIds : []).forEach(function (v) { var x = _netV1Id(v); if (x && !seen[x]) { seen[x] = true; ids.push(x); } });
    ids = ids.slice(0, 240);
    if (!ids.length) return { status: "ready", profiles: [] };
    var rows = [], failed = 0;
    for (var i = 0; i < ids.length; i += 80) {
      var part = ids.slice(i, i + 80);
      try {
        var base = await c.from("profiles").select("id,username,avatar,pub_orbit").in("id", part);
        if (base && base.error && typeof _isMissingCol === "function" && _isMissingCol(base.error)) base = await c.from("profiles").select("id,username,avatar").in("id", part);
        if (!base || base.error || !Array.isArray(base.data)) { failed++; continue; }
        var serverLevels = {};
        try {
          var lv = await c.from("profiles").select("id,level").in("id", part);
          if (lv && !lv.error && Array.isArray(lv.data)) lv.data.forEach(function (p) { if (p && p.id && (p.level | 0) > 0) serverLevels[p.id] = p.level | 0; });
        } catch (e2) {}
        base.data.forEach(function (p) {
          if (!p || !p.id || !seen[p.id]) return;
          var first = String(p.username || "").trim().split(/\s+/)[0] || "Участник";
          var pubLevel = p.pub_orbit && (p.pub_orbit.level | 0) > 0 ? (p.pub_orbit.level | 0) : null;
          rows.push({ id: p.id, username: first, name: first, avatar: p.avatar || "default", level: serverLevels[p.id] || pubLevel || null, levelSource: serverLevels[p.id] ? "server" : (pubLevel ? "public" : null) });
        });
      } catch (e) { failed++; }
    }
    return { status: failed ? (rows.length ? "partial" : "error") : "ready", profiles: rows, failed: failed };
  }

  // Public skill offers only: kind + trust + visibility are all required client-side in addition
  // to server RLS. No fallback to legacy rows when the new columns are missing.
  async function netSkillOffers(opts) {
    var c = client(); var me = await uid(); var pg = _netV1Page(opts, 100); opts = opts || {};
    if (!c || !me) return _netV1ReadFail("offers", { code: "auth", message: "not authenticated" });
    try {
      var q = c.from("network_offers").select(_NET_SKILL_OFFER_FIELDS)
        .eq("kind", "skill_offer").eq("active", true).eq("status", "confirmed").eq("visibility", "all");
      if (_netV1Id(opts.skillId)) q = q.eq("skill_id", opts.skillId);
      if (_netV1Id(opts.skillKey)) q = q.eq("skill_key", opts.skillKey);
      if (_netV1Id(opts.ownerId)) q = q.eq("owner_id", opts.ownerId);
      if (_netV1Id(opts.interactionKey)) q = q.eq("interaction_key", opts.interactionKey);
      if (_netV1Id(opts.outcomeKey)) q = q.eq("outcome_key", opts.outcomeKey);
      if (_netV1Id(opts.mode)) q = q.eq("mode", opts.mode);
      q = q.order("created_at", { ascending: false }).range(pg.offset, pg.offset + pg.limit - 1);
      var r = await q;
      if (!r || r.error || !Array.isArray(r.data)) return _netV1ReadFail("offers", r && r.error);
      return { status: "ready", offers: r.data, offset: pg.offset, nextOffset: r.data.length === pg.limit ? pg.offset + pg.limit : null };
    } catch (e) { return _netV1ReadFail("offers", e); }
  }
  async function netMySkillOffers(opts) {
    var c = client(); var id = await uid(); var pg = _netV1Page(opts, 100); opts = opts || {};
    if (!c || !id) return _netV1ReadFail("offers", { code: "auth", message: "not authenticated" });
    try {
      var q = c.from("network_offers").select(_NET_SKILL_OFFER_FIELDS).eq("owner_id", id).eq("kind", "skill_offer");
      if (_netV1Id(opts.status)) q = q.eq("status", opts.status);
      if (_netV1Id(opts.skillId)) q = q.eq("skill_id", opts.skillId);
      if (_netV1Id(opts.skillKey)) q = q.eq("skill_key", opts.skillKey);
      q = q.order("created_at", { ascending: false }).range(pg.offset, pg.offset + pg.limit - 1);
      var r = await q;
      if (!r || r.error || !Array.isArray(r.data)) return _netV1ReadFail("offers", r && r.error);
      return { status: "ready", offers: r.data, offset: pg.offset, nextOffset: r.data.length === pg.limit ? pg.offset + pg.limit : null };
    } catch (e) { return _netV1ReadFail("offers", e); }
  }

  // Only editable product fields cross the client boundary. owner/status/visibility/kind/active are
  // server-owned and deliberately omitted; the RPC creates kind='skill_offer' as a safe draft.
  async function netUpsertSkillOffer(input) {
    input = input || {};
    var skillId = _netV1Id(input.skill_id || input.skillId);
    var interaction = _netV1Id(input.interaction_key || input.interactionKey);
    var outcome = _netV1Id(input.outcome_key || input.outcomeKey);
    var mode = _netV1Id(input.mode);
    if (!skillId || !interaction || !outcome || !mode) return { ok: false, err: "input" };
    var offer = { skill_id: skillId, interaction_key: interaction, outcome_key: outcome, mode: mode };
    var oid = _netV1Id(input.id); if (oid) offer.id = oid;
    if (input.slots_week != null) offer.slots_week = Math.max(1, Math.min(5, input.slots_week | 0));
    if (input.when_text != null) offer.when_text = String(input.when_text).trim().slice(0, 120);
    // price_xp=0 и min_level=1 — серверные границы v1, клиент их не предлагает и не шлёт.
    return _netV1Rpc("bos_upsert_skill_offer", { p_offer: offer });
  }
  async function netPublishSkillOffer(offerId) {
    offerId = _netV1Id(offerId); if (!offerId) return { ok: false, err: "offer" };
    return _netV1Rpc("bos_publish_skill_offer", { p_offer: offerId });
  }
  async function netPauseSkillOffer(offerId, paused) {
    offerId = _netV1Id(offerId); if (!offerId) return { ok: false, err: "offer" };
    return _netV1Rpc("bos_pause_skill_offer", { p_offer: offerId, p_paused: paused !== false });
  }

  async function netRequestSkillOffer(offerId, requestNote) {
    offerId = _netV1Id(offerId); var note = String(requestNote || "").trim().slice(0, 240);
    if (!offerId) return { ok: false, err: "offer" };
    if (!note) return { ok: false, err: "request_note" };
    return _netV1Rpc("bos_request_skill_offer", { p_offer: offerId, p_request_note: note });
  }
  async function _netSkillEpisodes(side, opts) {
    var c = client(); var id = await uid(); var pg = _netV1Page(opts, 100); opts = opts || {};
    if (!c || !id) return _netV1ReadFail("episodes", { code: "auth", message: "not authenticated" });
    try {
      var col = side === "incoming" ? "owner_id" : "booker_id";
      var q = c.from("network_bookings").select(_NET_SKILL_EPISODE_FIELDS).eq(col, id)
        .eq("kind", "skill_episode").eq("network_offers.kind", "skill_offer");
      if (_netV1Id(opts.status)) q = q.eq("status", opts.status);
      q = q.order("created_at", { ascending: false }).range(pg.offset, pg.offset + pg.limit - 1);
      var r = await q;
      if (!r || r.error || !Array.isArray(r.data)) return _netV1ReadFail("episodes", r && r.error);
      // status + inner kind filter keep legacy circle bookings out of the episode inbox.
      var episodes = r.data.filter(function (e) { return e && e.status; });
      return { status: "ready", episodes: episodes, offset: pg.offset, nextOffset: r.data.length === pg.limit ? pg.offset + pg.limit : null };
    } catch (e) { return _netV1ReadFail("episodes", e); }
  }
  function netIncomingSkillEpisodes(opts) { return _netSkillEpisodes("incoming", opts); }
  function netOutgoingSkillEpisodes(opts) { return _netSkillEpisodes("outgoing", opts); }
  async function _netSkillEpisodeAction(episodeId, action) {
    episodeId = _netV1Id(episodeId);
    if (!episodeId || ["accept", "decline", "cancel"].indexOf(action) < 0) return { ok: false, err: "action" };
    return _netV1Rpc("bos_skill_episode_action", { p_episode: episodeId, p_action: action });
  }
  function netAcceptSkillEpisode(episodeId) { return _netSkillEpisodeAction(episodeId, "accept"); }
  function netDeclineSkillEpisode(episodeId) { return _netSkillEpisodeAction(episodeId, "decline"); }
  function netCancelSkillEpisode(episodeId) { return _netSkillEpisodeAction(episodeId, "cancel"); }
  async function _netSkillMarkDone(episodeId, role) {
    episodeId = _netV1Id(episodeId);
    if (!episodeId || ["provider", "recipient"].indexOf(role) < 0) return { ok: false, err: "role" };
    return _netV1Rpc("bos_skill_mark_done", { p_episode: episodeId, p_role: role });
  }
  function netMarkSkillProviderDone(episodeId) { return _netSkillMarkDone(episodeId, "provider"); }
  function netMarkSkillRecipientDone(episodeId) { return _netSkillMarkDone(episodeId, "recipient"); }
  async function netSkillEpisodeContact(episodeId) {
    episodeId = _netV1Id(episodeId);
    if (!episodeId) return { status: "error", err: "episode", contact: null };
    var r = await _netV1Rpc("bos_skill_episode_contact", { p_episode: episodeId });
    if (!r.ok) return { status: "error", err: r.err || "server", contact: null };
    var contact = r.contact != null ? r.contact : (r.data != null ? r.data : { first_name: r.first_name || null, avatar: r.avatar || null, telegram_url: r.telegram_url || null });
    if (!contact || typeof contact !== "object" || Array.isArray(contact)) return { status: "error", err: "not_available", contact: null };
    return { status: "ready", contact: contact };
  }

  async function netSkillOfferCounts(offerId) {
    offerId = _netV1Id(offerId); if (!offerId) return { status: "error", err: "offer", counts: null };
    var r = await _netV1Rpc("bos_skill_offer_counts", { p_offer: offerId });
    if (!r.ok) return { status: "error", err: r.err || "server", counts: null };
    var counts = r.counts != null ? r.counts : (r.data != null ? r.data : Object.assign({}, r));
    if (counts && typeof counts === "object") delete counts.ok;
    return { status: "ready", counts: counts };
  }
  async function netSkillEvidence(userId, skillId) {
    if (skillId == null) { skillId = userId; userId = null; }
    skillId = _netV1Id(skillId); var id = _netV1Id(userId) || await uid();
    if (!id || !skillId) return { status: "error", err: !id ? "auth" : "skill", evidence: null };
    var r = await _netV1Rpc("bos_skill_evidence_summary", { p_user: id, p_skill: skillId });
    if (!r.ok) return { status: "error", err: r.err || "server", evidence: null };
    var evidence = r.evidence != null ? r.evidence : (r.data != null ? r.data : Object.assign({}, r));
    if (evidence && typeof evidence === "object") delete evidence.ok;
    return { status: "ready", evidence: evidence };
  }

  async function netBlockUser(userId) {
    userId = _netV1Id(userId); if (!userId) return { ok: false, err: "user" };
    return _netV1Rpc("bos_block_network_user", { p_user: userId });
  }
  async function netUnblockUser(userId) {
    userId = _netV1Id(userId); if (!userId) return { ok: false, err: "user" };
    return _netV1Rpc("bos_unblock_network_user", { p_user: userId });
  }
  async function netReportUser(userId, reason, context) {
    userId = _netV1Id(userId); reason = _netV1Id(reason); context = context || {};
    if (!userId || !reason) return { ok: false, err: !userId ? "user" : "reason" };
    reason = reason.slice(0, 64);
    var safe = {};
    var offerId = _netV1Id(context.offer_id || context.offerId); if (offerId) safe.offer_id = offerId;
    var episodeId = _netV1Id(context.episode_id || context.episodeId); if (episodeId) safe.episode_id = episodeId;
    if (context.note != null) safe.note = String(context.note).trim().slice(0, 500);
    return _netV1Rpc("bos_report_network", { p_user: userId, p_reason: reason, p_context: safe });
  }

  // ── LEGACY НЕТВОРК · предложения пользы + бронь за XP ───────────────────────
  // Kept intact for circle support and backwards compatibility. New skill flows above never
  // silently fall back here.
  // Все активные предложения. Без trust-колонок ничего не показываем: legacy-RLS
  // делал черновики публичными, поэтому «мягкий» fallback здесь небезопасен.
  async function netOffers(limit) {
    var c = client(); if (!c) return [];
    try {
      var r = await c.from("network_offers").select("id,owner_id,emoji,title,descr,price_xp,min_level,slots_week,when_text,status,visibility,kind,skill_id,skill_key,interaction_key,outcome_key,mode").eq("active", true).limit(limit || 200);
      if (r && r.error && _isMissingCol(r.error)) r = await c.from("network_offers").select("id,owner_id,emoji,title,descr,price_xp,min_level,slots_week,when_text,status,visibility").eq("active", true).limit(limit || 200);
      return (r && !r.error && r.data) ? r.data : [];
    } catch (e) { return []; }
  }
  // Строгая выборка подтверждённой помощи КОНКРЕТНЫХ друзей. В отличие от netOffers(limit),
  // фильтр owner_id выполняется в БД до выдачи результата: предложения друзей не исчезнут из-за
  // глобального limit витрины. IDs режем только на транспортные чанки, но строки не лимитируем.
  // Нет status-колонки/таблицы/сети → error/partial, а не ложное «помощи нет».
  async function netConfirmedOffersByOwners(ownerIds, commonCircleOwnerIds) {
    var c = client(); var me = await uid();
    if (!c || !me) return { status: "error", offers: [], failed: 1 };
    var seenIds = {}, ids = [];
    (Array.isArray(ownerIds) ? ownerIds : []).forEach(function (x) {
      var id = typeof x === "string" ? x.trim() : "";
      if (id && id !== me && !seenIds[id]) { seenIds[id] = true; ids.push(id); }
    });
    if (!ids.length) return { status: "ready", offers: [], failed: 0 };

    var circleSeen = {}, circleIds = [];
    (Array.isArray(commonCircleOwnerIds) ? commonCircleOwnerIds : []).forEach(function (x) {
      if (typeof x === "string" && seenIds[x] && !circleSeen[x]) { circleSeen[x] = true; circleIds.push(x); }
    });
    // visibility='all' доступен любому своему; visibility='circles' — только человеку,
    // с которым уже найден общий принятый круг. Фильтруем ДО скачивания строк.
    var jobs = [];
    function addJobs(list, visibility) {
      for (var i = 0; i < list.length; i += 80) jobs.push({ ids: list.slice(i, i + 80), visibility: visibility });
    }
    addJobs(ids, "all");
    addJobs(circleIds, "circles");

    var offers = [], failed = 0;
    await Promise.all(jobs.map(async function (job) {
      try {
        var q = c.from("network_offers")
          .select("id,owner_id,emoji,title,descr,price_xp,min_level,slots_week,when_text,status,visibility,kind,skill_id,skill_key,interaction_key,outcome_key,mode")
          .in("owner_id", job.ids).eq("active", true).eq("visibility", job.visibility);
        if (job.visibility === "all") q = q.eq("status", "confirmed");
        var r = await q;
        if (r && r.error && _isMissingCol(r.error)) {
          var qLegacy = c.from("network_offers")
          .select("id,owner_id,emoji,title,descr,price_xp,min_level,slots_week,when_text,status,visibility")
          .in("owner_id", job.ids).eq("active", true).eq("visibility", job.visibility);
          if (job.visibility === "all") qLegacy = qLegacy.eq("status", "confirmed");
          r = await qLegacy;
        }
        if (!r || r.error || !Array.isArray(r.data)) { failed++; return; }
        r.data.forEach(function (o) {
          var visible = o && (o.visibility === "all" || (o.visibility === "circles" && circleSeen[o.owner_id]));
          var safeStatus = o && (o.visibility === "circles" ? (o.status === "draft" || o.status === "confirmed") : o.status === "confirmed");
          if (visible && safeStatus && o.id && o.owner_id && seenIds[o.owner_id]) offers.push(o);
        });
      } catch (e) { failed++; }
    }));

    var seenOffers = {}, unique = [];
    offers.forEach(function (o) { if (!seenOffers[o.id]) { seenOffers[o.id] = true; unique.push(o); } });
    return { status: failed === 0 ? "ready" : (failed < jobs.length ? "partial" : "error"), offers: unique, failed: failed };
  }
  // Мои предложения (все, включая выключённые) — для редактора/статуса «Мой вклад».
  // Нет trust-схемы → []: сохранение всё равно fail-closed и не создаст public legacy row.
  async function netMyOffers() {
    var c = client(); var id = await uid(); if (!c || !id) return [];
    try {
      var r = await c.from("network_offers").select("id,owner_id,emoji,title,descr,price_xp,min_level,slots_week,when_text,active,status,visibility,kind,skill_id,skill_key,interaction_key,outcome_key,mode").eq("owner_id", id).order("created_at", { ascending: true });
      if (r && r.error && _isMissingCol(r.error)) r = await c.from("network_offers").select("id,owner_id,emoji,title,descr,price_xp,min_level,slots_week,when_text,active,status,visibility").eq("owner_id", id).order("created_at", { ascending: true });
      return (r && !r.error && r.data) ? r.data : [];
    } catch (e) { return []; }
  }
  // Строгий вариант для аналитики/CTA: при сбое сохраняем последний достоверный кэш,
  // а не превращаем сетевую ошибку в «у тебя нет форматов».
  async function netMyOffersStrict() {
    var c = client(); var id = await uid();
    if (!c || !id) return { status: "error", offers: [] };
    try {
      var r = await c.from("network_offers").select("id,owner_id,emoji,title,descr,price_xp,min_level,slots_week,when_text,active,status,visibility,kind,skill_id,skill_key,interaction_key,outcome_key,mode").eq("owner_id", id).order("created_at", { ascending: true });
      if (r && r.error && _isMissingCol(r.error)) r = await c.from("network_offers").select("id,owner_id,emoji,title,descr,price_xp,min_level,slots_week,when_text,active,status,visibility").eq("owner_id", id).order("created_at", { ascending: true });
      if (!r || r.error || !Array.isArray(r.data)) return { status: "error", offers: [] };
      return { status: "ready", offers: r.data };
    } catch (e) { return { status: "error", offers: [] }; }
  }
  // Создать/обновить моё предложение (RLS: только владелец). Возвращает сохранённую строку | null.
  async function netUpsertOffer(o) {
    var c = client(); var id = await uid(); if (!c || !id || !o || !o.title) return null;
    try {
      var row = {
        owner_id: id, emoji: o.emoji || null, title: ("" + o.title).slice(0, 80),
        descr: (o.descr ? ("" + o.descr).slice(0, 300) : null),
        price_xp: Math.max(0, o.price_xp | 0), min_level: Math.max(1, (o.min_level | 0) || 10),
        slots_week: Math.max(1, (o.slots_week | 0) || 1), when_text: (o.when_text ? ("" + o.when_text).slice(0, 60) : null),
        active: o.active !== false,
      };
      if (o.visibility) row.visibility = o.visibility;   // Э2: 'circles' | 'all'
      if (o.status) row.status = o.status;                // Э2: 'draft' | 'confirmed'
      var r;
      if (o.existing && o.id) {
        r = await c.from("network_offers").update(row).eq("id", o.id).eq("owner_id", id).select().single();
      } else {
        if (o.id) row.id = o.id; // стабильный UUID делает повтор идемпотентным
        r = await c.from("network_offers").insert(row).select().single();
        // Ответ первого insert мог потеряться после commit. На повторе UUID уже существует —
        // читаем только СВОЮ строку и считаем сохранение успешным, не создавая дубль.
        if (r && r.error && o.id) {
          var existing = await c.from("network_offers").select("id,owner_id,emoji,title,descr,price_xp,min_level,slots_week,when_text,active,status,visibility").eq("id", o.id).eq("owner_id", id).maybeSingle();
          if (existing && !existing.error && existing.data) r = existing;
        }
      }
      // Приватный draft нельзя «спасти» повтором без status/visibility: на старой схеме
      // такая строка могла стать публичной. Нет нужных колонок/сети → честный failure.
      return (r && !r.error && r.data) ? r.data : null;
    } catch (e) { return null; }
  }
  // ── Э4 · след пользы = «спасибо»-свет (thanks) ──────────────────────────────
  // Оставить след (за реально забронированный вклад; RLS проверяет бронь). Одно на offer+неделю.
  async function netThank(offerId, toId, week, note) {
    var c = client(); var id = await uid(); if (!c || !id || !offerId || !toId || !week) return false;
    try { var r = await c.from("thanks").upsert({ offer_id: offerId, from_id: id, to_id: toId, week: week, note: (note ? ("" + note).slice(0, 140) : null) }, { onConflict: "offer_id,from_id,week", ignoreDuplicates: true }); return !(r && r.error); }
    catch (e) { return false; }
  }
  // Следы конкретного вклада — только серверный агрегат. Сырые строки содержат
  // социальный граф и свободный текст, поэтому клиент их глобально не читает.
  async function netOfferThanks(offerId) {
    var c = client(); if (!c || !offerId) return { n: 0, notes: [], mine: false };
    try {
      var r = await c.rpc("bos_offer_thanks_summary", { p_offer: offerId });
      if (!r || r.error || !r.data) return { n: 0, notes: [], mine: false };
      var d = r.data; if (typeof d === "string") { try { d = JSON.parse(d); } catch (e) { d = {}; } }
      return { n: Math.max(0, d.n | 0), notes: Array.isArray(d.notes) ? d.notes.filter(Boolean).slice(0, 20) : [], mine: !!d.mine };
    } catch (e) { return { n: 0, notes: [], mine: false }; }
  }
  // Сколько следов у человека — только агрегат, без авторов и текстов.
  async function netUserThanks(userId) {
    var c = client(); if (!c || !userId) return 0;
    try { var r = await c.rpc("bos_user_thanks_count", { p_user: userId }); return (r && !r.error && r.data != null) ? Math.max(0, r.data | 0) : 0; }
    catch (e) { return 0; }
  }

  // ── Э2 · подтверждения роли окружением (role_confirmations) ──────────────────
  // Сервер возвращает количество всем, кому виден вклад, но реальные id — только
  // автору и общим кругам. Анонимные элементы сохраняют прежний интерфейс счётчика.
  async function netRoleConfirmations(offerId) {
    var c = client(); var me = await uid(); if (!c || !offerId) return [];
    try {
      var r = await c.rpc("bos_role_confirmation_summary", { p_offer: offerId });
      if (!r || r.error || !r.data) return [];
      var d = r.data; if (typeof d === "string") { try { d = JSON.parse(d); } catch (e) { d = {}; } }
      var n = Math.max(0, d.n | 0), ids = Array.isArray(d.ids) ? d.ids.filter(Boolean) : [];
      var rows = ids.slice(0, n).map(function (id) { return { confirmer_id: id, anonymous: false }; });
      if (d.mine && me && !ids.some(function (id) { return id === me; }) && n > 0) {
        if (rows.length < n) rows.push({ confirmer_id: me, anonymous: false });
        else rows[0] = { confirmer_id: me, anonymous: false };
      }
      while (rows.length < n) rows.push({ confirmer_id: "anon:" + offerId + ":" + rows.length, anonymous: true });
      return rows;
    }
    catch (e) { return []; }
  }
  // Подтвердить роль автора вклада (RLS: только если мы в общем круге, за себя, один раз).
  async function netConfirmRole(offerId) {
    var c = client(); var id = await uid(); if (!c || !id || !offerId) return false;
    try { var r = await c.from("role_confirmations").upsert({ offer_id: offerId, confirmer_id: id }, { onConflict: "offer_id,confirmer_id", ignoreDuplicates: true }); return !(r && r.error); }
    catch (e) { return false; }
  }
  async function netDeleteOffer(offerId) {
    var c = client(); var id = await uid(); if (!c || !id || !offerId) return false;
    try { var r = await c.from("network_offers").delete().eq("id", offerId).eq("owner_id", id); return !(r && r.error); }
    catch (e) { return false; }
  }
  // Бронь через RPC (атомарно: слот + плата XP). Возвращает {ok, dup?, err?, taken?, slots?}.
  async function netBook(offerId, week, earned) {
    var c = client(); if (!c || !offerId || !week) return { ok: false, err: "client" };
    try {
      var r = await c.rpc("bos_book_offer", { p_offer: offerId, p_week: week, p_earned: (earned == null ? null : (earned | 0)) });
      if (r.error) return { ok: false, err: "rpc" };
      return r.data || { ok: false };
    } catch (e) { return { ok: false, err: "ex" }; }
  }
  // Сколько слотов занято на неделю (витрина «свободно/занято»).
  async function netOfferTaken(offerId, week) {
    var c = client(); if (!c || !offerId || !week) return 0;
    try { var r = await c.rpc("bos_offer_taken", { p_offer: offerId, p_week: week }); return (r && !r.error) ? (r.data | 0) : 0; }
    catch (e) { return 0; }
  }
  // Мои брони (куда я записан) — {offer_id, week}.
  async function netMyBookings() {
    var c = client(); var id = await uid(); if (!c || !id) return [];
    try { var r = await c.from("network_bookings").select("offer_id,week,price_xp,created_at").eq("booker_id", id); return (r && r.data) || []; }
    catch (e) { return []; }
  }
  // Кто записался на предложение (владелец читает по RLS) — {booker_id, week}.
  async function netOfferBookings(offerId) {
    var c = client(); if (!c || !offerId) return [];
    try { var r = await c.from("network_bookings").select("booker_id,week,created_at").eq("offer_id", offerId); return (r && r.data) || []; }
    catch (e) { return []; }
  }

  window.bosCloud = {
    enabled: function () { return !!client(); },
    inTelegram: inTelegram,
    signIn: signIn, uid: uid, uidSync: uidSync, currentUser: currentUser,
    loadProfile: loadProfile, saveProfile: saveProfile, saveOffer: saveOffer, touchActive: touchActive, savePulse: savePulse, envPulse: envPulse, invitedPeople: invitedPeople, myInviter: myInviter, envPeopleStrict: envPeopleStrict, refCode: refCode, inviteCode: inviteCode,
    savePublicStats: savePublicStats, profilesPublic: profilesPublic, allPublic: allPublic,
    saveSnapshot: saveSnapshot, loadSnapshot: loadSnapshot,
    loadHabits: loadHabits, upsertHabit: upsertHabit, deleteHabit: deleteHabit, toggleHabitLog: toggleHabitLog,
    loadGoals: loadGoals, upsertGoal: upsertGoal, deleteGoal: deleteGoal,
    createTeam: createTeam, updateTeam: updateTeam, discoverTeams: discoverTeams, searchTeams: searchTeams, activeToday: activeToday, joinTeam: joinTeam,
    joinViaLink: joinViaLink, requestJoin: requestJoin, approveMember: approveMember, rejectMember: rejectMember, pendingRequests: pendingRequests, teamById: teamById,
    teamMembers: teamMembers, teamMembersStrict: teamMembersStrict, teamMemberIdsStrict: teamMemberIdsStrict, myTeamIds: myTeamIds, myTeamsLive: myTeamsLive, leaveTeam: leaveTeam, deleteTeam: deleteTeam,
    teamHabitsFull: teamHabitsFull, addTeamHabit: addTeamHabit, updateTeamHabit: updateTeamHabit, removeTeamHabit: removeTeamHabit, toggleTeamHabitToday: toggleTeamHabitToday,
    teamTasks: teamTasks, addTeamTask: addTeamTask, removeTeamTask: removeTeamTask, toggleTeamTaskMine: toggleTeamTaskMine, claimTeamRequest: claimTeamRequest,
    createSharedHabit: createSharedHabit, joinSharedHabit: joinSharedHabit, setSharedLog: setSharedLog, setSharedLogBulk: setSharedLogBulk, sharedHabitProgress: sharedHabitProgress, sharedHabitMemberIdsStrict: sharedHabitMemberIdsStrict, removeSharedHabitMember: removeSharedHabitMember,
    teamHabitProgress: teamHabitProgress, teamGoalProgress: teamGoalProgress, teamTodayTimes: teamTodayTimes, circlePulse: circlePulse,
    teamLogsRange: teamLogsRange, teamMyHabitYear: teamMyHabitYear, teamDayFeed: teamDayFeed, teamCheersToday: teamCheersToday, sendTeamCheer: sendTeamCheer,
    settleTeamGoal: settleTeamGoal, myTeamGoalXP: myTeamGoalXP, teamSettlements: teamSettlements,
    loadMessages: loadMessages, sendMessage: sendMessage, subscribeMessages: subscribeMessages, uploadChatPhoto: uploadChatPhoto, unreadMessages: unreadMessages,
    spendLedger: spendLedger, wallet: wallet, flushLedgerBacklog: flushLedgerBacklog,
    netSkillsCatalog: netSkillsCatalog, loadMySkills: loadMySkills, claimSkill: claimSkill, netProfiles: netProfiles,
    netSkillOffers: netSkillOffers, netMySkillOffers: netMySkillOffers,
    netUpsertSkillOffer: netUpsertSkillOffer, netPublishSkillOffer: netPublishSkillOffer, netPauseSkillOffer: netPauseSkillOffer,
    netRequestSkillOffer: netRequestSkillOffer, netIncomingSkillEpisodes: netIncomingSkillEpisodes, netOutgoingSkillEpisodes: netOutgoingSkillEpisodes,
    netAcceptSkillEpisode: netAcceptSkillEpisode, netDeclineSkillEpisode: netDeclineSkillEpisode, netCancelSkillEpisode: netCancelSkillEpisode,
    netMarkSkillProviderDone: netMarkSkillProviderDone, netMarkSkillRecipientDone: netMarkSkillRecipientDone,
    netSkillEpisodeContact: netSkillEpisodeContact,
    netSkillOfferCounts: netSkillOfferCounts, netSkillEvidence: netSkillEvidence,
    netBlockUser: netBlockUser, netUnblockUser: netUnblockUser, netReportUser: netReportUser,
    netOffers: netOffers, netConfirmedOffersByOwners: netConfirmedOffersByOwners, netMyOffers: netMyOffers, netMyOffersStrict: netMyOffersStrict, netUpsertOffer: netUpsertOffer, netDeleteOffer: netDeleteOffer,
    netBook: netBook, netOfferTaken: netOfferTaken, netMyBookings: netMyBookings, netOfferBookings: netOfferBookings,
    netRoleConfirmations: netRoleConfirmations, netConfirmRole: netConfirmRole,
    netThank: netThank, netOfferThanks: netOfferThanks, netUserThanks: netUserThanks,
    upsertReminder: upsertReminder, deleteReminder: deleteReminder, markReminderDone: markReminderDone, saveTz: saveTz,
    signOut: signOut,
    _client: client,
  };
})();

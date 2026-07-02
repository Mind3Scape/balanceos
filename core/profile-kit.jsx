/* core/profile-kit.jsx — NEUTRAL shared toolkit extracted from screens/profile.jsx (v196 live/demo/core split).
   No product (demo/live) branching — one copy, used by BOTH demos and the live app.
   Moved bricks: AvatarPickerSheet, DayRing, EditProfileSheet, InfoSheet, OrbitField, SysBtn, SysCard, useAIT */
function SysCard({ children, style, className = "", ...rest }) {
  return <div className={"bos-sys-card " + className} style={style} {...rest}>{children}</div>;
}
function SysBtn({ children, style, className = "", ...rest }) {
  return <button className={"bos-sys-card tap " + className} style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px", textAlign: "left", width: "100%", cursor: "pointer", borderRadius: 22, ...style }} {...rest}>{children}</button>;
}

/* Sheet palette + a few small sheets used across the system screens (opened via useSheet). */
function InfoSheet({ title, body, cta = "Готово", dark = false }) {
  const { close } = useSheet();
  const C = sheetColors(dark);
  const [done, setDone] = useP(false);
  const act = () => { if (cta === "Готово") return close(); setDone(true); window.setTimeout(close, 1000); };
  return (
    <div style={{ padding: "2px 20px 6px", color: C.text }}>
      <div style={{ fontSize: 19, fontWeight: 700, textAlign: "center" }}>{title}</div>
      {done ? <SheetDone C={C} label="Готово"/> : (
        <>
          {body && <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.55, marginTop: 12 }}>{body}</div>}
          <button onClick={act} className="tap" style={{ width: "100%", marginTop: 16, background: C.btn, color: C.btnFg, border: 0, borderRadius: 999, padding: 13, fontSize: 15, fontWeight: 600 }}>{cta}</button>
        </>
      )}
    </div>
  );
}

function EditProfileSheet({ dark = false }) {
  const app = (typeof useApp === "function") ? useApp() : null;
  const { open, close } = useSheet();
  const C = sheetColors(dark);
  const [name, setName] = useP(app?.userName || "");
  const [saved, setSaved] = useP(false);
  const save = () => { try { app?.setUserName?.((name || "").trim()); } catch (e) {} setSaved(true); window.setTimeout(close, 900); };
  return (
    <div style={{ padding: "2px 20px 6px", color: C.text }}>
      <div style={{ fontSize: 19, fontWeight: 700, textAlign: "center" }}>Профиль</div>
      {saved ? <SheetDone C={C} label="Сохранено"/> : (
        <>
          {/* Tappable avatar with a pen badge → opens the picker */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
            <button onClick={() => open(<AvatarPickerSheet dark={dark}/>)} className="tap" aria-label="Сменить аватар"
              style={{ position: "relative", border: 0, background: "transparent", padding: 0, borderRadius: "50%" }}>
              <BosAvatar avatar={app?.avatar} size={76} style={{ boxShadow: "0 6px 18px rgba(0,0,0,0.18)" }}/>
              <span style={{ position: "absolute", right: -2, bottom: -2, width: 26, height: 26, borderRadius: "50%", background: C.btn, color: C.btnFg, display: "grid", placeItems: "center", border: "2px solid " + (dark ? "#1c1c1e" : "#fff") }}>
                <I.Pencil size={12}/>
              </span>
            </button>
          </div>
          <div style={{ fontSize: 12, color: C.sub, margin: "16px 0 6px" }}>Имя</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Как тебя зовут?" style={{ width: "100%", background: C.field, border: "1px solid " + C.line, borderRadius: 14, padding: 12, fontSize: 15, color: C.text, outline: "none", boxSizing: "border-box" }}/>
          <button onClick={save} className="tap" style={{ width: "100%", marginTop: 16, background: C.btn, color: C.btnFg, border: 0, borderRadius: 999, padding: 13, fontSize: 15, fontWeight: 600 }}>Сохранить</button>
        </>
      )}
    </div>
  );
}

/* Avatar picker — Memoji faces or an Emoji, on a soft disc. Tapping sets it live
   (preview behind the sheet); persisted with the profile. Opened from login + settings. */
function AvatarPickerSheet({ dark = false }) {
  const app = (typeof useApp === "function") ? useApp() : null;
  const { close } = useSheet();
  const C = sheetColors(dark);
  const [tab, setTab] = useP("memoji");
  const cur = app?.avatar || null;
  const pick = (val) => { try { app?.setAvatar?.(val); } catch (e) {} if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } };
  const cell = (key, val, selected) => (
    <button key={key} onClick={() => pick(val)} className="tap" aria-label="Аватар"
      style={{ padding: 0, border: 0, background: "transparent", display: "grid", placeItems: "center", justifySelf: "center" }}>
      <div style={{ borderRadius: "50%", padding: 3, background: selected ? "#FEDE34" : "transparent", boxShadow: selected ? "0 4px 12px rgba(254,222,52,0.45)" : "none" }}>
        <BosAvatar avatar={val} size={52} style={{ border: "2px solid " + (dark ? "#1c1c1e" : "#fff") }} />
      </div>
    </button>
  );
  return (
    <div style={{ padding: "2px 16px 8px", color: C.text }}>
      <div style={{ fontSize: 19, fontWeight: 700, textAlign: "center" }}>Аватар</div>
      <div style={{ fontSize: 12.5, color: C.sub, textAlign: "center", marginTop: 3, lineHeight: 1.4 }}>Выбери лицо — Мемоджи или Эмодзи. Сменить можно когда угодно.</div>
      <div style={{ display: "flex", gap: 6, background: C.field, borderRadius: 999, padding: 4, margin: "14px auto 14px", width: "fit-content" }}>
        {[["memoji", "Мемоджи"], ["emoji", "Эмодзи"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className="tap" style={{ border: 0, borderRadius: 999, padding: "7px 20px", fontSize: 13.5, fontWeight: 600, background: tab === k ? C.btn : "transparent", color: tab === k ? C.btnFg : C.sub }}>{l}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 13, maxHeight: 296, overflowY: "auto", padding: "2px 2px 4px" }}>
        {tab === "memoji"
          ? BOS_MEMOJI.map(m => cell(m, m === "default" ? null : m, m === "default" ? (!cur || cur === "default") : cur === m))
          : BOS_EMOJI_AVATARS.map(e => { var v = "emoji:" + e; return cell(v, v, cur === v); })}
      </div>
      <button onClick={close} className="tap" style={{ width: "100%", marginTop: 16, background: C.btn, color: C.btnFg, border: 0, borderRadius: 999, padding: 13, fontSize: 15, fontWeight: 600 }}>Готово</button>
    </div>
  );
}

function OrbitField({ avatar, name, habits = [], people = [], levelPct = 2, onTap, moodC, dark = false, hideLevelArc = false, editable = true, levelBadge = 0, settled = false, open, minimal = false }) {
  // editable=false → center is a circle's EMBLEM, not an editable avatar (no pencil). people items
  // may carry `lit` (opt-in): lit===true → active today (glows + ✓), lit===false → dimmed. Profile
  // passes plain people (no lit) → full opacity, no badge (unchanged). Used to unify the team orbit.
  // levelBadge>0 → wrap the centre avatar in the HOME treatment: a gold XP ring (levelPct) + the
  // level-number badge at 45° (David: «на «Я» — такой же кружочек уровня, как на главной»).
  const t = useOrbClock();
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, k) => a + (b - a) * k;
  const smooth = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  // settled=true → render ALREADY bloomed (eo=1, no re-grow). Used by the Вселенная overlay so its
  // copy of your orbit picks up EXACTLY where the settled page orbit sits → one seamless zoom, no swap.
  // open (0..1) → the СОТА lens drives the bloom directly by distance-to-centre: 1 = rings fully
  // open, 0 = rings folded into the avatar (a bare "star"). Overrides the time-bloom + settled.
  const openMode = typeof open === "number";
  const eo = openMode ? clamp(open, 0, 1) : (settled ? 1 : smooth(t / 0.85)); // gentle bloom-in on open

  // Ring STRUCTURE (sort by streak, build nodes, assign even angular spread, ring set)
  // depends ONLY on [habits, people] — memo it so it isn't rebuilt on every animation frame;
  // only the per-frame positions (cos/sin of t, below) recompute each tick.
  const MAXR = 3; // 4 belts — orbits may run under the cards below; the rest fold into a "+N" whisper
  const { nodes, drawRings, maxStreak } = React.useMemo(() => {
    // Strongest habit first → inner belt + bigger; people by invite order (1st = closest).
    const hb = (habits || []).slice().sort((a, b) => (b.streak || 0) - (a.streak || 0));
    const pp = (people || []).slice();
    const maxStreak = hb.reduce((m, h) => Math.max(m, h.streak || 0), 1);
    // A2 — BELTS: one ring holds MANY (4,8,12,16…), so 10 habits + 50 friends stay calm
    // instead of becoming 60 rings. Habits fill inner belts, people the belts just outside.
    const cap = (r) => 6 + r * 6; // a belt holds many (6,12,18) — scales to dozens
    const nodes = [];
    let ring = 0, slot = 0, overflow = 0;
    const place = (mk) => {
      while (ring <= MAXR && slot >= cap(ring)) { ring++; slot = 0; }
      if (ring > MAXR) { overflow++; return; }
      mk(ring); slot++;
    };
    hb.forEach((h, i) => place((r) => nodes.push({ ring: r, kind: "h", emoji: h.emoji || "✨", streak: h.streak || 0, key: "h" + (h.id != null ? h.id : i) })));
    if (slot > 0) { ring++; slot = 0; } // people start their own belt, just outside your habits
    pp.forEach((p, j) => place((r) => nodes.push({ ring: r, kind: "p", avatar: p && p.avatar, lit: (p && typeof p === "object") ? p.lit : undefined, key: "p" + j })));
    if (overflow > 0) nodes.push({ ring: MAXR, kind: "more", count: overflow, key: "more" });
    // Even angular spread within each belt (so nothing collides), then a per-ring spin.
    const byRing = {};
    nodes.forEach((n) => { (byRing[n.ring] = byRing[n.ring] || []).push(n); });
    Object.keys(byRing).forEach((r) => { const a = byRing[r]; a.forEach((n, idx) => { n.baseAng = (idx / a.length) * Math.PI * 2 + Number(r) * 0.7 - Math.PI / 2; }); });
    const drawRings = []; for (let r = 0; r <= MAXR; r++) drawRings.push(r);
    return { nodes, drawRings, maxStreak };
  }, [habits, people]);

  // Proportions mirror the onboarding cosmos: rings 72/104/136, spacing 32 (icons ≤15 → never
  // overlap across belts), all in-frame so nothing clips at the edge.
  const RBASE = 72, RSTEP = 32;
  const radius = (ring) => (RBASE + ring * RSTEP) * lerp(openMode ? 0.3 : 0.86, 1, eo);
  const spin = (ring) => ((ring % 2) ? -1 : 1) * 0.06 / (1 + ring * 0.18);
  // Like onboarding: the faces/planets stay FULL opacity; only the thin ring lines + dust
  // whisper a little outward. fadeAt is mild and used ONLY for those, never the icons.
  const fadeAt = (R) => clamp(1 - (R - 140) / 240, 0.6, 1);

  const tint = (typeof tintFromMood === "function") ? tintFromMood(moodC) : ["#cfe1ff", "#7aa4d0", "#2c4d76"];
  const glow = tint[1];
  // The centre orb's glossy shell already paints the default sphere face. Only nest a
  // SECOND inner avatar disc when the user actually picked a Memoji/Emoji — otherwise the
  // default sphere would render twice (a big + a small orb stacked = the duplicate bug).
  const hasCustomAvatar = !!avatar && avatar !== "default";
  const lr = 36, CIRC = 2 * Math.PI * lr; // gold level arc hugging the (smaller ~37%) centre orb
  // (nodes / maxRing / drawRings now come from the memo above — they depend only on habits/people)

  // NO background of its own — the constellation floats on the SAME page background as
  // the rest of the profile. Palette flips with the theme so discs/rings always read.
  const PAL = dark ? {
    ring: "186,210,248", disc: "rgba(20,32,54,0.66)", discStroke: "rgba(180,210,255,0.32)",
    pdisc: "rgba(20,32,54,0.6)", pstroke: "rgba(255,255,255,0.5)", lvlTrack: "rgba(255,255,255,0.12)",
    badge: "#0a0a0a", avShadow: "0 8px 22px rgba(0,0,0,0.5)", shadow: false,
  } : {
    ring: "92,120,165", disc: "#ffffff", discStroke: "rgba(0,0,0,0.06)",
    pdisc: "#ffffff", pstroke: "#ffffff", lvlTrack: "rgba(0,0,0,0.08)",
    badge: "#ffffff", avShadow: "0 8px 24px rgba(0,0,0,0.18)", shadow: true,
  };

  // Centre avatar = the SAME standardized grey disc as everyone else (BuddyFaceLive look),
  // inlined so this shared core widget pulls in no live-only deps.
  const avStr = "" + (avatar || "");
  const avIsMemoji = /^m\d+$/.test(avStr);
  const avIsEmoji = avStr.indexOf("emoji:") === 0;
  const centreInitial = ("" + (name || "")).trim().charAt(0).toUpperCase();
  const TILE_SHEEN = "linear-gradient(165deg, rgba(255,255,255,0.55), rgba(255,255,255,0.12) 46%, rgba(255,255,255,0) 72%)";
  return (
    <div style={{ position: "relative", width: "100%", height: 300, margin: "0 auto", overflow: "visible" }}>
      <svg viewBox="-160 -160 320 320" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", inset: 0, display: "block", pointerEvents: "none", overflow: "visible" }}>
        <defs>
          <clipPath id="orbAvClip"><circle cx="0" cy="0" r="16" /></clipPath>
          <filter id="orbShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#000" floodOpacity="0.16" /></filter>
          {/* glass for the orbiting discs — SAME tile-glass vocabulary as the pencil button
              (BOS_TILE_SHEEN directional sheen + a bright top edge), not a soft radial blob. */}
          <linearGradient id="orbGlass" x1="0.12" y1="0" x2="0.6" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="0.46" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="0.72" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="orbEdge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.18" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          {/* disc base = the SAME grey as the centre avatar (#eef1f6→#dadfe7) so everything matches */}
          <linearGradient id="orbDiscBg" x1="0.2" y1="0" x2="0.7" y2="1">
            <stop offset="0" stopColor="#eef1f6" />
            <stop offset="1" stopColor="#dadfe7" />
          </linearGradient>
        </defs>

        {/* concentric orbits */}
        {drawRings.map((r) => {
          const R = radius(r), op = ((dark ? 0.20 : 0.17) - r * 0.035) * eo * fadeAt(R);
          return op <= 0.004 ? null :
            <circle key={"ring" + r} cx="0" cy="0" r={R.toFixed(1)} fill="none" stroke={"rgba(" + PAL.ring + "," + op.toFixed(3) + ")"} strokeWidth="1" />;
        })}

        {/* small living dots drifting along the orbits — echoes the onboarding cosmos.
            minimal=true (Вселенная) СКИПАЕТ их: десятки лишних SVG-элементов на каждую орбиту ×
            много систем ре-рендерились на 30fps → главный источник лагов вселенной. */}
        {!minimal && drawRings.map((r) => {
          const R = radius(r), baseOp = clamp(eo * fadeAt(R), 0, 1);
          if (baseOp <= 0.02) return null;
          const ds = ((r % 2) ? -1 : 1) * 0.05 / (1 + r * 0.15);
          return [0, 1, 2].map((k) => {
            const ang = (k / 3) * Math.PI * 2 + r * 1.3 + 0.5 + t * ds;
            const x = (Math.cos(ang) * R).toFixed(1), y = (Math.sin(ang) * R).toFixed(1);
            const rad = lerp(1.7, 1.05, clamp(r / 4, 0, 1));
            return (
              <g key={"dot" + r + "_" + k} opacity={(baseOp * 0.9).toFixed(2)}>
                <circle cx={x} cy={y} r={(rad * 2.4).toFixed(2)} fill={glow} opacity="0.16" style={{ filter: "blur(2.5px)" }} />
                <circle cx={x} cy={y} r={rad.toFixed(2)} fill={glow} opacity={dark ? "0.85" : "0.6"} />
              </g>
            );
          });
        })}

        {/* gold level arc — hidden in live (David: «жёлтое кольцо не нужно»; level lives in the
            stat plaque). Demo keeps it (it passes no hideLevelArc). */}
        {!hideLevelArc && (
        <g transform="rotate(-90)" opacity={eo}>
          <circle cx="0" cy="0" r={lr} fill="none" stroke={PAL.lvlTrack} strokeWidth="4" />
          <circle cx="0" cy="0" r={lr} fill="none" stroke="#FEDE34" strokeWidth="4" strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - Math.max(0.02, (levelPct || 2) / 100))} />
        </g>
        )}

        {/* planets — habits (glass discs w/ emoji) + people (memoji discs) */}
        {nodes.map((n) => {
          const R = radius(n.ring), ang = n.baseAng + t * spin(n.ring);
          const x = Math.cos(ang) * R, y = Math.sin(ang) * R;
          const op = clamp(eo, 0, 1); if (op <= 0.02) return null; // faces stay crisp (onboarding-style)
          // Size by belt (inner = bigger). Capped ≤15 with 32px belt spacing → adjacent belts
          // never overlap (the thing David disliked on onboarding). Meaning survives: strongest
          // habits sit on the inner belt, so they read biggest.
          const sz = n.kind === "more" ? 13 : lerp(15, 11, clamp(n.ring / 2, 0, 1));
          const pop = (settled || openMode) ? 1 : smooth((t - n.ring * 0.08) / 0.5);      // inner rings settle first
          const gs = ((sz / 16) * pop).toFixed(3);            // canonical r=16, scaled per ring
          if (n.kind === "more") {
            return (
              <g key={n.key} transform={"translate(" + x.toFixed(2) + " " + y.toFixed(2) + ") scale(" + gs + ")"} opacity={op.toFixed(2)} filter={PAL.shadow ? "url(#orbShadow)" : undefined}>
                <circle cx="0" cy="0" r="16" fill="url(#orbDiscBg)" />
                <circle cx="0" cy="0" r="16" fill="url(#orbGlass)" />
                <circle cx="0" cy="0" r="16" fill="none" stroke="url(#orbEdge)" strokeWidth="1.3" />
                <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="600" style={{ fill: dark ? "#cfe0ff" : "#5b6473" }}>+{n.count}</text>
              </g>
            );
          }
          if (n.kind === "h") {
            return (
              <g key={n.key} transform={"translate(" + x.toFixed(2) + " " + y.toFixed(2) + ") scale(" + gs + ")"} opacity={op.toFixed(2)} filter={PAL.shadow ? "url(#orbShadow)" : undefined}>
                {dark && <circle cx="0" cy="0" r="19" fill={glow} opacity="0.18" style={{ filter: "blur(5px)" }} />}
                <circle cx="0" cy="0" r="16" fill="url(#orbDiscBg)" />
                <circle cx="0" cy="0" r="16" fill="url(#orbGlass)" />
                <circle cx="0" cy="0" r="16" fill="none" stroke="url(#orbEdge)" strokeWidth="1.3" />
                <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fontSize="17" style={{ pointerEvents: "none" }}>{n.emoji}</text>
              </g>
            );
          }
          const av = n.avatar, isEmoji = av && ("" + av).indexOf("emoji:") === 0, isMemoji = /^m\d+$/.test(av || "");
          const href = isMemoji ? "./assets/people/" + av + ".png" : "./assets/sphere.png";
          const pOp = (n.lit === false ? 0.5 : 1) * op; // dim members not active today (lit opt-in; profile passes none → full)
          return (
            <g key={n.key} transform={"translate(" + x.toFixed(2) + " " + y.toFixed(2) + ") scale(" + gs + ")"} opacity={pOp.toFixed(2)} filter={PAL.shadow ? "url(#orbShadow)" : undefined}>
              {dark && <circle cx="0" cy="0" r="18.5" fill={glow} opacity="0.16" style={{ filter: "blur(5px)" }} />}
              <circle cx="0" cy="0" r="16" fill="url(#orbDiscBg)" />
              {isEmoji
                ? <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fontSize="17">{("" + av).slice(6)}</text>
                : <image href={href} x="-16" y="-16" width="32" height="32" preserveAspectRatio="xMidYMid slice" clipPath="url(#orbAvClip)" />}
              <circle cx="0" cy="0" r="16" fill="url(#orbGlass)" />
              <circle cx="0" cy="0" r="16.6" fill="none" stroke="url(#orbEdge)" strokeWidth="1.4" />
              {n.lit === true && (
                <g transform="translate(11 11)">
                  <circle cx="0" cy="0" r="6.6" fill="#0a0a0a" stroke={dark ? "#0a0a0a" : "#ffffff"} strokeWidth="1.5" />
                  <path d="M -2.7 0.2 L -0.8 2.1 L 2.9 -2.1" fill="none" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* you, in the centre — the SAME glossy mood orb as the home hero, just larger,
          with your avatar nested inside it. tap to change avatar. open<1 (Вселенная): кольца свёрнуты,
          а центр-аватар РАЗДУВАЕТСЯ (до ~2.6×), заполняя ячейку → дальняя система = плотный диск-иконка
          (тайлится встык, Apple-Watch), у центра сжимается обратно к 60px и вокруг расцветают кольца. */}
      <button onClick={onTap} className="tap" aria-label={editable ? "Сменить аватар" : (name || "Круг")} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%) scale(" + (openMode ? lerp(2.6, 1.05, eo) : 1).toFixed(3) + ")", width: 60, height: 60, borderRadius: "50%", border: 0, padding: 0, background: "transparent", cursor: onTap ? "pointer" : "default", opacity: openMode ? 1 : eo }}>
        {/* Gold XP ring around the centre (same as the home avatar) when a level badge is requested. */}
        {levelBadge > 0 && (
          <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <defs><linearGradient id="orbXpRingC" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFE777" /><stop offset="0.5" stopColor="#F4B72A" /><stop offset="1" stopColor="#E08A00" /></linearGradient></defs>
            <circle cx="30" cy="30" r="28" stroke={dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"} strokeWidth="2.5" fill="none" />
            <circle cx="30" cy="30" r="28" stroke="url(#orbXpRingC)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray={2 * Math.PI * 28} strokeDashoffset={2 * Math.PI * 28 * (1 - Math.max(0.02, (levelPct || 0) / 100))} />
          </svg>
        )}
        <div aria-hidden style={{ position: "absolute", inset: levelBadge > 0 ? 7 : 0, borderRadius: "50%",
          background: TILE_SHEEN + ", " + (avIsMemoji ? "url(./assets/people/" + avStr + ".png) center/cover no-repeat, " : (!avIsEmoji && !centreInitial ? "url(./assets/sphere.png) center/cover no-repeat, " : "")) + "linear-gradient(150deg,#eef1f6,#dadfe7)",
          boxShadow: "inset 0 1.5px 0.5px rgba(255,255,255,0.9), inset 0 0 0 0.6px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.14)",
          display: "grid", placeItems: "center", fontSize: 27, lineHeight: 1, color: "#5b6473", fontWeight: 600 }}>
          {avIsEmoji ? avStr.slice(6) : (!avIsMemoji ? (centreInitial || null) : null)}
        </div>
        {/* Level-number badge at 45° on the ring — identical language to the home hero avatar. */}
        {levelBadge > 0 && (
          <span aria-hidden style={{ position: "absolute", left: 30 + 28 * 0.7071 - 10, top: 30 + 28 * 0.7071 - 10, width: 20, height: 20, borderRadius: 999, background: "linear-gradient(180deg,#FFE777,#F4B72A)", color: "#4a3800", fontSize: 11, fontWeight: 800, lineHeight: "17px", textAlign: "center", letterSpacing: "-0.3px", border: "1.5px solid var(--card)", boxShadow: "0 1px 3px rgba(224,138,0,0.5), inset 0 1px 0.5px rgba(255,255,255,0.6)", zIndex: 3 }}>{levelBadge}</span>
        )}
        {editable && (
        <span style={{ position: "absolute", right: -1, bottom: -1, width: 20, height: 20, borderRadius: "50%", color: dark ? "#fff" : "var(--text)", background: "linear-gradient(165deg, rgba(255,255,255,0.55), rgba(255,255,255,0.12) 46%, rgba(255,255,255,0) 72%), " + (dark ? "rgba(255,255,255,0.12)" : "var(--surface-3)"), boxShadow: "inset 0 1.5px 0.5px rgba(255,255,255,0.92), inset 0 0 0 0.7px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.18)", display: "grid", placeItems: "center", zIndex: 2 }}>
          <I.Pencil size={10} />
        </span>
        )}
      </button>
    </div>
  );
}

function DayRing({ pct, track, sw = 3, glow }) {
  const r = 16, C = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 40 40" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
      <circle cx="20" cy="20" r={r} fill="none" stroke={track} strokeWidth={sw} />
      {pct > 0 && <circle cx="20" cy="20" r={r} fill="none" stroke="url(#calRing)" strokeWidth={sw} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={glow ? { filter: "drop-shadow(0 0 1.5px rgba(239,159,20,0.75))" } : undefined} />}
    </svg>
  );
}

// Folded into the shared 30fps useOrbClock (was its own per-orb 60fps rAF loop). Kept as a
// named alias so existing call sites (profile_live.jsx) don't need to change.
function useAIT() { return useOrbClock(); }

/* Onboarding intro flow (5 dark slides) + sign up */


/* ── v197: neutral deps the live forks need (moved from screens/profile.jsx) ── */
const sheetColors = (d) => d
  ? { text: "#fff", sub: "rgba(255,255,255,0.55)", line: "rgba(255,255,255,0.1)", btn: "#fff", btnFg: "#0a0a0a", field: "rgba(255,255,255,0.06)" }
  : { text: "#0a0a0a", sub: "rgba(0,0,0,0.5)", line: "rgba(0,0,0,0.08)", btn: "#0a0a0a", btnFg: "#fff", field: "#f5f5f7" };

const BOS_SUPPORT_EMAIL = "support@balanceos.app";

/* ── v197: deeper deps for the moved bricks (SheetDone) ── */
function SheetDone({ C, label }) {
  return (
    <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.btn, color: C.btnFg, display: "grid", placeItems: "center", margin: "0 auto", fontSize: 24 }}>✓</div>
      <div style={{ fontSize: 15, fontWeight: 600, marginTop: 10 }}>{label}</div>
    </div>
  );
}


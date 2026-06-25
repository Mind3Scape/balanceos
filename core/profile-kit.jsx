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

function OrbitField({ avatar, habits = [], people = [], levelPct = 2, onTap, moodC, dark = false }) {
  const t = (typeof useT === "function") ? useT() : 0;
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, k) => a + (b - a) * k;
  const smooth = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const eo = smooth(t / 0.85); // gentle bloom-in on open

  // Strongest habit first → inner ring + bigger; newest (low streak) → outer + small.
  const hb = (habits || []).slice().sort((a, b) => (b.streak || 0) - (a.streak || 0));
  const pp = (people || []).slice(); // invite order: index 0 = first = closest

  const nodes = [];
  hb.forEach((h, i) => nodes.push({ ring: i, kind: "h", emoji: h.emoji || "✨", key: "h" + (h.id != null ? h.id : i) }));
  pp.forEach((p, j) => nodes.push({ ring: j + 1, kind: "p", avatar: p.avatar, key: "p" + j })); // people just outside your hero habit

  // Even angular spread within each ring (so nothing collides), then a per-ring spin.
  const byRing = {};
  nodes.forEach((n) => { (byRing[n.ring] = byRing[n.ring] || []).push(n); });
  Object.keys(byRing).forEach((r) => { const a = byRing[r]; a.forEach((n, idx) => { n.baseAng = (idx / a.length) * Math.PI * 2 + Number(r) * 0.7 - Math.PI / 2; }); });

  const RBASE = 82, RSTEP = 26;
  const radius = (ring) => (RBASE + ring * RSTEP) * lerp(0.86, 1, eo);
  const spin = (ring) => ((ring % 2) ? -1 : 1) * 0.06 / (1 + ring * 0.18);
  const fadeAt = (R) => clamp(1 - (R - 138) / 56, 0, 1); // outer rings whisper toward the edge

  const tint = (typeof tintFromMood === "function") ? tintFromMood(moodC) : ["#cfe1ff", "#7aa4d0", "#2c4d76"];
  const glow = tint[1];
  // The centre orb's glossy shell already paints the default sphere face. Only nest a
  // SECOND inner avatar disc when the user actually picked a Memoji/Emoji — otherwise the
  // default sphere would render twice (a big + a small orb stacked = the duplicate bug).
  const hasCustomAvatar = !!avatar && avatar !== "default";
  const lr = 54, CIRC = 2 * Math.PI * lr; // gold level arc hugging the centre orb
  const maxRing = nodes.reduce((m, n) => Math.max(m, n.ring), 2); // ≥3 rings, even when empty
  const drawRings = []; for (let r = 0; r <= Math.min(maxRing, 6); r++) drawRings.push(r);

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

  return (
    <div style={{ position: "relative", width: "100%", height: 300, margin: "0 auto", overflow: "visible" }}>
      <svg viewBox="-160 -160 320 320" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", inset: 0, display: "block", pointerEvents: "none" }}>
        <defs>
          <clipPath id="orbAvClip"><circle cx="0" cy="0" r="16" /></clipPath>
          <filter id="orbShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#000" floodOpacity="0.16" /></filter>
        </defs>

        {/* concentric orbits */}
        {drawRings.map((r) => {
          const R = radius(r), op = (dark ? 0.22 : 0.26 - r * 0.03) * eo * fadeAt(R);
          return op <= 0.004 ? null :
            <circle key={"ring" + r} cx="0" cy="0" r={R.toFixed(1)} fill="none" stroke={"rgba(" + PAL.ring + "," + op.toFixed(3) + ")"} strokeWidth="1" />;
        })}

        {/* small living dots drifting along the orbits — echoes the onboarding cosmos */}
        {drawRings.map((r) => {
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

        {/* gold level arc hugging the centre orb */}
        <g transform="rotate(-90)" opacity={eo}>
          <circle cx="0" cy="0" r={lr} fill="none" stroke={PAL.lvlTrack} strokeWidth="4" />
          <circle cx="0" cy="0" r={lr} fill="none" stroke="#FEDE34" strokeWidth="4" strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - Math.max(0.02, (levelPct || 2) / 100))} />
        </g>

        {/* planets — habits (glass discs w/ emoji) + people (memoji discs) */}
        {nodes.map((n) => {
          const R = radius(n.ring), ang = n.baseAng + t * spin(n.ring);
          const x = Math.cos(ang) * R, y = Math.sin(ang) * R;
          const op = clamp(eo * fadeAt(R), 0, 1); if (op <= 0.02) return null;
          const sz = lerp(18, 10.5, clamp(n.ring / 4, 0, 1)); // inner big → outer small
          const pop = smooth((t - n.ring * 0.08) / 0.5);      // inner rings settle first
          const gs = ((sz / 16) * pop).toFixed(3);            // canonical r=16, scaled per ring
          if (n.kind === "h") {
            return (
              <g key={n.key} transform={"translate(" + x.toFixed(2) + " " + y.toFixed(2) + ") scale(" + gs + ")"} opacity={op.toFixed(2)} filter={PAL.shadow ? "url(#orbShadow)" : undefined}>
                {dark && <circle cx="0" cy="0" r="19" fill={glow} opacity="0.18" style={{ filter: "blur(5px)" }} />}
                <circle cx="0" cy="0" r="16" fill={PAL.disc} />
                <circle cx="0" cy="0" r="16" fill="none" stroke={PAL.discStroke} strokeWidth="0.9" />
                <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fontSize="17" style={{ pointerEvents: "none" }}>{n.emoji}</text>
              </g>
            );
          }
          const av = n.avatar, isEmoji = av && ("" + av).indexOf("emoji:") === 0, isMemoji = /^m\d+$/.test(av || "");
          const href = isMemoji ? "./assets/people/" + av + ".png" : "./assets/sphere.png";
          return (
            <g key={n.key} transform={"translate(" + x.toFixed(2) + " " + y.toFixed(2) + ") scale(" + gs + ")"} opacity={op.toFixed(2)} filter={PAL.shadow ? "url(#orbShadow)" : undefined}>
              {dark && <circle cx="0" cy="0" r="18.5" fill={glow} opacity="0.16" style={{ filter: "blur(5px)" }} />}
              <circle cx="0" cy="0" r="16" fill={PAL.pdisc} />
              {isEmoji
                ? <text x="0" y="0.5" textAnchor="middle" dominantBaseline="central" fontSize="17">{("" + av).slice(6)}</text>
                : <image href={href} x="-16" y="-16" width="32" height="32" preserveAspectRatio="xMidYMid slice" clipPath="url(#orbAvClip)" />}
              <circle cx="0" cy="0" r="16.6" fill="none" stroke={PAL.pstroke} strokeWidth="1.4" />
            </g>
          );
        })}
      </svg>

      {/* you, in the centre — the SAME glossy mood orb as the home hero, just larger,
          with your avatar nested inside it. tap to change avatar */}
      <button onClick={onTap} className="tap" aria-label="Сменить аватар" style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 96, height: 96, borderRadius: "50%", border: 0, padding: 0, background: "transparent", cursor: "pointer", opacity: eo }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "50%", boxShadow: "0 6px 18px rgba(0,0,0,0.18)" + (dark ? ", 0 0 18px " + glow + "55" : "") }}>
          <BosOrbFace avatar={avatar} size={96} tint={tint} style={{ width: "100%", height: "100%" }} />
        </div>
        <span style={{ position: "absolute", right: 1, bottom: 1, width: 27, height: 27, borderRadius: "50%", background: "#0a0a0a", color: "#fff", display: "grid", placeItems: "center", border: "2.5px solid " + PAL.badge, boxShadow: "0 2px 6px rgba(0,0,0,0.25)", zIndex: 2 }}>
          <I.Pencil size={12} />
        </span>
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

function useAIT() {
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    let raf, s = performance.now();
    const tick = (now) => { setT((now - s) / 1000); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return t;
}

/* Onboarding intro flow (5 dark slides) + sign up */

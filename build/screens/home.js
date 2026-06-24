/* HOME — theme-aware. Streaks, AI bell, customizable widgets, deeper hierarchy */
var {
  useState: useHomeState
} = React;

/* Detect dark/light theme from wrapper class */
function useThemeFlag(ref) {
  var [isDark, setIsDark] = React.useState(false);
  React.useEffect(() => {
    var el = ref.current;
    if (!el) return;
    var n = el.parentElement;
    while (n && !n.classList.contains("theme-light") && !n.classList.contains("theme-dark")) n = n.parentElement;
    setIsDark(!!(n && n.classList.contains("theme-dark")));
  }, []);
  return isDark;
}

/* AI-brief pills now carry intent: a pill can OPEN a real screen ("записать прогулку",
   "написать дневник", "отметить состояние") or START a chat — only conversational ones
   should land in ai-chat. Shape: { label, kind:"action"|"chat", route?, params?, prompt?, i? }.
   We stay backwards-compatible with the old shapes ({ t, i } chips, or a bare string),
   which fall back to opening the chat with their text as the prompt. */
function bosPillLabel(pill) {
  if (typeof pill === "string") return pill;
  return pill.label || pill.t || pill.prompt || "";
}
function bosPillIcon(pill) {
  if (typeof pill === "string") return "✨";
  return pill.i || "✨";
}
function bosRoutePill(navigate, pill) {
  if (typeof pill === "string") {
    navigate("ai-chat", {
      prompt: pill
    });
    return;
  }
  if (pill && pill.kind === "action" && pill.route) {
    navigate(pill.route, pill.params || {});
    return;
  }
  // kind:"chat" (or any legacy/unknown pill): open the conversation. Prefer an
  // explicit prompt, else use the label so the chat still opens on-topic.
  navigate("ai-chat", {
    prompt: pill && (pill.prompt || pill.label || pill.t) || ""
  });
}

/* Habit checkmark with a floating "+XP" pop on completion — the same reward beat
   as the day-close celebration, but right ON the checkmark so it's always visible
   (even when the top of the screen is scrolled off). Shared by Home + Habits. */
function HabitCheck({
  done,
  onToggle,
  xp = 10
}) {
  var [tick, setTick] = React.useState(0);
  var onClick = e => {
    e.stopPropagation();
    var willComplete = !done;
    onToggle();
    if (willComplete) {
      setTick(t => t + 1);
      if (window.tgHaptic) {
        try {
          window.tgHaptic("light");
        } catch (_) {}
      }
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flexShrink: 0,
      display: "grid",
      placeItems: "center"
    }
  }, tick > 0 && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 6,
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    key: tick,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      whiteSpace: "nowrap",
      background: "#0a0a0a",
      color: "#FEDE34",
      fontSize: 11.5,
      fontWeight: 800,
      padding: "3px 9px",
      borderRadius: 999,
      boxShadow: "0 4px 12px rgba(0,0,0,0.28)",
      animation: "bosXpTick 1.2s cubic-bezier(0.22,1,0.36,1) forwards"
    }
  }, "+", xp, " XP")), /*#__PURE__*/React.createElement("button", {
    className: "check-btn " + (done ? "" : "unchecked"),
    "data-no-haptic": true,
    onClick: onClick
  }, done && /*#__PURE__*/React.createElement(I.Check, {
    size: 18,
    strokeWidth: 2.5,
    color: "#fff"
  })));
}
window.HabitCheck = HabitCheck;

/* Balance Wheel — 8-axis radar of life areas with iOS-style icons + zone colors */
function zoneColor(v) {
  if (v >= 0.70) return "#34C759"; // зелёная зона — в балансе
  if (v >= 0.52) return "#FFC400"; // нейтрально
  return "#FF8A3D"; // оранжевая зона — дефицит, выпирает
}
function BalanceWheel({
  size = 122,
  isDark = false
}) {
  var uid = React.useMemo(() => "bw" + Math.random().toString(36).slice(2, 7), []);
  var app = useApp ? useApp() : null;
  var enabled = app?.wheelSpheres && app.wheelSpheres.length >= 3 ? app.wheelSpheres : window.DEFAULT_SPHERES || [];
  var axes = (window.ALL_SPHERES || []).filter(s => enabled.includes(s.id));
  var cx = size / 2,
    cy = size / 2,
    r = size * 0.40;
  var pad = 30;
  var W = size + pad * 2;
  var ang = i => i / axes.length * Math.PI * 2 - Math.PI / 2;
  var pt = (i, v, rad = r) => [cx + Math.cos(ang(i)) * rad * v, cy + Math.sin(ang(i)) * rad * v];
  var poly = axes.map((a, i) => {
    var [x, y] = pt(i, a.v);
    return (i ? "L" : "M") + x.toFixed(1) + "," + y.toFixed(1);
  }).join(" ") + "Z";
  var grid = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.055)";
  var chipFill = isDark ? "#1d1d20" : "#ffffff";
  return /*#__PURE__*/React.createElement("svg", {
    width: W,
    height: W,
    viewBox: `${-pad} ${-pad} ${W} ${W}`,
    style: {
      overflow: "visible",
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("radialGradient", {
    id: uid + "-fill",
    cx: "50%",
    cy: "46%",
    r: "60%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#FFD64A",
    stopOpacity: "0.46"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#FF9F45",
    stopOpacity: "0.12"
  }))), /*#__PURE__*/React.createElement("circle", {
    cx: cx,
    cy: cy,
    r: r,
    fill: "none",
    stroke: grid,
    strokeWidth: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: cx,
    cy: cy,
    r: r * 0.7,
    fill: "none",
    stroke: isDark ? "rgba(52,199,89,0.38)" : "rgba(52,199,89,0.34)",
    strokeWidth: "1",
    strokeDasharray: "2.5 4.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: poly,
    fill: `url(#${uid}-fill)`,
    stroke: "#FFB020",
    strokeWidth: "1.7",
    strokeLinejoin: "round"
  }), axes.map((a, i) => {
    var [x, y] = pt(i, a.v);
    return /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: x,
      cy: y,
      r: "2.5",
      fill: zoneColor(a.v),
      stroke: chipFill,
      strokeWidth: "1.2"
    });
  }), axes.map((a, i) => {
    var [ox, oy] = pt(i, 1.26);
    return /*#__PURE__*/React.createElement("text", {
      key: i,
      x: ox,
      y: oy,
      fontSize: "14",
      textAnchor: "middle",
      dominantBaseline: "central"
    }, a.e);
  }));
}

/* Hero orbit — the SAME constellation as the Profile screen's OrbitField, scaled to
   live inside the swipe-deck card: you (the mood orb with your avatar) in the centre,
   orbit rings with small drifting dots, and your real people (team-mates + co-op
   friends) as memoji discs around you. No green health glow — it follows the mood
   tint like the hero, and a settings gear sits in the top-right.
   `people` is REAL data (deduped team members + habit friends); empty → calm rings. */
function HomeOrbit({
  navigate,
  avatar,
  people = [],
  levelPct = 2,
  moodC,
  isDark
}) {
  var t = typeof useT === "function" ? useT() : 0;
  var clamp = (x, a, b) => x < a ? a : x > b ? b : x;
  var lerp = (a, b, k) => a + (b - a) * k;
  var smooth = x => {
    x = clamp(x, 0, 1);
    return x * x * (3 - 2 * x);
  };
  var eo = smooth(t / 0.85); // gentle bloom-in on appear

  // People become orbiting discs (index 0 = closest ring). Capped so the small
  // card never gets crowded — the rest are implied by the rings.
  var pp = (people || []).slice(0, 10);
  var nodes = pp.map((p, j) => ({
    ring: j % 3,
    av: p.avatar,
    initials: p.initials,
    color: p.color,
    key: "p" + j
  }));
  var byRing = {};
  nodes.forEach(n => {
    (byRing[n.ring] = byRing[n.ring] || []).push(n);
  });
  Object.keys(byRing).forEach(r => {
    var a = byRing[r];
    a.forEach((n, idx) => {
      n.baseAng = idx / a.length * Math.PI * 2 + Number(r) * 0.7 - Math.PI / 2;
    });
  });
  var RBASE = 70,
    RSTEP = 23;
  var radius = ring => (RBASE + ring * RSTEP) * lerp(0.86, 1, eo);
  var spin = ring => (ring % 2 ? -1 : 1) * 0.06 / (1 + ring * 0.18);
  var fadeAt = R => clamp(1 - (R - 120) / 52, 0, 1);
  var tint = typeof tintFromMood === "function" ? tintFromMood(moodC) : ["#cfe1ff", "#7aa4d0", "#2c4d76"];
  var glow = tint[1];
  var lr = 48,
    CIRC = 2 * Math.PI * lr; // gold level arc hugging the centre orb
  var drawRings = [0, 1, 2]; // always ≥3 calm rings, even with no people

  var PAL = isDark ? {
    ring: "186,210,248",
    pdisc: "rgba(20,32,54,0.6)",
    pstroke: "rgba(255,255,255,0.5)",
    lvlTrack: "rgba(255,255,255,0.12)",
    badge: "#0a0a0a",
    shadow: false
  } : {
    ring: "92,120,165",
    pdisc: "#ffffff",
    pstroke: "#ffffff",
    lvlTrack: "rgba(0,0,0,0.08)",
    badge: "#ffffff",
    shadow: true
  };
  return /*#__PURE__*/React.createElement("div", {
    key: "orbit",
    style: {
      position: "relative",
      height: "100%",
      boxSizing: "border-box",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("settings"),
    className: "tap",
    "aria-label": "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
    style: {
      position: "absolute",
      top: 12,
      right: 12,
      zIndex: 3,
      width: 30,
      height: 30,
      borderRadius: 10,
      background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
      border: 0,
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(I.Settings, {
    size: 16,
    color: isDark ? "rgba(255,255,255,0.8)" : "#787878"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: "100%",
      height: "100%",
      minHeight: 196,
      overflow: "visible"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "-140 -140 280 280",
    width: "100%",
    height: "100%",
    preserveAspectRatio: "xMidYMid meet",
    style: {
      position: "absolute",
      inset: 0,
      display: "block",
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("clipPath", {
    id: "homeOrbAvClip"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "0",
    cy: "0",
    r: "16"
  })), /*#__PURE__*/React.createElement("filter", {
    id: "homeOrbShadow",
    x: "-40%",
    y: "-40%",
    width: "180%",
    height: "180%"
  }, /*#__PURE__*/React.createElement("feDropShadow", {
    dx: "0",
    dy: "2",
    stdDeviation: "2.2",
    floodColor: "#000",
    floodOpacity: "0.16"
  }))), drawRings.map(r => {
    var R = radius(r),
      op = (isDark ? 0.22 : 0.26 - r * 0.03) * eo * fadeAt(R);
    return op <= 0.004 ? null : /*#__PURE__*/React.createElement("circle", {
      key: "ring" + r,
      cx: "0",
      cy: "0",
      r: R.toFixed(1),
      fill: "none",
      stroke: "rgba(" + PAL.ring + "," + op.toFixed(3) + ")",
      strokeWidth: "1"
    });
  }), drawRings.map(r => {
    var R = radius(r),
      baseOp = clamp(eo * fadeAt(R), 0, 1);
    if (baseOp <= 0.02) return null;
    var ds = (r % 2 ? -1 : 1) * 0.05 / (1 + r * 0.15);
    return [0, 1, 2].map(k => {
      var ang = k / 3 * Math.PI * 2 + r * 1.3 + 0.5 + t * ds;
      var x = (Math.cos(ang) * R).toFixed(1),
        y = (Math.sin(ang) * R).toFixed(1);
      var rad = lerp(1.7, 1.05, clamp(r / 4, 0, 1));
      return /*#__PURE__*/React.createElement("g", {
        key: "dot" + r + "_" + k,
        opacity: (baseOp * 0.9).toFixed(2)
      }, /*#__PURE__*/React.createElement("circle", {
        cx: x,
        cy: y,
        r: (rad * 2.4).toFixed(2),
        fill: glow,
        opacity: "0.16",
        style: {
          filter: "blur(2.5px)"
        }
      }), /*#__PURE__*/React.createElement("circle", {
        cx: x,
        cy: y,
        r: rad.toFixed(2),
        fill: glow,
        opacity: isDark ? "0.85" : "0.6"
      }));
    });
  }), /*#__PURE__*/React.createElement("g", {
    transform: "rotate(-90)",
    opacity: eo
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "0",
    cy: "0",
    r: lr,
    fill: "none",
    stroke: PAL.lvlTrack,
    strokeWidth: "4"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "0",
    cy: "0",
    r: lr,
    fill: "none",
    stroke: "#FEDE34",
    strokeWidth: "4",
    strokeLinecap: "round",
    strokeDasharray: CIRC,
    strokeDashoffset: CIRC * (1 - Math.max(0.02, (levelPct || 2) / 100))
  })), nodes.map(n => {
    var R = radius(n.ring),
      ang = n.baseAng + t * spin(n.ring);
    var x = Math.cos(ang) * R,
      y = Math.sin(ang) * R;
    var op = clamp(eo * fadeAt(R), 0, 1);
    if (op <= 0.02) return null;
    var sz = lerp(17, 11, clamp(n.ring / 3, 0, 1));
    var pop = smooth((t - n.ring * 0.08) / 0.5);
    var gs = (sz / 16 * pop).toFixed(3);
    var av = n.av,
      isEmoji = av && ("" + av).indexOf("emoji:") === 0,
      isMemoji = /^m\d+$/.test(av || "");
    var href = isMemoji ? "./assets/people/" + av + ".png" : "./assets/sphere.png";
    return /*#__PURE__*/React.createElement("g", {
      key: n.key,
      transform: "translate(" + x.toFixed(2) + " " + y.toFixed(2) + ") scale(" + gs + ")",
      opacity: op.toFixed(2),
      filter: PAL.shadow ? "url(#homeOrbShadow)" : undefined
    }, isDark && /*#__PURE__*/React.createElement("circle", {
      cx: "0",
      cy: "0",
      r: "18.5",
      fill: glow,
      opacity: "0.16",
      style: {
        filter: "blur(5px)"
      }
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "0",
      cy: "0",
      r: "16",
      fill: n.color || PAL.pdisc
    }), av ? isEmoji ? /*#__PURE__*/React.createElement("text", {
      x: "0",
      y: "0.5",
      textAnchor: "middle",
      dominantBaseline: "central",
      fontSize: "17"
    }, ("" + av).slice(6)) : /*#__PURE__*/React.createElement("image", {
      href: href,
      x: "-16",
      y: "-16",
      width: "32",
      height: "32",
      preserveAspectRatio: "xMidYMid slice",
      clipPath: "url(#homeOrbAvClip)"
    }) : /*#__PURE__*/React.createElement("text", {
      x: "0",
      y: "0.5",
      textAnchor: "middle",
      dominantBaseline: "central",
      fontSize: "15",
      fontWeight: "700",
      fill: "rgba(0,0,0,0.55)"
    }, n.initials || "•"), /*#__PURE__*/React.createElement("circle", {
      cx: "0",
      cy: "0",
      r: "16.6",
      fill: "none",
      stroke: PAL.pstroke,
      strokeWidth: "1.4"
    }));
  })), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%,-50%)",
      width: 88,
      height: 88,
      opacity: eo
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: "50%",
      background: "url(./assets/sphere.png) center/cover no-repeat, radial-gradient(circle at 30% 30%, " + tint[0] + ", " + tint[2] + ")",
      boxShadow: "inset -4px -7px 16px rgba(0,0,0,0.22), 0 6px 18px rgba(0,0,0,0.18)" + (isDark ? ", 0 0 18px " + glow + "55" : "")
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 7,
      borderRadius: "50%",
      overflow: "hidden",
      boxShadow: "inset -3px -5px 12px rgba(0,0,0,0.22)"
    }
  }, /*#__PURE__*/React.createElement(BosAvatar, {
    avatar: avatar,
    size: 74
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 36,
      textAlign: "center",
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1.2
    }
  }, people.length ? "Твоя орбита" : "Твоя орбита · позови своих")));
}

/* Hero swipe deck — page 1: today's reading, page 2: Balance Wheel (demo) / your orbit (live) */
function HomeHeroSwipe({
  navigate,
  doneCount,
  totalCount,
  ringPct,
  isDark
}) {
  var [page, setPage] = useHomeState(0);
  // Ring grows from 0 on appear (and eases to its new value on change).
  var [ringShown, setRingShown] = useHomeState(0);
  React.useEffect(() => {
    var t = setTimeout(() => setRingShown(ringPct), 80);
    return () => clearTimeout(t);
  }, [ringPct]);
  // Stable global handle so the guided tour can flip this deck (e.g. to the
  // balance wheel) — always calls the latest setPage via a ref.
  var setPageRef = React.useRef(setPage);
  setPageRef.current = setPage;
  React.useEffect(() => {
    window.__bosHeroPage = p => setPageRef.current(p);
    return () => {
      if (window.__bosHeroPage) window.__bosHeroPage = null;
    };
  }, []);
  var heroApp = useApp ? useApp() : null;
  // The avatar ring + the glow under it follow the current state orb's colour.
  var mood = heroApp?.mood;
  var moodTint = mood && typeof tintFromMood === "function" ? tintFromMood(mood.c) : null;
  // "Newbie" = a brand-new account with nothing yet: the demo's fresh showcase OR
  // a real Telegram user (mode "live") who just signed in and has no habits. Both
  // get the warm get-started hero — not the demo's mood brief + balance wheel.
  var newbie = heroApp?.mode === "fresh" || heroApp?.mode === "live" && (heroApp?.habits?.length || 0) === 0;
  var enabledW = heroApp?.wheelSpheres && heroApp.wheelSpheres.length >= 3 ? heroApp.wheelSpheres : window.DEFAULT_SPHERES || [];
  var wAxes = (window.ALL_SPHERES || []).filter(s => enabledW.includes(s.id));
  var avgBalance = wAxes.length ? Math.round(wAxes.reduce((s, a) => s + a.v, 0) / wAxes.length * 100) : 0;
  var weakSpheres = [...wAxes].sort((a, b) => a.v - b.v).slice(0, 2);

  // Multiplayer orbit data (page 2 for live/fresh). REAL people only: the user's
  // invited referral circle (same cloud source the Profile orbit uses), plus the
  // people they already share habits/teams with — deduped. Demo uses its showcase
  // faces so the orbit reads even before any real circle exists.
  var _liveOrbit = heroApp?.mode !== "demo";
  // Live/fresh (the real new user) get ONLY page 1 — the orbit 2nd screen was removed
  // (David: the swipe felt off). Demo keeps its 2nd page (Balance Wheel).
  var _maxPage = _liveOrbit ? 0 : 1;
  var _lvlInfo = typeof bosLevelInfo === "function" && typeof bosLiveXP === "function" && _liveOrbit ? bosLevelInfo(bosLiveXP(heroApp)) : null;
  var orbitLevelPct = heroApp?.mode === "demo" ? 72 : _lvlInfo ? _lvlInfo.pct : 2;
  var [invited, setInvited] = useHomeState([]);
  React.useEffect(() => {
    if (!_liveOrbit || !(window.bosCloud && window.bosCloud.enabled())) return;
    var on = true;
    try {
      window.bosCloud.invitedPeople().then(list => {
        if (on && Array.isArray(list)) setInvited(list.map(p => ({
          avatar: p && p.avatar || "default",
          name: p && p.username || "Друг"
        })));
      }).catch(() => {});
    } catch (e) {}
    return () => {
      on = false;
    };
  }, [_liveOrbit]);
  var orbitPeople = React.useMemo(() => {
    if (heroApp?.mode === "demo") return window.DEMO_ORBIT_PEOPLE || [];
    // dedupe by avatar id, then name, so the same friend across a team + a habit
    // shows once. Team members carry avatars/initials; habit friends carry initials.
    var seen = new Set(),
      out = [];
    var push = p => {
      if (!p) return;
      var k = (p.avatar && /^m\d+$/.test(p.avatar) ? "a:" + p.avatar : "") || "n:" + (p.name || p.initials || "");
      if (!k || seen.has(k)) return;
      seen.add(k);
      out.push({
        avatar: p.avatar,
        initials: p.initials || (p.name ? p.name.charAt(0).toUpperCase() : ""),
        color: p.color
      });
    };
    invited.forEach(push);
    (heroApp?.teams || []).forEach(t => (t.members || []).forEach(push));
    (heroApp?.habits || []).forEach(h => (h.friends || []).forEach(push));
    return out;
  }, [heroApp?.mode, invited, heroApp?.teams, heroApp?.habits]);
  var startX = React.useRef(null);
  var onTouchStart = e => {
    startX.current = e.touches[0].clientX;
  };
  var onTouchEnd = e => {
    if (startX.current == null) return;
    var dx = e.changedTouches[0].clientX - startX.current;
    if (dx < -40 && page < _maxPage) setPage(page + 1);
    if (dx > 40 && page > 0) setPage(page - 1);
    startX.current = null;
  };
  var chipBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.85)";
  var chipBd = isDark ? "0" : "1px solid rgba(0,0,0,0.05)";
  var cardBg = isDark ? "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)" : "linear-gradient(160deg, #ffffff 0%, #f5f5f5 100%)";
  var cardBd = isDark ? "0" : "1px solid rgba(0,0,0,0.04)";
  var ringBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  var dotIdle = isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.18)";
  var dotActive = isDark ? "#fff" : "#0a0a0a";
  // Demo "Balance AI" daily brief — one short line that follows the user's
  // current state (like the orb) + the day's progress. Replaces the old quote.
  var AI_BRIEF = {
    "Энергия": "Энергии много — берись за самое важное сейчас.",
    "Радость": "Ты в ресурсе — отличный день, чтобы закрыть серию.",
    "Спокойствие": "Спокойствие — твоё время для глубокого чтения.",
    "Тревога": "Начни с двух минут дыхания — и день станет легче.",
    "Упадок": "Сделай одно маленькое дело — этого сегодня достаточно.",
    "Усталость": "Сбавь темп: закрой одну привычку — и довольно."
  };
  var aiBrief = totalCount && doneCount >= totalCount ? "День закрыт — ты в потоке. Так держи ритм." : AI_BRIEF[mood && mood.t] || "Чтение легче даётся вечером — оставь его на потом.";
  // L2 — for LIVE users the summary + pills come from the AI login brief (refreshed
  // at login). Demo keeps its scripted line/chips. The brief always has a heuristic
  // fallback, so this is never empty.
  var _liveBrief = heroApp?.mode === "live" ? heroApp?.aiBrief : null;
  var _homeSummary = _liveBrief && _liveBrief.summary || aiBrief;
  var _livePills = _liveBrief && Array.isArray(_liveBrief.pills) && _liveBrief.pills.length ? _liveBrief.pills.slice(0, 4) : null;
  var _pillsKey = _livePills ? _livePills.map(bosPillLabel).join("|") : "demo"; // change → re-animate
  var _pages = [/* Page 1: fresh → compact AI-hints + avatar; demo → quote + avatar + chips */
  newbie ? /*#__PURE__*/React.createElement("div", {
    key: "hints",
    style: {
      position: "relative",
      padding: 16,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 13,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1.2,
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement(I.Sparkles, {
    size: 12,
    color: "#E0A500",
    filled: true,
    strokeWidth: 0
  }), " \u0421 \u0447\u0435\u0433\u043E \u043D\u0430\u0447\u0430\u0442\u044C"), /*#__PURE__*/React.createElement("div", {
    key: _homeSummary,
    style: {
      fontSize: 13.5,
      color: "var(--text-2)",
      marginTop: 3,
      lineHeight: 1.4,
      letterSpacing: "-0.1px",
      animation: _liveBrief ? "briefFade 0.5s ease both" : undefined
    }
  }, _liveBrief ? _homeSummary : "Расскажи о себе — и я подскажу, с каких привычек начать.")), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("profile"),
    className: "tap",
    title: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u0440\u043E\u0444\u0438\u043B\u044C",
    style: {
      flexShrink: 0,
      position: "relative",
      width: 54,
      height: 54,
      background: "transparent",
      border: 0,
      padding: 0,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "54",
    height: "54",
    viewBox: "0 0 54 54",
    style: {
      position: "absolute",
      inset: 0,
      transform: "rotate(-90deg)"
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "27",
    cy: "27",
    r: "23",
    stroke: ringBg,
    strokeWidth: "3",
    fill: "none"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "27",
    cy: "27",
    r: "23",
    stroke: "#FEDE34",
    strokeWidth: "3",
    fill: "none",
    strokeLinecap: "round",
    strokeDasharray: 2 * Math.PI * 23,
    strokeDashoffset: 2 * Math.PI * 23 * (1 - ringShown),
    style: {
      transition: "stroke-dashoffset 0.7s cubic-bezier(0.22,0.61,0.36,1)"
    }
  })), heroApp?.avatar ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 5,
      borderRadius: "50%",
      overflow: "hidden",
      boxShadow: `inset -3px -5px 12px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.08)${moodTint ? `, 0 0 13px ${moodTint[1]}55` : ""}`
    }
  }, /*#__PURE__*/React.createElement(BosAvatar, {
    avatar: heroApp.avatar,
    size: 44
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 5,
      borderRadius: "50%",
      background: `url(./assets/sphere.png) center/cover no-repeat, radial-gradient(circle at 30% 30%, ${moodTint ? moodTint[0] : "#ffd97a"}, ${moodTint ? moodTint[2] : "#d97757"})`,
      boxShadow: `inset -3px -5px 12px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.08)${moodTint ? `, 0 0 13px ${moodTint[1]}55` : ""}`
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6
    }
  }, [{
    i: "🙋",
    t: "Рассказать о себе",
    go: () => navigate("ai-chat", {
      prompt: "Я хочу рассказать о себе — задай мне пару коротких вопросов и подскажи, с каких привычек начать."
    })
  }, {
    i: "➕",
    t: "Создать привычку",
    go: () => navigate("habit-settings", {
      mode: "create"
    })
  }, {
    i: "🧭",
    t: "Как всё устроено",
    go: () => navigate("guide")
  }, {
    i: "✨",
    t: "Спросить ИИ",
    go: () => navigate("ai-chat")
  }].map((c, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: c.go,
    className: "tap",
    style: {
      padding: "6px 12px",
      fontSize: 12,
      color: "var(--text-2)",
      background: chipBg,
      border: chipBd,
      borderRadius: 999,
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", null, c.i), c.t)))) : /*#__PURE__*/React.createElement("div", {
    key: "quote",
    style: {
      position: "relative",
      height: "100%",
      padding: 18,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1.2,
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement(I.Sparkles, {
    size: 12,
    color: "#E0A500",
    filled: true,
    strokeWidth: 0
  }), " \u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0438 \u0434\u043B\u044F \u0442\u0435\u0431\u044F"), /*#__PURE__*/React.createElement("div", {
    key: _homeSummary,
    style: {
      fontSize: 14,
      color: "var(--text-2)",
      marginTop: 5,
      lineHeight: 1.42,
      letterSpacing: "-0.1px",
      animation: "briefFade 0.5s ease both"
    }
  }, _homeSummary)), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("profile"),
    className: "tap",
    title: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u0440\u043E\u0444\u0438\u043B\u044C",
    style: {
      flexShrink: 0,
      position: "relative",
      width: 72,
      height: 72,
      background: "transparent",
      border: 0,
      padding: 0,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "72",
    height: "72",
    viewBox: "0 0 72 72",
    style: {
      position: "absolute",
      inset: 0,
      transform: "rotate(-90deg)"
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "36",
    cy: "36",
    r: "32",
    stroke: ringBg,
    strokeWidth: "3.5",
    fill: "none"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "36",
    cy: "36",
    r: "32",
    stroke: "#FEDE34",
    strokeWidth: "3.5",
    fill: "none",
    strokeLinecap: "round",
    strokeDasharray: 2 * Math.PI * 32,
    strokeDashoffset: 2 * Math.PI * 32 * (1 - ringShown),
    style: {
      transition: "stroke-dashoffset 0.7s cubic-bezier(0.22,0.61,0.36,1)"
    }
  })), heroApp?.avatar ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 6,
      borderRadius: "50%",
      overflow: "hidden",
      boxShadow: `inset -3px -5px 12px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.08)${moodTint ? `, 0 0 13px ${moodTint[1]}55` : ""}`
    }
  }, /*#__PURE__*/React.createElement(BosAvatar, {
    avatar: heroApp.avatar,
    size: 60
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 6,
      borderRadius: "50%",
      background: `url(./assets/sphere.png) center/cover no-repeat, radial-gradient(circle at 30% 30%, ${moodTint ? moodTint[0] : "#ffd97a"}, ${moodTint ? moodTint[2] : "#d97757"})`,
      boxShadow: `inset -3px -5px 12px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.08)${moodTint ? `, 0 0 13px ${moodTint[1]}55` : ""}`
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      bottom: -2,
      right: -4,
      background: "#0a0a0a",
      color: "#FEDE34",
      fontSize: 9,
      fontWeight: 700,
      padding: "2px 6px",
      borderRadius: 999,
      border: "2px solid " + (isDark ? "#0a0a0a" : "#fff")
    }
  }, doneCount, "/", totalCount))), /*#__PURE__*/React.createElement("div", {
    key: _pillsKey,
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginTop: "auto",
      paddingTop: 12,
      paddingBottom: 14
    }
  }, (_livePills || [{
    i: "✨",
    t: "ИИ: спланируй день"
  }, {
    i: "🔮",
    t: "Познай себя"
  }, {
    i: "🧘🏼‍♀️",
    t: "Медитация 5 мин"
  }, {
    i: "📖",
    t: "Открыть дневник"
  }]).map((c, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => bosRoutePill(navigate, c),
    className: "tap",
    style: {
      padding: "6px 12px",
      fontSize: 12,
      color: "var(--text-2)",
      background: chipBg,
      border: chipBd,
      borderRadius: 999,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      animation: _livePills ? "briefPop 0.45s cubic-bezier(0.22,0.9,0.3,1.2) both " + i * 0.06 + "s" : undefined
    }
  }, /*#__PURE__*/React.createElement("span", null, bosPillIcon(c)), bosPillLabel(c))))),
  /* Page 2 — LIVE/FRESH: your multiplayer orbit (you in the centre, real people
     around you, settings gear). DEMO: the curated Balance Wheel showcase. */
  _liveOrbit ? /*#__PURE__*/React.createElement(HomeOrbit, {
    key: "orbit",
    navigate: navigate,
    avatar: heroApp?.avatar,
    people: orbitPeople,
    levelPct: orbitLevelPct,
    moodC: mood && mood.c,
    isDark: isDark
  }) : /*#__PURE__*/React.createElement("div", {
    key: "wheel",
    "data-tour": "balance-wheel",
    style: {
      position: "relative",
      height: "100%",
      padding: "14px 16px 14px 8px",
      boxSizing: "border-box",
      display: "flex",
      gap: 6,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(BalanceWheel, {
    size: 112,
    isDark: isDark
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1.2
    }
  }, "\u0411\u0430\u043B\u0430\u043D\u0441 \u0436\u0438\u0437\u043D\u0438"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      color: "var(--text)",
      fontWeight: 700,
      letterSpacing: "-0.6px",
      lineHeight: 1
    }
  }, /*#__PURE__*/React.createElement(CountUp, {
    value: avgBalance
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "var(--text-4)"
    }
  }, "%"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, wAxes.map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      width: 15,
      textAlign: "center",
      flexShrink: 0
    }
  }, a.e), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      width: 48,
      flexShrink: 0,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, a.l), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 5,
      borderRadius: 999,
      background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.055)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: Math.round(a.v * 100) + "%",
      borderRadius: 999,
      background: zoneColor(a.v)
    }
  })))))))];
  // Live/fresh (real new user) = ONLY page 1 (the orbit 2nd page was removed). Demo keeps
  // both [quote, wheel]. A single page renders full-width with no swipe / no dots.
  var pages = _liveOrbit ? [_pages[0]] : _pages;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: cardBg,
      border: cardBd,
      borderRadius: 28,
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
    },
    onTouchStart: onTouchStart,
    onTouchEnd: onTouchEnd
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      width: pages.length > 1 ? "200%" : "100%",
      transform: pages.length > 1 ? `translateX(${-page * 50}%)` : "none",
      transition: "transform 0.45s cubic-bezier(0.22,0.61,0.36,1)",
      minHeight: 196
    }
  }, pages.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: pages.length > 1 ? "50%" : "100%",
      flexShrink: 0
    }
  }, p))), pages.length > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      bottom: 14,
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "center",
      gap: 5
    }
  }, pages.map((_, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => setPage(i),
    className: "tap",
    style: {
      width: i === page ? 18 : 6,
      height: 6,
      borderRadius: 999,
      background: i === page ? dotActive : dotIdle,
      border: 0,
      transition: "all 0.3s",
      padding: 0
    }
  }))));
}
function HomeScreen() {
  var {
    navigate
  } = useNav();
  var {
    open: openSheet
  } = useSheet();
  var app = useApp();
  var widgets = app?.widgets || {};
  var mood = app?.mood;
  var wrapRef = React.useRef(null);
  var isDark = useThemeFlag(wrapRef);
  var [tab, setTab] = useHomeState("habits");
  // Habits + goals come from the shared app store, so a check here shows up
  // on the Habits tab too (and vice versa).
  var habits = app?.habits || [];
  var goals = app?.goals || [];
  var teams = app?.teams || [];
  var userName = app?.userName ?? "";
  // Greeting follows the user's OWN local clock — real morning for whoever opens
  // it in the morning, evening in the evening. No server sync needed: each device
  // already knows its local time.
  var _hr = new Date().getHours();
  var greeting = _hr < 5 ? "Доброй ночи" : _hr < 12 ? "Доброе утро" : _hr < 18 ? "Добрый день" : _hr < 23 ? "Добрый вечер" : "Доброй ночи";
  // Date line under the greeting. LIVE → the device's REAL current date in Russian
  // ("Вторник · 28 апреля"); demo keeps its frozen showcase string.
  var _todayLabel = "Вторник · 28 апреля";
  var _calLabel = "28 апр"; // short form for the Calendar card
  if (app?.mode !== "demo") {
    // live AND fresh show the real date; only demo is frozen
    try {
      var _wd = new Intl.DateTimeFormat("ru-RU", {
        weekday: "long"
      }).format(new Date());
      var _dm = new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long"
      }).format(new Date());
      _todayLabel = _wd.charAt(0).toUpperCase() + _wd.slice(1) + " · " + _dm;
      _calLabel = new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "short"
      }).format(new Date()).replace(".", "");
    } catch (e) {}
  }
  // A brand-new account (the fresh demo, or a real Telegram user with no habits yet):
  // gets the get-started hero + an engaging level BANNER instead of the dense stat strip.
  var isNewbie = app?.mode === "fresh" || app?.mode === "live" && (app?.habits?.length || 0) === 0;
  var toggle = app?.toggleHabit || (() => {});
  var remove = app?.removeHabit || (() => {});
  var doneCount = habits.filter(h => h.done).length;
  var totalCount = habits.length;
  var ringPct = totalCount ? doneCount / totalCount : 0;
  // Daily XP — real and legible: each habit is +10, closing the whole day adds
  // the +30 "ideal day" bonus. Show what's earned vs. what's still on the table.
  var XP_PER_HABIT = 10,
    XP_IDEAL_DAY = 30;
  var leftCount = Math.max(0, totalCount - doneCount);
  var dayAllDone = totalCount > 0 && leftCount === 0;
  var xpEarnedToday = doneCount * XP_PER_HABIT + (dayAllDone ? XP_IDEAL_DAY : 0);
  var ruHab = n => {
    var m = n % 10,
      h = n % 100;
    return m === 1 && h !== 11 ? "привычку" : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? "привычки" : "привычек";
  };
  var ruTeam = n => {
    var m = n % 10,
      h = n % 100;
    return m === 1 && h !== 11 ? "команда" : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? "команды" : "команд";
  };
  // Live profiles get REAL numbers from the date-keyed habit model (T0.2); demo stays a
  // curated showcase (level 7 / 1240 XP / 27-day streak); a fresh demo shows blanks.
  var _isLive = app?.mode === "live";
  var _liveXP = _isLive ? bosLiveXP(app) : 0;
  var _lvl = bosLevelInfo(_liveXP);
  // Show the engaging gold LEVEL banner (instead of the bare "Сегодня x/y" stat cards)
  // through the whole NEW-user phase — a brand-new account OR a live user still at level 1.
  // The gold level banner is the live home's XP hero — keep it for EVERY live user, at any
  // level (David asked twice). Earlier it swapped to the compact stat strip at level 2+, so
  // earning XP ironically hid it. Demo keeps the compact strip (it's not live, not a newbie).
  var _showLevelBanner = isNewbie || _isLive;
  var dayStreak = app?.mode === "demo" ? 27 : _isLive ? bosMaxStreak(habits) : 0;

  // Bell red dot. Demo always shows it (scripted alert). LIVE: only light it when
  // there are REAL unread team-chat messages — same signal NotificationsScreen uses
  // (loadMessages per cloud team vs. the per-team "bos:chatread:" timestamp). If the
  // cloud is off or nothing's unread, the dot stays hidden (no fake alert).
  var [hasUnread, setHasUnread] = React.useState(false);
  React.useEffect(() => {
    if (!_isLive || !(window.bosCloud && window.bosCloud.enabled())) {
      setHasUnread(false);
      return;
    }
    var on = true;
    (async () => {
      try {
        var me = await window.bosCloud.uid();
        var cloudTeams = (app?.teams || []).filter(t => t.cloudId);
        var _loop = async function () {
            var rows = await window.bosCloud.loadMessages(t.cloudId);
            if (!Array.isArray(rows) || !rows.length) return 0; // continue
            var lastRead = Number(localStorage.getItem("bos:chatread:" + t.cloudId) || 0);
            if (rows.some(r => r && r.user_id !== me && new Date(r.created_at).getTime() > lastRead)) {
              if (on) setHasUnread(true);
              return {
                v: void 0
              };
            }
          },
          _ret;
        for (var t of cloudTeams) {
          _ret = await _loop();
          if (_ret === 0) continue;
          if (_ret) return _ret.v;
        }
        if (on) setHasUnread(false);
      } catch (e) {
        if (on) setHasUnread(false);
      }
    })();
    return () => {
      on = false;
    };
  }, [_isLive, teams]);
  var showBellDot = app?.mode === "demo" || hasUnread;

  // Celebration when a habit gets completed: float +XP near the avatar ring,
  // sparkle burst when the whole day closes (doneCount reaches total).
  var [celebrate, setCelebrate] = React.useState(null);
  var prevDoneRef = React.useRef(doneCount);
  React.useEffect(() => {
    if (doneCount > prevDoneRef.current) {
      var full = totalCount > 0 && doneCount === totalCount;
      // Per-habit XP now pops on the checkmark (HabitCheck); the big top-of-screen
      // celebration is reserved for the DAY-CLOSE moment so it never double-pops.
      if (full) {
        setCelebrate({
          xp: totalCount * 10 + 30,
          full: true,
          key: Date.now() + ":" + doneCount
        });
        if (window.tgHaptic) {
          try {
            window.tgHaptic("heavy");
          } catch (e) {}
        }
        var t = window.setTimeout(() => setCelebrate(null), 2000);
        prevDoneRef.current = doneCount;
        return () => window.clearTimeout(t);
      }
    }
    prevDoneRef.current = doneCount;
  }, [doneCount, totalCount]);

  // Theme tokens
  var cardBg = isDark ? "rgba(39,39,42,0.55)" : "#fff";
  var cardBorder = "0";
  var chipBg = isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)";
  var iconBg = isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)";
  var bellIcon = isDark ? "#fff" : "#0a0a0a";
  var dividerLn = isDark ? "rgba(255,255,255,0.06)" : "var(--line)";
  var moodGrad = c => isDark ? `linear-gradient(135deg, ${c}66 0%, ${c}22 60%, rgba(255,255,255,0.02) 100%)` : `linear-gradient(135deg, ${c} 0%, ${c}66 60%, var(--card-fade) 100%)`;
  var cardShadow = isDark ? "none" : "0 1px 2px rgba(0,0,0,0.04)";
  var rowBg = isDark ? "#1b1b1e" : "#ffffff"; // opaque so swipe actions stay hidden until revealed

  return /*#__PURE__*/React.createElement("div", {
    ref: wrapRef,
    className: "page-in",
    style: {
      padding: "0 12px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "4px 4px 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      letterSpacing: 0.4
    }
  }, _todayLabel), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 800,
      color: "var(--text)",
      letterSpacing: "-0.6px",
      marginTop: 2,
      fontFamily: "var(--bos-title-font)"
    }
  }, userName ? greeting + ", " + userName : greeting + " 👋")), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("notifications", {
      from: "home"
    }),
    className: "tap",
    style: {
      width: 42,
      height: 42,
      borderRadius: 14,
      background: iconBg,
      border: 0,
      display: "grid",
      placeItems: "center",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(I.Bell, {
    size: 18,
    color: bellIcon
  }), showBellDot && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 8,
      right: 10,
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: "var(--accent-red)",
      border: "2px solid " + (isDark ? "#0a0a0a" : "#fff")
    }
  }))), /*#__PURE__*/React.createElement("div", {
    "data-tour": "aihints",
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(HomeHeroSwipe, {
    navigate: navigate,
    doneCount: doneCount,
    totalCount: totalCount,
    ringPct: ringPct,
    isDark: isDark
  }), celebrate && /*#__PURE__*/React.createElement("div", {
    key: celebrate.key,
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      zIndex: 6,
      overflow: "visible"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 66,
      right: 16,
      whiteSpace: "nowrap",
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      background: "#0a0a0a",
      color: "#FEDE34",
      fontSize: celebrate.full ? 13 : 12,
      fontWeight: 800,
      padding: celebrate.full ? "7px 12px" : "5px 10px",
      borderRadius: 999,
      boxShadow: "0 8px 22px rgba(0,0,0,0.3)",
      animation: "bosXpPop 1.15s cubic-bezier(0.22,1,0.36,1) forwards"
    }
  }, "\u2726 +", celebrate.xp, " XP", celebrate.full ? " · день закрыт" : ""), celebrate.full && [0, 1, 2, 3, 4, 5, 6, 7].map(i => {
    var a = i / 8 * Math.PI * 2;
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        position: "absolute",
        top: 52,
        right: 52,
        width: 5,
        height: 5,
        borderRadius: "50%",
        background: "#FEDE34",
        boxShadow: "0 0 6px #FEDE34",
        animation: "bosSpark 0.9s ease-out forwards",
        ["--sx"]: Math.cos(a) * 44 + "px",
        ["--sy"]: Math.sin(a) * 44 + "px"
      }
    });
  }))), _showLevelBanner && /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("levels"),
    className: "tap",
    style: {
      marginTop: 12,
      width: "100%",
      border: 0,
      borderRadius: 22,
      padding: "15px 17px",
      background: "linear-gradient(135deg,#FEDE34,#EF9F14)",
      color: "#0a0a0a",
      display: "flex",
      alignItems: "center",
      gap: 13,
      textAlign: "left",
      boxShadow: "0 10px 26px rgba(239,159,20,0.30)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 14,
      background: "rgba(255,255,255,0.5)",
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      fontSize: 22
    }
  }, "\uD83C\uDFC6"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15.5,
      fontWeight: 700,
      letterSpacing: "-0.2px"
    }
  }, "\u0423\u0440\u043E\u0432\u0435\u043D\u044C ", _isLive ? _lvl.level : 1), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      opacity: 0.55
    }
  }, _isLive ? _liveXP : 0, " XP")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "rgba(0,0,0,0.62)",
      marginTop: 2,
      lineHeight: 1.35
    }
  }, "\u041A\u0430\u0436\u0434\u0430\u044F \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0430 \u2014 \u044D\u0442\u043E \u043E\u043F\u044B\u0442. \u0423\u0437\u043D\u0430\u0439, \u043A\u0430\u043A \u0440\u0430\u0441\u0442\u0438 \u2192"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      height: 5,
      borderRadius: 999,
      background: "rgba(0,0,0,0.14)",
      overflow: "hidden",
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: (_isLive ? _lvl.pct : 4) + "%",
      borderRadius: 999,
      background: "rgba(0,0,0,0.82)"
    }
  }))), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 20,
    color: "rgba(0,0,0,0.45)"
  })), app?.mode === "demo" && widgets.mood !== false && mood && /*#__PURE__*/React.createElement(MoodWidget, {
    mood: mood,
    app: app,
    isDark: isDark,
    navigate: navigate
  }), !_showLevelBanner && (widgets.streak !== false || widgets.level !== false) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: widgets.streak !== false && widgets.level !== false ? "1.2fr 1fr 1fr" : widgets.streak !== false || widgets.level !== false ? "1fr 1fr" : "1fr",
      gap: 8,
      marginTop: 12
    }
  }, widgets.streak !== false && /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("history"),
    className: "tap",
    style: {
      background: cardBg,
      border: cardBorder,
      borderRadius: 18,
      padding: "12px 14px",
      textAlign: "left",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      boxShadow: cardShadow,
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16
    }
  }, "\uD83D\uDD25"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600
    }
  }, "\u0421\u0435\u0440\u0438\u044F")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: "var(--text)",
      letterSpacing: "-0.5px"
    }
  }, /*#__PURE__*/React.createElement(CountUp, {
    value: dayStreak
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "var(--text-4)"
    }
  }, " \u0434\u043D."))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: cardBg,
      border: cardBorder,
      borderRadius: 18,
      padding: "12px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      boxShadow: cardShadow,
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600
    }
  }, "\u0421\u0435\u0433\u043E\u0434\u043D\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: "-0.5px"
    }
  }, /*#__PURE__*/React.createElement(CountUp, {
    value: doneCount
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-4)"
    }
  }, "/ ", totalCount))), widgets.level !== false && /*#__PURE__*/React.createElement("button", {
    "data-tour": "level",
    onClick: () => navigate("levels"),
    className: "tap",
    style: {
      background: "linear-gradient(135deg,#FEDE34,#EF9F14)",
      border: 0,
      borderRadius: 18,
      padding: "12px 14px",
      textAlign: "left",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      color: "#0a0a0a"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 700,
      opacity: 0.7
    }
  }, "\u0423\u0440\u043E\u0432\u0435\u043D\u044C"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22,
      fontWeight: 800,
      letterSpacing: "-0.5px"
    }
  }, /*#__PURE__*/React.createElement(CountUp, {
    value: app?.mode === "demo" ? 7 : _isLive ? _lvl.level : 1
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      opacity: 0.62,
      fontWeight: 700
    }
  }, app?.mode === "demo" ? "1 240 XP" : _isLive ? _liveXP + " XP" : "0 XP")), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      height: 4,
      borderRadius: 999,
      background: "rgba(0,0,0,0.16)",
      overflow: "hidden",
      marginTop: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: (app?.mode === "demo" ? 83 : _isLive ? _lvl.pct : 4) + "%",
      borderRadius: 999,
      background: "rgba(0,0,0,0.82)"
    }
  })))), (widgets.calendar !== false || widgets.team !== false) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: widgets.calendar !== false && widgets.team !== false ? "1fr 1fr" : "1fr",
      gap: 8,
      marginTop: 8
    }
  }, widgets.calendar !== false && /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => navigate("history"),
    style: {
      background: cardBg,
      border: cardBorder,
      borderRadius: 18,
      padding: "14px 14px 12px",
      textAlign: "left",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      boxShadow: cardShadow,
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600
    }
  }, "\u041A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--text-2)",
      marginTop: 4,
      fontWeight: 500
    }
  }, _calLabel)), /*#__PURE__*/React.createElement(I.Calendar, {
    size: 28,
    color: isDark ? "rgba(255,255,255,0.7)" : "#787878",
    strokeWidth: 1.5
  })), widgets.team !== false && /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => navigate("community"),
    style: {
      background: cardBg,
      border: cardBorder,
      borderRadius: 18,
      padding: "14px 14px 12px",
      textAlign: "left",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      boxShadow: cardShadow,
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600
    }
  }, "\u041A\u043E\u043C\u0430\u043D\u0434\u044B"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--text-2)",
      marginTop: 4,
      fontWeight: 500
    }
  }, teams.length ? teams.length + " " + ruTeam(teams.length) : "Создай команду")), teams.length > 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex"
    }
  }, teams.slice(0, 4).map((t, i) => /*#__PURE__*/React.createElement("span", {
    key: t._id || i,
    title: t.name,
    style: {
      width: 28,
      height: 28,
      borderRadius: "50%",
      background: t.accent || "var(--surface-3)",
      border: "2px solid " + (isDark ? "#0a0a0a" : "#fff"),
      marginLeft: i ? -10 : 0,
      display: "grid",
      placeItems: "center",
      fontSize: 14,
      lineHeight: 1
    }
  }, t.emblem || "👥"))) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: "50%",
      background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)",
      display: "grid",
      placeItems: "center",
      color: "var(--text-3)"
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 16
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tab-pill",
    style: {
      background: isDark ? "rgba(255,255,255,0.06)" : "#e8e8e8"
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "tap " + (tab === "habits" ? "active" : ""),
    onClick: () => setTab("habits")
  }, "\u041F\u0440\u0438\u0432\u044B\u0447\u043A\u0438"), /*#__PURE__*/React.createElement("button", {
    className: "tap " + (tab === "goals" ? "active" : ""),
    onClick: () => setTab("goals")
  }, "\u0426\u0435\u043B\u0438"))), tab === "habits" ? habits.length === 0 ? /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => navigate("habit-settings", {
      mode: "create"
    }),
    style: {
      marginTop: 10,
      width: "100%",
      background: cardBg,
      border: cardBorder,
      borderRadius: 22,
      padding: "30px 20px",
      boxShadow: cardShadow,
      color: "var(--text)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 52,
      height: 52,
      borderRadius: 16,
      background: iconBg,
      display: "grid",
      placeItems: "center",
      fontSize: 26
    }
  }, "\uD83C\uDF31"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 600
    }
  }, "\u0417\u0434\u0435\u0441\u044C \u0431\u0443\u0434\u0443\u0442 \u0442\u0432\u043E\u0438 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-4)",
      lineHeight: 1.45,
      maxWidth: 235
    }
  }, "\u041D\u0430\u0447\u043D\u0438 \u0441 \u043E\u0434\u043D\u043E\u0439 \u043C\u0430\u043B\u0435\u043D\u044C\u043A\u043E\u0439 \u2014 \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440, \u0441\u0442\u0430\u043A\u0430\u043D \u0432\u043E\u0434\u044B \u0443\u0442\u0440\u043E\u043C."), /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 4,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: isDark ? "#fff" : "#0a0a0a",
      color: isDark ? "#0a0a0a" : "#fff",
      borderRadius: 999,
      padding: "9px 16px",
      fontSize: 14,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 15,
    strokeWidth: 2.5
  }), " \u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0443")) : /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      color: "var(--text)"
    }
  }, habits.map(h => /*#__PURE__*/React.createElement("div", {
    key: h.id,
    style: {
      borderRadius: 18,
      overflow: "hidden",
      boxShadow: cardShadow
    }
  }, /*#__PURE__*/React.createElement(SwipeRow, {
    rowBg: rowBg,
    dark: isDark,
    actions: [{
      key: "share",
      tone: "share",
      label: "Поделиться",
      icon: I.Share,
      onAction: () => openSheet(/*#__PURE__*/React.createElement(ShareHabitSheet, {
        habit: h,
        dark: isDark
      }))
    }, {
      key: "del",
      tone: "delete",
      label: "Удалить",
      icon: I.Trash,
      onAction: () => remove(h.id)
    }]
  }, /*#__PURE__*/React.createElement("div", {
    className: "tap",
    onClick: () => navigate("habit-detail", {
      habit: h,
      from: "home"
    }),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "14px 16px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 12,
      background: h.color ? h.color + "26" : iconBg,
      display: "grid",
      placeItems: "center",
      fontSize: 20,
      flexShrink: 0
    }
  }, h.emoji), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      color: "var(--text-2)",
      letterSpacing: "-0.2px"
    }
  }, h.name), (h.friends?.length || h.duration) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginTop: 3,
      flexWrap: "wrap",
      fontSize: 11,
      color: "var(--text-4)"
    }
  }, h.duration && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 3
    }
  }, /*#__PURE__*/React.createElement(I.Clock, {
    size: 11
  }), " ", h.duration, " \u043C\u0438\u043D"), h.friends?.length > 0 && /*#__PURE__*/React.createElement(AvatarStack, {
    people: h.friends,
    size: 16,
    max: 3,
    label: false
  }), h.friends?.length > 0 && /*#__PURE__*/React.createElement("span", null, "\u0441\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u043E"))), h.duration && !h.done && /*#__PURE__*/React.createElement(HabitRing, {
    habit: h,
    dark: isDark,
    onComplete: () => {
      if (!h.done) toggle(h.id);
    }
  }), /*#__PURE__*/React.createElement(HabitCheck, {
    done: h.done,
    onToggle: () => toggle(h.id),
    xp: XP_PER_HABIT
  })))))) : goals.length === 0 ? /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => navigate("goal-settings", {
      mode: "create"
    }),
    style: {
      marginTop: 10,
      width: "100%",
      background: cardBg,
      border: cardBorder,
      borderRadius: 22,
      padding: "30px 20px",
      boxShadow: cardShadow,
      color: "var(--text)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 52,
      height: 52,
      borderRadius: 16,
      background: iconBg,
      display: "grid",
      placeItems: "center",
      fontSize: 26
    }
  }, "\uD83C\uDFAF"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 600
    }
  }, "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0446\u0435\u043B\u0435\u0439"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-4)",
      lineHeight: 1.45,
      maxWidth: 235
    }
  }, "\u0411\u043E\u043B\u044C\u0448\u0430\u044F \u0446\u0435\u043B\u044C \u2014 \u044D\u0442\u043E \u043C\u0430\u043B\u0435\u043D\u044C\u043A\u0438\u0435 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438, \u0441\u043B\u043E\u0436\u0435\u043D\u043D\u044B\u0435 \u0432\u043C\u0435\u0441\u0442\u0435."), /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 4,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: isDark ? "#fff" : "#0a0a0a",
      color: isDark ? "#0a0a0a" : "#fff",
      borderRadius: 999,
      padding: "9px 16px",
      fontSize: 14,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 15,
    strokeWidth: 2.5
  }), " \u041F\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0446\u0435\u043B\u044C")) : /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, goals.map(g => {
    var pct = g.target ? g.current / g.target : 0;
    return /*#__PURE__*/React.createElement("div", {
      key: g.id,
      className: "tap",
      onClick: () => navigate("goal-detail", {
        goal: g,
        from: "home"
      }),
      style: {
        background: cardBg,
        border: cardBorder,
        borderRadius: 18,
        padding: 14,
        boxShadow: cardShadow,
        color: "var(--text)",
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 38,
        height: 38,
        borderRadius: 11,
        background: iconBg,
        display: "grid",
        placeItems: "center",
        fontSize: 18
      }
    }, g.emoji), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        color: "var(--text-2)",
        fontWeight: 500
      }
    }, g.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--text-4)"
      }
    }, g.current, " / ", g.target, " ", g.unit)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 600,
        color: "var(--text-2)"
      }
    }, Math.round(pct * 100), "%")), /*#__PURE__*/React.createElement("div", {
      className: "bos-progress"
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: pct * 100 + "%"
      }
    })));
  })), app?.mode === "fresh" && /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("guide"),
    className: "tap",
    "data-no-haptic": true,
    style: {
      marginTop: 12,
      width: "100%",
      textAlign: "left",
      border: isDark ? "0" : "1px solid rgba(70,120,190,0.14)",
      borderRadius: 22,
      padding: "15px 16px",
      background: isDark ? "linear-gradient(135deg, rgba(122,164,208,0.20), rgba(122,164,208,0.05))" : "linear-gradient(135deg, #eef3fc 0%, #dfe9f8 100%)",
      color: "var(--text)",
      display: "flex",
      alignItems: "center",
      gap: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 14,
      background: isDark ? "rgba(255,255,255,0.08)" : "#fff",
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      fontSize: 22,
      boxShadow: isDark ? "none" : "0 2px 8px rgba(120,150,200,0.2)"
    }
  }, "\uD83E\uDDED"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 600,
      letterSpacing: "-0.2px"
    }
  }, "\u0427\u0442\u043E \u0434\u0430\u043B\u044C\u0448\u0435?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)",
      marginTop: 2,
      lineHeight: 1.4
    }
  }, "\u041A\u043E\u043C\u0430\u043D\u0434\u044B, \u0442\u0440\u0435\u043D\u0438\u043D\u0433\u0438, \u0446\u0435\u043B\u0438 \u2014 \u043E\u0431\u043E \u0432\u0441\u0451\u043C \u043A\u043E\u0440\u043E\u0442\u043A\u043E \u043D\u0430 \u043E\u0434\u043D\u043E\u0439 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435")), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 20,
    color: "var(--text-4)"
  })), /*#__PURE__*/React.createElement("button", {
    "data-tour": "share-app",
    className: "tap",
    onClick: () => openSheet(/*#__PURE__*/React.createElement(ShareAppSheet, {
      dark: isDark
    })),
    style: {
      marginTop: 12,
      width: "100%",
      borderRadius: 22,
      padding: "16px 18px",
      border: 0,
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(135deg, #34508c 0%, #1d2c4d 100%)",
      boxShadow: "0 10px 26px rgba(20,40,80,0.28)",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      gap: 14,
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      background: "radial-gradient(circle at 86% 10%, rgba(255,255,255,0.16) 0%, transparent 52%)",
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 14,
      background: "rgba(255,255,255,0.14)",
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      color: "#fff",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(I.Share, {
    size: 20
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 700,
      color: "#fff",
      letterSpacing: "-0.2px"
    }
  }, "\u041F\u043E\u0437\u043E\u0432\u0438 \u0441\u0432\u043E\u0438\u0445"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      fontSize: 10.5,
      fontWeight: 800,
      color: "#0a0a0a",
      background: "linear-gradient(135deg, #FEDE34, #EF9F14)",
      padding: "2px 8px",
      borderRadius: 999,
      flexShrink: 0
    }
  }, "+XP")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "rgba(255,255,255,0.74)",
      marginTop: 3,
      lineHeight: 1.35
    }
  }, "\u0412\u043C\u0435\u0441\u0442\u0435 \u043B\u0435\u0433\u0447\u0435 \u2014 \u0438 \u0437\u0430 \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u0434\u0440\u0443\u0433\u0430 XP \u043A \u043D\u043E\u0432\u043E\u043C\u0443 \u0443\u0440\u043E\u0432\u043D\u044E")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexShrink: 0,
      position: "relative"
    }
  }, app?.mode === "live" ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.16)",
      border: "2px solid rgba(255,255,255,0.3)",
      display: "grid",
      placeItems: "center",
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 16,
    strokeWidth: 2.5
  })) : [{
    c: "#e8c8a8",
    i: "А"
  }, {
    c: "#a8d4e8",
    i: "В"
  }, {
    c: "#d4b8e8",
    i: "Л"
  }].map((p, idx) => /*#__PURE__*/React.createElement("span", {
    key: idx,
    style: {
      width: 30,
      height: 30,
      borderRadius: "50%",
      background: p.c,
      border: "2px solid #fff",
      marginLeft: idx ? -10 : 0,
      display: "grid",
      placeItems: "center",
      fontSize: 12,
      fontWeight: 700,
      color: "rgba(0,0,0,0.55)"
    }
  }, p.i)))), app?.mode !== "demo" && widgets.mood !== false && mood && (app?.mode !== "live" || typeof bosMoodDays === "function" && bosMoodDays(app?.dayMoods) >= 2) && /*#__PURE__*/React.createElement(MoodWidget, {
    mood: mood,
    app: app,
    isDark: isDark,
    navigate: navigate
  }));
}

/* ── Share-the-app sheet (slides up from the home "Поделиться приложением") ── */
function ShareAppSheet({
  dark = false
}) {
  var {
    close
  } = useSheet();
  var app = typeof useApp === "function" ? useApp() : null;
  var invited = app?.mode === "demo" ? 2 : 0; // demo: 1 away from the 3-milestone
  var [copied, setCopied] = useHomeState(false);
  // The real, live web app — works on any phone, also opens fine from Telegram. For a LIVE
  // user we tag the invite with ?ref=<uid> so it actually credits them (orbit + XP), exactly
  // like the team-invite link already does. FUTURE: when a dedicated bot exists, swap this
  // base for t.me/<bot>?startapp=ref_<uid> — the uid already flows, so it's a one-line change.
  var APP_URL = "https://mind3scape.github.io/balanceos";
  var [shareUrl, setShareUrl] = useHomeState(APP_URL);
  React.useEffect(() => {
    var on = true;
    if (app?.mode === "live" && window.bosCloud && window.bosCloud.uid) {
      window.bosCloud.uid().then(id => {
        if (on && id) setShareUrl(APP_URL + "?ref=" + id);
      }).catch(() => {});
    } else {
      setShareUrl(APP_URL);
    }
    return () => {
      on = false;
    };
  }, [app?.mode]);
  var copyLink = () => {
    try {
      navigator.clipboard.writeText(shareUrl);
    } catch (e) {}
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
  };
  var shareLink = () => {
    // Inside Telegram → native contact picker; else Web Share; else clipboard (+ toast).
    if (window.bosShare ? !window.bosShare(shareUrl, "Держим баланс вместе — BalanceOS") : true) copyLink();else if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
  };
  var C = dark ? {
    text: "#fff",
    sub: "rgba(255,255,255,0.5)",
    tile: "rgba(255,255,255,0.08)",
    line: "rgba(255,255,255,0.09)"
  } : {
    text: "#0a0a0a",
    sub: "rgba(0,0,0,0.5)",
    tile: "#f1f1f3",
    line: "rgba(0,0,0,0.06)"
  };
  var _isLive = app?.mode === "live";
  // Soft pastel palette so each real friend chip still gets a pleasant colour.
  var _FCOLORS = ["#f0c8a8", "#a8c0e8", "#e8b8d4", "#b8e8c8", "#d4c8e8", "#a8d4e8", "#e8d0a8"];
  var _demoFriends = [{
    name: "Катя",
    i: "К",
    c: "#f0c8a8"
  }, {
    name: "Дима",
    i: "Д",
    c: "#a8c0e8"
  }, {
    name: "Соня",
    i: "С",
    c: "#e8b8d4"
  }, {
    name: "Ник",
    i: "Н",
    c: "#b8e8c8"
  }, {
    name: "Аля",
    i: "А",
    c: "#d4c8e8"
  }];
  // LIVE: the user's REAL invited people (referral circle). Demo keeps the 5 faces.
  var [liveFriends, setLiveFriends] = React.useState([]);
  React.useEffect(() => {
    if (!_isLive || !(window.bosCloud && window.bosCloud.enabled())) return;
    var on = true;
    try {
      window.bosCloud.invitedPeople().then(list => {
        if (!on || !Array.isArray(list)) return;
        setLiveFriends(list.map((p, idx) => {
          var nm = p && p.username ? p.username : "Друг";
          return {
            name: nm,
            i: nm.charAt(0).toUpperCase(),
            c: _FCOLORS[idx % _FCOLORS.length]
          };
        }));
      }).catch(() => {});
    } catch (e) {}
    return () => {
      on = false;
    };
  }, [_isLive]);
  var friends = _isLive ? liveFriends : _demoFriends;
  // LIVE share targets: only the two that map to a REAL action (the OS share sheet /
  // clipboard copy of the invite link). Demo keeps the full curated row.
  var targets = _isLive ? [{
    e: "💬",
    t: "Сообщения"
  }, {
    e: "🔗",
    t: "Ссылка"
  }] : [{
    e: "💬",
    t: "Сообщения"
  }, {
    e: "🔗",
    t: "Ссылка"
  }, {
    e: "📷",
    t: "Истории"
  }, {
    e: "•••",
    t: "Ещё"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 20px 0",
      color: C.text
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: "50%",
      margin: "0 auto 12px",
      background: "radial-gradient(circle at 37% 29%, #ffffff 0%, #dbe6f6 14%, #7aa4d0 46%, #3f5f86 72%, #243b5c 100%)",
      boxShadow: "0 8px 24px rgba(122,164,208,0.42)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: "-0.3px"
    }
  }, "\u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F BalanceOS"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: C.sub,
      marginTop: 3
    }
  }, "\u0412\u043C\u0435\u0441\u0442\u0435 \u0434\u0435\u0440\u0436\u0430\u0442\u044C \u0431\u0430\u043B\u0430\u043D\u0441 \u043F\u0440\u043E\u0449\u0435 \u2014 \u043F\u043E\u0437\u043E\u0432\u0438 \u0434\u0440\u0443\u0433\u0430")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(XPRewardCard, {
    amount: 150,
    reason: "\u043A\u043E\u0433\u0434\u0430 \u0434\u0440\u0443\u0433 \u043D\u0430\u0447\u043D\u0451\u0442 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C\u0441\u044F \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435\u043C",
    dark: dark
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: C.tile,
      borderRadius: 14,
      padding: "11px 14px",
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16
    }
  }, "\uD83D\uDD17"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 14,
      color: C.text,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, "mind3scape.github.io/balanceos"), /*#__PURE__*/React.createElement("button", {
    onClick: copyLink,
    className: "tap",
    style: {
      background: copied ? "#34C759" : dark ? "#fff" : "#0a0a0a",
      color: copied ? "#fff" : dark ? "#0a0a0a" : "#fff",
      border: 0,
      borderRadius: 999,
      padding: "7px 14px",
      fontSize: 13,
      fontWeight: 600,
      transition: "background 0.2s",
      whiteSpace: "nowrap"
    }
  }, copied ? "Скопировано ✓" : "Копировать")), friends.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.sub,
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600,
      margin: "20px 0 12px"
    }
  }, _isLive ? "Твой круг" : "Предложить друзьям"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      overflowX: "auto",
      margin: "0 -20px",
      padding: "0 20px 4px",
      scrollbarWidth: "none"
    }
  }, friends.map((p, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: _isLive ? shareLink : undefined,
    className: "tap",
    "data-no-haptic": true,
    style: {
      background: "transparent",
      border: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 7,
      flexShrink: 0,
      width: 56,
      color: C.text
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 54,
      height: 54,
      borderRadius: "50%",
      background: p.c,
      display: "grid",
      placeItems: "center",
      fontSize: 19,
      fontWeight: 700,
      color: "rgba(0,0,0,0.55)"
    }
  }, p.i), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: C.sub,
      maxWidth: 56,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, p.name)))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: C.line,
      margin: "18px 0"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: targets.length >= 4 ? "space-between" : "flex-start",
      gap: targets.length >= 4 ? 8 : 18,
      marginTop: friends.length > 0 ? 0 : 18
    }
  }, targets.map((t, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: shareLink,
    className: "tap",
    style: {
      flex: targets.length >= 4 ? 1 : "0 0 auto",
      width: targets.length >= 4 ? undefined : 64,
      background: "transparent",
      border: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 7,
      color: C.text
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 54,
      height: 54,
      borderRadius: "50%",
      background: C.tile,
      display: "grid",
      placeItems: "center",
      fontSize: 22
    }
  }, t.e), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: C.sub
    }
  }, t.t)))), /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: close,
    style: {
      width: "100%",
      marginTop: 22,
      background: dark ? "#fff" : "#0a0a0a",
      color: dark ? "#0a0a0a" : "#fff",
      border: 0,
      borderRadius: 999,
      padding: 15,
      fontSize: 15,
      fontWeight: 600
    }
  }, "\u0413\u043E\u0442\u043E\u0432\u043E"));
}

/* Home customization screen — pick widgets (wired to global app.widgets) */
function HomeCustomizeScreen() {
  var {
    navigate
  } = useNav();
  var app = useApp();
  var widgets = app?.widgets || {};
  var isDark = app?.themeOverride === "dark";
  var setOne = (id, v) => app?.setWidgets({
    ...widgets,
    [id]: v
  });
  // Only widgets that REALLY exist and are wired into the home render. The old
  // quote/ai/weather/books toggles did nothing — removed so every switch works.
  var opts = [{
    id: "mood",
    i: "💭",
    t: "Состояние",
    d: "Твоё самочувствие — нажми, чтобы обновить"
  }, {
    id: "streak",
    i: "🔥",
    t: "Счётчик серии",
    d: "Дней подряд"
  }, {
    id: "level",
    i: "🏆",
    t: "Уровень и опыт",
    d: "Прогресс и награды"
  }, {
    id: "calendar",
    i: "📅",
    t: "Календарь",
    d: "Сегодняшняя дата"
  }, {
    id: "team",
    i: "👥",
    t: "Команды",
    d: "Активные команды"
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u0412\u0438\u0434\u0436\u0435\u0442\u044B \u0433\u043B\u0430\u0432\u043D\u043E\u0433\u043E",
    onBack: () => navigate("settings")
  }), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 13,
      marginBottom: 14,
      lineHeight: 1.5,
      padding: "0 2px"
    }
  }, "\u0412\u043A\u043B\u044E\u0447\u0430\u0439 \u0438 \u0432\u044B\u043A\u043B\u044E\u0447\u0430\u0439 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 \u043D\u0430 \u0433\u043B\u0430\u0432\u043D\u043E\u043C. \u0421\u0432\u043E\u0434\u043A\u0430 \u0438 \u0430\u0432\u0430\u0442\u0430\u0440 \u0441\u0432\u0435\u0440\u0445\u0443 \u2014 \u0432\u0441\u0435\u0433\u0434\u0430 \u043D\u0430 \u043C\u0435\u0441\u0442\u0435."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, opts.map(o => /*#__PURE__*/React.createElement("div", {
    key: o.id,
    className: "bos-sys-card",
    style: {
      padding: 14,
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-chip-bg",
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      display: "grid",
      placeItems: "center",
      fontSize: 18,
      flexShrink: 0
    }
  }, o.i), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 500
    }
  }, o.t), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 12
    }
  }, o.d)), /*#__PURE__*/React.createElement(Switch, {
    on: widgets[o.id] !== false,
    onChange: v => setOne(o.id, v),
    dark: isDark
  })))));
}
window.HomeScreen = HomeScreen;
window.HomeCustomizeScreen = HomeCustomizeScreen;

/* MoodWidget — breathing aurora orb + last-7-days mood trail.
   Theme-aware: in dark, deeper inky background with luminous orb;
   in light, soft pastel band with the same orb. */
function MoodWidget({
  mood,
  app,
  isDark,
  navigate
}) {
  // Last 7 days. Live → REAL date keys (so state marks accumulate per real day);
  // demo → curated numeric days. Each item carries its own weekday letter.
  // The CURRENT calendar week, Пн (left) → Вс (right) — how people actually read a week.
  // Today sits in its real weekday slot (e.g. Ср = 3rd), highlighted; days AFTER today are
  // upcoming (dimmed, no mark yet). Live → real date keys; demo → curated showcase.
  var _WD = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  var _liveTrail = app?.mode === "live";
  var _monOff = (new Date().getDay() + 6) % 7; // 0=Пн … 6=Вс — TODAY's slot in the week
  var last7 = _liveTrail ? [0, 1, 2, 3, 4, 5, 6].map(i => {
    var off = _monOff - i; // days ago (negative = a day later this week)
    var key = typeof bosDayKeyOffset === "function" ? bosDayKeyOffset(off) : "";
    var di = app?.dayMoods && app.dayMoods[key] != null ? app.dayMoods[key] : null;
    // Bounds-guard: a bad/out-of-range index from a corrupted cloud row must yield null,
    // not undefined → otherwise the widget reads `.c`/`.t` on undefined and white-screens.
    return {
      key,
      today: i === _monOff,
      future: off < 0,
      wd: _WD[i],
      m: di != null && MOOD_OPTIONS[di] ? MOOD_OPTIONS[di] : null
    };
  }) : [0, 1, 2, 3, 4, 5, 6].map(i => ({
    d: 22 + i,
    today: i === 6,
    wd: _WD[i],
    m: app?.dayMoods && app.dayMoods[22 + i] != null && MOOD_OPTIONS[app.dayMoods[22 + i]] ? MOOD_OPTIONS[app.dayMoods[22 + i]] : null
  }));
  var logged = last7.filter(d => d.m).length;
  var sameAsToday = last7.filter(d => d.m && d.m.t === mood.t).length;

  // hex deepener for orb gradients
  var deep = (hex, amt = 0.45) => {
    if (!hex || hex[0] !== "#") return "#222";
    var h = hex.slice(1);
    if (h.length === 3) h = h.split("").map(c => c + c).join("");
    var n = parseInt(h, 16);
    var r = Math.max(0, (n >> 16 & 255) * (1 - amt)) | 0;
    var g = Math.max(0, (n >> 8 & 255) * (1 - amt)) | 0;
    var b = Math.max(0, (n & 255) * (1 - amt)) | 0;
    return "#" + (r << 16 | g << 8 | b).toString(16).padStart(6, "0");
  };
  var bg = isDark ? `linear-gradient(160deg, #1a1a1d 0%, #0d0d10 100%)` : `#ffffff`;
  var border = isDark ? "0" : "1px solid rgba(0,0,0,0.04)";
  var labelMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.50)";
  var subMuted = isDark ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.55)";
  var titleColor = isDark ? "#fff" : "var(--text)";
  var trailIdle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  var trailRing = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.28)"; // soft grey, not a harsh black ring
  var chipBg = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)";
  var fresh = app?.mode === "fresh";
  var live = app?.mode === "live"; // L3 — real users earn XP for checking in / journaling
  var _moodStreak = live && typeof bosMoodStreak === "function" ? bosMoodStreak(app?.dayMoods) : 0;
  return /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("mood"),
    className: "tap",
    "data-tour": "state",
    style: {
      marginTop: 12,
      width: "100%",
      border,
      textAlign: "left",
      background: bg,
      borderRadius: 22,
      padding: 18,
      position: "relative",
      overflow: "hidden",
      boxShadow: isDark ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      alignItems: "center",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flexShrink: 0,
      width: 72,
      height: 72,
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(StateOrb, {
    size: 72,
    tint: tintFromMood(mood.c),
    intensity: isDark ? 1.25 : 1.05
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: labelMuted,
      textTransform: "uppercase",
      letterSpacing: 1.4,
      fontWeight: 600
    }
  }, "\u0421\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \xB7 \u0441\u0435\u0439\u0447\u0430\u0441"), live && _moodStreak >= 2 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: isDark ? "#FF9A62" : "#a4541b",
      background: isDark ? "rgba(255,138,91,0.16)" : "rgba(255,138,91,0.16)",
      borderRadius: 999,
      padding: "2px 8px",
      letterSpacing: 0.3,
      whiteSpace: "nowrap"
    }
  }, "\uD83D\uDD25 ", _moodStreak, " ", bosRuDays(_moodStreak), " \u043F\u043E\u0434\u0440\u044F\u0434"), !live && sameAsToday >= 2 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: isDark ? "#FEDE34" : "#8a6a00",
      background: isDark ? "rgba(254,222,52,0.14)" : "rgba(254,222,52,0.35)",
      borderRadius: 999,
      padding: "2px 7px",
      letterSpacing: 0.4,
      whiteSpace: "nowrap"
    }
  }, "\u2728 +", sameAsToday * 10, " XP")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
      fontSize: 26,
      fontWeight: 600,
      lineHeight: 1.1,
      letterSpacing: "-0.6px",
      marginTop: 4,
      color: titleColor
    }
  }, fresh ? "Как ты сейчас?" : mood.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: subMuted,
      marginTop: 4
    }
  }, live ? "Отмечай каждый день: +5 XP, +10 со строкой в дневник. Удержишь неделю подряд — бонус +50 XP." : fresh ? "Нажми, чтобы отметить первое состояние." : "Нажми, чтобы обновить — сфера следует за твоим состоянием."))), !fresh && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      paddingTop: 14,
      borderTop: "1px solid " + (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"),
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, last7.map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4,
      opacity: d.future ? 0.4 : 1
    }
  }, d.m ? /*#__PURE__*/React.createElement("span", {
    "aria-label": d.m.t,
    style: {
      width: 22,
      height: 22,
      borderRadius: "50%",
      display: "block",
      boxShadow: d.today ? `0 0 0 2px ${trailRing}` : "none"
    }
  }, /*#__PURE__*/React.createElement(StaticOrb, {
    size: 22,
    tint: tintFromMood(d.m.c),
    seed: 1.2,
    intensity: 0.25
  })) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: 22,
      height: 22,
      borderRadius: "50%",
      background: trailIdle,
      boxShadow: d.today ? `0 0 0 2px ${trailRing}` : "none"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      color: labelMuted,
      fontWeight: 600
    }
  }, d.wd))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: 0.3,
      color: subMuted,
      background: chipBg,
      borderRadius: 999,
      padding: "4px 9px",
      flexShrink: 0
    }
  }, logged, "/7 \u043E\u0442\u043C\u0435\u0447\u0435\u043D\u043E")));
}

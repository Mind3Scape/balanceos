function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* core/profile-kit.jsx — NEUTRAL shared toolkit extracted from screens/profile.jsx (v196 live/demo/core split).
   No product (demo/live) branching — one copy, used by BOTH demos and the live app.
   Moved bricks: AvatarPickerSheet, DayRing, EditProfileSheet, InfoSheet, OrbitField, SysBtn, SysCard, useAIT */
function SysCard({
  children,
  style,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: "bos-sys-card " + className,
    style: style
  }, rest), children);
}
function SysBtn({
  children,
  style,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    className: "bos-sys-card tap " + className,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "16px 16px",
      textAlign: "left",
      width: "100%",
      cursor: "pointer",
      borderRadius: 22,
      ...style
    }
  }, rest), children);
}

/* Sheet palette + a few small sheets used across the system screens (opened via useSheet). */
function InfoSheet({
  title,
  body,
  cta = "Готово",
  dark = false
}) {
  var {
    close
  } = useSheet();
  var C = sheetColors(dark);
  var [done, setDone] = useP(false);
  var act = () => {
    if (cta === "Готово") return close();
    setDone(true);
    window.setTimeout(close, 1000);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 20px 6px",
      color: C.text
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 700,
      textAlign: "center"
    }
  }, title), done ? /*#__PURE__*/React.createElement(SheetDone, {
    C: C,
    label: "\u0413\u043E\u0442\u043E\u0432\u043E"
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, body && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: C.sub,
      lineHeight: 1.55,
      marginTop: 12
    }
  }, body), /*#__PURE__*/React.createElement("button", {
    onClick: act,
    className: "tap",
    style: {
      width: "100%",
      marginTop: 16,
      background: C.btn,
      color: C.btnFg,
      border: 0,
      borderRadius: 999,
      padding: 13,
      fontSize: 15,
      fontWeight: 600
    }
  }, cta)));
}
function EditProfileSheet({
  dark = false
}) {
  var app = typeof useApp === "function" ? useApp() : null;
  var {
    open,
    close
  } = useSheet();
  var C = sheetColors(dark);
  var [name, setName] = useP(app?.userName || "");
  var [saved, setSaved] = useP(false);
  var save = () => {
    try {
      app?.setUserName?.((name || "").trim());
    } catch (e) {}
    setSaved(true);
    window.setTimeout(close, 900);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 20px 6px",
      color: C.text
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 700,
      textAlign: "center"
    }
  }, "\u041F\u0440\u043E\u0444\u0438\u043B\u044C"), saved ? /*#__PURE__*/React.createElement(SheetDone, {
    C: C,
    label: "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E"
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => open(/*#__PURE__*/React.createElement(AvatarPickerSheet, {
      dark: dark
    })),
    className: "tap",
    "aria-label": "\u0421\u043C\u0435\u043D\u0438\u0442\u044C \u0430\u0432\u0430\u0442\u0430\u0440",
    style: {
      position: "relative",
      border: 0,
      background: "transparent",
      padding: 0,
      borderRadius: "50%"
    }
  }, /*#__PURE__*/React.createElement(BosAvatar, {
    avatar: app?.avatar,
    size: 76,
    style: {
      boxShadow: "0 6px 18px rgba(0,0,0,0.18)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: -2,
      bottom: -2,
      width: 26,
      height: 26,
      borderRadius: "50%",
      background: C.btn,
      color: C.btnFg,
      display: "grid",
      placeItems: "center",
      border: "2px solid " + (dark ? "#1c1c1e" : "#fff")
    }
  }, /*#__PURE__*/React.createElement(I.Pencil, {
    size: 12
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.sub,
      margin: "16px 0 6px"
    }
  }, "\u0418\u043C\u044F"), /*#__PURE__*/React.createElement("input", {
    value: name,
    onChange: e => setName(e.target.value),
    placeholder: "\u041A\u0430\u043A \u0442\u0435\u0431\u044F \u0437\u043E\u0432\u0443\u0442?",
    style: {
      width: "100%",
      background: C.field,
      border: "1px solid " + C.line,
      borderRadius: 14,
      padding: 12,
      fontSize: 15,
      color: C.text,
      outline: "none",
      boxSizing: "border-box"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: save,
    className: "tap",
    style: {
      width: "100%",
      marginTop: 16,
      background: C.btn,
      color: C.btnFg,
      border: 0,
      borderRadius: 999,
      padding: 13,
      fontSize: 15,
      fontWeight: 600
    }
  }, "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C")));
}

/* Avatar picker — Memoji faces or an Emoji, on a soft disc. Tapping sets it live
   (preview behind the sheet); persisted with the profile. Opened from login + settings. */
function AvatarPickerSheet({
  dark = false
}) {
  var app = typeof useApp === "function" ? useApp() : null;
  var {
    close
  } = useSheet();
  var C = sheetColors(dark);
  var [tab, setTab] = useP("memoji");
  var cur = app?.avatar || null;
  var pick = val => {
    try {
      app?.setAvatar?.(val);
    } catch (e) {}
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
  };
  var cell = (key, val, selected) => /*#__PURE__*/React.createElement("button", {
    key: key,
    onClick: () => pick(val),
    className: "tap",
    "aria-label": "\u0410\u0432\u0430\u0442\u0430\u0440",
    style: {
      padding: 0,
      border: 0,
      background: "transparent",
      display: "grid",
      placeItems: "center",
      justifySelf: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: "50%",
      padding: 3,
      background: selected ? "#FEDE34" : "transparent",
      boxShadow: selected ? "0 4px 12px rgba(254,222,52,0.45)" : "none"
    }
  }, /*#__PURE__*/React.createElement(BosAvatar, {
    avatar: val,
    size: 52,
    style: {
      border: "2px solid " + (dark ? "#1c1c1e" : "#fff")
    }
  })));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 16px 8px",
      color: C.text
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 700,
      textAlign: "center"
    }
  }, "\u0410\u0432\u0430\u0442\u0430\u0440"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: C.sub,
      textAlign: "center",
      marginTop: 3,
      lineHeight: 1.4
    }
  }, "\u0412\u044B\u0431\u0435\u0440\u0438 \u043B\u0438\u0446\u043E \u2014 \u041C\u0435\u043C\u043E\u0434\u0436\u0438 \u0438\u043B\u0438 \u042D\u043C\u043E\u0434\u0437\u0438. \u0421\u043C\u0435\u043D\u0438\u0442\u044C \u043C\u043E\u0436\u043D\u043E \u043A\u043E\u0433\u0434\u0430 \u0443\u0433\u043E\u0434\u043D\u043E."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      background: C.field,
      borderRadius: 999,
      padding: 4,
      margin: "14px auto 14px",
      width: "fit-content"
    }
  }, [["memoji", "Мемоджи"], ["emoji", "Эмодзи"]].map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setTab(k),
    className: "tap",
    style: {
      border: 0,
      borderRadius: 999,
      padding: "7px 20px",
      fontSize: 13.5,
      fontWeight: 600,
      background: tab === k ? C.btn : "transparent",
      color: tab === k ? C.btnFg : C.sub
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(5,1fr)",
      gap: 13,
      maxHeight: 296,
      overflowY: "auto",
      padding: "2px 2px 4px"
    }
  }, tab === "memoji" ? BOS_MEMOJI.map(m => cell(m, m === "default" ? null : m, m === "default" ? !cur || cur === "default" : cur === m)) : BOS_EMOJI_AVATARS.map(e => {
    var v = "emoji:" + e;
    return cell(v, v, cur === v);
  })), /*#__PURE__*/React.createElement("button", {
    onClick: close,
    className: "tap",
    style: {
      width: "100%",
      marginTop: 16,
      background: C.btn,
      color: C.btnFg,
      border: 0,
      borderRadius: 999,
      padding: 13,
      fontSize: 15,
      fontWeight: 600
    }
  }, "\u0413\u043E\u0442\u043E\u0432\u043E"));
}
function OrbitField({
  avatar,
  name,
  habits = [],
  people = [],
  levelPct = 2,
  onTap,
  moodC,
  dark = false
}) {
  var t = useOrbClock();
  var clamp = (x, a, b) => x < a ? a : x > b ? b : x;
  var lerp = (a, b, k) => a + (b - a) * k;
  var smooth = x => {
    x = clamp(x, 0, 1);
    return x * x * (3 - 2 * x);
  };
  var eo = smooth(t / 0.85); // gentle bloom-in on open

  // Ring STRUCTURE (sort by streak, build nodes, assign even angular spread, ring set)
  // depends ONLY on [habits, people] — memo it so it isn't rebuilt on every animation frame;
  // only the per-frame positions (cos/sin of t, below) recompute each tick.
  var MAXR = 3; // 4 belts — orbits may run under the cards below; the rest fold into a "+N" whisper
  var {
    nodes,
    drawRings,
    maxStreak
  } = React.useMemo(() => {
    // Strongest habit first → inner belt + bigger; people by invite order (1st = closest).
    var hb = (habits || []).slice().sort((a, b) => (b.streak || 0) - (a.streak || 0));
    var pp = (people || []).slice();
    var maxStreak = hb.reduce((m, h) => Math.max(m, h.streak || 0), 1);
    // A2 — BELTS: one ring holds MANY (4,8,12,16…), so 10 habits + 50 friends stay calm
    // instead of becoming 60 rings. Habits fill inner belts, people the belts just outside.
    var cap = r => 6 + r * 6; // a belt holds many (6,12,18) — scales to dozens
    var nodes = [];
    var ring = 0,
      slot = 0,
      overflow = 0;
    var place = mk => {
      while (ring <= MAXR && slot >= cap(ring)) {
        ring++;
        slot = 0;
      }
      if (ring > MAXR) {
        overflow++;
        return;
      }
      mk(ring);
      slot++;
    };
    hb.forEach((h, i) => place(r => nodes.push({
      ring: r,
      kind: "h",
      emoji: h.emoji || "✨",
      streak: h.streak || 0,
      key: "h" + (h.id != null ? h.id : i)
    })));
    if (slot > 0) {
      ring++;
      slot = 0;
    } // people start their own belt, just outside your habits
    pp.forEach((p, j) => place(r => nodes.push({
      ring: r,
      kind: "p",
      avatar: p.avatar,
      key: "p" + j
    })));
    if (overflow > 0) nodes.push({
      ring: MAXR,
      kind: "more",
      count: overflow,
      key: "more"
    });
    // Even angular spread within each belt (so nothing collides), then a per-ring spin.
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
    var drawRings = [];
    for (var r = 0; r <= MAXR; r++) drawRings.push(r);
    return {
      nodes,
      drawRings,
      maxStreak
    };
  }, [habits, people]);

  // Proportions mirror the onboarding cosmos: rings 72/104/136, spacing 32 (icons ≤15 → never
  // overlap across belts), all in-frame so nothing clips at the edge.
  var RBASE = 72,
    RSTEP = 32;
  var radius = ring => (RBASE + ring * RSTEP) * lerp(0.86, 1, eo);
  var spin = ring => (ring % 2 ? -1 : 1) * 0.06 / (1 + ring * 0.18);
  // Like onboarding: the faces/planets stay FULL opacity; only the thin ring lines + dust
  // whisper a little outward. fadeAt is mild and used ONLY for those, never the icons.
  var fadeAt = R => clamp(1 - (R - 140) / 240, 0.6, 1);
  var tint = typeof tintFromMood === "function" ? tintFromMood(moodC) : ["#cfe1ff", "#7aa4d0", "#2c4d76"];
  var glow = tint[1];
  // The centre orb's glossy shell already paints the default sphere face. Only nest a
  // SECOND inner avatar disc when the user actually picked a Memoji/Emoji — otherwise the
  // default sphere would render twice (a big + a small orb stacked = the duplicate bug).
  var hasCustomAvatar = !!avatar && avatar !== "default";
  var lr = 36,
    CIRC = 2 * Math.PI * lr; // gold level arc hugging the (smaller ~37%) centre orb
  // (nodes / maxRing / drawRings now come from the memo above — they depend only on habits/people)

  // NO background of its own — the constellation floats on the SAME page background as
  // the rest of the profile. Palette flips with the theme so discs/rings always read.
  var PAL = dark ? {
    ring: "186,210,248",
    disc: "rgba(20,32,54,0.66)",
    discStroke: "rgba(180,210,255,0.32)",
    pdisc: "rgba(20,32,54,0.6)",
    pstroke: "rgba(255,255,255,0.5)",
    lvlTrack: "rgba(255,255,255,0.12)",
    badge: "#0a0a0a",
    avShadow: "0 8px 22px rgba(0,0,0,0.5)",
    shadow: false
  } : {
    ring: "92,120,165",
    disc: "#ffffff",
    discStroke: "rgba(0,0,0,0.06)",
    pdisc: "#ffffff",
    pstroke: "#ffffff",
    lvlTrack: "rgba(0,0,0,0.08)",
    badge: "#ffffff",
    avShadow: "0 8px 24px rgba(0,0,0,0.18)",
    shadow: true
  };

  // Centre avatar = the SAME standardized grey disc as everyone else (BuddyFaceLive look),
  // inlined so this shared core widget pulls in no live-only deps.
  var avStr = "" + (avatar || "");
  var avIsMemoji = /^m\d+$/.test(avStr);
  var avIsEmoji = avStr.indexOf("emoji:") === 0;
  var centreInitial = ("" + (name || "")).trim().charAt(0).toUpperCase();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: "100%",
      height: 300,
      margin: "0 auto",
      overflow: "visible"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "-160 -160 320 320",
    width: "100%",
    height: "100%",
    preserveAspectRatio: "xMidYMid meet",
    style: {
      position: "absolute",
      inset: 0,
      display: "block",
      pointerEvents: "none",
      overflow: "visible"
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("clipPath", {
    id: "orbAvClip"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "0",
    cy: "0",
    r: "16"
  })), /*#__PURE__*/React.createElement("filter", {
    id: "orbShadow",
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
  })), /*#__PURE__*/React.createElement("radialGradient", {
    id: "orbGlass",
    cx: "0.34",
    cy: "0.26",
    r: "0.85"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0",
    stopColor: "#ffffff",
    stopOpacity: "0.6"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "0.45",
    stopColor: "#ffffff",
    stopOpacity: "0.14"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "1",
    stopColor: "#ffffff",
    stopOpacity: "0"
  }))), drawRings.map(r => {
    var R = radius(r),
      op = ((dark ? 0.20 : 0.17) - r * 0.035) * eo * fadeAt(R);
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
        opacity: dark ? "0.85" : "0.6"
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
    var op = clamp(eo, 0, 1);
    if (op <= 0.02) return null; // faces stay crisp (onboarding-style)
    // Size by belt (inner = bigger). Capped ≤15 with 32px belt spacing → adjacent belts
    // never overlap (the thing David disliked on onboarding). Meaning survives: strongest
    // habits sit on the inner belt, so they read biggest.
    var sz = n.kind === "more" ? 13 : lerp(15, 11, clamp(n.ring / 2, 0, 1));
    var pop = smooth((t - n.ring * 0.08) / 0.5); // inner rings settle first
    var gs = (sz / 16 * pop).toFixed(3); // canonical r=16, scaled per ring
    if (n.kind === "more") {
      return /*#__PURE__*/React.createElement("g", {
        key: n.key,
        transform: "translate(" + x.toFixed(2) + " " + y.toFixed(2) + ") scale(" + gs + ")",
        opacity: op.toFixed(2),
        filter: PAL.shadow ? "url(#orbShadow)" : undefined
      }, /*#__PURE__*/React.createElement("circle", {
        cx: "0",
        cy: "0",
        r: "16",
        fill: PAL.pdisc
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "0",
        cy: "0",
        r: "16",
        fill: "url(#orbGlass)"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "0",
        cy: "0",
        r: "16",
        fill: "none",
        stroke: PAL.pstroke,
        strokeWidth: "1.2"
      }), /*#__PURE__*/React.createElement("text", {
        x: "0",
        y: "0.5",
        textAnchor: "middle",
        dominantBaseline: "central",
        fontSize: "12",
        fontWeight: "600",
        style: {
          fill: dark ? "#cfe0ff" : "#5b6473"
        }
      }, "+", n.count));
    }
    if (n.kind === "h") {
      return /*#__PURE__*/React.createElement("g", {
        key: n.key,
        transform: "translate(" + x.toFixed(2) + " " + y.toFixed(2) + ") scale(" + gs + ")",
        opacity: op.toFixed(2),
        filter: PAL.shadow ? "url(#orbShadow)" : undefined
      }, dark && /*#__PURE__*/React.createElement("circle", {
        cx: "0",
        cy: "0",
        r: "19",
        fill: glow,
        opacity: "0.18",
        style: {
          filter: "blur(5px)"
        }
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "0",
        cy: "0",
        r: "16",
        fill: PAL.disc
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "0",
        cy: "0",
        r: "16",
        fill: "url(#orbGlass)"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "0",
        cy: "0",
        r: "16",
        fill: "none",
        stroke: PAL.discStroke,
        strokeWidth: "0.9"
      }), /*#__PURE__*/React.createElement("text", {
        x: "0",
        y: "0.5",
        textAnchor: "middle",
        dominantBaseline: "central",
        fontSize: "17",
        style: {
          pointerEvents: "none"
        }
      }, n.emoji));
    }
    var av = n.avatar,
      isEmoji = av && ("" + av).indexOf("emoji:") === 0,
      isMemoji = /^m\d+$/.test(av || "");
    var href = isMemoji ? "./assets/people/" + av + ".png" : "./assets/sphere.png";
    return /*#__PURE__*/React.createElement("g", {
      key: n.key,
      transform: "translate(" + x.toFixed(2) + " " + y.toFixed(2) + ") scale(" + gs + ")",
      opacity: op.toFixed(2),
      filter: PAL.shadow ? "url(#orbShadow)" : undefined
    }, dark && /*#__PURE__*/React.createElement("circle", {
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
      fill: PAL.pdisc
    }), isEmoji ? /*#__PURE__*/React.createElement("text", {
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
      clipPath: "url(#orbAvClip)"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "0",
      cy: "0",
      r: "16",
      fill: "url(#orbGlass)"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "0",
      cy: "0",
      r: "16.6",
      fill: "none",
      stroke: PAL.pstroke,
      strokeWidth: "1.4"
    }));
  })), /*#__PURE__*/React.createElement("button", {
    onClick: onTap,
    className: "tap",
    "aria-label": "\u0421\u043C\u0435\u043D\u0438\u0442\u044C \u0430\u0432\u0430\u0442\u0430\u0440",
    style: {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%,-50%)",
      width: 60,
      height: 60,
      borderRadius: "50%",
      border: 0,
      padding: 0,
      background: "transparent",
      cursor: "pointer",
      opacity: eo
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: "50%",
      background: (avIsMemoji ? "url(./assets/people/" + avStr + ".png) center/cover no-repeat, " : !avIsEmoji && !centreInitial ? "url(./assets/sphere.png) center/cover no-repeat, " : "") + "linear-gradient(150deg,#eef1f6,#dadfe7)",
      boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.14)",
      display: "grid",
      placeItems: "center",
      fontSize: 27,
      lineHeight: 1,
      color: "#5b6473",
      fontWeight: 600
    }
  }, avIsEmoji ? avStr.slice(6) : !avIsMemoji ? centreInitial || null : null), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: -1,
      bottom: -1,
      width: 20,
      height: 20,
      borderRadius: "50%",
      color: dark ? "#fff" : "var(--text)",
      background: "linear-gradient(165deg, rgba(255,255,255,0.55), rgba(255,255,255,0.12) 46%, rgba(255,255,255,0) 72%), " + (dark ? "rgba(255,255,255,0.12)" : "var(--surface-3)"),
      boxShadow: "inset 0 1.5px 0.5px rgba(255,255,255,0.92), inset 0 0 0 0.7px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.18)",
      display: "grid",
      placeItems: "center",
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement(I.Pencil, {
    size: 10
  }))));
}
function DayRing({
  pct,
  track,
  sw = 3,
  glow
}) {
  var r = 16,
    C = 2 * Math.PI * r;
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 40 40",
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      transform: "rotate(-90deg)"
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "20",
    cy: "20",
    r: r,
    fill: "none",
    stroke: track,
    strokeWidth: sw
  }), pct > 0 && /*#__PURE__*/React.createElement("circle", {
    cx: "20",
    cy: "20",
    r: r,
    fill: "none",
    stroke: "url(#calRing)",
    strokeWidth: sw,
    strokeLinecap: "round",
    strokeDasharray: C,
    strokeDashoffset: C * (1 - pct),
    style: glow ? {
      filter: "drop-shadow(0 0 1.5px rgba(239,159,20,0.75))"
    } : undefined
  }));
}

// Folded into the shared 30fps useOrbClock (was its own per-orb 60fps rAF loop). Kept as a
// named alias so existing call sites (profile_live.jsx) don't need to change.
function useAIT() {
  return useOrbClock();
}

/* Onboarding intro flow (5 dark slides) + sign up */

/* ── v197: neutral deps the live forks need (moved from screens/profile.jsx) ── */
var sheetColors = d => d ? {
  text: "#fff",
  sub: "rgba(255,255,255,0.55)",
  line: "rgba(255,255,255,0.1)",
  btn: "#fff",
  btnFg: "#0a0a0a",
  field: "rgba(255,255,255,0.06)"
} : {
  text: "#0a0a0a",
  sub: "rgba(0,0,0,0.5)",
  line: "rgba(0,0,0,0.08)",
  btn: "#0a0a0a",
  btnFg: "#fff",
  field: "#f5f5f7"
};
var BOS_SUPPORT_EMAIL = "support@balanceos.app";

/* ── v197: deeper deps for the moved bricks (SheetDone) ── */
function SheetDone({
  C,
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "16px 0 8px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      borderRadius: "50%",
      background: C.btn,
      color: C.btnFg,
      display: "grid",
      placeItems: "center",
      margin: "0 auto",
      fontSize: 24
    }
  }, "\u2713"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      marginTop: 10
    }
  }, label));
}

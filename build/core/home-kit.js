/* core/home-kit.jsx — NEUTRAL shared toolkit extracted from screens/home.jsx (v196 live/demo/core split).
   No product (demo/live) branching — one copy, used by BOTH demos and the live app.
   Moved bricks: HabitCheck, useThemeFlag */
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
var BOS_XP_PILL = {
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
};
/* The "+XP" pop, lifted to a body-level overlay so it floats ABOVE every card clip
   (the swipe-row corner clips + the rounded-card wrapper would otherwise shave its
   right edge mid-bounce). Decorative, pointerEvents none; pinned over the checkmark
   it celebrates. LIVE-only — the frozen demo keeps its in-place pop, pixel-identical. */
function XpFloat({
  tick,
  xp,
  anchorRef
}) {
  var [pos, setPos] = React.useState(null);
  React.useLayoutEffect(() => {
    if (!tick || !anchorRef.current) return;
    var r = anchorRef.current.getBoundingClientRect();
    setPos({
      x: r.left + r.width / 2,
      y: r.top + r.height / 2
    });
  }, [tick]);
  if (!tick || !pos) return null;
  return ReactDOM.createPortal(/*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      position: "fixed",
      left: pos.x,
      top: pos.y,
      transform: "translate(-50%, -50%)",
      zIndex: 9000,
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    key: tick,
    style: BOS_XP_PILL
  }, "+", xp, " XP")), document.body);
}
function HabitCheck({
  done,
  onToggle,
  xp = 10,
  float = false
}) {
  var [tick, setTick] = React.useState(0);
  var btnRef = React.useRef(null);
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
  }, !float && tick > 0 && /*#__PURE__*/React.createElement("span", {
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
    style: BOS_XP_PILL
  }, "+", xp, " XP")), float && /*#__PURE__*/React.createElement(XpFloat, {
    tick: tick,
    xp: xp,
    anchorRef: btnRef
  }), /*#__PURE__*/React.createElement("button", {
    ref: btnRef,
    className: "check-btn hit44 " + (done ? "" : "unchecked"),
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

/* ── v197: neutral deps the live forks need (moved from screens/home.jsx) ── */
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
var HeroOrbFace = React.memo(function HeroOrbFace({
  avatar,
  inset,
  size,
  moodTint
}) {
  var shadow = `0 2px 6px rgba(0,0,0,0.08)${moodTint ? `, 0 0 13px ${moodTint[1]}55` : ""}`;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset,
      borderRadius: "50%",
      overflow: "hidden",
      boxShadow: shadow
    }
  }, /*#__PURE__*/React.createElement(BosOrbFace, {
    avatar: avatar,
    size: size,
    tint: moodTint,
    style: {
      width: "100%",
      height: "100%"
    }
  }));
  // memo'd (tint compared by value) so a parent re-render that doesn't change THIS face's mood
  // tint / avatar / size — e.g. a habit toggle elsewhere on Home — won't re-render the hero face.
}, (a, b) => a.avatar === b.avatar && a.inset === b.inset && a.size === b.size && _orbTintEq(a.moodTint, b.moodTint));

/* Hero orbit — the SAME constellation as the Profile screen's OrbitField, scaled to
   live inside the swipe-deck card: you (the mood orb with your avatar) in the centre,
   orbit rings with small drifting dots, and your real people (team-mates + co-op
   friends) as memoji discs around you. No green health glow — it follows the mood
   tint like the hero, and a settings gear sits in the top-right.
   `people` is REAL data (deduped team members + habit friends); empty → calm rings. */

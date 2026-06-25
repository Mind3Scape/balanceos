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

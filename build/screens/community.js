/* COMMUNITY: Teams + Network + Courses + Partners — polished */
var {
  useState: useCS
} = React;

/* Liquid-glass icon chip — glossy, dimensional, iOS-26 style. Vivid gradient
   fill + bright top specular + inner shadow + soft coloured glow underneath. */
var COURSE_GLASS = {
  overload: {
    from: "#FFD60A",
    to: "#FF8A00"
  },
  breakthrough: {
    from: "#6EC6FF",
    to: "#0A84FF"
  },
  marathon: {
    from: "#5BE8A4",
    to: "#2BB673"
  }
};
function GlassChip({
  from,
  to,
  emoji,
  size = 48,
  radius = 16
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: radius,
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      position: "relative",
      overflow: "hidden",
      background: `linear-gradient(145deg, ${from} 0%, ${to} 100%)`,
      boxShadow: `inset 0 1px 1.5px rgba(255,255,255,0.7), inset 0 -3px 8px rgba(0,0,0,0.18), 0 6px 16px ${to}66`,
      border: "0.5px solid rgba(255,255,255,0.35)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      top: 0,
      left: "8%",
      right: "8%",
      height: "48%",
      background: "linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0))",
      borderRadius: "0 0 60% 60%"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      fontSize: Math.round(size * 0.46),
      lineHeight: 1,
      filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.22))"
    }
  }, emoji));
}
function CourseGlass({
  c,
  size = 46
}) {
  var g = COURSE_GLASS[c.id] || {
    from: c.accent,
    to: c.accent
  };
  return /*#__PURE__*/React.createElement(GlassChip, {
    from: g.from,
    to: g.to,
    emoji: c.i,
    size: size,
    radius: size >= 54 ? 18 : 15
  });
}

/* Network locked-state banner.
   Network is a premium social tier — unlocks at L10. Shown when level too low. */
function NetworkLocked({
  navigate,
  level,
  xp,
  xpMax,
  levelsLeft,
  weeks,
  onUnlock,
  onSwitchToCommunity
}) {
  var xpPct = Math.max(0, Math.min(1, xp / xpMax));
  var ruLvl = n => {
    var m = n % 10,
      h = n % 100;
    return m === 1 && h !== 11 ? "уровень" : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? "уровня" : "уровней";
  };
  var progPct = ((10 - levelsLeft - 1 + xpPct) / 10 * 100).toFixed(1);
  var paths = [{
    i: "🔥",
    t: "Держи серию",
    d: `Около ${weeks} недель ежедневных отметок — и ты на месте.`,
    cta: "К сегодняшнему дню",
    action: () => navigate("home"),
    meta: `+${Math.round((1 - xpPct) * 100)}% осталось`,
    accent: "#FEDE34"
  }, {
    i: "🎓",
    t: "Пройди курс сообщества",
    d: "Каждый завершённый курс поднимает на целый уровень. Самый быстрый путь.",
    cta: "Смотреть курсы",
    action: () => onSwitchToCommunity(),
    meta: "Сразу +1 уровень",
    accent: "#85e3a8"
  }, {
    i: "🤝",
    t: "Воспользуйся услугой партнёра",
    d: "Запишись к коучу Balance или партнёру — занятие принесёт XP.",
    cta: "Смотреть партнёров",
    action: () => onSwitchToCommunity(),
    meta: "+250 XP / сессия",
    accent: "#9bd0ff"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      overflow: "hidden",
      borderRadius: 22,
      padding: "16px 18px",
      background: "linear-gradient(145deg, #26406e 0%, #182c4f 52%, #0c1730 100%)",
      boxShadow: "0 10px 26px rgba(12,23,48,0.42)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      background: "radial-gradient(circle at 82% 18%, rgba(150,185,255,0.30) 0%, transparent 46%), radial-gradient(circle at 12% 96%, rgba(120,160,220,0.16) 0%, transparent 44%)",
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      top: 15,
      right: 18,
      fontSize: 34,
      lineHeight: 1,
      pointerEvents: "none"
    }
  }, "\uD83D\uDC51"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      color: "rgba(160,196,255,0.9)"
    }
  }, "\u041D\u0435\u0442\u0432\u043E\u0440\u043A \xB7 \u043E\u0442\u043A\u0440\u043E\u0435\u0442\u0441\u044F \u0441 10 \u0443\u0440\u043E\u0432\u043D\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: "-0.4px",
      color: "#fff",
      marginTop: 4,
      maxWidth: 215,
      lineHeight: 1.18
    }
  }, "\u0417\u0430\u043A\u0440\u044B\u0442\u044B\u0439 \u043A\u0440\u0443\u0433 \u0441\u0432\u043E\u0438\u0445"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "rgba(255,255,255,0.74)",
      marginTop: 6,
      lineHeight: 1.4,
      maxWidth: 248
    }
  }, "\u0416\u0438\u0432\u044B\u0435 \u0432\u0441\u0442\u0440\u0435\u0447\u0438 \u0438 \u043F\u043E\u043C\u043E\u0449\u044C \u0440\u044F\u0434\u043E\u043C \u2014 \u0441 \u043B\u044E\u0434\u044C\u043C\u0438 \u0442\u0432\u043E\u0435\u0433\u043E \u0433\u043E\u0440\u043E\u0434\u0430."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 700,
      color: "#fff"
    }
  }, "\u0423\u0440\u043E\u0432\u0435\u043D\u044C ", level, " \u2192 10"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "rgba(255,255,255,0.72)"
    }
  }, "\u043E\u0441\u0442\u0430\u043B\u043E\u0441\u044C ", levelsLeft, " ", ruLvl(levelsLeft))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 9,
      borderRadius: 999,
      background: "rgba(255,255,255,0.13)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: progPct + "%",
      background: "linear-gradient(90deg, #FEDE34, #EF9F14)",
      borderRadius: 999
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      marginTop: 13
    }
  }, [["🤝", "Наставники"], ["💎", "Услуги за XP"]].map(([e, l], i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      background: "rgba(255,255,255,0.13)",
      borderRadius: 999,
      padding: "6px 11px",
      fontSize: 12.5,
      fontWeight: 700,
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      lineHeight: 1
    }
  }, e), l))))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 6
    }
  }, "3 \u0441\u043F\u043E\u0441\u043E\u0431\u0430 \u043E\u0442\u043A\u0440\u044B\u0442\u044C"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, paths.map((p, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: p.action,
    className: "tap",
    style: {
      background: "var(--card)",
      border: 0,
      borderRadius: 22,
      padding: 16,
      boxShadow: "var(--card-shadow)",
      display: "flex",
      alignItems: "center",
      gap: 14,
      textAlign: "left",
      position: "relative",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 14,
      background: `linear-gradient(135deg, ${p.accent}66, ${p.accent}22)`,
      display: "grid",
      placeItems: "center",
      fontSize: 22,
      flexShrink: 0,
      position: "relative"
    }
  }, p.i), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, p.t), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      padding: "2px 7px",
      borderRadius: 999,
      background: `${p.accent}33`,
      color: "#0a0a0a",
      letterSpacing: 0.2
    }
  }, p.meta)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-4)",
      marginTop: 4,
      lineHeight: 1.45
    }
  }, p.d)), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18,
    color: "var(--text-4)",
    style: {
      position: "relative"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 18,
      padding: "14px 16px",
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement(I.Help, {
    size: 14,
    color: "var(--text-3)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "var(--text-2)",
      letterSpacing: 0.2
    }
  }, "\u041F\u043E\u0447\u0435\u043C\u0443 \u041D\u0435\u0442\u0432\u043E\u0440\u043A \u0437\u0430\u043A\u0440\u044B\u0442?")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-4)",
      lineHeight: 1.5
    }
  }, "\u041D\u0430\u043C \u0432\u0430\u0436\u043D\u044B \u043B\u044E\u0434\u0438, \u043F\u0440\u0435\u0434\u0430\u043D\u043D\u044B\u0435 \u0434\u0435\u043B\u0443, \u0430 \u043D\u0435 \u0441\u043B\u0443\u0447\u0430\u0439\u043D\u044B\u0439 \u0448\u0443\u043C. \u041A\u043E\u0433\u0434\u0430 \u0432\u0445\u043E\u0434 \u043D\u0443\u0436\u043D\u043E \u0437\u0430\u0441\u043B\u0443\u0436\u0438\u0442\u044C, \u0437\u0434\u0435\u0441\u044C \u043E\u0441\u0442\u0430\u044E\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0442\u0435, \u0441 \u043A\u0435\u043C \u043F\u0440\u0430\u0432\u0434\u0430 \u0445\u043E\u0447\u0435\u0442\u0441\u044F \u043F\u043E\u0437\u043D\u0430\u043A\u043E\u043C\u0438\u0442\u044C\u0441\u044F.")), /*#__PURE__*/React.createElement("button", {
    onClick: onUnlock,
    className: "tap",
    style: {
      background: "transparent",
      border: "1px dashed rgba(0,0,0,0.15)",
      color: "var(--text-4)",
      borderRadius: 999,
      padding: "8px 14px",
      fontSize: 11,
      marginTop: 4,
      alignSelf: "center"
    }
  }, "\u041F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u043E\u0442\u043A\u0440\u044B\u0442\u044B\u0439 \u041D\u0435\u0442\u0432\u043E\u0440\u043A \u2192"));
}

/* ── Impact gamification (Network tab) ────────────────────────────────
   Each level unlocks the ability to publicly offer a kind of service to
   the community, building a "social impact" score. Other members can
   book/redeem those offers — the offer is the unit of social capital.
   Tier table is shared between YourImpactCard and NetworkPersonCard so
   levels light up consistently. */
var IMPACT_TIERS = [{
  lvl: 3,
  i: "🧠",
  t: "Разбор привычек",
  d: "Найди чужие препятствия"
}, {
  lvl: 4,
  i: "🌬️",
  t: "Дыхательная практика",
  d: "Проведи 20-минутную сессию"
}, {
  lvl: 5,
  i: "🧘",
  t: "Сессия медитации",
  d: "Веди 30-минутную группу"
}, {
  lvl: 8,
  i: "🏃",
  t: "Коучинг дисциплины",
  d: "Звонки по темпу и ответственности"
}, {
  lvl: 10,
  i: "💼",
  t: "Профессиональная консультация",
  d: "Поделись опытом (1 ч)"
}, {
  lvl: 15,
  i: "🎯",
  t: "Спринт менторства",
  d: "Месячный пакет сопровождения"
}, {
  lvl: 20,
  i: "🌍",
  t: "Проведи ретрит",
  d: "Организуй выходные с сообществом"
}];
function YourImpactCard({
  level
}) {
  var unlocked = IMPACT_TIERS.filter(t => t.lvl <= level);
  var next = IMPACT_TIERS.find(t => t.lvl > level);
  var myImpact = 480; // demo
  return /*#__PURE__*/React.createElement("div", {
    "data-tour": "impact",
    style: {
      background: "linear-gradient(135deg, #1a1a1d 0%, #0a0a0a 100%)",
      color: "#fff",
      borderRadius: 22,
      padding: 18,
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 6px 22px rgba(0,0,0,0.18)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      top: -40,
      right: -30,
      width: 160,
      height: 160,
      borderRadius: "50%",
      background: "radial-gradient(circle at 35% 35%, #ffe88a 0%, #FEDE34 30%, #EF9F14 70%, transparent 95%)",
      opacity: 0.18,
      filter: "blur(8px)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      alignItems: "flex-start",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "rgba(255,255,255,0.55)",
      textTransform: "uppercase",
      letterSpacing: 1.4,
      fontWeight: 600
    }
  }, "\u0422\u0432\u043E\u0439 \u0432\u043A\u043B\u0430\u0434 \u0432 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--bos-title-font)",
      fontSize: 30,
      fontWeight: 400,
      letterSpacing: "-0.5px"
    }
  }, myImpact), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "rgba(255,255,255,0.55)",
      letterSpacing: 0.4
    }
  }, "XP \u0432\u043A\u043B\u0430\u0434\u0430 \xB7 \u0423\u0440\u043E\u0432\u0435\u043D\u044C ", level)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "rgba(255,255,255,0.65)",
      lineHeight: 1.5,
      marginTop: 4
    }
  }, "\u041F\u043E\u043C\u043E\u0433\u0430\u0435\u0448\u044C \u0434\u0440\u0443\u0433\u0438\u043C \u2014 \u0440\u0430\u0441\u0442\u0451\u0442 \u0442\u0432\u043E\u0439 \u0432\u043A\u043B\u0430\u0434. \u0415\u0433\u043E \u043C\u043E\u0436\u043D\u043E \u043E\u0431\u043C\u0435\u043D\u044F\u0442\u044C \u043D\u0430 XP \u0438\u043B\u0438 \u043F\u043E\u0434\u043D\u044F\u0442\u044C \u0441\u0442\u0430\u0442\u0443\u0441."))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      paddingTop: 14,
      borderTop: "1px solid rgba(255,255,255,0.08)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "rgba(255,255,255,0.5)",
      textTransform: "uppercase",
      letterSpacing: 1.2,
      fontWeight: 700,
      marginBottom: 8
    }
  }, "\u0427\u0442\u043E \u0442\u044B \u043C\u043E\u0436\u0435\u0448\u044C \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0438\u0442\u044C"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6
    }
  }, unlocked.length === 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "rgba(255,255,255,0.55)"
    }
  }, "\u0421 3-\u0433\u043E \u0443\u0440\u043E\u0432\u043D\u044F \u0441\u043C\u043E\u0436\u0435\u0448\u044C \u043F\u0440\u0435\u0434\u043B\u0430\u0433\u0430\u0442\u044C \u0441\u0432\u043E\u044E \u043F\u043E\u043C\u043E\u0449\u044C \u0434\u0440\u0443\u0433\u0438\u043C."), unlocked.map((u, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 10px",
      background: "rgba(255,255,255,0.07)",
      borderRadius: 999,
      fontSize: 12,
      color: "#fff",
      letterSpacing: -0.1
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      fontSize: 14
    }
  }, u.i), u.t)))), next && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      padding: "10px 12px",
      background: "rgba(255,222,52,0.08)",
      borderRadius: 14,
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 999,
      background: "rgba(254,222,52,0.18)",
      display: "grid",
      placeItems: "center",
      fontSize: 16,
      color: "#FEDE34"
    }
  }, next.i), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "#fff"
    }
  }, "\u041E\u0442\u043A\u0440\u043E\u0435\u0442\u0441\u044F \u043D\u0430 ", next.lvl, " \u0443\u0440\u043E\u0432\u043D\u0435 \xB7 ", next.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "rgba(255,255,255,0.55)",
      marginTop: 1
    }
  }, next.d)), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 14,
    color: "rgba(255,255,255,0.5)"
  })), /*#__PURE__*/React.createElement("button", {
    className: "tap",
    style: {
      width: "100%",
      marginTop: 12,
      background: "#FEDE34",
      color: "#0a0a0a",
      border: 0,
      borderRadius: 999,
      padding: "12px 14px",
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: "-0.1px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6
    }
  }, "\u041E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u0442\u044C \u043C\u043E\u0438 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F ", /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 14
  })));
}

/* Reusable "write a message" sheet (light — sheets render outside theme scope). */
function MessageSheet({
  name = ""
}) {
  var {
    close
  } = useSheet();
  var [txt, setTxt] = useCS("");
  var [sent, setSent] = useCS(false);
  var send = () => {
    setSent(true);
    window.setTimeout(close, 1100);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 20px 8px",
      color: "#0a0a0a"
    }
  }, sent ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "18px 0 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: "50%",
      background: "#0a0a0a",
      color: "#fff",
      display: "grid",
      placeItems: "center",
      margin: "0 auto",
      fontSize: 26
    }
  }, "\u2713"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      marginTop: 12
    }
  }, "\u041E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E", name ? " · " + name : ""), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "rgba(0,0,0,0.5)",
      marginTop: 3
    }
  }, "\u041E\u0442\u0432\u0435\u0442 \u043F\u0440\u0438\u0434\u0451\u0442 \u0432 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      textAlign: "center"
    }
  }, "\u041D\u0430\u043F\u0438\u0441\u0430\u0442\u044C", name ? " · " + name : ""), /*#__PURE__*/React.createElement("textarea", {
    value: txt,
    onChange: e => setTxt(e.target.value),
    placeholder: "\u0422\u0432\u043E\u0451 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435\u2026",
    rows: 4,
    style: {
      width: "100%",
      marginTop: 14,
      border: "1px solid rgba(0,0,0,0.1)",
      borderRadius: 14,
      padding: 12,
      fontSize: 16,
      fontFamily: "inherit",
      resize: "none",
      outline: "none",
      boxSizing: "border-box",
      background: "#f7f7f8"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: send,
    className: "tap",
    style: {
      width: "100%",
      marginTop: 12,
      background: "#0a0a0a",
      color: "#fff",
      border: 0,
      borderRadius: 999,
      padding: "13px",
      fontSize: 15,
      fontWeight: 600
    }
  }, "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C")));
}
function NetworkPersonCard({
  p,
  userLevel
}) {
  var {
    navigate
  } = useNav();
  var {
    open: openSheet
  } = useSheet();
  // sort offers by level so the easiest-to-book sits first
  var offers = (p.offers || []).slice().sort((a, b) => a.lvl - b.lvl);
  return /*#__PURE__*/React.createElement("div", {
    onClick: () => navigate("contact-detail", {
      contact: p
    }),
    className: "tap",
    style: {
      background: "var(--card)",
      borderRadius: 22,
      padding: 16,
      boxShadow: "var(--card-shadow)",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(AvatarStack, {
    people: [p],
    size: 44,
    max: 1,
    label: false
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 16,
      color: "var(--text)"
    }
  }, p.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: "var(--text-3)",
      background: "var(--card-2)",
      borderRadius: 999,
      padding: "2px 7px",
      letterSpacing: 0.4
    }
  }, "L", p.level)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCCD ", p.city), /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCBC ", p.role))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 700
    }
  }, "\u0412\u043A\u043B\u0430\u0434"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: "var(--text)",
      letterSpacing: "-0.4px",
      marginTop: 1
    }
  }, p.impact.toLocaleString()))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-2)",
      marginTop: 10,
      lineHeight: 1.5
    }
  }, p.bio), offers.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      paddingTop: 12,
      borderTop: "1px solid var(--line)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1.2,
      fontWeight: 700,
      marginBottom: 8
    }
  }, "\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0443"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, offers.map((o, j) => {
    var locked = userLevel < o.lvl;
    return /*#__PURE__*/React.createElement("div", {
      key: j,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        background: "var(--card-2)",
        borderRadius: 12,
        opacity: locked ? 0.55 : 1
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 30,
        height: 30,
        borderRadius: 10,
        background: "var(--card)",
        display: "grid",
        placeItems: "center",
        fontSize: 15,
        flexShrink: 0
      }
    }, o.i), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: "var(--text)",
        letterSpacing: -0.1
      }
    }, o.t), locked && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        fontWeight: 700,
        color: "var(--text-4)",
        background: "var(--card)",
        borderRadius: 999,
        padding: "2px 6px",
        letterSpacing: 0.4
      }
    }, "\uD83D\uDD12 L", o.lvl)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--text-4)",
        marginTop: 1
      }
    }, o.d)), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "right",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        color: locked ? "var(--text-4)" : "var(--text)"
      }
    }, o.price), !locked && /*#__PURE__*/React.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        navigate("contact-detail", {
          contact: p,
          focusOffer: j
        });
      },
      className: "tap",
      style: {
        marginTop: 2,
        fontSize: 11,
        fontWeight: 600,
        color: "#0a0a0a",
        background: "#FEDE34",
        border: 0,
        borderRadius: 999,
        padding: "3px 9px"
      }
    }, "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u044C\u0441\u044F")));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      openSheet(/*#__PURE__*/React.createElement(MessageSheet, {
        name: p.name
      }));
    },
    className: "tap",
    style: {
      flex: 1,
      background: "var(--card-2)",
      border: 0,
      borderRadius: 999,
      padding: "10px 14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      fontSize: 13,
      color: "var(--text-2)"
    }
  }, /*#__PURE__*/React.createElement(I.MessageCircle, {
    size: 15
  }), " \u041D\u0430\u043F\u0438\u0441\u0430\u0442\u044C"), /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      navigate("contact-detail", {
        contact: p
      });
    },
    className: "tap",
    style: {
      background: "#0a0a0a",
      color: "#fff",
      border: 0,
      borderRadius: 999,
      padding: "10px 16px",
      fontSize: 13,
      fontWeight: 500
    }
  }, "\u0421\u0432\u044F\u0437\u0430\u0442\u044C\u0441\u044F")));
}
function CommunityScreen() {
  var {
    navigate
  } = useNav();
  var app = useApp();
  // View-state (section / sub-tabs / network unlock) lives in the shared store so
  // it survives navigating into a detail screen and back (the screen remounts).
  var cv = app?.communityView || {
    section: "discover",
    discTab: "teams",
    commTab: "network",
    networkUnlocked: false
  };
  var {
    section,
    discTab,
    commTab,
    networkUnlocked
  } = cv;
  var setView = patch => app?.setCommunityView(patch);
  var resolve = (v, cur) => typeof v === "function" ? v(cur) : v;
  var setSection = v => setView({
    section: resolve(v, section)
  });
  var setDiscTab = v => setView({
    discTab: resolve(v, discTab)
  });
  var setCommTab = v => setView({
    commTab: resolve(v, commTab)
  });
  var setNetworkUnlocked = v => setView({
    networkUnlocked: resolve(v, networkUnlocked)
  });
  var [activated, setActivated] = useCS({}); // partner activations (by index)

  var userLevel = 8;
  var xpInLevel = 1240;
  var xpForNext = 2000;
  var levelsLeft = 10 - userLevel;
  var weeksToUnlock = 2;
  var teams = app?.teams || []; // shared store — "Создать команду" adds here
  var network = [{
    name: "Александра Иванова",
    initials: "АИ",
    color: "#e8c8a8",
    city: "Москва",
    role: "Маркетинг",
    bio: "Диджитал-маркетолог, 5 лет. Йога и медитация.",
    tags: ["Йога", "Маркетинг", "Путешествия"],
    dist: "в 2 км",
    level: 12,
    impact: 1840,
    offers: [{
      i: "🧘",
      t: "Сессия медитации",
      d: "30 мин · вт и чт",
      price: "Бесплатно",
      lvl: 5
    }, {
      i: "💼",
      t: "Консультация по маркетингу",
      d: "1 ч · бренд и рост",
      price: "150 XP/ч",
      lvl: 10
    }]
  }, {
    name: "Иван Петров",
    initials: "ИП",
    color: "#a8d4e8",
    city: "Москва",
    role: "Основатель",
    bio: "Предприниматель, бегун, вечный ученик.",
    tags: ["Бег", "Книги", "Закаливание"],
    dist: "в 3 км",
    level: 18,
    impact: 3120,
    offers: [{
      i: "🌬️",
      t: "Дыхательная практика",
      d: "20 мин · по утрам в будни",
      price: "Бесплатно",
      lvl: 4
    }, {
      i: "🏃",
      t: "Звонок с беговым коучем",
      d: "45 мин · планы темпа",
      price: "100 XP/звонок",
      lvl: 8
    }, {
      i: "💬",
      t: "Q&A с основателем",
      d: "1 ч · b2b SaaS",
      price: "200 XP/ч",
      lvl: 15
    }]
  }, {
    name: "Анастасия В.",
    initials: "АВ",
    color: "#d4b8e8",
    city: "Москва",
    role: "Коуч",
    bio: "Помогаю выстраивать устойчивые ритуалы.",
    tags: ["Коучинг", "Мышление"],
    dist: "в 5 км",
    level: 9,
    impact: 1240,
    offers: [{
      i: "🧠",
      t: "Разбор привычек",
      d: "30 мин · диагностика",
      price: "Бесплатно",
      lvl: 3
    }, {
      i: "🎯",
      t: "Менторство на месяц",
      d: "4 звонка · сопровождение",
      price: "300 XP/мес",
      lvl: 7
    }]
  }];
  var courses = [{
    id: "overload",
    i: "⚡",
    accent: "#fef3c7",
    t: "Перегрузка",
    d: "Перенастрой мышление и очисти негативные убеждения.",
    price: "110 000 ₽",
    lvl: "Интенсив",
    length: "3 дня",
    cohort: "14 — 16 мар"
  }, {
    id: "breakthrough",
    i: "🚀",
    accent: "#dbe9ff",
    t: "Прорыв",
    d: "Открой новые пути и преодолей пределы.",
    price: "110 000 ₽",
    lvl: "Продвинутый",
    length: "7 дней",
    cohort: "8 — 14 апр"
  }, {
    id: "marathon",
    i: "🏃🏼‍♀️",
    accent: "#d6f3df",
    t: "Марафон",
    d: "21-дневная программа устойчивых привычек.",
    price: "110 000 ₽",
    lvl: "Базовый",
    length: "21 день",
    cohort: "1 — 21 мая"
  }];
  var partners = [{
    name: "Headspace",
    emblem: "🧘",
    accent: "#ffe1c8",
    tagline: "Медитация под твою жизнь",
    offer: "−20% на год",
    tags: ["Медитация", "Сон"],
    xp: 250
  }, {
    name: "Strava",
    emblem: "🏃",
    accent: "#fde2e2",
    tagline: "Двигайся с миллионами атлетов",
    offer: "2 месяца бесплатно",
    tags: ["Бег", "Велоспорт"],
    xp: 200
  }, {
    name: "Calm",
    emblem: "🌙",
    accent: "#dbe9ff",
    tagline: "Истории для сна и звуки",
    offer: "30 дней пробно",
    tags: ["Сон", "Спокойствие"],
    xp: 200
  }, {
    name: "Withings",
    emblem: "⌚",
    accent: "#d4f0eb",
    tagline: "Умные весы и трекинг сна",
    offer: "−15% на устройства",
    tags: ["Здоровье", "Сон"],
    xp: 300
  }];
  return /*#__PURE__*/React.createElement("div", {
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
      flex: 1,
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: "-0.5px"
    }
  }, "\u0421\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E"), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("team-create"),
    className: "tap",
    style: {
      background: "#0a0a0a",
      color: "#fff",
      border: 0,
      borderRadius: 999,
      padding: "10px 14px",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 13,
      fontWeight: 500,
      boxShadow: "0 4px 14px rgba(0,0,0,0.18)"
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 16
  }), " \u041D\u043E\u0432\u0430\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u0430")), /*#__PURE__*/React.createElement("div", {
    className: "tab-pill",
    style: {
      background: "var(--card-2)"
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "tap " + (section === "discover" ? "active" : ""),
    onClick: () => setSection("discover")
  }, "\u041A\u043E\u043C\u0430\u043D\u0434\u044B"), /*#__PURE__*/React.createElement("button", {
    className: "tap " + (section === "community" ? "active" : ""),
    onClick: () => setSection("community")
  }, "\u0421\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E")), section === "community" && /*#__PURE__*/React.createElement("div", {
    className: "tab-pill tab-pill-sm",
    style: {
      background: "var(--card-2)",
      marginTop: 10,
      marginBottom: 14
    }
  }, [{
    id: "network",
    t: "Нетворк"
  }, {
    id: "courses",
    t: "Курсы"
  }, {
    id: "partners",
    t: "Партнёры"
  }].map(tb => /*#__PURE__*/React.createElement("button", {
    key: tb.id,
    className: "tap " + (commTab === tb.id ? "active" : ""),
    "data-tour": tb.id === "network" ? "network" : undefined,
    onClick: () => setCommTab(tb.id)
  }, tb.t))), section === "discover" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      marginTop: 14
    }
  }, teams.map((t, i) => {
    var tgt = t.target || 0;
    var cur = t.current != null ? t.current : Math.round((t.progress || 0) * tgt);
    var gp = tgt > 0 ? Math.min(1, cur / tgt) : t.progress || 0;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "team-card",
      style: {
        ["--team-accent"]: t.accent,
        borderRadius: 22,
        padding: 18,
        position: "relative",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      "aria-hidden": true,
      className: "team-card__emblem",
      style: {
        position: "absolute",
        top: -10,
        right: -6,
        fontSize: 110,
        lineHeight: 1,
        pointerEvents: "none",
        transform: "rotate(8deg)"
      }
    }, t.emblem), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 700,
        fontSize: 18,
        color: "var(--text)",
        letterSpacing: "-0.4px"
      }
    }, t.name), /*#__PURE__*/React.createElement("span", {
      style: {
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10.5,
        fontWeight: 600,
        color: "var(--text-3)",
        background: "var(--card-track)",
        padding: "2px 8px",
        borderRadius: 999
      }
    }, t.vis === "public" ? "🌐 Открытая" : "🔒 Приватная")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: "var(--text-2)",
        marginTop: 6,
        fontWeight: 500
      }
    }, "\uD83C\uDFAF ", t.goal), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--text-3)",
        marginTop: 2
      }
    }, t.date, " \xB7 ", t.members.length, " \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 14,
        fontSize: 11,
        color: "var(--text-3)",
        textTransform: "uppercase",
        letterSpacing: 1,
        fontWeight: 600
      }
    }, /*#__PURE__*/React.createElement("span", null, t.target ? "К цели" : "Прогресс команды"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--text)"
      }
    }, t.target ? `${cur} / ${tgt} ${t.unit || ""}` : Math.round(gp * 100) + "%")), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 6,
        height: 8,
        borderRadius: 999,
        background: "var(--card-track)",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "team-card__fill",
      style: {
        display: "block",
        height: "100%",
        width: gp * 100 + "%",
        borderRadius: 999
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        marginTop: 14,
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(AvatarStack, {
      people: t.members,
      size: 28,
      max: 5,
      label: false
    }), /*#__PURE__*/React.createElement("button", {
      onClick: () => navigate("team-detail", {
        team: t
      }),
      className: "tap team-card__cta",
      style: {
        marginLeft: "auto",
        border: 0,
        borderRadius: 999,
        padding: "11px 18px",
        fontSize: 13.5,
        fontWeight: 600
      }
    }, "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u0443"))));
  }), teams.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "8px 18px 2px",
      color: "var(--text-4)",
      fontSize: 13.5,
      lineHeight: 1.5
    }
  }, "\u041A\u043E\u043C\u0430\u043D\u0434\u044B \u2014 \u044D\u0442\u043E \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438 \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 \u0434\u0440\u0443\u0437\u044C\u044F\u043C\u0438. \u0421\u043E\u0437\u0434\u0430\u0439 \u043F\u0435\u0440\u0432\u0443\u044E \u0438\u043B\u0438 \u0434\u043E\u0436\u0434\u0438\u0441\u044C \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u044F."), /*#__PURE__*/React.createElement("button", {
    "data-tour": "make-team",
    onClick: () => navigate("team-create"),
    className: "tap team-new-cta",
    style: {
      color: "#fff",
      border: 0,
      borderRadius: 22,
      padding: 18,
      display: "flex",
      alignItems: "center",
      gap: 14,
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 48,
      height: 48,
      borderRadius: "50%",
      background: "rgba(255,222,52,0.15)",
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 22,
    color: "#FEDE34"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      fontSize: 16
    }
  }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u0443"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      opacity: 0.65,
      marginTop: 2
    }
  }, "\u041F\u0440\u0438\u0433\u043B\u0430\u0441\u0438 \u0434\u0440\u0443\u0437\u0435\u0439, \u043F\u043E\u0441\u0442\u0430\u0432\u044C \u043E\u0431\u0449\u0443\u044E \u0446\u0435\u043B\u044C, \u0432\u044B\u0441\u0442\u0440\u0430\u0438\u0432\u0430\u0439\u0442\u0435 \u0441\u0435\u0440\u0438\u0438 \u0432\u043C\u0435\u0441\u0442\u0435.")), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18
  }))), section === "community" && commTab === "network" && (networkUnlocked ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(YourImpactCard, {
    level: userLevel
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      padding: "4px 4px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1.2,
      fontWeight: 700
    }
  }, "\u041B\u044E\u0434\u0438 \u0440\u044F\u0434\u043E\u043C \u0441 \u0442\u043E\u0431\u043E\u0439"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)"
    }
  }, "\u041F\u043E \u0432\u043A\u043B\u0430\u0434\u0443")), network.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    "data-tour": i === 0 ? "contacts" : undefined
  }, /*#__PURE__*/React.createElement(NetworkPersonCard, {
    p: p,
    userLevel: userLevel
  })))) : /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement(NetworkLocked, {
    navigate: navigate,
    level: userLevel,
    xp: xpInLevel,
    xpMax: xpForNext,
    levelsLeft: levelsLeft,
    weeks: weeksToUnlock,
    onUnlock: () => setNetworkUnlocked(true),
    onSwitchToCommunity: () => {
      setSection("community");
      setCommTab("courses");
    }
  }))), section === "community" && commTab === "courses" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      overflow: "hidden",
      borderRadius: 22,
      padding: "16px 18px",
      background: "linear-gradient(135deg, #FEDE34 0%, #F7C420 44%, #EF9F14 100%)",
      boxShadow: "0 8px 22px rgba(239,159,20,0.32)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      top: -46,
      right: -28,
      width: 168,
      height: 168,
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(255,255,255,0.5), transparent 66%)",
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      top: 15,
      right: 17,
      fontSize: 38,
      lineHeight: 1,
      pointerEvents: "none"
    }
  }, "\uD83C\uDFC6"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      color: "rgba(58,42,0,0.6)"
    }
  }, "\u0417\u0430\u0447\u0435\u043C \u043F\u0440\u043E\u0445\u043E\u0434\u0438\u0442\u044C \u043A\u0443\u0440\u0441\u044B"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 800,
      letterSpacing: "-0.4px",
      color: "#3a2a00",
      marginTop: 4,
      maxWidth: 220,
      lineHeight: 1.2
    }
  }, "\u041A\u0430\u0436\u0434\u044B\u0439 \u043A\u0443\u0440\u0441 \u2014 \u0446\u0435\u043B\u044B\u0439 \u0443\u0440\u043E\u0432\u0435\u043D\u044C"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "rgba(58,42,0,0.8)",
      marginTop: 6,
      lineHeight: 1.42,
      maxWidth: 244
    }
  }, "\u0410\u0447\u0438\u0432\u043A\u0430, \u0431\u043E\u043B\u044C\u0448\u043E\u0439 \u043E\u043F\u044B\u0442 \u0438 \u0434\u043E\u0441\u0442\u0443\u043F \u043A \u043D\u043E\u0432\u044B\u043C \u043B\u044E\u0434\u044F\u043C. \u0421\u0430\u043C\u044B\u0439 \u0431\u044B\u0441\u0442\u0440\u044B\u0439 \u0440\u043E\u0441\u0442."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      marginTop: 13,
      flexWrap: "wrap"
    }
  }, [["🏆", "+Уровень"], ["🎖️", "Ачивка"], ["⚡", "+2000 XP"]].map(([e, l], i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      background: "rgba(255,255,255,0.55)",
      borderRadius: 999,
      padding: "6px 11px",
      fontSize: 12.5,
      fontWeight: 700,
      color: "#3a2a00"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      lineHeight: 1
    }
  }, e), l))))), courses.map((c, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    "data-tour": i === 0 ? "course" : undefined,
    onClick: () => navigate("course-detail", {
      course: c
    }),
    className: "tap",
    style: {
      background: "var(--card)",
      borderRadius: 22,
      padding: 16,
      boxShadow: "var(--card-shadow)",
      border: 0,
      textAlign: "left",
      color: "var(--text)",
      display: "block",
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
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
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 17,
      color: "var(--text)",
      letterSpacing: "-0.3px"
    }
  }, c.t), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      padding: "2px 8px",
      background: "var(--card-2)",
      borderRadius: 999,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      fontWeight: 600
    }
  }, c.lvl)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-3)",
      marginTop: 6,
      lineHeight: 1.45
    }
  }, c.d), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      marginTop: 6,
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u23F1 ", c.length), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCC5 ", c.cohort))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 46,
      height: 46,
      borderRadius: "50%",
      background: c.accent,
      display: "grid",
      placeItems: "center",
      fontSize: 22,
      flexShrink: 0
    }
  }, c.i)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderTop: "1px solid var(--line)",
      paddingTop: 12,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600
    }
  }, "\u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      marginTop: 2,
      color: "var(--text)"
    }
  }, c.price)), /*#__PURE__*/React.createElement("span", {
    style: {
      background: "#0a0a0a",
      color: "#fff",
      borderRadius: 999,
      padding: "10px 18px",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 13,
      fontWeight: 500
    }
  }, "\u041E \u043A\u0443\u0440\u0441\u0435 ", /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 14
  })))))), section === "community" && commTab === "partners" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      marginTop: 4
    }
  }, partners.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: "var(--card)",
      borderRadius: 22,
      padding: 16,
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: 17,
      color: "var(--text)",
      letterSpacing: "-0.3px"
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-3)",
      marginTop: 4
    }
  }, p.tagline), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 8,
      flexWrap: "wrap"
    }
  }, p.tags.map((tg, j) => /*#__PURE__*/React.createElement("span", {
    key: j,
    style: {
      background: "var(--card-2)",
      borderRadius: 999,
      padding: "4px 10px",
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, tg)))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      borderRadius: "50%",
      background: p.accent,
      display: "grid",
      placeItems: "center",
      fontSize: 22,
      flexShrink: 0
    }
  }, p.emblem)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 14,
      paddingTop: 12,
      borderTop: "1px solid var(--line)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600
    }
  }, "\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0434\u043B\u044F \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      marginTop: 2,
      color: "var(--text)"
    }
  }, p.offer), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      marginTop: 2
    }
  }, "+", p.xp, " XP \u0437\u0430 \u0430\u043A\u0442\u0438\u0432\u0430\u0446\u0438\u044E")), activated[i] ? /*#__PURE__*/React.createElement("span", {
    style: {
      background: "rgba(52,199,89,0.14)",
      color: "#1E8E4E",
      borderRadius: 999,
      padding: "10px 16px",
      fontSize: 13,
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(I.Check, {
    size: 14,
    strokeWidth: 3
  }), " \u0410\u043A\u0442\u0438\u0432\u043D\u043E") : /*#__PURE__*/React.createElement("button", {
    onClick: () => setActivated(a => ({
      ...a,
      [i]: true
    })),
    className: "tap",
    style: {
      background: "#0a0a0a",
      color: "#fff",
      border: 0,
      borderRadius: 999,
      padding: "10px 16px",
      fontSize: 13,
      fontWeight: 500,
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, "\u0410\u043A\u0442\u0438\u0432\u0438\u0440\u043E\u0432\u0430\u0442\u044C ", /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 14
  })))))));
}

/* Underline-style text tabs — secondary navigation that visually contrasts with the pill */
function UnderlineTabs({
  value,
  onChange,
  tabs
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 0,
      marginTop: 14,
      marginBottom: 14,
      borderBottom: "1px solid rgba(0,0,0,0.06)",
      padding: "0 4px"
    }
  }, tabs.map(tab => {
    var active = tab.id === value;
    return /*#__PURE__*/React.createElement("button", {
      key: tab.id,
      "data-tour": tab.id === "network" ? "network" : undefined,
      onClick: () => onChange(tab.id),
      className: "tap",
      style: {
        background: "transparent",
        border: 0,
        padding: "10px 14px 12px",
        fontSize: 14,
        fontWeight: 600,
        color: active ? "var(--text)" : "var(--text-4)",
        letterSpacing: "-0.2px",
        position: "relative",
        transition: "color 0.18s"
      }
    }, tab.t, /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        left: 14,
        right: 14,
        bottom: -1,
        height: 2,
        background: active ? "#0a0a0a" : "transparent",
        borderRadius: 2,
        transition: "background 0.18s"
      }
    }));
  }));
}

/* SplitEditor — Auto / Custom per-member quota distribution.
   In auto mode: target divides evenly across active members.
   In custom mode: each member gets an editable number input;
   shows running total + remainder vs target. */
function SplitEditor({
  target,
  unit,
  members,
  setMembers,
  splitMode,
  setSplitMode
}) {
  var activeMembers = members.filter(m => m.on);
  var perMember = activeMembers.length ? Math.ceil(target / activeMembers.length) : 0;

  // Initialise custom quotas the first time mode flips to custom
  React.useEffect(() => {
    if (splitMode !== "custom") return;
    setMembers(curr => {
      var active = curr.filter(m => m.on);
      var base = active.length ? Math.floor(target / active.length) : 0;
      var remainder = active.length ? target - base * active.length : 0;
      var activeIdx = 0;
      return curr.map(m => {
        if (!m.on) return {
          ...m,
          quota: undefined
        };
        if (m.quota != null) return m;
        var isFirst = activeIdx === 0;
        activeIdx++;
        return {
          ...m,
          quota: base + (isFirst ? remainder : 0)
        };
      });
    });
    // eslint-disable-next-line
  }, [splitMode]);
  var setQuota = (idx, q) => {
    var clean = Math.max(0, parseInt(String(q).replace(/\D/g, "")) || 0);
    setMembers(curr => curr.map((m, i) => i === idx ? {
      ...m,
      quota: clean
    } : m));
  };
  var autoBalance = () => {
    setMembers(curr => {
      var active = curr.filter(m => m.on);
      var base = active.length ? Math.floor(target / active.length) : 0;
      var remainder = active.length ? target - base * active.length : 0;
      var activeIdx = 0;
      return curr.map(m => {
        if (!m.on) return {
          ...m,
          quota: undefined
        };
        var isFirst = activeIdx === 0;
        activeIdx++;
        return {
          ...m,
          quota: base + (isFirst ? remainder : 0)
        };
      });
    });
  };
  var customTotal = activeMembers.reduce((s, m) => s + (m.quota || 0), 0);
  var remainder = target - customTotal;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 18,
      padding: 16,
      marginTop: 10,
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--text-2)",
      fontWeight: 500
    }
  }, "\u041A\u0430\u043A \u0440\u0430\u0441\u043F\u0440\u0435\u0434\u0435\u043B\u044F\u0435\u0442\u0441\u044F?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 2
    }
  }, splitMode === "auto" ? `~${perMember} ${unit}/чел.` : "Задай квоты на каждого ниже")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      background: "var(--card-2)",
      borderRadius: 999,
      padding: 3,
      flexShrink: 0
    }
  }, [{
    id: "auto",
    t: "Авто"
  }, {
    id: "custom",
    t: "Вручную"
  }].map(o => /*#__PURE__*/React.createElement("button", {
    key: o.id,
    onClick: () => setSplitMode(o.id),
    className: "tap",
    style: {
      background: splitMode === o.id ? "#fff" : "transparent",
      border: 0,
      borderRadius: 999,
      padding: "5px 12px",
      fontSize: 12,
      fontWeight: 500,
      color: "var(--text)"
    }
  }, o.t)))), splitMode === "auto" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      width: "100%",
      height: 10,
      borderRadius: 999,
      overflow: "hidden",
      background: "var(--card-2)"
    }
  }, activeMembers.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    title: `${m.name} · ${perMember} ${unit}`,
    style: {
      flex: 1,
      background: m.color,
      borderRight: i < activeMembers.length - 1 ? "2px solid #fff" : 0
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 8,
      fontSize: 11,
      color: "var(--text-4)"
    }
  }, /*#__PURE__*/React.createElement("span", null, activeMembers.length, " \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0445 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432"), /*#__PURE__*/React.createElement("span", null, target, " ", unit, " \u0432\u0441\u0435\u0433\u043E"))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      width: "100%",
      height: 10,
      borderRadius: 999,
      overflow: "hidden",
      background: "var(--card-2)"
    }
  }, activeMembers.map((m, i) => {
    var flex = Math.max(0.001, m.quota || 0);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      title: `${m.name} · ${m.quota || 0} ${unit}`,
      style: {
        flex,
        background: m.color,
        borderRight: i < activeMembers.length - 1 ? "2px solid #fff" : 0,
        transition: "flex 0.2s"
      }
    });
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, members.map((m, i) => {
    if (!m.on) return null;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "6px 0"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 26,
        height: 26,
        borderRadius: "50%",
        background: m.color,
        border: "1.5px solid #fff",
        display: "grid",
        placeItems: "center",
        fontSize: 11,
        fontWeight: 700,
        color: "rgba(0,0,0,0.6)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.08)"
      }
    }, m.initials), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        fontSize: 14,
        color: "var(--text)"
      }
    }, m.name), /*#__PURE__*/React.createElement("button", {
      onClick: () => setQuota(i, Math.max(0, (m.quota || 0) - 1)),
      className: "tap",
      style: {
        width: 26,
        height: 26,
        borderRadius: "50%",
        background: "var(--card-2)",
        border: 0,
        fontSize: 14,
        color: "var(--text)"
      }
    }, "\u2212"), /*#__PURE__*/React.createElement("input", {
      type: "text",
      inputMode: "numeric",
      pattern: "[0-9]*",
      value: m.quota ?? 0,
      onChange: e => setQuota(i, e.target.value),
      style: {
        width: 50,
        textAlign: "center",
        fontSize: 15,
        fontWeight: 600,
        color: "var(--text)",
        border: 0,
        outline: 0,
        background: "transparent",
        padding: 0
      }
    }), /*#__PURE__*/React.createElement("button", {
      onClick: () => setQuota(i, (m.quota || 0) + 1),
      className: "tap",
      style: {
        width: 26,
        height: 26,
        borderRadius: "50%",
        background: "var(--card-2)",
        border: 0,
        fontSize: 14,
        color: "var(--text)"
      }
    }, "+"));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      paddingTop: 12,
      borderTop: "1px solid var(--line)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: autoBalance,
    className: "tap",
    style: {
      background: "transparent",
      border: "1px solid rgba(0,0,0,0.1)",
      borderRadius: 999,
      padding: "6px 12px",
      fontSize: 12,
      fontWeight: 500,
      color: "var(--text-2)",
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(I.Refresh, {
    size: 12
  }), " \u0420\u0430\u0441\u043F\u0440\u0435\u0434\u0435\u043B\u0438\u0442\u044C \u043F\u043E\u0440\u043E\u0432\u043D\u0443"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "baseline"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-4)"
    }
  }, customTotal, " / ", target, " ", unit), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      padding: "3px 9px",
      borderRadius: 999,
      background: remainder === 0 ? "#e5f5ea" : remainder > 0 ? "#fff5d8" : "#ffe8e8",
      color: remainder === 0 ? "#1e6b3a" : remainder > 0 ? "#8a6a00" : "#a02020"
    }
  }, remainder === 0 ? "Ровно" : remainder > 0 ? `+${remainder} осталось` : `${-remainder} сверх`)))));
}

/* DurationPicker — flexible team-goal timeframe.
   Presets in chips + "Custom range" that opens start/end date editors. */
function DurationPicker({
  value,
  onChange
}) {
  var presets = [{
    id: "week",
    t: "1 неделя",
    days: 7
  }, {
    id: "2weeks",
    t: "2 недели",
    days: 14
  }, {
    id: "month",
    t: "1 месяц",
    days: 30
  }, {
    id: "quarter",
    t: "3 месяца",
    days: 90
  }, {
    id: "6mo",
    t: "6 месяцев",
    days: 180
  }, {
    id: "year",
    t: "1 год",
    days: 365
  }];
  var isCustom = typeof value === "object" && value !== null;
  var [showCustom, setShowCustom] = useCS(isCustom);
  var today = new Date();
  var fmt = d => d.toLocaleDateString("ru-RU", {
    month: "short",
    day: "numeric"
  });
  var todayStr = today.toISOString().slice(0, 10);
  var [start, setStart] = useCS(isCustom ? value.start : todayStr);
  var [end, setEnd] = useCS(() => {
    if (isCustom) return value.end;
    var d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  var previewEnd = (() => {
    if (showCustom) return null;
    var p = presets.find(x => x.id === value);
    if (!p) return null;
    var d = new Date();
    d.setDate(d.getDate() + p.days);
    return d;
  })();
  var days = (() => {
    if (!showCustom) {
      var p = presets.find(x => x.id === value);
      return p ? p.days : 0;
    }
    try {
      var s = new Date(start),
        e = new Date(end);
      return Math.max(0, Math.round((e - s) / 86400000));
    } catch {
      return 0;
    }
  })();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, presets.map(p => {
    var on = !showCustom && value === p.id;
    return /*#__PURE__*/React.createElement("button", {
      key: p.id,
      onClick: () => {
        setShowCustom(false);
        onChange(p.id);
      },
      className: "tap",
      style: {
        background: on ? "#0a0a0a" : "#fff",
        color: on ? "#fff" : "var(--text-2)",
        border: on ? 0 : "1px solid rgba(0,0,0,0.08)",
        borderRadius: 999,
        padding: "8px 14px",
        fontSize: 13,
        fontWeight: 500
      }
    }, p.t);
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setShowCustom(true);
      onChange({
        start,
        end
      });
    },
    className: "tap",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: showCustom ? "#0a0a0a" : "#fff",
      color: showCustom ? "#fff" : "var(--text-2)",
      border: showCustom ? 0 : "1px solid rgba(0,0,0,0.08)",
      borderRadius: 999,
      padding: "8px 14px",
      fontSize: 13,
      fontWeight: 500
    }
  }, /*#__PURE__*/React.createElement(I.Calendar, {
    size: 13
  }), " \u0421\u0432\u043E\u0439")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 18,
      padding: 14,
      marginTop: 10,
      boxShadow: "var(--card-shadow)"
    }
  }, !showCustom ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(I.Calendar, {
    size: 18,
    color: "var(--text-3)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, fmt(today), " \u2192 ", previewEnd ? fmt(previewEnd) : "—"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      marginTop: 2
    }
  }, days, " \u0434\u043D\u0435\u0439 \xB7 \u0441 \u0441\u0435\u0433\u043E\u0434\u043D\u044F\u0448\u043D\u0435\u0433\u043E \u0434\u043D\u044F"))) : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600
    }
  }, "\u041D\u0430\u0447\u0430\u043B\u043E"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: start,
    onChange: e => {
      setStart(e.target.value);
      onChange({
        start: e.target.value,
        end
      });
    },
    style: {
      width: "100%",
      marginTop: 4,
      fontSize: 14,
      fontWeight: 500,
      color: "var(--text)",
      border: 0,
      outline: 0,
      background: "transparent",
      padding: "6px 0",
      borderBottom: "1px solid var(--line)"
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600
    }
  }, "\u041A\u043E\u043D\u0435\u0446"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: end,
    onChange: e => {
      setEnd(e.target.value);
      onChange({
        start,
        end: e.target.value
      });
    },
    style: {
      width: "100%",
      marginTop: 4,
      fontSize: 14,
      fontWeight: 500,
      color: "var(--text)",
      border: 0,
      outline: 0,
      background: "transparent",
      padding: "6px 0",
      borderBottom: "1px solid var(--line)"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      marginTop: 10
    }
  }, days, " \u0434\u043D\u0435\u0439 \u0432\u0441\u0435\u0433\u043E"))));
}
function TeamCreateScreen() {
  var {
    navigate
  } = useNav();
  var app = useApp();
  var [name, setName] = useCS("");
  var [emblem, setEmblem] = useCS("✨");
  var [accent, setAccent] = useCS("#fef3c7");
  var [duration, setDuration] = useCS("month");
  var [vis, setVis] = useCS("private");

  // Goal config
  var [goalType, setGoalType] = useCS("collective"); // collective | streak | race
  var [goalTitle, setGoalTitle] = useCS("50 добрых дел");
  var [target, setTarget] = useCS(50);
  var [unit, setUnit] = useCS("дел");
  var [splitMode, setSplitMode] = useCS("auto"); // auto | custom
  var [linkedHabits, setLinkedHabits] = useCS({
    "🙏": true,
    "🧘🏼‍♀️": false,
    "📖": false,
    "🥗": false,
    "🏃🏼‍♀️": false
  });
  var [stakes, setStakes] = useCS(true);
  var [stakeAmount, setStakeAmount] = useCS(100);

  // Members for split preview
  var allMembers = [{
    name: "Павел (вы)",
    initials: "П",
    color: "#FEDE34",
    on: true,
    you: true
  }, {
    name: "Ник",
    initials: "Н",
    color: "#a8b9d4",
    on: true
  }, {
    name: "Светлана",
    initials: "С",
    color: "#e8c8a8",
    on: true
  }, {
    name: "Вадим",
    initials: "В",
    color: "#a8d4e8",
    on: false
  }, {
    name: "Анна",
    initials: "А",
    color: "#d4a8b9",
    on: false
  }, {
    name: "Лена",
    initials: "Л",
    color: "#d4b8e8",
    on: false
  }];
  var [members, setMembers] = useCS(allMembers);
  var toggleMember = i => setMembers(m => m.map((x, j) => j === i ? {
    ...x,
    on: !x.on
  } : x));
  var activeMembers = members.filter(m => m.on);
  var perMember = Math.max(1, Math.ceil(target / Math.max(1, activeMembers.length)));
  var goalTypes = [{
    id: "collective",
    e: "🌊",
    t: "Общий счёт",
    d: "Отметки всех складываются в одно число.",
    example: `напр. ${target} ${unit} вместе`
  }, {
    id: "streak",
    e: "🔥",
    t: "Серия у каждого",
    d: "Каждый держит серию — команда проходит только если прошли все.",
    example: `напр. все держат серию ${duration === "week" ? 7 : duration === "month" ? 21 : 60} дней`
  }, {
    id: "race",
    e: "🏁",
    t: "Гонка",
    d: "Бок о бок — первый до цели побеждает, остальные получают часть XP.",
    example: `напр. первый до ${target} ${unit}`
  }];
  var HABIT_LIB = [{
    e: "🙏",
    t: "Помогать"
  }, {
    e: "🧘🏼‍♀️",
    t: "Медитация"
  }, {
    e: "📖",
    t: "Чтение"
  }, {
    e: "🥗",
    t: "Питание"
  }, {
    e: "🏃🏼‍♀️",
    t: "Бег"
  }];
  var linkedCount = Object.values(linkedHabits).filter(Boolean).length;
  var toggleHabit = e => setLinkedHabits(h => ({
    ...h,
    [e]: !h[e]
  }));
  var accentSwatches = ["#fef3c7", "#dbe9ff", "#d6f3df", "#e9dffd", "#fde2e2", "#ffe1c8", "#d4f0eb", "#e3e3e3"];
  var emblemChoices = ["✨", "🌱", "🔥", "🌊", "🏔", "🚀", "🎯", "🧭"];
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u0443",
    onBack: () => navigate("community")
  }), /*#__PURE__*/React.createElement("div", {
    className: "section-label"
  }, "\u0418\u0434\u0435\u043D\u0442\u0438\u0447\u043D\u043E\u0441\u0442\u044C"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: `linear-gradient(135deg, ${accent} 0%, ${accent}66 60%, var(--card-fade) 100%)`,
      borderRadius: 22,
      padding: 18,
      marginTop: 8,
      boxShadow: "var(--card-shadow)",
      position: "relative",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      top: -10,
      right: -6,
      fontSize: 110,
      lineHeight: 1,
      opacity: 0.28,
      pointerEvents: "none",
      filter: "saturate(0.9)",
      transform: "rotate(8deg)"
    }
  }, emblem), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      textTransform: "uppercase",
      letterSpacing: 1.4,
      fontWeight: 600
    }
  }, "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u044B"), /*#__PURE__*/React.createElement("input", {
    value: name,
    onChange: e => setName(e.target.value),
    placeholder: "\u041A\u043E\u043C\u0430\u043D\u0434\u0430 \u0441\u043E\u0437\u0434\u0430\u0442\u0435\u043B\u0435\u0439",
    style: {
      width: "100%",
      marginTop: 6,
      fontSize: 22,
      fontWeight: 700,
      color: "var(--text)",
      border: 0,
      outline: 0,
      background: "transparent",
      padding: 0,
      letterSpacing: "-0.4px"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 14,
      flexWrap: "wrap",
      position: "relative"
    }
  }, emblemChoices.map(e => /*#__PURE__*/React.createElement("button", {
    key: e,
    onClick: () => setEmblem(e),
    className: "tap",
    style: {
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: emblem === e ? "#0a0a0a" : "rgba(255,255,255,0.7)",
      border: 0,
      fontSize: 18,
      display: "grid",
      placeItems: "center",
      boxShadow: emblem === e ? "none" : "inset 0 0 0 1px rgba(0,0,0,0.06)"
    }
  }, e))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 12,
      flexWrap: "wrap",
      position: "relative"
    }
  }, accentSwatches.map(c => /*#__PURE__*/React.createElement("button", {
    key: c,
    onClick: () => setAccent(c),
    className: "tap",
    style: {
      width: 28,
      height: 28,
      borderRadius: "50%",
      background: c,
      border: 0,
      padding: 0,
      boxShadow: accent === c ? "0 0 0 2px #0a0a0a, 0 0 0 4px #fff" : "inset 0 0 0 1px rgba(0,0,0,0.08)"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u041E\u0431\u0449\u0430\u044F \u0446\u0435\u043B\u044C"), /*#__PURE__*/React.createElement("div", {
    "data-tour": "team-modes",
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 8
    }
  }, goalTypes.map(gt => {
    var active = goalType === gt.id;
    return /*#__PURE__*/React.createElement("button", {
      key: gt.id,
      onClick: () => setGoalType(gt.id),
      className: "tap",
      style: {
        background: "var(--card)",
        border: active ? "2px solid #0a0a0a" : "1px solid rgba(0,0,0,0.05)",
        borderRadius: 18,
        padding: 14,
        display: "flex",
        alignItems: "center",
        gap: 12,
        textAlign: "left",
        boxShadow: "var(--card-shadow)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 38,
        height: 38,
        borderRadius: "50%",
        background: active ? "#0a0a0a" : "#e8e8e8",
        color: active ? "#fff" : "var(--text)",
        display: "grid",
        placeItems: "center",
        fontSize: 18,
        flexShrink: 0
      }
    }, gt.e), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 600,
        color: "var(--text)"
      }
    }, gt.t), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--text-4)",
        marginTop: 2,
        lineHeight: 1.45
      }
    }, gt.d)), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: active ? "#0a0a0a" : "transparent",
        border: active ? "0" : "1.5px solid var(--text-5)",
        flexShrink: 0,
        display: "grid",
        placeItems: "center"
      }
    }, active && /*#__PURE__*/React.createElement(I.Check, {
      size: 11,
      color: "#fff",
      strokeWidth: 3
    })));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 18,
      padding: 16,
      marginTop: 10,
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600
    }
  }, "\u0427\u0435\u0433\u043E \u0442\u044B \u0445\u043E\u0447\u0435\u0448\u044C"), /*#__PURE__*/React.createElement("input", {
    value: goalTitle,
    onChange: e => setGoalTitle(e.target.value),
    placeholder: "50 \u0434\u043E\u0431\u0440\u044B\u0445 \u0434\u0435\u043B",
    style: {
      width: "100%",
      fontSize: 19,
      fontWeight: 600,
      color: "var(--text)",
      border: 0,
      outline: 0,
      padding: "8px 0 12px",
      background: "transparent",
      borderBottom: "1px solid var(--line)"
    }
  }), goalType !== "streak" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600
    }
  }, "\u0426\u0435\u043B\u044C"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    inputMode: "numeric",
    pattern: "[0-9]*",
    value: target,
    onChange: e => setTarget(parseInt(e.target.value.replace(/\D/g, "")) || 0),
    style: {
      width: "100%",
      fontSize: 28,
      fontWeight: 700,
      color: "var(--text)",
      border: 0,
      outline: 0,
      background: "transparent",
      padding: 0,
      marginTop: 2
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600
    }
  }, "\u0415\u0434\u0438\u043D\u0438\u0446\u0430"), /*#__PURE__*/React.createElement("input", {
    value: unit,
    onChange: e => setUnit(e.target.value),
    placeholder: "\u0434\u0435\u043B",
    style: {
      width: "100%",
      fontSize: 18,
      color: "var(--text-3)",
      border: 0,
      outline: 0,
      background: "transparent",
      padding: "4px 0"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 18,
      padding: 16,
      marginTop: 10,
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--text-2)",
      fontWeight: 500,
      lineHeight: 1.4
    }
  }, "\u0414\u0432\u0438\u0433\u0430\u0442\u044C \u0446\u0435\u043B\u044C \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0430\u043C\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 2,
      lineHeight: 1.5
    }
  }, "\u041E\u0442\u043C\u0435\u0442\u043A\u0430 \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0430 \u043F\u043E \u044D\u0442\u0438\u043C \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0430\u043C = +1 \u043A \u0446\u0435\u043B\u0438. \u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438 \u0442\u0430\u043A\u0436\u0435 \u043C\u043E\u0433\u0443\u0442 \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u0442\u044C \u0441\u0432\u043E\u0451 \u0447\u0438\u0441\u043B\u043E \u0432\u0440\u0443\u0447\u043D\u0443\u044E.")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: linkedCount > 0 ? "#1e6b3a" : "var(--text-4)",
      background: linkedCount > 0 ? "#e5f5ea" : "#e8e8e8",
      padding: "3px 9px",
      borderRadius: 999,
      flexShrink: 0
    }
  }, linkedCount, " \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D\u043E")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 14,
      flexWrap: "wrap"
    }
  }, HABIT_LIB.map(h => {
    var on = linkedHabits[h.e];
    return /*#__PURE__*/React.createElement("button", {
      key: h.e,
      onClick: () => toggleHabit(h.e),
      className: "tap",
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 11px 5px 5px",
        borderRadius: 999,
        background: on ? "#0a0a0a" : "#e8e8e8",
        color: on ? "#fff" : "var(--text-3)",
        border: 0,
        fontSize: 12,
        fontWeight: 500
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: "var(--card)",
        display: "grid",
        placeItems: "center",
        fontSize: 13
      }
    }, h.e), h.t, on && /*#__PURE__*/React.createElement(I.Check, {
      size: 12,
      strokeWidth: 3
    }));
  }), /*#__PURE__*/React.createElement("button", {
    className: "tap",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 11px",
      borderRadius: 999,
      background: "transparent",
      border: "1px dashed rgba(0,0,0,0.18)",
      color: "var(--text-3)",
      fontSize: 12,
      fontWeight: 500
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 12
  }), " \u041D\u043E\u0432\u0430\u044F \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0430"))), goalType === "collective" && /*#__PURE__*/React.createElement(SplitEditor, {
    target: target,
    unit: unit,
    members: members,
    setMembers: setMembers,
    splitMode: splitMode,
    setSplitMode: setSplitMode
  }), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0414\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C"), /*#__PURE__*/React.createElement(DurationPicker, {
    value: duration,
    onChange: setDuration
  }), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0412\u0438\u0434\u0438\u043C\u043E\u0441\u0442\u044C"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Segmented, {
    value: vis,
    onChange: setVis,
    options: [{
      value: "private",
      label: "Приватная"
    }, {
      value: "public",
      label: "Публичная"
    }]
  })), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0421\u0442\u0430\u0432\u043A\u0430 \u0432 \u0438\u0433\u0440\u0435"), /*#__PURE__*/React.createElement("div", {
    "data-tour": "team-stakes",
    style: {
      background: "var(--card)",
      borderRadius: 18,
      padding: 16,
      marginTop: 8,
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--text-2)",
      fontWeight: 500
    }
  }, "\u0412\u0441\u0435 \u0441\u0442\u0430\u0432\u044F\u0442 XP"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 2,
      lineHeight: 1.5
    }
  }, "\u0414\u043E\u0439\u0434\u0451\u0442\u0435 \u0434\u043E \u0446\u0435\u043B\u0438 \u2014 \u0431\u0430\u043D\u043A \u0432\u0435\u0440\u043D\u0451\u0442\u0441\u044F \u0432\u0434\u0432\u043E\u0435 \u0431\u043E\u043B\u044C\u0448\u0435. \u041D\u0435 \u0434\u043E\u0439\u0434\u0451\u0442\u0435 \u2014 \u0441\u0442\u0430\u0432\u043A\u0438 \u0441\u0433\u043E\u0440\u0430\u044E\u0442. \u041D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E, \u043D\u043E \u0430\u0437\u0430\u0440\u0442\u043D\u043E.")), /*#__PURE__*/React.createElement(Switch, {
    on: stakes,
    onChange: setStakes
  })), stakes && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      paddingTop: 14,
      borderTop: "1px solid var(--line)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600
    }
  }, "\u0421\u0442\u0430\u0432\u043A\u0430 \u043D\u0430 \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      marginTop: 6,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    inputMode: "numeric",
    pattern: "[0-9]*",
    value: stakeAmount,
    onChange: e => setStakeAmount(parseInt(e.target.value.replace(/\D/g, "")) || 0),
    style: {
      flex: "0 0 80px",
      fontSize: 22,
      fontWeight: 700,
      color: "var(--text)",
      border: 0,
      outline: 0,
      background: "transparent",
      padding: 0,
      minWidth: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-4)"
    }
  }, "XP \u043A\u0430\u0436\u0434\u044B\u0439")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
      fontSize: 12,
      color: "var(--text-4)"
    }
  }, /*#__PURE__*/React.createElement("span", null, activeMembers.length, " ", activeMembers.length === 1 ? "участник" : "участников"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      color: "var(--text)"
    }
  }, "\u0431\u0430\u043D\u043A ", stakeAmount * activeMembers.length, " XP")))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u041F\u0440\u0438\u0433\u043B\u0430\u0441\u0438\u0442\u044C \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 18,
      padding: 16,
      marginTop: 8,
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginBottom: 12,
      lineHeight: 1.45
    }
  }, "\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438 \u0432\u0438\u0434\u044F\u0442 \u043E\u0442\u043C\u0435\u0442\u043A\u0438, \u0438\u0442\u043E\u0433\u0438 \u0438 \u0440\u0430\u0441\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u0435. \u041E\u043D\u0438 \u043C\u043E\u0433\u0443\u0442 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0430\u0442\u044C \u0438\u043B\u0438 \u043F\u043E\u0434\u0442\u043E\u043B\u043A\u043D\u0443\u0442\u044C."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, members.map((p, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => !p.you && toggleMember(i),
    className: "tap",
    disabled: p.you,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 11px 5px 5px",
      borderRadius: 999,
      background: p.on ? "#0a0a0a" : "#e8e8e8",
      color: p.on ? "#fff" : "var(--text-3)",
      border: 0,
      fontSize: 12,
      fontWeight: 500,
      opacity: p.you ? 0.85 : 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 22,
      height: 22,
      borderRadius: "50%",
      background: p.color,
      display: "grid",
      placeItems: "center",
      fontSize: 11,
      fontWeight: 700,
      color: "rgba(0,0,0,0.55)"
    }
  }, p.initials), p.name, p.on && /*#__PURE__*/React.createElement(I.Check, {
    size: 12,
    strokeWidth: 3
  }))), /*#__PURE__*/React.createElement("button", {
    className: "tap",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 11px",
      borderRadius: 999,
      background: "transparent",
      border: "1px dashed rgba(0,0,0,0.18)",
      color: "var(--text-3)",
      fontSize: 12,
      fontWeight: 500
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 12
  }), " \u041F\u0440\u0438\u0433\u043B\u0430\u0441\u0438\u0442\u044C"))), /*#__PURE__*/React.createElement("button", {
    className: "bos-btn",
    style: {
      marginTop: 20
    },
    onClick: () => {
      var dur = {
        week: "Эта неделя",
        month: "Этот месяц",
        quarter: "3 месяца",
        year: "Год"
      }[duration] || "Этот месяц";
      app?.addTeam({
        name: name.trim() || "Новая команда",
        emblem,
        accent,
        vis,
        // private / public — preserved from the toggle above
        goal: goalTitle || target + " " + unit,
        target: Number(target) || 0,
        current: 0,
        unit,
        date: dur,
        progress: 0,
        members: activeMembers.map(m => ({
          name: m.name,
          initials: m.initials,
          color: m.color,
          pct: 0
        }))
      });
      navigate("community");
    }
  }, "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u0443"));
}

/* Colored progress ring for a calendar day — like History's DayRing but any colour
   (per-member tint), so a member's month reads in their own colour. */
function TeamRing({
  pct,
  color = "#FFC400",
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
    stroke: color,
    strokeWidth: sw,
    strokeLinecap: "round",
    strokeDasharray: C,
    strokeDashoffset: C * (1 - pct),
    style: glow ? {
      filter: `drop-shadow(0 0 1.5px ${color}bf)`
    } : undefined
  }));
}

/* PEOPLE MONTH CALENDAR — ONE shared full-month calendar (paged, like History), used
   by BOTH a team and an individual habit so the whole app reads the same way. Pass
   people [{name,initials,color,you?}] and dayFrac(personIdx, day, month)→0..1. With
   >1 person it shows a "Все" density view + a per-person selector; 1 person = just
   that month. Selection can be controlled (selPerson/onSelPerson) to sync with a
   leaderboard, else internal. `granular` shows %-completion in the read-out (teams). */
function PeopleMonthCalendar({
  people = [],
  dayFrac,
  label = "Календарь",
  granular = false,
  selPerson: selProp,
  onSelPerson
}) {
  var app = typeof useApp === "function" ? useApp() : null;
  var isDark = app?.themeOverride === "dark";
  var MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  var DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var CUR_M = 3,
    today = 28,
    year = 2026;
  var solo = people.length <= 1;
  var [mIdx, setMIdx] = useCS(CUR_M);
  var [selInner, setSelInner] = useCS(solo ? 0 : null);
  var selPerson = selProp !== undefined ? selProp : selInner;
  var setSelPerson = v => {
    if (onSelPerson) onSelPerson(v);else setSelInner(v);
  };
  var [selDay, setSelDay] = useCS(today);
  var daysInMonth = DIM[mIdx];
  var startWeekday = (mIdx * 3 + 3) % 7;
  var isCurMonth = mIdx === CUR_M;
  var lastLogged = isCurMonth ? today : mIdx > CUR_M ? 0 : daysInMonth;
  var future = d => mIdx > CUR_M || d > lastLogged;
  var pf = (pi, d) => future(d) ? null : dayFrac(pi, d, mIdx);
  var allFrac = d => {
    if (future(d)) return null;
    var v = people.map((_, i) => pf(i, d));
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  };
  var dayPct = d => selPerson == null ? allFrac(d) : pf(selPerson, d);
  var track = isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.09)";
  var selColor = selPerson == null ? "#FFC400" : people[selPerson]?.color || "#FFC400";
  var todayBg = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.07)"; // soft grey — not a hard black fill
  var selRing = isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.28)";
  var chipBg = isDark ? "rgba(255,255,255,0.07)" : "var(--surface-3)";
  var chip = active => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 11px 5px 6px",
    borderRadius: 999,
    background: active ? isDark ? "#fff" : "#0a0a0a" : chipBg,
    color: active ? isDark ? "#0a0a0a" : "#fff" : "var(--text-2)",
    border: 0,
    flexShrink: 0,
    fontSize: 13,
    fontWeight: active ? 700 : 500,
    whiteSpace: "nowrap",
    cursor: "pointer"
  });
  var weekday = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  var cells = [...Array.from({
    length: startWeekday
  }, (_, i) => ({
    blank: true,
    key: "b" + i
  })), ...Array.from({
    length: daysInMonth
  }, (_, i) => ({
    d: i + 1,
    key: "d" + (i + 1)
  }))];
  var selActive = future(selDay) ? null : people.filter((_, i) => (pf(i, selDay) ?? 0) >= 0.5).length;
  var selAvg = future(selDay) ? null : Math.round((allFrac(selDay) || 0) * 100);
  var selName = selPerson != null && people[selPerson] ? people[selPerson].name : null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, label && /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 22,
      padding: 16,
      marginTop: label ? 8 : 0,
      boxShadow: "var(--card-shadow)"
    }
  }, !solo && /*#__PURE__*/React.createElement("div", {
    className: "screen-scroll",
    style: {
      display: "flex",
      gap: 7,
      overflowX: "auto",
      paddingBottom: 2,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSelPerson(null),
    className: "tap",
    style: chip(selPerson == null)
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 18,
      height: 18,
      borderRadius: "50%",
      background: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.1)",
      display: "grid",
      placeItems: "center",
      fontSize: 10
    }
  }, "\uD83D\uDC65"), "\u0412\u0441\u0435"), people.map((m, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => setSelPerson(i),
    className: "tap",
    style: chip(selPerson === i)
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 18,
      height: 18,
      borderRadius: "50%",
      background: m.color,
      display: "grid",
      placeItems: "center",
      fontSize: 9,
      fontWeight: 700,
      color: "rgba(0,0,0,0.6)"
    }
  }, m.initials), m.you ? "Ты" : (m.name || "").split(" ")[0]))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setMIdx(m => Math.max(0, m - 1)),
    className: "tap",
    style: {
      background: chipBg,
      border: 0,
      borderRadius: 999,
      width: 32,
      height: 32,
      display: "grid",
      placeItems: "center",
      color: "inherit",
      opacity: mIdx === 0 ? 0.35 : 1
    }
  }, /*#__PURE__*/React.createElement(I.ChevronLeft, {
    size: 16
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      letterSpacing: "-0.3px"
    }
  }, MONTHS[mIdx], " ", year), /*#__PURE__*/React.createElement("button", {
    onClick: () => setMIdx(m => Math.min(11, m + 1)),
    className: "tap",
    style: {
      background: chipBg,
      border: 0,
      borderRadius: 999,
      width: 32,
      height: 32,
      display: "grid",
      placeItems: "center",
      color: "inherit",
      opacity: mIdx === 11 ? 0.35 : 1
    }
  }, /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7,1fr)",
      gap: 4,
      marginTop: 14
    }
  }, weekday.map((w, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      textAlign: "center",
      fontSize: 10.5,
      fontWeight: 600,
      letterSpacing: 0.6,
      color: "var(--text-4)"
    }
  }, w))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7,1fr)",
      gap: 4,
      marginTop: 6
    }
  }, cells.map(c => {
    if (c.blank) return /*#__PURE__*/React.createElement("span", {
      key: c.key,
      "aria-hidden": true,
      style: {
        aspectRatio: "1/1"
      }
    });
    var pct = dayPct(c.d);
    var fut = pct == null;
    var isToday = isCurMonth && c.d === today;
    var isSel = selDay === c.d;
    return /*#__PURE__*/React.createElement("button", {
      key: c.key,
      onClick: () => setSelDay(c.d),
      className: "tap",
      style: {
        aspectRatio: "1/1",
        border: 0,
        borderRadius: "50%",
        padding: 0,
        display: "grid",
        placeItems: "center",
        position: "relative",
        fontSize: 13,
        fontWeight: isToday ? 700 : 500,
        cursor: "pointer",
        background: "transparent",
        color: fut ? "var(--text-4)" : isDark ? "#fff" : "var(--text)"
      }
    }, isToday && /*#__PURE__*/React.createElement("span", {
      "aria-hidden": true,
      style: {
        position: "absolute",
        width: "62%",
        aspectRatio: "1/1",
        borderRadius: "50%",
        background: todayBg
      }
    }), isSel && !isToday && /*#__PURE__*/React.createElement("span", {
      "aria-hidden": true,
      style: {
        position: "absolute",
        width: "66%",
        aspectRatio: "1/1",
        borderRadius: "50%",
        border: "1.5px solid " + selRing
      }
    }), fut ? /*#__PURE__*/React.createElement("span", {
      "aria-hidden": true,
      style: {
        position: "absolute",
        inset: "17%",
        borderRadius: "50%",
        border: "1px dashed " + (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)")
      }
    }) : /*#__PURE__*/React.createElement(TeamRing, {
      pct: pct,
      color: selColor,
      track: track,
      glow: pct === 1
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        position: "relative",
        zIndex: 1
      }
    }, c.d));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      paddingTop: 13,
      borderTop: "1px solid var(--line)",
      fontSize: 12.5,
      color: "var(--text-3)",
      lineHeight: 1.45
    }
  }, future(selDay) ? `${MONTHS[mIdx]} ${selDay} — ещё впереди` : solo ? /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text)"
    }
  }, MONTHS[mIdx], " ", selDay), " \xB7 ", (dayPct(selDay) || 0) > 0 ? "выполнено ✓" : "пропущено") : selPerson == null ? /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text)"
    }
  }, MONTHS[mIdx], " ", selDay), " \xB7 \u043E\u0442\u043C\u0435\u0442\u0438\u043B\u043E\u0441\u044C ", selActive, " \u0438\u0437 ", people.length, granular && selAvg != null ? ` · ${selAvg}%` : "") : /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text)"
    }
  }, selName), " \xB7 ", MONTHS[mIdx], " ", selDay, " \xB7 ", granular ? `${Math.round((dayPct(selDay) || 0) * 100)}% привычек` : (dayPct(selDay) || 0) > 0 ? "отмечался ✓" : "пропустил"))));
}

/* Share a team — invite link + native share. For a PRIVATE team this is the ONLY
   way someone else gets in (it's invisible otherwise); for a PUBLIC team the link
   just jumps straight to it. Join-by-link wires to the cloud at T1; the
   share/copy itself works now. */
function TeamShareSheet({
  team
}) {
  var [copied, setCopied] = React.useState(false);
  var isPublic = team?.vis === "public";
  var link = "https://mind3scape.github.io/balanceos/?join=" + (team?._id || "");
  var copyLink = () => {
    try {
      navigator.clipboard.writeText(link);
    } catch (e) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
  };
  var shareLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: team?.name || "Команда",
          text: "Присоединяйся к команде «" + (team?.name || "") + "» в BalanceOS",
          url: link
        });
        return;
      }
    } catch (e) {
      return;
    }
    copyLink();
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 20px 0",
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: 18,
      margin: "0 auto 12px",
      background: team?.accent || "#fef3c7",
      display: "grid",
      placeItems: "center",
      fontSize: 34
    }
  }, team?.emblem || "✨"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: "-0.3px"
    }
  }, "\u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u043E\u0439"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-3)",
      marginTop: 4,
      maxWidth: 290,
      marginInline: "auto",
      lineHeight: 1.45
    }
  }, isPublic ? "Команда открытая — её и так видят все. Ссылка ведёт прямо в неё." : "Команда приватная — её увидят только те, кому ты дашь эту ссылку.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: "var(--surface-3)",
      borderRadius: 14,
      padding: "11px 8px 11px 14px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 13,
      color: "var(--text-2)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, link), /*#__PURE__*/React.createElement("button", {
    onClick: copyLink,
    className: "tap",
    style: {
      flexShrink: 0,
      border: 0,
      background: "var(--text)",
      color: "var(--card)",
      borderRadius: 999,
      padding: "8px 15px",
      fontSize: 12.5,
      fontWeight: 600
    }
  }, copied ? "Готово" : "Копировать")), /*#__PURE__*/React.createElement("button", {
    onClick: shareLink,
    className: "tap",
    style: {
      width: "100%",
      marginTop: 12,
      border: 0,
      borderRadius: 999,
      padding: 14,
      background: "var(--text)",
      color: "var(--card)",
      fontSize: 15,
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(I.Share, {
    size: 18
  }), " \u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: "max(8px, var(--tg-bottom-inset, 0px))"
    }
  }));
}
function TeamDetailScreen() {
  var {
    navigate,
    params
  } = useNav();
  var app = useApp();
  var {
    open: openSheet
  } = useSheet();
  var [expandedMember, setExpandedMember] = useCS(null);
  var passed = params?.team || {
    _id: "seed-1",
    name: "Команда создателей",
    emblem: "✨",
    accent: "#fef3c7",
    goal: "50 добрых дел за месяц",
    date: "1 — 31 дек",
    progress: 0.62,
    members: []
  };
  // Read the LIVE team from the store so a just-added habit appears immediately.
  var t = (app?.teams || []).find(x => x._id === passed._id) || passed;
  var accent = t.accent || "#fef3c7";
  var members = t.members?.length ? t.members : [{
    name: "Ник",
    initials: "Н",
    pct: 19,
    color: "#a8b9d4"
  }];
  var ranked = [...members].sort((a, b) => (b.pct || 0) - (a.pct || 0)); // leaderboard
  var DEFAULT_TEAM_HABITS = [{
    id: 1,
    emoji: "🙏",
    name: "Добрые дела",
    isMain: true,
    doneToday: 8,
    total: 9,
    weekPct: 0.78,
    week: [1, 1, 0, 1, 1, 1, 1]
  }, {
    id: 2,
    emoji: "🧘🏼‍♀️",
    name: "Групповая медитация",
    isMain: false,
    doneToday: 6,
    total: 9,
    weekPct: 0.65,
    week: [1, 0, 1, 1, 0, 1, 1]
  }, {
    id: 3,
    emoji: "📖",
    name: "Читаем вместе",
    isMain: false,
    doneToday: 4,
    total: 9,
    weekPct: 0.42,
    week: [0, 1, 0, 1, 0, 0, 1]
  }, {
    id: 4,
    emoji: "🥗",
    name: "Здоровое питание",
    isMain: false,
    doneToday: 7,
    total: 9,
    weekPct: 0.81,
    week: [1, 1, 1, 1, 0, 1, 1]
  }];
  var teamHabits = Array.isArray(t.habits) ? t.habits : DEFAULT_TEAM_HABITS;
  var main = teamHabits.find(h => h.isMain);
  var others = teamHabits.filter(h => !h.isMain);
  var aggregate = teamHabits.length ? Math.round(teamHabits.reduce((s, h) => s + (h.weekPct || 0), 0) / teamHabits.length * 100) : 0;
  var openAddHabit = () => openSheet(/*#__PURE__*/React.createElement(TeamHabitSheet, {
    team: t,
    members: members,
    onAdd: h => app?.addTeamHabit(t._id, h)
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u041A\u043E\u043C\u0430\u043D\u0434\u0430",
    onBack: () => navigate("community"),
    right: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => openSheet(/*#__PURE__*/React.createElement(TeamShareSheet, {
        team: t
      })),
      className: "tap",
      title: "\u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u043E\u0439",
      style: {
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "var(--surface-3)",
        border: 0,
        display: "grid",
        placeItems: "center"
      }
    }, /*#__PURE__*/React.createElement(I.Share, {
      size: 18
    })), /*#__PURE__*/React.createElement("button", {
      onClick: () => navigate("team-settings", {
        team: t
      }),
      className: "tap",
      style: {
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "var(--surface-3)",
        border: 0,
        display: "grid",
        placeItems: "center"
      }
    }, /*#__PURE__*/React.createElement(I.Settings, {
      size: 18
    })))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: `linear-gradient(135deg, ${accent} 0%, ${accent}66 60%, var(--card-fade) 100%)`,
      color: "var(--text)",
      borderRadius: 22,
      padding: 20,
      position: "relative",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      top: -14,
      right: -10,
      fontSize: 150,
      lineHeight: 1,
      opacity: 0.28,
      pointerEvents: "none",
      filter: "saturate(0.9)",
      transform: "rotate(8deg)"
    }
  }, t.emblem || "✨"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: "-0.5px",
      color: "var(--text)"
    }
  }, t.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--text-2)",
      marginTop: 6,
      fontWeight: 500
    }
  }, "\uD83C\uDFAF ", t.goal), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      marginTop: 2
    }
  }, t.date), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      marginTop: 9,
      fontSize: 11.5,
      fontWeight: 600,
      color: "var(--text-2)",
      background: "rgba(255,255,255,0.5)",
      padding: "4px 10px",
      borderRadius: 999
    }
  }, t.vis === "public" ? "🌐 Открытая · видна всем" : "🔒 Приватная · по приглашению"), (() => {
    var tgt = t.target || 0;
    var cur = t.current != null ? t.current : Math.round((t.progress || 0) * tgt);
    var done = tgt > 0 && cur >= tgt;
    var gp = tgt > 0 ? Math.min(1, cur / tgt) : t.progress || 0;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "var(--text-3)",
        textTransform: "uppercase",
        letterSpacing: 1,
        fontWeight: 600
      }
    }, done ? "Цель достигнута 🎉" : "До цели вместе"), tgt > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15,
        fontWeight: 700,
        color: "var(--text)"
      }
    }, cur, " / ", tgt, " ", t.unit || "")), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 9,
        background: "rgba(255,255,255,0.55)",
        borderRadius: 999,
        overflow: "hidden",
        marginTop: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        height: "100%",
        width: gp * 100 + "%",
        background: done ? "linear-gradient(90deg,#FEDE34,#EF9F14)" : "var(--card-fill)",
        borderRadius: 999,
        transition: "width 0.6s ease"
      }
    })), tgt > 0 && !done && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "var(--text-3)",
        marginTop: 6
      }
    }, "\u041E\u0441\u0442\u0430\u043B\u043E\u0441\u044C ", tgt - cur, " ", t.unit || "", " \u2014 \u0437\u0430\u043A\u0440\u043E\u0435\u043C \u0432\u043C\u0435\u0441\u0442\u0435"));
  })(), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "var(--text-3)",
      letterSpacing: 1,
      textTransform: "uppercase",
      fontWeight: 600
    }
  }, "\u041F\u0440\u0438\u0432\u044B\u0447\u043A\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      marginTop: 2,
      color: "var(--text)"
    }
  }, teamHabits.length)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "var(--text-3)",
      letterSpacing: 1,
      textTransform: "uppercase",
      fontWeight: 600
    }
  }, "\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      marginTop: 2,
      color: "var(--text)"
    }
  }, members.length)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "var(--text-3)",
      letterSpacing: 1,
      textTransform: "uppercase",
      fontWeight: 600
    }
  }, "\u0421\u0435\u0440\u0438\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      marginTop: 2,
      color: "var(--text)"
    }
  }, "14\u0434 \uD83D\uDD25"))))), /*#__PURE__*/React.createElement("button", {
    "data-tour": "team-chat",
    onClick: () => navigate("team-chat", {
      team: t
    }),
    className: "tap",
    style: {
      width: "100%",
      marginTop: 12,
      background: "var(--card)",
      border: 0,
      borderRadius: 18,
      padding: 14,
      boxShadow: "var(--card-shadow)",
      display: "flex",
      alignItems: "center",
      gap: 13,
      textAlign: "left",
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 13,
      background: "var(--surface-3)",
      display: "grid",
      placeItems: "center",
      fontSize: 22,
      flexShrink: 0
    }
  }, "\uD83D\uDCAC"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 600
    }
  }, "\u0427\u0430\u0442 \u043A\u043E\u043C\u0430\u043D\u0434\u044B"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-4)",
      marginTop: 2,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, "\u0421\u0435\u0440\u0433\u0435\u0439: \u0426\u0435\u043B\u044C \u0434\u043E\u0431\u044C\u0451\u043C \u043A \u0432\u044B\u0445\u043E\u0434\u043D\u044B\u043C \u2014 \u043D\u0430\u043B\u0435\u0433\u0430\u0435\u043C! \uD83D\uDD25")), /*#__PURE__*/React.createElement("span", {
    style: {
      background: "#FF3B30",
      color: "#fff",
      fontSize: 11,
      fontWeight: 700,
      borderRadius: 999,
      minWidth: 20,
      height: 20,
      padding: "0 6px",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, "3"), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18,
    color: "var(--text-4)"
  })), main && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22,
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: "#FEDE34"
    }
  }), " \u0413\u043B\u0430\u0432\u043D\u0430\u044F \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0430"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "linear-gradient(135deg,#FEDE34,#EF9F14)",
      borderRadius: 22,
      padding: 18,
      marginTop: 8,
      color: "#0a0a0a",
      position: "relative",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 38
    }
  }, main.emoji), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 1.4,
      opacity: 0.6
    }
  }, "\u042F\u043A\u043E\u0440\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u044B"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 700,
      letterSpacing: "-0.4px",
      marginTop: 2
    }
  }, main.name))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, "\u0421\u0435\u0433\u043E\u0434\u043D\u044F"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13
    }
  }, main.doneToday, " \u0438\u0437 ", main.total, " \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432 \u2713")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      background: "rgba(0,0,0,0.12)",
      borderRadius: 999,
      overflow: "hidden",
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: main.doneToday / main.total * 100 + "%",
      background: "#0a0a0a"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      marginTop: 12,
      flexWrap: "wrap"
    }
  }, Array.from({
    length: main.total
  }).map((_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 22,
      height: 22,
      borderRadius: "50%",
      background: i < main.doneToday ? "#0a0a0a" : "rgba(0,0,0,0.15)",
      display: "grid",
      placeItems: "center",
      color: "#FEDE34",
      fontSize: 11,
      fontWeight: 700
    }
  }, i < main.doneToday ? "✓" : ""))))), /*#__PURE__*/React.createElement(PeopleMonthCalendar, {
    people: members.map(m => ({
      name: m.name,
      initials: m.initials,
      color: m.color
    })),
    dayFrac: (pi, d, mi) => {
      var lvl = (members[pi] && members[pi].pct != null ? members[pi].pct : 50) / 100;
      var n = Math.sin(d * 12.9898 + pi * 78.233 + mi * 37.719) * 43758.5453;
      var r = n - Math.floor(n);
      return Math.max(0, Math.min(1, Math.round((lvl * 0.5 + r * 0.55) * 5) / 5));
    },
    granular: true,
    label: "\u041A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u044B"
  }), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u041F\u0440\u0438\u0432\u044B\u0447\u043A\u0438 \u043A\u043E\u043C\u0430\u043D\u0434\u044B (", others.length, ")"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 8
    }
  }, teamHabits.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-4)",
      padding: "4px 2px 8px",
      lineHeight: 1.5
    }
  }, "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043E\u0431\u0449\u0438\u0445 \u043F\u0440\u0438\u0432\u044B\u0447\u0435\u043A. \u0414\u043E\u0431\u0430\u0432\u044C \u043F\u0435\u0440\u0432\u0443\u044E \u2014 \u043E\u043D\u0430 \u0441\u0442\u0430\u043D\u0435\u0442 \u044F\u043A\u043E\u0440\u0435\u043C \u043A\u043E\u043C\u0430\u043D\u0434\u044B."), others.map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: "var(--card)",
      borderRadius: 16,
      padding: 14,
      display: "flex",
      alignItems: "center",
      gap: 12,
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 12,
      background: "var(--surface-3)",
      display: "grid",
      placeItems: "center",
      fontSize: 22,
      flexShrink: 0
    }
  }, h.emoji), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 500,
      color: "var(--text)"
    }
  }, h.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginTop: 7
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      maxWidth: 110,
      height: 5,
      borderRadius: 999,
      background: "var(--surface-3)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: Math.round((h.weekPct || 0) * 100) + "%",
      background: "#0a0a0a",
      borderRadius: 999
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-4)"
    }
  }, Math.round((h.weekPct || 0) * 100), "% \u0437\u0430 \u043D\u0435\u0434\u0435\u043B\u044E"))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "var(--text)"
    }
  }, h.doneToday, "/", h.total), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1
    }
  }, "\u0441\u0435\u0433\u043E\u0434\u043D\u044F")))), /*#__PURE__*/React.createElement("button", {
    onClick: openAddHabit,
    className: "tap",
    style: {
      background: "transparent",
      border: "1px dashed rgba(0,0,0,0.18)",
      borderRadius: 16,
      padding: 14,
      color: "var(--text-3)",
      fontSize: 14,
      fontWeight: 500
    }
  }, "+ \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0443 \u043A\u043E\u043C\u0430\u043D\u0434\u044B")), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438 (", members.length, ") \xB7 \u043F\u043E \u0432\u043A\u043B\u0430\u0434\u0443"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 8
    }
  }, ranked.map((m, i) => {
    var isLeader = i === 0 && (m.pct || 0) > 0;
    var expanded = expandedMember === m.name;
    var todayDone = m.todayDone ?? 0;
    var todayTotal = m.todayTotal ?? teamHabits.length;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        background: "var(--card)",
        borderRadius: 16,
        boxShadow: "var(--card-shadow)",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setExpandedMember(expanded ? null : m.name),
      className: "tap",
      style: {
        width: "100%",
        background: "transparent",
        border: 0,
        padding: 12,
        display: "flex",
        alignItems: "center",
        gap: 12,
        textAlign: "left",
        color: "var(--text)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: "relative",
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: m.color,
        display: "grid",
        placeItems: "center",
        color: "#fff",
        fontWeight: 600,
        flexShrink: 0
      }
    }, m.initials, isLeader && /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        top: -7,
        right: -5,
        fontSize: 14
      }
    }, "\uD83D\uDC51")), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        display: "flex",
        alignItems: "center",
        gap: 7
      }
    }, m.name, isLeader && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        fontWeight: 700,
        color: "#9A7B0A",
        background: "#FEF3C7",
        padding: "2px 7px",
        borderRadius: 999,
        textTransform: "uppercase",
        letterSpacing: 0.4
      }
    }, "\u041B\u0438\u0434\u0435\u0440")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--text-4)",
        marginTop: 2,
        display: "flex",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD25 ", m.streak ?? 0), /*#__PURE__*/React.createElement("span", null, "\u0441\u0435\u0433\u043E\u0434\u043D\u044F ", todayDone, "/", todayTotal))), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 700,
        color: "var(--text-2)",
        flexShrink: 0
      }
    }, m.pct, "%"), /*#__PURE__*/React.createElement(I.ChevronRight, {
      size: 16,
      color: "var(--text-4)",
      style: {
        flexShrink: 0,
        transform: expanded ? "rotate(90deg)" : "none",
        transition: "transform 0.2s"
      }
    })), expanded && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "0 14px 14px 64px",
        display: "flex",
        flexWrap: "wrap",
        gap: 6
      }
    }, teamHabits.length === 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "var(--text-4)"
      }
    }, "\u041D\u0435\u0442 \u043E\u0431\u0449\u0438\u0445 \u043F\u0440\u0438\u0432\u044B\u0447\u0435\u043A."), teamHabits.map((h, hi) => {
      var did = hi < todayDone;
      return /*#__PURE__*/React.createElement("span", {
        key: hi,
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: 12,
          padding: "4px 9px",
          borderRadius: 999,
          background: did ? "#0a0a0a" : "var(--surface-3)",
          color: did ? "#fff" : "var(--text-4)"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 13
        }
      }, h.emoji), h.name, did && /*#__PURE__*/React.createElement(I.Check, {
        size: 11,
        strokeWidth: 3
      }));
    })));
  })), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0410\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u044C"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 18,
      padding: 16,
      marginTop: 8,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      boxShadow: "var(--card-shadow)"
    }
  }, [{
    who: "Ник",
    what: "завершил утреннюю пробежку",
    when: "2 ч",
    emoji: "🏃🏼"
  }, {
    who: "Светлана",
    what: "добавила новую привычку",
    when: "5 ч",
    emoji: "✨"
  }, {
    who: "Вадим",
    what: "достиг серии 7 дней",
    when: "1 д",
    emoji: "🔥"
  }].map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      fontSize: 14,
      color: "var(--text-2)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20
    }
  }, a.emoji), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("b", null, a.who), " ", a.what), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-4)"
    }
  }, a.when)))));
}

/* Team settings — full screen opened from the gear in Team detail. Edits are
   local until "Сохранить" → updateTeam; team detail re-reads the live team by _id. */
function TeamSettingsScreen() {
  var {
    navigate,
    params
  } = useNav();
  var app = useApp();
  var team = params?.team || {};
  var [name, setName] = useCS(team.name || "");
  var [emblem, setEmblem] = useCS(team.emblem || "✨");
  var [accent, setAccent] = useCS(team.accent || "#fef3c7");
  var [goal, setGoal] = useCS(team.goal || "");
  var [priv, setPriv] = useCS(team.vis !== "public");
  var [notify, setNotify] = useCS(team.notify !== false);
  var [members, setMembers] = useCS(team.members || []);
  var emblems = ["✨", "🌱", "🔥", "🌊", "🏔", "🚀", "🎯", "🧭"];
  var accents = ["#fef3c7", "#dbe9ff", "#d6f3df", "#e9dffd", "#fde2e2", "#ffe1c8", "#d4f0eb", "#e3e3e3"];
  var SUGGEST = [{
    name: "Аля",
    initials: "А",
    color: "#d4c8e8"
  }, {
    name: "Дима",
    initials: "Д",
    color: "#a8c0e8"
  }, {
    name: "Соня",
    initials: "С",
    color: "#e8b8d4"
  }];
  var removeMember = i => setMembers(ms => ms.filter((_, j) => j !== i));
  var invite = p => setMembers(ms => ms.some(m => m.name === p.name) ? ms : [...ms, {
    ...p,
    pct: 0
  }]);
  var save = () => {
    app?.updateTeam(team._id, {
      name: name.trim() || team.name,
      emblem,
      accent,
      goal: goal.trim() || team.goal,
      vis: priv ? "private" : "public",
      notify,
      members
    });
    navigate("team-detail", {
      team
    });
  };
  var del = () => {
    navigate("community");
    app?.removeTeam(team._id);
  };
  var card = {
    background: "#fff",
    borderRadius: 18,
    marginTop: 8,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043A\u043E\u043C\u0430\u043D\u0434\u044B",
    onBack: () => navigate("team-detail", {
      team
    })
  }), /*#__PURE__*/React.createElement("div", {
    className: "section-label"
  }, "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435"), /*#__PURE__*/React.createElement("input", {
    className: "bos-input",
    value: name,
    onChange: e => setName(e.target.value),
    style: {
      marginTop: 8
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u042D\u043C\u0431\u043B\u0435\u043C\u0430"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      overflowX: "auto",
      margin: "8px -16px 0",
      padding: "0 16px 4px",
      scrollbarWidth: "none"
    }
  }, emblems.map(e => /*#__PURE__*/React.createElement("button", {
    key: e,
    onClick: () => setEmblem(e),
    className: "tap",
    "data-no-haptic": true,
    style: {
      flexShrink: 0,
      width: 46,
      height: 46,
      borderRadius: 14,
      fontSize: 22,
      lineHeight: 1,
      background: e === emblem ? "#0a0a0a" : "#f1f1f3",
      border: 0
    }
  }, e))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0426\u0432\u0435\u0442"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginTop: 8,
      flexWrap: "wrap"
    }
  }, accents.map(c => /*#__PURE__*/React.createElement("button", {
    key: c,
    onClick: () => setAccent(c),
    className: "tap",
    style: {
      width: 40,
      height: 40,
      borderRadius: "50%",
      background: c,
      border: c === accent ? "3px solid #0a0a0a" : "3px solid transparent"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0426\u0435\u043B\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u044B"), /*#__PURE__*/React.createElement("input", {
    className: "bos-input",
    value: goal,
    onChange: e => setGoal(e.target.value),
    placeholder: "\u043D\u0430\u043F\u0440. 50 \u0434\u043E\u0431\u0440\u044B\u0445 \u0434\u0435\u043B",
    style: {
      marginTop: 8
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      ...card,
      padding: "2px 16px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "13px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      color: "var(--text-2)"
    }
  }, "\u041F\u0440\u0438\u0432\u0430\u0442\u043D\u0430\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u0430"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 1
    }
  }, "\u0422\u043E\u043B\u044C\u043A\u043E \u043F\u043E \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u044E")), /*#__PURE__*/React.createElement(Switch, {
    on: priv,
    onChange: setPriv
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--line)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "13px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      color: "var(--text-2)"
    }
  }, "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 1
    }
  }, "\u041A\u043E\u0433\u0434\u0430 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438 \u043E\u0442\u043C\u0435\u0447\u0430\u044E\u0442\u0441\u044F")), /*#__PURE__*/React.createElement(Switch, {
    on: notify,
    onChange: setNotify
  }))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438 (", members.length, ")"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...card,
      padding: "8px 16px"
    }
  }, members.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "8px 0"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: m.color,
      display: "grid",
      placeItems: "center",
      color: "#fff",
      fontWeight: 600,
      fontSize: 13
    }
  }, m.initials), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 15,
      color: "var(--text-2)"
    }
  }, m.name), /*#__PURE__*/React.createElement("button", {
    onClick: () => removeMember(i),
    className: "tap",
    "aria-label": "\u0423\u0431\u0440\u0430\u0442\u044C",
    style: {
      width: 28,
      height: 28,
      borderRadius: "50%",
      background: "var(--surface-3)",
      border: 0,
      color: "var(--text-3)",
      fontSize: 17,
      lineHeight: 1
    }
  }, "\xD7"))), members.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-4)",
      padding: "6px 0"
    }
  }, "\u041F\u043E\u043A\u0430 \u043D\u0438\u043A\u043E\u0433\u043E. \u041F\u0440\u0438\u0433\u043B\u0430\u0441\u0438 \u0434\u0440\u0443\u0437\u0435\u0439 \u043D\u0438\u0436\u0435.")), SUGGEST.filter(p => !members.some(m => m.name === p.name)).length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 10,
      flexWrap: "wrap"
    }
  }, SUGGEST.filter(p => !members.some(m => m.name === p.name)).map((p, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => invite(p),
    className: "tap",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 11px 5px 5px",
      borderRadius: 999,
      background: "#fff",
      border: "1px dashed rgba(0,0,0,0.18)",
      color: "var(--text-3)",
      fontSize: 12,
      fontWeight: 500
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 22,
      height: 22,
      borderRadius: "50%",
      background: p.color,
      display: "grid",
      placeItems: "center",
      fontSize: 11,
      fontWeight: 700,
      color: "rgba(0,0,0,0.55)"
    }
  }, p.initials), p.name, " ", /*#__PURE__*/React.createElement(I.Plus, {
    size: 12
  })))), /*#__PURE__*/React.createElement("button", {
    className: "bos-btn",
    style: {
      marginTop: 20
    },
    onClick: save
  }, "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C"), /*#__PURE__*/React.createElement("button", {
    onClick: del,
    className: "tap",
    style: {
      width: "100%",
      background: "transparent",
      border: 0,
      color: "var(--accent-red)",
      padding: 14,
      marginTop: 6,
      fontSize: 15
    }
  }, "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u0443"));
}

/* Bottom sheet — create a shared team habit (opened from Team detail). Team
   detail is always light, so colors are explicit (sheets render outside the
   themed page scope, same pattern as ShareAppSheet). */
function TeamHabitSheet({
  team,
  members = [],
  onAdd
}) {
  var {
    close
  } = useSheet();
  var C = {
    text: "#0a0a0a",
    sub: "rgba(0,0,0,0.5)",
    tile: "#f1f1f3",
    line: "rgba(0,0,0,0.07)"
  };
  var EMO = ["🙏", "🧘🏼‍♀️", "📖", "🥗", "🏃🏼‍♀️", "💧", "🧊", "☀️", "💬", "✍🏼", "🎯", "🔥"];
  var [emoji, setEmoji] = useCS("🙏");
  var [name, setName] = useCS("");
  var [movesGoal, setMovesGoal] = useCS(true);
  var [isMain, setIsMain] = useCS(false);
  var [picked, setPicked] = useCS(() => members.map((_, i) => i)); // default: everyone
  var toggleMember = i => setPicked(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);
  var participants = members.filter((_, i) => picked.includes(i)).map(m => ({
    name: m.name,
    initials: m.initials,
    color: m.color
  }));
  var save = () => {
    onAdd && onAdd({
      emoji,
      name: name.trim() || "Новая привычка",
      isMain,
      movesGoal,
      participants,
      total: Math.max(1, participants.length || members.length || 1)
    });
    close();
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 20px 6px",
      color: C.text
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: "-0.3px"
    }
  }, "\u041D\u043E\u0432\u0430\u044F \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0430 \u043A\u043E\u043C\u0430\u043D\u0434\u044B"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: C.sub,
      marginTop: 3
    }
  }, "\u041E\u0431\u0449\u0430\u044F \u0434\u043B\u044F \u0432\u0441\u0435\u0445 \u0432 \xAB", team?.name || "команде", "\xBB")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      overflowX: "auto",
      margin: "16px -20px 0",
      padding: "0 20px 4px",
      scrollbarWidth: "none"
    }
  }, EMO.map(e => /*#__PURE__*/React.createElement("button", {
    key: e,
    onClick: () => setEmoji(e),
    className: "tap",
    "data-no-haptic": true,
    style: {
      flexShrink: 0,
      width: 46,
      height: 46,
      borderRadius: 14,
      fontSize: 22,
      lineHeight: 1,
      background: e === emoji ? "#0a0a0a" : C.tile,
      border: 0
    }
  }, e))), /*#__PURE__*/React.createElement("input", {
    className: "bos-input",
    value: name,
    onChange: e => setName(e.target.value),
    placeholder: "\u043D\u0430\u043F\u0440. \u0425\u043E\u043B\u043E\u0434\u043D\u044B\u0439 \u0434\u0443\u0448",
    style: {
      marginTop: 14
    }
  }), members.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: C.sub,
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600,
      margin: "18px 0 8px"
    }
  }, "\u0423\u0447\u0430\u0441\u0442\u0432\u0443\u044E\u0442"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, members.map((m, i) => {
    var on = picked.includes(i);
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      onClick: () => toggleMember(i),
      className: "tap",
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 11px 5px 5px",
        borderRadius: 999,
        background: on ? "#0a0a0a" : C.tile,
        color: on ? "#fff" : C.sub,
        border: 0,
        fontSize: 12,
        fontWeight: 500
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: m.color,
        display: "grid",
        placeItems: "center",
        fontSize: 11,
        fontWeight: 700,
        color: "rgba(0,0,0,0.55)"
      }
    }, m.initials), m.name, on && /*#__PURE__*/React.createElement(I.Check, {
      size: 12,
      strokeWidth: 3
    }));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: C.tile,
      borderRadius: 16,
      padding: "2px 14px",
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "11px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5
    }
  }, "\u0414\u0432\u0438\u0433\u0430\u0435\u0442 \u0446\u0435\u043B\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u044B"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.sub,
      marginTop: 1
    }
  }, "\u041E\u0442\u043C\u0435\u0442\u043A\u0430 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0430 = +1 \u043A \u043E\u0431\u0449\u0435\u0439 \u0446\u0435\u043B\u0438")), /*#__PURE__*/React.createElement(Switch, {
    on: movesGoal,
    onChange: setMovesGoal
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: C.line
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "11px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5
    }
  }, "\u0421\u0434\u0435\u043B\u0430\u0442\u044C \u0433\u043B\u0430\u0432\u043D\u043E\u0439"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.sub,
      marginTop: 1
    }
  }, "\u0421\u0442\u0430\u043D\u0435\u0442 \xAB\u044F\u043A\u043E\u0440\u0435\u043C\xBB \u043A\u043E\u043C\u0430\u043D\u0434\u044B")), /*#__PURE__*/React.createElement(Switch, {
    on: isMain,
    onChange: setIsMain
  }))), /*#__PURE__*/React.createElement("button", {
    className: "bos-btn",
    style: {
      marginTop: 20,
      marginBottom: 2
    },
    onClick: save
  }, "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0443"));
}

/* LEVELS / CREDITS — gamification (theme-aware) */
function LevelsScreen() {
  var {
    navigate
  } = useNav();
  var {
    open: openSheet
  } = useSheet();
  var app = useApp ? useApp() : null;
  var isDark = app?.themeOverride === "dark";
  var invited = app?.mode === "demo" ? 2 : 0; // people you've drawn into the app
  // Круг влияния — concrete XP, no abstract ×/%. The felt "multiplier" is two
  // plain things: shared habits pay more (+15 vs +10), and growing your circle
  // hits milestones that drop a big lump bonus. No ceiling — milestones keep
  // climbing and every friend always pays +150.
  var CIRCLE_MILESTONES = [{
    n: 3,
    bonus: 300
  }, {
    n: 7,
    bonus: 700
  }, {
    n: 15,
    bonus: 1500
  }, {
    n: 30,
    bonus: 3000
  }];
  var nextMile = CIRCLE_MILESTONES.find(t => t.n > invited) || null; // null = past the last listed milestone
  var prevMileN = ([...CIRCLE_MILESTONES].reverse().find(t => t.n <= invited) || {
    n: 0
  }).n;
  var ruPpl = (n, a) => {
    var m = n % 10,
      h = n % 100;
    return a[m === 1 && h !== 11 ? 0 : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? 1 : 2];
  };
  var ach = typeof window !== "undefined" && window.ACHIEVEMENTS || [];
  var achEarned = ach.filter(a => a.earned);
  // LIVE: real numbers from the date-keyed habit model (T0.2). DEMO: curated showcase.
  // Fresh demo: a clean level 1. Titles are shared so demo's "Преданный делу" still maps to 7.
  var _isLive = app?.mode === "live";
  var _xpLive = _isLive ? bosTotalXP(app?.habits) : 0;
  var _li = bosLevelInfo(_xpLive);
  var LEVEL_TITLES = ["Новичок", "Первые шаги", "Набираю ритм", "В потоке", "Стойкость", "Уверенность", "Преданный делу", "Сосредоточенный", "Мастер привычек", "Вдохновитель", "Наставник", "Легенда"];
  var titleFor = l => LEVEL_TITLES[Math.min(Math.max(1, l), LEVEL_TITLES.length) - 1];
  var lvl = app?.mode === "demo" ? 7 : _isLive ? _li.level : 1;
  var xp = app?.mode === "demo" ? 1240 : _isLive ? _xpLive : 0;
  var next = app?.mode === "demo" ? 1500 : _isLive ? _li.next : 100;
  var pctBar = app?.mode === "demo" ? Math.round(1240 / 1500 * 100) : _isLive ? _li.pct : 4;
  var credits = app?.mode === "demo" ? 980 : _isLive ? _xpLive : 0; // spendable balance = earned XP for live
  var rUnlocked = r => lvl >= r.lvl;
  var rewards = [{
    i: "🎁",
    t: "Коробка-сюрприз",
    c: 200,
    lvl: 5,
    unlocked: true
  }, {
    i: "🧘🏼‍♀️",
    t: "Персональная медитация",
    c: 500,
    lvl: 6,
    unlocked: true
  }, {
    i: "📚",
    t: "Скидка на премиум-курс",
    c: 800,
    lvl: 7,
    unlocked: true
  }, {
    i: "🏃🏼‍♀️",
    t: "Звонок с коучем (30 мин)",
    c: 1500,
    lvl: 9,
    unlocked: false
  }, {
    i: "🎯",
    t: "Свой командный вызов",
    c: 2500,
    lvl: 10,
    unlocked: false
  }, {
    i: "✨",
    t: "Пожизненный AI Pro",
    c: 5000,
    lvl: 12,
    unlocked: false
  }];
  var badges = [{
    i: "🔥",
    t: "Серия 30 дней",
    earned: true
  }, {
    i: "💪",
    t: "Первая привычка",
    earned: true
  }, {
    i: "👥",
    t: "Командный игрок",
    earned: true
  }, {
    i: "🌅",
    t: "Ранняя пташка",
    earned: true
  }, {
    i: "🏆",
    t: "Покоритель целей",
    earned: false
  }, {
    i: "💎",
    t: "Алмазный разум",
    earned: false
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u0423\u0440\u043E\u0432\u043D\u0438",
    onBack: () => navigate("home")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "linear-gradient(135deg,#FEDE34,#EF9F14)",
      borderRadius: 24,
      padding: 22,
      color: "#0a0a0a",
      position: "relative",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: -40,
      right: -40,
      width: 180,
      height: 180,
      background: "radial-gradient(circle, rgba(255,255,255,0.4), transparent 70%)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 1.4,
      fontWeight: 700,
      opacity: 0.7
    }
  }, "\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u0443\u0440\u043E\u0432\u0435\u043D\u044C"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 64,
      fontWeight: 800,
      letterSpacing: "-2px",
      lineHeight: 1,
      marginTop: 6
    }
  }, lvl), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      marginTop: 4
    }
  }, titleFor(lvl)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 12,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("span", null, xp, " XP"), /*#__PURE__*/React.createElement("span", null, next, " XP")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      background: "rgba(0,0,0,0.15)",
      borderRadius: 999,
      overflow: "hidden",
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: pctBar + "%",
      background: "#0a0a0a"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      marginTop: 6,
      opacity: 0.7
    }
  }, Math.max(0, next - xp), " XP \u0434\u043E ", lvl + 1, " \u0443\u0440\u043E\u0432\u043D\u044F \xB7 ", titleFor(lvl + 1))))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 20
    }
  }, "\u041A\u0430\u043A \u0437\u0430\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0442\u044C XP"), /*#__PURE__*/React.createElement(SysCard, {
    style: {
      padding: 14,
      marginTop: 8
    }
  }, [{
    t: "Выполнить привычку",
    v: "+10"
  }, {
    t: "Идеальный день — все привычки",
    v: "+30"
  }, {
    t: "Серия 7 дней",
    v: "+75"
  }, {
    t: "Достичь цели",
    v: "+250"
  }, {
    t: "Позвать друга в привычку",
    v: "+75",
    infl: true
  }, {
    t: "Пригласить друга в приложение",
    v: "+150",
    infl: true
  }].map((r, i, arr) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 0",
      borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : 0,
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7
    }
  }, r.infl && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14
    }
  }, "\uD83E\uDD1D"), r.t), /*#__PURE__*/React.createElement("span", {
    style: {
      color: r.infl ? "#2f8fd6" : "#c99a1a",
      fontWeight: 700
    }
  }, r.v, " XP")))), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 12,
      marginTop: 8,
      padding: "0 4px",
      lineHeight: 1.45
    }
  }, "\u0417\u0430 \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0451\u043D\u043D\u044B\u0445 \u0434\u0440\u0443\u0437\u0435\u0439 \u043F\u043B\u0430\u0442\u0438\u043C \u0449\u0435\u0434\u0440\u0435\u0435 \u0432\u0441\u0435\u0433\u043E \u2014 \u0442\u0430\u043A \u0440\u0430\u0441\u0442\u0451\u0442 \u0442\u0432\u043E\u0439 \u043A\u0440\u0443\u0433."), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u041A\u0440\u0443\u0433 \u0432\u043B\u0438\u044F\u043D\u0438\u044F"), /*#__PURE__*/React.createElement(SysCard, {
    "data-tour": "influence-mult",
    style: {
      padding: 16,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 13
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: 16,
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      background: "linear-gradient(135deg,#FEDE34,#FFC400)",
      boxShadow: "0 7px 18px rgba(254,222,52,0.34)"
    }
  }, /*#__PURE__*/React.createElement(I.Users, {
    size: 25,
    color: "#0a0a0a"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 700
    }
  }, "\u041C\u043D\u043E\u0436\u0438\u0442\u0435\u043B\u044C \u0432\u043B\u0438\u044F\u043D\u0438\u044F"), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 12.5,
      marginTop: 3,
      lineHeight: 1.4
    }
  }, invited > 0 ? /*#__PURE__*/React.createElement(React.Fragment, null, "\u0420\u044F\u0434\u043E\u043C \u0441 \u0442\u043E\u0431\u043E\u0439 \u0443\u0436\u0435 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text-2)"
    }
  }, invited, " ", ruPpl(invited, ["человек", "человека", "человек"])), ". \u0427\u0435\u043C \u0431\u043E\u043B\u044C\u0448\u0435 \u0434\u0440\u0443\u0437\u0435\u0439 \u2014 \u0442\u0435\u043C \u0431\u043E\u043B\u044C\u0448\u0435 XP \u0442\u044B \u043F\u043E\u043B\u0443\u0447\u0430\u0435\u0448\u044C.") : /*#__PURE__*/React.createElement(React.Fragment, null, "\u041F\u043E\u0437\u043E\u0432\u0438 \u0434\u0440\u0443\u0437\u0435\u0439 \u2014 \u0438 \u043A\u0430\u0436\u0434\u044B\u0439 \u043F\u043E\u043C\u043E\u0436\u0435\u0442 \u0442\u0435\u0431\u0435 \u043F\u043E\u043B\u0443\u0447\u0430\u0442\u044C \u0431\u043E\u043B\u044C\u0448\u0435 XP.")))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      padding: "12px 13px",
      borderRadius: 14,
      background: isDark ? "rgba(254,222,52,0.10)" : "#FFF7DC"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: 13.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-text-2"
  }, "\u041F\u0440\u0438\u0432\u044B\u0447\u043A\u0430 \u0432 \u043E\u0434\u0438\u043D\u043E\u0447\u043A\u0443"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      color: "#c99a1a"
    }
  }, "+10 XP")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: 13.5,
      marginTop: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-text-2"
  }, "\u041F\u0440\u0438\u0432\u044B\u0447\u043A\u0430 \u0441 \u0434\u0440\u0443\u0433\u043E\u043C"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 800,
      color: "#c99a1a"
    }
  }, "+15 XP")), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 12,
      marginTop: 9,
      lineHeight: 1.4
    }
  }, "\u041E\u0434\u043D\u0438 \u0438 \u0442\u0435 \u0436\u0435 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438 \u0441 \u0434\u0440\u0443\u0437\u044C\u044F\u043C\u0438 \u043F\u0440\u0438\u043D\u043E\u0441\u044F\u0442 \u0431\u043E\u043B\u044C\u0448\u0435 XP.")), nextMile ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-text-3"
  }, "\u041F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u043E \u0434\u0440\u0443\u0437\u0435\u0439"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text-2)",
      fontWeight: 700
    }
  }, invited), " ", /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-text-3"
  }, "\u0438\u0437 ", nextMile.n))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 7,
      background: "var(--surface-3)",
      borderRadius: 999,
      overflow: "hidden",
      marginTop: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: Math.min(100, Math.max(6, (invited - prevMileN) / (nextMile.n - prevMileN) * 100)) + "%",
      background: "linear-gradient(90deg,#FEDE34,#F0B400)",
      borderRadius: 999
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 12.5,
      marginTop: 8,
      lineHeight: 1.45
    }
  }, "\u0415\u0449\u0451 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text-2)"
    }
  }, nextMile.n - invited), " \u2014 \u0438 \u043F\u043E\u043B\u0443\u0447\u0438\u0448\u044C ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "#c99a1a"
    }
  }, "+", nextMile.bonus, " XP"), " \u0440\u0430\u0437\u043E\u043C.")) : /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 12.5,
      marginTop: 14,
      lineHeight: 1.45
    }
  }, "\u041A\u0440\u0443\u0433 \u043C\u043E\u0436\u043D\u043E \u0440\u0430\u0441\u0442\u0438\u0442\u044C \u0431\u0435\u0441\u043A\u043E\u043D\u0435\u0447\u043D\u043E \u2014 \u0438 \u043A\u0430\u0436\u0434\u044B\u0439 \u043D\u043E\u0432\u044B\u0439 \u0434\u0440\u0443\u0433 \u043F\u0440\u0438\u043D\u043E\u0441\u0438\u0442 \u0442\u0435\u0431\u0435 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "#c99a1a"
    }
  }, "+150 XP"), "."), /*#__PURE__*/React.createElement("button", {
    onClick: () => openSheet(/*#__PURE__*/React.createElement(ShareAppSheet, {
      dark: isDark
    })),
    className: "tap",
    style: {
      width: "100%",
      marginTop: 14,
      background: isDark ? "#fff" : "#0a0a0a",
      color: isDark ? "#0a0a0a" : "#fff",
      border: 0,
      borderRadius: 999,
      padding: 12,
      fontSize: 14.5,
      fontWeight: 600
    }
  }, "\u041F\u0440\u0438\u0433\u043B\u0430\u0441\u0438\u0442\u044C \u0434\u0440\u0443\u0433\u0430")), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0414\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u044F"), /*#__PURE__*/React.createElement(SysCard, {
    className: "tap",
    onClick: () => navigate("achievements", {
      from: "levels"
    }),
    style: {
      padding: 14,
      marginTop: 8,
      display: "flex",
      alignItems: "center",
      gap: 13,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-chip-bg",
    style: {
      width: 44,
      height: 44,
      borderRadius: 13,
      display: "grid",
      placeItems: "center",
      fontSize: 22,
      flexShrink: 0
    }
  }, "\uD83C\uDFC5"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 600
    }
  }, "\u0410\u0447\u0438\u0432\u043A\u0438"), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 12.5,
      marginTop: 2
    }
  }, achEarned.length, " \u0438\u0437 ", ach.length, " \xB7 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u044E\u0442 \u043A\u0440\u0443\u0433\u0438 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u043E\u0432")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      marginRight: 4
    }
  }, achEarned.slice(0, 3).map((a, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 26,
      height: 26,
      borderRadius: 8,
      background: "var(--card-2)",
      display: "grid",
      placeItems: "center",
      fontSize: 13,
      marginLeft: i ? -7 : 0,
      border: "1.5px solid var(--card)"
    }
  }, a.i))), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18,
    className: "bos-sys-text-2"
  })), /*#__PURE__*/React.createElement(SysCard, {
    style: {
      padding: 16,
      marginTop: 22,
      display: "flex",
      alignItems: "center",
      gap: 14,
      borderRadius: 18
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-chip-bg",
    style: {
      width: 50,
      height: 50,
      borderRadius: 14,
      display: "grid",
      placeItems: "center",
      fontSize: 24
    }
  }, "\uD83E\uDE99"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600
    }
  }, "\u0411\u0430\u043B\u0430\u043D\u0441 XP"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 700,
      marginTop: 2
    }
  }, credits.toLocaleString()), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 11.5,
      marginTop: 1
    }
  }, "\u043C\u043E\u0436\u043D\u043E \u043F\u043E\u0442\u0440\u0430\u0442\u0438\u0442\u044C \xB7 \u0443\u0440\u043E\u0432\u0435\u043D\u044C \u043E\u0442 \u0442\u0440\u0430\u0442\u044B \u043D\u0435 \u043F\u0430\u0434\u0430\u0435\u0442")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      app?.setCommunityView?.({
        section: "community",
        commTab: "network"
      });
      navigate("community");
    },
    className: "tap",
    style: {
      background: "#FEDE34",
      color: "#0a0a0a",
      border: 0,
      borderRadius: 999,
      padding: "10px 16px",
      fontSize: 13,
      fontWeight: 600,
      flexShrink: 0
    }
  }, "\u0412 \u041D\u0435\u0442\u0432\u043E\u0440\u043A")), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u041D\u0430\u0433\u0440\u0430\u0434\u044B \u0437\u0430 XP"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 8
    }
  }, rewards.map((r, i) => /*#__PURE__*/React.createElement(SysCard, {
    key: i,
    style: {
      padding: 12,
      display: "flex",
      alignItems: "center",
      gap: 12,
      opacity: rUnlocked(r) ? 1 : 0.55
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-chip-bg",
    style: {
      width: 42,
      height: 42,
      borderRadius: 12,
      display: "grid",
      placeItems: "center",
      fontSize: 22
    }
  }, r.i), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 500
    }
  }, r.t), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 11,
      marginTop: 2
    }
  }, rUnlocked(r) ? `${r.c} XP` : `Откроется на уровне ${r.lvl}`)), /*#__PURE__*/React.createElement("button", {
    disabled: !rUnlocked(r) || credits < r.c,
    className: "tap",
    style: {
      background: rUnlocked(r) && credits >= r.c ? "#FEDE34" : "var(--surface-3)",
      color: rUnlocked(r) && credits >= r.c ? "#0a0a0a" : "var(--text-4)",
      border: 0,
      borderRadius: 999,
      padding: "8px 14px",
      fontSize: 12,
      fontWeight: 600
    }
  }, rUnlocked(r) ? credits >= r.c ? "Получить" : "Нужно больше" : "🔒")))));
}

/* ─── COURSE DETAIL — full programme description ─── */
function CourseDetailScreen() {
  var {
    navigate,
    params
  } = useNav();
  var [enrolled, setEnrolled] = useCS(false);
  var c = params?.course || {
    id: "marathon",
    i: "🏃🏼‍♀️",
    accent: "#d6f3df",
    t: "Марафон",
    d: "21-дневная программа устойчивых привычек.",
    price: "110 000 ₽",
    lvl: "База",
    length: "21 день",
    cohort: "1 — 21 мая"
  };

  // Default to Marathon programme content; could be data-driven per id
  var META = [{
    l: "Длительность",
    v: c.length || "21 день"
  }, {
    l: "Поток",
    v: c.cohort || "1 — 21 мая"
  }, {
    l: "Формат",
    v: "Онлайн · самостоят. + 2 живых звонка/нед."
  }, {
    l: "Нагрузка",
    v: "30 мин/день"
  }, {
    l: "Размер потока",
    v: "12 человек, ограничено"
  }, {
    l: "Результат",
    v: "1 устойчивая ежедневная привычка"
  }];
  var PROGRAMME = {
    overload: [{
      wk: "День 1",
      h: "Найди шум",
      b: "Определи, что выбивает тебя из равновесия — и во что это обходится."
    }, {
      wk: "День 2",
      h: "Убери три",
      b: "Убери три главных утечки энергии. Замени каждую на 60-секундную перезагрузку."
    }, {
      wk: "День 3",
      h: "Задай минимум",
      b: "Собери минимальный ежедневный ритуал, который выдержишь даже в самый трудный день."
    }],
    breakthrough: [{
      wk: "Дни 1–2",
      h: "Аудит",
      b: "Определи свой потолок и убеждение, которое его поставило."
    }, {
      wk: "Дни 3–4",
      h: "Переосмысление",
      b: "Замени одно ограничивающее убеждение списком проверенных контраргументов."
    }, {
      wk: "Дни 5–7",
      h: "Действуй",
      b: "Три осознанных эксперимента, пересекающих твою старую границу."
    }],
    marathon: [{
      wk: "Неделя 1",
      h: "Крошечно и с опорой",
      b: "Выбери одну ключевую привычку. Найди якорь. Только двухминутная версия — каждый день."
    }, {
      wk: "Неделя 2",
      h: "Добавь глубину",
      b: "Растяни её до реальной формы. Строй серию. Найди точки трения."
    }, {
      wk: "Неделя 3",
      h: "Закрепи",
      b: "Выполняй полную версию на полную длительность. Спланируй восстановление. Задай следующий 30-дневный цикл."
    }]
  };
  var programme = PROGRAMME[c.id] || PROGRAMME.marathon;
  var includes = [{
    i: "📓",
    t: "Рабочая тетрадь",
    b: "Ежедневные вопросы + страницы недельного разбора."
  }, {
    i: "🎥",
    t: "Живые звонки",
    b: "2 раза в неделю с потоком и коучем."
  }, {
    i: "💬",
    t: "Чат потока",
    b: "Закрытая группа для поддержки и ответственности."
  }, {
    i: "🏆",
    t: "Бонус за финиш",
    b: "+500 XP и постоянный значок в профиле."
  }];
  var FAQ = [{
    q: "Что, если я пропущу день?",
    a: "Восстанавливайся, а не начинай заново. Твоя единственная задача на следующий день — появиться, хотя бы в мини-версии."
  }, {
    q: "Нужно ли оборудование?",
    a: "Нет. Программа использует только то, что у тебя уже есть. Инструменты добавляем, только если этого требует привычка."
  }, {
    q: "Можно ли поставить на паузу?",
    a: "Да — один раз. Используй её для важных событий. Вторая пауза в потоке переносит на следующий набор."
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u041A\u0443\u0440\u0441",
    onBack: () => navigate("community"),
    right: /*#__PURE__*/React.createElement("button", {
      className: "tap icon-btn"
    }, /*#__PURE__*/React.createElement(I.More, {
      size: 18
    }))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 24,
      padding: "22px 20px 20px",
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 58,
      height: 58,
      borderRadius: "50%",
      background: c.accent,
      display: "grid",
      placeItems: "center",
      fontSize: 28,
      flexShrink: 0
    }
  }, c.i), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      padding: "2px 8px",
      background: "var(--card-2)",
      borderRadius: 999,
      color: "var(--text-3)",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      fontWeight: 600
    }
  }, c.lvl)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--bos-title-font)",
      fontSize: 26,
      lineHeight: 1.15,
      letterSpacing: "-0.4px",
      marginTop: 6,
      color: "var(--text)"
    }
  }, c.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--text-3)",
      marginTop: 8,
      lineHeight: 1.5
    }
  }, c.d))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 1,
      marginTop: 16,
      background: "var(--line)",
      borderRadius: 14,
      overflow: "hidden"
    }
  }, META.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: "var(--card)",
      padding: "10px 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600
    }
  }, m.l), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text)",
      marginTop: 2,
      fontWeight: 500
    }
  }, m.v))))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22,
      padding: "0 4px"
    }
  }, "\u041F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      background: "var(--card)",
      borderRadius: 22,
      overflow: "hidden",
      boxShadow: "var(--card-shadow)"
    }
  }, programme.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      padding: "16px 18px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 600
    }
  }, p.wk)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 600,
      color: "var(--text)",
      letterSpacing: "-0.2px"
    }
  }, p.h), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-3)",
      marginTop: 4,
      lineHeight: 1.5
    }
  }, p.b))), i < programme.length - 1 && /*#__PURE__*/React.createElement("div", {
    className: "divider"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22,
      padding: "0 4px"
    }
  }, "\u0427\u0442\u043E \u0432\u0445\u043E\u0434\u0438\u0442"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10
    }
  }, includes.map((it, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: "var(--card)",
      borderRadius: 18,
      padding: 14,
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: "var(--card-2)",
      display: "grid",
      placeItems: "center",
      fontSize: 18,
      marginBottom: 8
    }
  }, it.i), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600
    }
  }, it.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 3,
      lineHeight: 1.45
    }
  }, it.b)))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22,
      padding: "0 4px"
    }
  }, "\u0422\u0432\u043E\u0439 \u043A\u043E\u0443\u0447"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      background: "var(--card)",
      borderRadius: 22,
      padding: 16,
      boxShadow: "var(--card-shadow)",
      display: "flex",
      gap: 14,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(AvatarStack, {
    people: [{
      name: "Марк Халверсон",
      initials: "МХ",
      color: "#d4b8e8"
    }],
    size: 52,
    max: 1,
    label: false
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600
    }
  }, "\u041C\u0430\u0440\u043A \u0425\u0430\u043B\u0432\u0435\u0440\u0441\u043E\u043D"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 2
    }
  }, "\u041A\u043E\u0443\u0447 \u043F\u043E \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0430\u043C \xB7 1200+ \u0432\u044B\u043F\u0443\u0441\u043A\u043D\u0438\u043A\u043E\u0432"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)",
      marginTop: 6,
      lineHeight: 1.5
    }
  }, "\xAB\u042F \u0441\u0442\u0440\u043E\u044E \u043A\u043E\u0443\u0447\u0438\u043D\u0433 \u0434\u043B\u044F \u0442\u0435\u0445, \u043A\u0442\u043E \u043D\u0435\u043D\u0430\u0432\u0438\u0434\u0438\u0442 \u0441\u043B\u043E\u0432\u043E \xAB\u043A\u043E\u0443\u0447\u0438\u043D\u0433\xBB. \u041F\u0440\u043E\u0441\u0442\u043E \u043F\u043E\u044F\u0432\u043B\u044F\u0439\u0441\u044F \u2014 \u043E\u0441\u0442\u0430\u043B\u044C\u043D\u043E\u0435 \u0441\u0434\u0435\u043B\u0430\u044E \u044F.\xBB"))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22,
      padding: "0 4px"
    }
  }, "FAQ"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      background: "var(--card)",
      borderRadius: 22,
      overflow: "hidden",
      boxShadow: "var(--card-shadow)"
    }
  }, FAQ.map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 18px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, f.q), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-3)",
      marginTop: 4,
      lineHeight: 1.5
    }
  }, f.a)), i < FAQ.length - 1 && /*#__PURE__*/React.createElement("div", {
    className: "divider"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      background: "#0a0a0a",
      color: "#fff",
      borderRadius: 22,
      padding: "16px 18px",
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      opacity: 0.6,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      fontWeight: 600
    }
  }, "\u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      marginTop: 2,
      letterSpacing: "-0.4px"
    }
  }, c.price), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      opacity: 0.65,
      marginTop: 2
    }
  }, "\u0415\u0434\u0438\u043D\u043E\u0440\u0430\u0437\u043E\u0432\u043E \xB7 \u043C\u043E\u0436\u043D\u043E \u0440\u0430\u0437\u0431\u0438\u0442\u044C \u043D\u0430 3 \u043C\u0435\u0441\u044F\u0446\u0430")), enrolled ? /*#__PURE__*/React.createElement("span", {
    style: {
      background: "rgba(52,199,89,0.18)",
      color: "#34C759",
      borderRadius: 999,
      padding: "12px 18px",
      fontSize: 14,
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(I.Check, {
    size: 15,
    strokeWidth: 3
  }), " \u0412\u044B \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u044B") : /*#__PURE__*/React.createElement("button", {
    onClick: () => setEnrolled(true),
    className: "tap",
    style: {
      background: "var(--card)",
      color: "#0a0a0a",
      border: 0,
      borderRadius: 999,
      padding: "12px 18px",
      fontSize: 14,
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u044C\u0441\u044F ", /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 14
  }))));
}

/* Compress + downscale a picked image to a light JPEG data URL so chat photos
   stay small (a 4000px phone photo → ~1280px, ~50-150KB) — important once many
   people share into one team. At T1 these move to Supabase Storage; this call
   site doesn't change. */
function bosCompressImage(file, maxDim, quality) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onerror = reject;
    reader.onload = function () {
      var img = new Image();
      img.onerror = reject;
      img.onload = function () {
        var w = img.width,
          h = img.height;
        var scale = Math.min(1, maxDim / Math.max(w, h));
        w = Math.max(1, Math.round(w * scale));
        h = Math.max(1, Math.round(h * scale));
        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        try {
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", quality || 0.72));
        } catch (e) {
          reject(e);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ─── TEAM CHAT — one shared chat for the whole team: messages + photos, in the
   flow of doing the goal together. Core team feature; especially useful for
   trainers running cohorts and for family circles.
   Local-first: in a REAL (live) profile the conversation is saved per team and
   never lost on reload; demo modes show the rich seeded chat (ephemeral). The
   cross-person realtime layer (everyone sees each other) arrives at T1. ─── */
function TeamChatScreen() {
  var {
    navigate,
    params
  } = useNav();
  var app = typeof useApp === "function" ? useApp() : null;
  var isDark = app?.themeOverride === "dark";
  var team = params?.team || {
    _id: "seed-1",
    name: "Команда создателей",
    emblem: "✨",
    members: []
  };
  var live = app?.mode === "live";
  var chatKey = "bos:chat:" + (app?.persistId || "live:local") + ":" + (team._id || team.name || "team");
  var SEED = [{
    who: "Светлана",
    c: "#F4A574",
    t: "Доброе утро, команда! ☀️ Кто уже отметил доброе дело?",
    time: "8:14"
  }, {
    who: "Вадим",
    c: "#74CFE0",
    t: "Я помог соседке с покупками 💪",
    time: "8:31"
  }, {
    who: "Вадим",
    c: "#74CFE0",
    photo: {
      e: "🌅",
      g: "linear-gradient(135deg,#ffd28a,#ff9a6b)"
    },
    cap: "И пробежку засчитал",
    time: "8:32"
  }, {
    who: "Ник",
    c: "#7FB3F2",
    t: "Красиво! Тоже выхожу 🏃",
    time: "8:40"
  }, {
    who: "Сергей",
    c: "#76D3A0",
    t: "Перевёл бабушку через дорогу 😄 плюс одно доброе дело",
    time: "8:52"
  }, {
    who: "Павел",
    me: true,
    c: "#FEDE34",
    t: "Вы лучшие 🙌 Сегодня закрываем 50 добрых дел!",
    time: "9:02"
  }, {
    who: "Светлана",
    c: "#F4A574",
    t: "Я в деле — несу обед волонтёрам в приют 🐾",
    time: "9:07"
  }, {
    who: "Сергей",
    c: "#76D3A0",
    t: "До цели 8 дел — добьём к вечеру 🔥",
    time: "9:10"
  }, {
    who: "Ник",
    c: "#7FB3F2",
    t: "Давайте! После работы ещё пару добрых дел успею 🙌",
    time: "9:15"
  }];
  // Live profiles: restore saved history (or start empty). Demo/fresh: rich seed.
  var [msgs, setMsgs] = useCS(function () {
    if (live) {
      try {
        var raw = localStorage.getItem(chatKey);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return [];
    }
    return SEED;
  });
  var [text, setText] = useCS("");
  var scrollRef = React.useRef(null);
  var fileRef = React.useRef(null);
  // Persist every change under the real profile — messages & photos survive
  // reloads and reopening the chat. On a full localStorage quota, drop the oldest
  // photos (keep all text) rather than failing the save.
  React.useEffect(function () {
    if (!live) return;
    try {
      localStorage.setItem(chatKey, JSON.stringify(msgs));
    } catch (e) {
      try {
        localStorage.setItem(chatKey, JSON.stringify(msgs.filter(function (m) {
          return !m.img;
        })));
      } catch (e2) {}
    }
  }, [msgs, live, chatKey]);
  // Pin to the latest message by scrolling the chat's OWN container — NOT
  // scrollIntoView, which bubbles up and yanked the page mid open-transition.
  React.useLayoutEffect(() => {
    var el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs.length]);
  var myName = live ? app?.userName || "Вы" : "Павел";
  var nowLabel = () => {
    try {
      var d = new Date();
      return d.getHours() + ":" + ("0" + d.getMinutes()).slice(-2);
    } catch (e) {
      return "сейчас";
    }
  };
  var push = m => setMsgs(list => [...list, {
    who: myName,
    me: true,
    c: "#FEDE34",
    time: nowLabel(),
    ...m
  }]);
  var send = () => {
    var v = text.trim();
    if (!v) return;
    push({
      t: v
    });
    setText("");
  };
  var pickPhoto = () => {
    if (fileRef.current) fileRef.current.click();
  };
  var onFile = e => {
    var file = e.target.files && e.target.files[0];
    try {
      e.target.value = "";
    } catch (_) {}
    if (!file) return;
    bosCompressImage(file, 1280, 0.72).then(src => push({
      img: src
    })).catch(() => {});
  };
  var otherBubble = isDark ? "rgba(255,255,255,0.07)" : "#fff";
  var mineBubble = isDark ? "#fff" : "#0a0a0a";
  var mineText = isDark ? "#0a0a0a" : "#fff";
  var Photo = ({
    p,
    cap,
    light
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 152,
      height: 104,
      borderRadius: 14,
      background: p.g,
      display: "grid",
      placeItems: "center",
      fontSize: 46,
      boxShadow: "inset 0 -34px 44px rgba(0,0,0,0.14)"
    }
  }, p.e), cap && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      marginTop: 5,
      color: light ? "rgba(255,255,255,0.85)" : "var(--text-2)"
    }
  }, cap));
  var RealPhoto = ({
    src,
    cap,
    light
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: "",
    loading: "lazy",
    style: {
      width: 188,
      maxWidth: "100%",
      maxHeight: 240,
      objectFit: "cover",
      borderRadius: 14,
      display: "block"
    }
  }), cap && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      marginTop: 5,
      color: light ? "rgba(255,255,255,0.85)" : "var(--text-2)"
    }
  }, cap));
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      height: "calc(100% + 90px)",
      margin: "-60px 0 -30px",
      display: "flex",
      flexDirection: "column",
      paddingTop: "max(60px, var(--tg-top-inset, 0px))",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 14px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: team.name,
    onBack: () => navigate("team-detail", {
      team
    }),
    right: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "var(--text-4)",
        whiteSpace: "nowrap"
      }
    }, team.members?.length || 4, " \uD83D\uDC65")
  })), /*#__PURE__*/React.createElement("div", {
    ref: scrollRef,
    className: "screen-scroll",
    style: {
      flex: 1,
      minHeight: 0,
      padding: "2px 14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, live && msgs.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "auto",
      textAlign: "center",
      padding: "0 30px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 40,
      marginBottom: 10
    }
  }, "\uD83D\uDCAC"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 600,
      color: "var(--text-2)",
      marginBottom: 4
    }
  }, "\u042D\u0442\u043E \u043E\u0431\u0449\u0438\u0439 \u0447\u0430\u0442 \u043A\u043E\u043C\u0430\u043D\u0434\u044B"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      lineHeight: 1.5,
      color: "var(--text-4)"
    }
  }, "\u041D\u0430\u043F\u0438\u0448\u0438 \u043F\u0435\u0440\u0432\u043E\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0438\u043B\u0438 \u043F\u043E\u0434\u0435\u043B\u0438\u0441\u044C \u0444\u043E\u0442\u043E \u0441\u0432\u043E\u0435\u0433\u043E \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441\u0430 \uD83D\uDC4B")) : /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      fontSize: 11,
      color: "var(--text-4)",
      margin: "2px 0 2px"
    }
  }, "\u0421\u0435\u0433\u043E\u0434\u043D\u044F"), msgs.map((m, i) => m.me ? /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      justifyContent: "flex-end"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "78%",
      background: mineBubble,
      color: mineText,
      borderRadius: "18px 18px 5px 18px",
      padding: m.photo || m.img ? 8 : "9px 13px"
    }
  }, m.img ? /*#__PURE__*/React.createElement(RealPhoto, {
    src: m.img,
    cap: m.cap,
    light: true
  }) : m.photo ? /*#__PURE__*/React.createElement(Photo, {
    p: m.photo,
    cap: m.cap,
    light: true
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.4
    }
  }, m.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      opacity: 0.55,
      textAlign: "right",
      marginTop: 3
    }
  }, m.time))) : /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 8,
      alignItems: "flex-end"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: "50%",
      background: m.c,
      display: "grid",
      placeItems: "center",
      fontSize: 12,
      fontWeight: 700,
      color: "rgba(0,0,0,0.55)",
      flexShrink: 0
    }
  }, m.who[0]), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "78%",
      background: otherBubble,
      borderRadius: "18px 18px 18px 5px",
      padding: m.photo || m.img ? 8 : "9px 13px",
      boxShadow: isDark ? "none" : "0 1px 2px rgba(0,0,0,0.05)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: m.photo || m.img ? 4 : 2
    }
  }, m.who), m.img ? /*#__PURE__*/React.createElement(RealPhoto, {
    src: m.img,
    cap: m.cap
  }) : m.photo ? /*#__PURE__*/React.createElement(Photo, {
    p: m.photo,
    cap: m.cap
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.4,
      color: "var(--text)"
    }
  }, m.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "var(--text-4)",
      textAlign: "right",
      marginTop: 3
    }
  }, m.time))))), /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      background: isDark ? "rgba(18,18,20,0.72)" : "rgba(255,255,255,0.72)",
      backdropFilter: "blur(28px) saturate(180%)",
      WebkitBackdropFilter: "blur(28px) saturate(180%)",
      borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)",
      padding: "9px 12px calc(9px + var(--bos-safe-bottom, 0px))",
      display: "flex",
      alignItems: "flex-end",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: "image/*",
    onChange: onFile,
    style: {
      display: "none"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: pickPhoto,
    className: "tap",
    "aria-label": "\u041F\u0440\u0438\u043A\u0440\u0435\u043F\u0438\u0442\u044C \u0444\u043E\u0442\u043E",
    style: {
      width: 38,
      height: 38,
      borderRadius: "50%",
      background: isDark ? "rgba(255,255,255,0.10)" : "rgba(120,120,128,0.14)",
      border: 0,
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      color: "var(--text-2)"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "18",
    height: "18",
    rx: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "8.5",
    cy: "8.5",
    r: "1.6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 15l-5-5L5 21"
  }))), /*#__PURE__*/React.createElement("input", {
    value: text,
    onChange: e => setText(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter") send();
    },
    placeholder: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u0435\u2026",
    style: {
      flex: 1,
      minWidth: 0,
      background: isDark ? "rgba(255,255,255,0.07)" : "rgba(120,120,128,0.10)",
      border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.05)",
      borderRadius: 20,
      padding: "10px 15px",
      fontSize: 16,
      color: "var(--text)",
      outline: "none",
      lineHeight: 1.3
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: send,
    className: "tap",
    "aria-label": "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C",
    style: {
      width: 38,
      height: 38,
      borderRadius: "50%",
      background: text.trim() ? "#FEDE34" : isDark ? "rgba(255,255,255,0.10)" : "rgba(120,120,128,0.18)",
      border: 0,
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      transition: "background 0.2s, transform 0.2s",
      transform: text.trim() ? "scale(1)" : "scale(0.94)"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: text.trim() ? "#0a0a0a" : "var(--text-4)",
    strokeWidth: "2.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 19V5M6 11l6-6 6 6"
  })))));
}
window.TeamChatScreen = TeamChatScreen;
window.CommunityScreen = CommunityScreen;
window.CourseDetailScreen = CourseDetailScreen;
window.TeamCreateScreen = TeamCreateScreen;
window.TeamDetailScreen = TeamDetailScreen;
window.LevelsScreen = LevelsScreen;
window.ContactDetailScreen = ContactDetailScreen;

/* CONTACT DETAIL — public profile of a network member with their
   social-impact history, reviews from people they've helped, and the
   full list of bookable offers. Light theme to match Community. */
function ContactDetailScreen() {
  var {
    navigate,
    params
  } = useNav();
  var {
    open: openSheet
  } = useSheet();
  var [booked, setBooked] = useCS({}); // booked offers (by index)
  var [added, setAdded] = useCS(false);
  var userLevel = 8;
  var p = params?.contact || {
    name: "Александра Иванова",
    initials: "АИ",
    color: "#e8c8a8",
    city: "Москва",
    role: "Маркетинг",
    level: 12,
    impact: 1840,
    bio: "Цифровой маркетолог, 5 лет. Йога и медитация.",
    tags: ["Йога", "Маркетинг", "Путешествия"],
    offers: [{
      i: "🧘",
      t: "Сеанс медитации",
      d: "30 мин · вт и чт",
      price: "Бесплатно",
      lvl: 5
    }, {
      i: "💼",
      t: "Консультация по маркетингу",
      d: "1 ч · бренд и рост",
      price: "150 XP/ч",
      lvl: 10
    }]
  };

  // Mock impact history — services this person has delivered
  var history = [{
    i: "🧘",
    t: "Проведено медитаций",
    n: 23,
    sub: "Последняя: вчера с Марией"
  }, {
    i: "💼",
    t: "Консультации по маркетингу",
    n: 8,
    sub: "Помогла 8 основателям"
  }, {
    i: "🌬️",
    t: "Сеансы дыхания",
    n: 5,
    sub: "Группы по 3–5 человек"
  }];
  var rating = 4.9;
  var ratingsCount = 36;
  var reviews = [{
    who: "Ник В.",
    when: "2 дн. назад",
    text: "Самые спокойные 30 минут моей недели. Её объяснение дыхания превратило привычку, которой я боялся, в ту, которую жду.",
    stars: 5,
    color: "#a8b9d4"
  }, {
    who: "Анна К.",
    when: "1 нед. назад",
    text: "Разобралась с основой лендинга за 45 минут. Прямо, без воды, дала задание, которое я реально выполнила.",
    stars: 5,
    color: "#e8a8c8"
  }, {
    who: "Сергей М.",
    when: "2 нед. назад",
    text: "Сеанс медитации был прекрасно выстроен. Запишусь снова.",
    stars: 5,
    color: "#c8e8a8"
  }];
  var offers = (p.offers || []).slice().sort((a, b) => a.lvl - b.lvl);
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 0 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: `linear-gradient(160deg, ${p.color}66 0%, ${p.color}22 60%, transparent 100%)`,
      margin: "-60px 0 0",
      padding: "60px 16px 18px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      paddingTop: 4,
      paddingBottom: 14
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("community"),
    className: "tap",
    style: {
      width: 40,
      height: 40,
      borderRadius: 999,
      background: "rgba(255,255,255,0.6)",
      border: 0,
      display: "grid",
      placeItems: "center",
      padding: 0
    }
  }, /*#__PURE__*/React.createElement(I.ChevronLeft, {
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    className: "tap",
    style: {
      width: 40,
      height: 40,
      borderRadius: 999,
      background: "rgba(255,255,255,0.6)",
      border: 0,
      display: "grid",
      placeItems: "center",
      padding: 0
    }
  }, /*#__PURE__*/React.createElement(I.MessageCircle, {
    size: 16
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 64,
      height: 64,
      borderRadius: "50%",
      background: p.color,
      border: "3px solid #fff",
      display: "grid",
      placeItems: "center",
      fontSize: 22,
      fontWeight: 700,
      color: "rgba(0,0,0,0.65)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
    }
  }, p.initials), /*#__PURE__*/React.createElement("div", {
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
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: "var(--text)",
      letterSpacing: "-0.5px"
    }
  }, p.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      background: "#0a0a0a",
      color: "#FEDE34",
      borderRadius: 999,
      padding: "2px 8px",
      letterSpacing: 0.4
    }
  }, "L", p.level)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      fontSize: 13,
      color: "var(--text-3)",
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCCD ", p.city), /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCBC ", p.role)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 8,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(255,255,255,0.7)",
      borderRadius: 16,
      padding: "10px 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 700
    }
  }, "\u0412\u043A\u043B\u0430\u0434"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 700,
      color: "var(--text)",
      letterSpacing: "-0.4px",
      marginTop: 2
    }
  }, p.impact.toLocaleString())), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(255,255,255,0.7)",
      borderRadius: 16,
      padding: "10px 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 700
    }
  }, "\u0420\u0435\u0439\u0442\u0438\u043D\u0433"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 4,
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 19,
      fontWeight: 700,
      color: "var(--text)",
      letterSpacing: "-0.4px"
    }
  }, rating), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-4)"
    }
  }, "\u2605 \xB7 ", ratingsCount))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(255,255,255,0.7)",
      borderRadius: 16,
      padding: "10px 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: 700
    }
  }, "\u041F\u043E\u043C\u043E\u0433"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 700,
      color: "var(--text)",
      letterSpacing: "-0.4px",
      marginTop: 2
    }
  }, history.reduce((s, h) => s + h.n, 0))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "18px 16px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--text-2)",
      lineHeight: 1.55
    }
  }, p.bio), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 10,
      flexWrap: "wrap"
    }
  }, p.tags.map((tg, j) => /*#__PURE__*/React.createElement("span", {
    key: j,
    style: {
      background: "var(--card-2)",
      borderRadius: 999,
      padding: "4px 10px",
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, tg)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "22px 16px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1.4,
      fontWeight: 700,
      marginBottom: 10
    }
  }, "\u041F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, offers.map((o, j) => {
    var locked = userLevel < o.lvl;
    return /*#__PURE__*/React.createElement("div", {
      key: j,
      style: {
        background: "var(--card)",
        borderRadius: 18,
        padding: 14,
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "var(--card-shadow)",
        opacity: locked ? 0.55 : 1
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 42,
        height: 42,
        borderRadius: 13,
        background: "var(--card-2)",
        display: "grid",
        placeItems: "center",
        fontSize: 21,
        flexShrink: 0
      }
    }, o.i), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15,
        fontWeight: 600,
        color: "var(--text)",
        letterSpacing: -0.1
      }
    }, o.t), locked && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        fontWeight: 700,
        color: "var(--text-4)",
        background: "var(--card-2)",
        borderRadius: 999,
        padding: "2px 7px",
        letterSpacing: 0.4
      }
    }, "\uD83D\uDD12 L", o.lvl)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--text-4)",
        marginTop: 2
      }
    }, o.d)), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "right",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: locked ? "var(--text-4)" : "var(--text)"
      }
    }, o.price), !locked && (booked[j] ? /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        marginTop: 4,
        fontSize: 11,
        fontWeight: 700,
        color: "#1E8E4E",
        background: "rgba(52,199,89,0.14)",
        borderRadius: 999,
        padding: "4px 10px"
      }
    }, /*#__PURE__*/React.createElement(I.Check, {
      size: 11,
      strokeWidth: 3
    }), " \u0417\u0430\u043F\u0438\u0441\u0430\u043D") : /*#__PURE__*/React.createElement("button", {
      onClick: () => setBooked(b => ({
        ...b,
        [j]: true
      })),
      className: "tap",
      style: {
        marginTop: 4,
        fontSize: 11,
        fontWeight: 600,
        color: "#0a0a0a",
        background: "#FEDE34",
        border: 0,
        borderRadius: 999,
        padding: "4px 12px"
      }
    }, "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u044C\u0441\u044F"))));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "22px 16px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1.4,
      fontWeight: 700,
      marginBottom: 10
    }
  }, "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0432\u043A\u043B\u0430\u0434\u0430"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 18,
      boxShadow: "var(--card-shadow)",
      overflow: "hidden"
    }
  }, history.map((h, j) => /*#__PURE__*/React.createElement("div", {
    key: j,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 14px",
      borderTop: j === 0 ? 0 : "1px solid var(--line)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 10,
      background: "var(--card-2)",
      display: "grid",
      placeItems: "center",
      fontSize: 16,
      flexShrink: 0
    }
  }, h.i), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: "var(--text-2)",
      letterSpacing: -0.1
    }
  }, h.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      marginTop: 1
    }
  }, h.sub)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: "var(--text)",
      letterSpacing: "-0.4px",
      flexShrink: 0
    }
  }, h.n))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "22px 16px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      textTransform: "uppercase",
      letterSpacing: 1.4,
      fontWeight: 700
    }
  }, "\u041E\u0442\u0437\u044B\u0432\u044B"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)"
    }
  }, "\u0432\u0441\u0435\u0433\u043E ", ratingsCount)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, reviews.map((r, j) => /*#__PURE__*/React.createElement("div", {
    key: j,
    style: {
      background: "var(--card)",
      borderRadius: 18,
      padding: 14,
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: "50%",
      background: r.color,
      display: "grid",
      placeItems: "center",
      fontSize: 11,
      fontWeight: 700,
      color: "rgba(0,0,0,0.6)"
    }
  }, r.who.split(" ").map(s => s[0]).join("")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, r.who), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)"
    }
  }, r.when)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      letterSpacing: 1
    }
  }, "★".repeat(r.stars))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-2)",
      marginTop: 10,
      lineHeight: 1.55
    }
  }, r.text))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "22px 16px 0",
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => openSheet(/*#__PURE__*/React.createElement(MessageSheet, {
      name: p.name
    })),
    className: "tap",
    style: {
      flex: 1,
      background: "var(--card)",
      border: 0,
      borderRadius: 999,
      padding: "13px 14px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      fontSize: 14,
      color: "var(--text-2)",
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement(I.MessageCircle, {
    size: 15
  }), " \u041D\u0430\u043F\u0438\u0441\u0430\u0442\u044C"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setAdded(a => !a),
    className: "tap",
    style: {
      flex: 1,
      background: added ? "rgba(52,199,89,0.16)" : "#0a0a0a",
      color: added ? "#1E8E4E" : "#fff",
      border: 0,
      borderRadius: 999,
      padding: "13px 14px",
      fontSize: 14,
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6
    }
  }, added ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(I.Check, {
    size: 15,
    strokeWidth: 3
  }), " \u0412 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u0430\u0445") : "Добавить")));
}

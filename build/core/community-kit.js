/* core/community-kit.jsx — NEUTRAL shared toolkit extracted from screens/community.jsx (v196 live/demo/core split).
   No product (demo/live) branching — one copy, used by BOTH demos and the live app.
   Moved bricks: BOS_TEAM_PALETTE, CloudTeamsDiscover, DurationPicker, MessageSheet, SplitEditor, TEAM_EMBLEMS, TeamHabitSheet, TeamShareSheet, bosCompressImage, bosConfirmExitTeam, bosMsgTime, bosUserColor */
var BOS_TEAM_PALETTE = ["#7FB3F2", "#F4A574", "#9BD4A8", "#C9A8E8", "#F2A0B4", "#E8C868", "#86C7C2", "#E59BC4"];

/* Liquid-glass icon chip — glossy, dimensional, iOS-26 style. Vivid gradient
   fill + bright top specular + inner shadow + soft coloured glow underneath. */
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
function CloudTeamsDiscover({
  app
}) {
  var [list, setList] = React.useState(null);
  var [busy, setBusy] = React.useState({});
  var [requested, setRequested] = React.useState({});
  React.useEffect(() => {
    var on = true;
    try {
      if (window.bosCloud && window.bosCloud.enabled()) {
        window.bosCloud.discoverTeams().then(ts => {
          if (on) setList(Array.isArray(ts) ? ts : []);
        }).catch(() => {
          if (on) setList([]);
        });
      } else setList([]);
    } catch (e) {
      setList([]);
    }
    return () => {
      on = false;
    };
  }, []);
  if (!list || !list.length) return null;
  // E: send a JOIN REQUEST («из поиска — по заявке»). The creator approves it later.
  // Pre-SQL (no approval system yet) the call falls back to an instant join.
  var join = t => {
    setBusy(b => Object.assign({}, b, {
      [t.id]: true
    }));
    try {
      window.bosCloud.requestJoin(t.id).then(res => {
        setBusy(b => Object.assign({}, b, {
          [t.id]: false
        }));
        if (!res) return;
        if (res.pending) {
          setRequested(r => Object.assign({}, r, {
            [t.id]: true
          }));
          return;
        }
        // fallback: actually joined → add to my teams + drop from the discover list
        window.bosCloud.teamMembers(t.id).then(mem => {
          if (app && app.addTeam) app.addTeam({
            cloudId: t.id,
            joined: true,
            name: t.name,
            emblem: t.emblem || "✨",
            accent: "#dbe9ff",
            vis: t.vis,
            goal: "Общая цель",
            target: t.goalTarget || 0,
            current: 0,
            unit: "",
            date: "",
            progress: 0,
            members: (mem || []).map(m => ({
              name: m.name || "Участник",
              initials: (m.name || "?").slice(0, 1),
              color: "#cfe1ff",
              avatar: m.avatar,
              pct: 0
            }))
          });
          setList(l => (l || []).filter(x => x.id !== t.id));
        });
      });
    } catch (e) {
      setBusy(b => Object.assign({}, b, {
        [t.id]: false
      }));
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "var(--text-4)",
      padding: "4px 4px 8px"
    }
  }, "\u041E\u0442\u043A\u0440\u044B\u0442\u044B\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u044B \u0440\u044F\u0434\u043E\u043C"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, list.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: "var(--card)",
      borderRadius: 22,
      padding: 14,
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 14,
      background: "var(--card-2)",
      display: "grid",
      placeItems: "center",
      fontSize: 24,
      flexShrink: 0
    }
  }, t.emblem || "✨"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, t.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)",
      marginTop: 2
    }
  }, "\uD83C\uDF10 \u041E\u0442\u043A\u0440\u044B\u0442\u0430\u044F \xB7 ", t.members, " \u0443\u0447\u0430\u0441\u0442.")), /*#__PURE__*/React.createElement("button", {
    onClick: () => join(t),
    disabled: busy[t.id] || requested[t.id],
    className: "tap",
    style: {
      flexShrink: 0,
      background: busy[t.id] || requested[t.id] ? "var(--card-2)" : "#0a0a0a",
      color: busy[t.id] || requested[t.id] ? "var(--text-3)" : "#fff",
      border: 0,
      borderRadius: 999,
      padding: "9px 16px",
      fontSize: 13,
      fontWeight: 600,
      whiteSpace: "nowrap"
    }
  }, requested[t.id] ? "Заявка отправлена" : busy[t.id] ? "…" : "Вступить")))));
}
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
      borderRadius: 22,
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
      borderRadius: 22,
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

// Shared emblem set for teams — a big, tasteful selection (create + settings use the same list).
var TEAM_EMBLEMS = ["✨", "🔥", "🌱", "🌊", "🏔️", "⛰️", "☀️", "🌙", "⭐", "🌈", "🍀", "🌳", "🌸", "🌿", "🚀", "🎯", "🧭", "🏃", "🚴", "🧘", "🏋️", "⚽", "🏀", "🥊", "🏊", "🤸", "💪", "🥇", "🧠", "📚", "💡", "🎓", "♟️", "🪶", "🔮", "🏆", "👑", "💎", "⚡", "🛡️", "🗝️", "🧩", "❤️", "🤝", "🫶", "🌟", "🎵", "🎨", "🌍", "⚓"];
function bosConfirmExitTeam({
  app,
  team,
  isOwner,
  navigate,
  openSheet
}) {
  openSheet(/*#__PURE__*/React.createElement(ConfirmActionSheet, {
    emoji: isOwner ? "🗑️" : "👋",
    title: isOwner ? "Удалить команду?" : "Покинуть команду?",
    message: isOwner ? "Команда «" + (team?.name || "") + "» и весь её прогресс исчезнут у всех участников. Это не отменить." : "Ты выйдешь из «" + (team?.name || "") + "». Снова войти можно будет только по приглашению.",
    confirmLabel: isOwner ? "Удалить команду" : "Покинуть",
    confirmIcon: isOwner ? I.Trash : I.Logout,
    onConfirm: async () => {
      await bosExitTeam({
        app,
        team,
        isOwner
      });
      navigate("community");
    }
  }));
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
  // REFERRAL invite: every inviter gets their OWN link (?team=<id>&ref=<myUid>) so the
  // referral system can credit who brought a new member. The ref is resolved async from
  // the cloud uid; until it arrives we show the plain ?team link (still joins correctly).
  // Demo/local-only teams (no cloudId) keep the placeholder ?join link — no referral.
  var base = typeof location !== "undefined" ? location.origin + location.pathname : "https://mind3scape.github.io/balanceos/";
  var baseTeamLink = team?.cloudId ? base + "?team=" + team.cloudId : base + "?join=" + (team?._id || "");
  var [link, setLink] = React.useState(baseTeamLink);
  React.useEffect(() => {
    var on = true;
    if (team?.cloudId && window.bosCloud && window.bosCloud.uid) {
      window.bosCloud.uid().then(id => {
        if (on && id) setLink(base + "?team=" + team.cloudId + "&ref=" + id);
      }).catch(() => {});
    } else {
      setLink(baseTeamLink);
    }
    return () => {
      on = false;
    };
  }, [team?.cloudId]);
  var shareText = "Вести привычки вместе — веселее, и за совместные привычки больше XP ✨ Залетай в команду «" + (team?.name || "") + "» в BalanceOS";
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
  var shareTelegram = () => {
    var url = "https://t.me/share/url?url=" + encodeURIComponent(link) + "&text=" + encodeURIComponent(shareText);
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
    // Inside Telegram Mini App, openTelegramLink keeps it in-app; otherwise open a tab.
    try {
      if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(url);
        return;
      }
    } catch (e) {}
    try {
      window.open(url, "_blank");
    } catch (e) {}
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
      borderRadius: 22,
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
      marginTop: 6,
      maxWidth: 290,
      marginInline: "auto",
      lineHeight: 1.45
    }
  }, "\u0412\u0435\u0441\u0442\u0438 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438 \u0432\u043C\u0435\u0441\u0442\u0435 \u2014 \u0432\u0435\u0441\u0435\u043B\u0435\u0435, \u0438 \u0437\u0430 \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u044B\u0435 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438 \u0431\u043E\u043B\u044C\u0448\u0435 XP \u2728"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      marginTop: 10,
      fontSize: 11.5,
      fontWeight: 600,
      color: "var(--text-3)",
      background: "var(--surface-3)",
      padding: "4px 11px",
      borderRadius: 999
    }
  }, isPublic ? "🌐 Открытая · ссылка ведёт прямо в команду" : "🔒 Приватная · войдут только по этой ссылке")), /*#__PURE__*/React.createElement("div", {
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
      background: "#0a0a0a",
      color: "#fff",
      borderRadius: 999,
      padding: "8px 15px",
      fontSize: 12.5,
      fontWeight: 600
    }
  }, copied ? "Готово" : "Копировать")), /*#__PURE__*/React.createElement("button", {
    onClick: copyLink,
    className: "tap",
    style: {
      width: "100%",
      marginTop: 12,
      border: 0,
      borderRadius: 999,
      padding: 14,
      background: "#0a0a0a",
      color: "#fff",
      fontSize: 15,
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 17,
      lineHeight: 1
    }
  }, "\uD83D\uDD17"), " ", copied ? "Ссылка скопирована" : "Скопировать ссылку"), /*#__PURE__*/React.createElement("button", {
    onClick: shareTelegram,
    className: "tap",
    style: {
      width: "100%",
      marginTop: 8,
      border: 0,
      borderRadius: 999,
      padding: 14,
      background: "#229ED9",
      color: "#fff",
      fontSize: 15,
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(I.Send, {
    size: 18
  }), " \u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F \u0432 Telegram"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: "max(8px, var(--tg-bottom-inset, 0px))"
    }
  }));
}
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
      borderRadius: 14,
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
/* D4 helpers — a stable colour per user id, and HH:MM from an ISO timestamp. */
function bosUserColor(id) {
  var str = "" + (id || ""),
    s = 0;
  for (var i = 0; i < str.length; i++) s = s * 31 + str.charCodeAt(i) >>> 0;
  var pal = ["#F4A574", "#74CFE0", "#7FB3F2", "#76D3A0", "#C9A0E8", "#E89BC0", "#7BD0C4", "#F2B66B"];
  return pal[s % pal.length];
}
function bosMsgTime(iso) {
  try {
    var d = new Date(iso);
    return d.getHours() + ":" + ("0" + d.getMinutes()).slice(-2);
  } catch (e) {
    return "";
  }
}

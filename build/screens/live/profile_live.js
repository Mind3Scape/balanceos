/* PROFILE + AI — LIVE-only forks (real Telegram user, app.mode === "live" is
   ALWAYS true here). The demo ("Павел") and fresh branches are stripped: no
   curated level 7 / 72% / 1240 XP, no scripted "Павел Хиллсон" header, no demo
   orbit faces, no fresh Apple-Health intro, no scripted "Павел" insights /
   patterns / sparkline. Everything is real — real level/XP via bosLiveXPLive +
   bosLevelInfoLive, the real OrbitField with your invited people, real achievements,
   and the honest AI hub driven by app.aiBrief.

   Reuses the shared core/ toolkit (OrbitField, SysCard, SysBtn, AvatarPickerSheet,
   EditProfileSheet, InfoSheet, useAIT, buildQuickPrompts) + framework
   (PageHeader, BosAvatar, BosOrbFace, SiriOrb, I, hooks useApp/useNav/useSheet,
   every bos* helper, BOS_ACHIEVEMENTS_LIVE, tintFromMood).

   TYPOGRAPHY: primary labels (user name, section/row primary titles, list-item
   primary text) carry iOS Headline weight (fontWeight: 600 / 700) — matching the
   «Следующие шаги» pills. Secondary/caption text is left untouched.

   The ONLY new top-level declarations in this file are `function ProfileLive`
   and `function AILive`. */

function ProfileLive() {
  var {
    navigate
  } = useNav();
  var app = typeof useApp === "function" ? useApp() : null;
  var {
    open: openSheet
  } = useSheet();
  var openAvatar = () => openSheet(/*#__PURE__*/React.createElement(AvatarPickerSheetLive, {
    dark: app?.themeOverride === "dark"
  }));
  // LIVE: always real data.
  var _xp = bosLiveXPLive(app);
  var _li = bosLevelInfoLive(_xp);
  var lvlNum = _li.level;
  var lvlPct = _li.pct;

  // Real multiplayer: pull the people you've actually invited (referral circle) from
  // the cloud and put them on your orbit — PLUS the person who invited YOU (myInviter),
  // so a newcomer's orbit is never empty: the bridge works both ways from day one.
  var [livePeople, setLivePeople] = React.useState([]);
  React.useEffect(() => {
    var on = true;
    try {
      if (window.bosCloud && window.bosCloud.enabled()) {
        var _mk = p => ({
          avatar: p && p.avatar || "default",
          name: p && (p.username || p.name) || ""
        });
        Promise.all([window.bosCloud.invitedPeople().catch(() => []), (window.bosCloud.myInviter ? window.bosCloud.myInviter() : Promise.resolve(null)).catch(() => null)]).then(([list, inv]) => {
          if (!on) return;
          var out = (Array.isArray(list) ? list : []).map(_mk);
          if (inv && inv.username) out.unshift(_mk(inv)); // зовущий — первым, ближе всех
          setLivePeople(out);
        }).catch(() => {});
      }
    } catch (e) {}
    return () => {
      on = false;
    };
  }, []);
  var orbitPeople = livePeople;

  // Publish MY public ORBIT (level + habit icons + people count) so my system shows REAL to others in
  // «Вселенная» — their orbits with my habits/people, как у меня (David). World-readable; no-ops until
  // David adds the pub_orbit column. Only emoji+colour leave the device (no habit names). Re-publishes
  // when anything changes via a small signature string.
  // Скрытые копии привычек круга (shelved, Г) и goalOnly не светятся ни на орбите, ни в витрине.
  var _visHabits = (app?.habits || []).filter(h => !h.shelved && !h.goalOnly);
  var _pubHabits = _visHabits.map(h => ({
    e: h.emoji,
    c: h.color
  }));
  var _pubSig = JSON.stringify(_pubHabits) + "|" + orbitPeople.length + "|" + lvlNum + "|" + lvlPct + "|" + (app?.goals || []).length;
  React.useEffect(() => {
    try {
      if (window.bosCloud && window.bosCloud.enabled() && window.bosCloud.savePublicStats) window.bosCloud.savePublicStats({
        level: lvlNum,
        lvlPct: lvlPct,
        habits: _pubHabits,
        goals: (app?.goals || []).length,
        people: orbitPeople.length
      });
    } catch (e) {}
  }, [_pubSig]);

  // Achievements badge — REAL earned set + emojis.
  var _liveAch = bosEarnedAchievementsLive(app).filter(a => a.earned);
  var _achTotal = BOS_ACHIEVEMENTS_LIVE.length;
  var _achEarnedN = _liveAch.length;
  var _achEmojis = _liveAch.slice(0, 3).map(a => a.i);
  var _achCircles = livePeople.length;
  var isDark = app?.themeOverride === "dark";
  var [universeOpen, setUniverseOpen] = React.useState(false); // зум-аут в «Вселенную»
  // Единый ЦЕЛОСТНЫЙ переход: меряем твою орбиту на «Я» и отдаём её рект во Вселенную — она стартует
  // ровно отсюда и плавно отдаляется к множеству систем (David: «ощущение перехода ОТ нашей системы»).
  var orbitRef = React.useRef(null);
  var [universeFrom, setUniverseFrom] = React.useState(null);
  var openUniverse = () => {
    try {
      var r = orbitRef.current && orbitRef.current.getBoundingClientRect();
      setUniverseFrom(r && r.width ? {
        cx: r.left + r.width / 2,
        cy: r.top + r.height / 2,
        w: r.width,
        h: r.height,
        size: Math.min(r.width, r.height)
      } : null);
    } catch (e) {
      setUniverseFrom(null);
    }
    setUniverseOpen(true);
  };
  var statCard = isDark ? {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)"
  } : {
    background: "#fff",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
  };
  // Grouped iOS-style menu (v280): plain render-fn so re-renders never remount the rows.
  var chip = icon => /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-chip-bg",
    style: {
      width: 32,
      height: 32,
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(icon, {
    size: 16,
    color: "var(--text)"
  }));
  var navRow = (icon, label, id, last) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => navigate(id, {
      from: "profile"
    }),
    className: "tap",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      width: "100%",
      background: "transparent",
      border: 0,
      borderBottom: last ? "none" : "0.5px solid var(--line)",
      cursor: "pointer",
      textAlign: "left",
      padding: "13px 14px"
    }
  }, chip(icon), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 16,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, label), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18,
    className: "bos-sys-text-2"
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    onBack: () => navigate("home"),
    title: "",
    right: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: openUniverse,
      className: "tap",
      "aria-label": "\u0412\u0441\u0435\u043B\u0435\u043D\u043D\u0430\u044F",
      title: "\u0412\u0441\u0435\u043B\u0435\u043D\u043D\u0430\u044F",
      style: {
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: 0,
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        color: isDark ? "#fff" : "var(--text)",
        background: (typeof BOS_TILE_SHEEN !== "undefined" ? BOS_TILE_SHEEN + ", " : "") + (isDark ? "rgba(255,255,255,0.10)" : "var(--surface-3)"),
        boxShadow: typeof bosTileGlass === "function" ? bosTileGlass(isDark) : "none"
      }
    }, /*#__PURE__*/React.createElement(I.Galaxy, {
      size: 18,
      strokeWidth: 1.8
    })), typeof EditGlassButtonLive === "function" ? /*#__PURE__*/React.createElement(EditGlassButtonLive, {
      onClick: openAvatar
    }) : null)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: orbitRef,
    style: {
      opacity: universeOpen ? 0 : 1,
      transition: "opacity 0.2s ease"
    }
  }, /*#__PURE__*/React.createElement(OrbitField, {
    avatar: app?.avatar,
    name: app?.userName,
    habits: _visHabits,
    people: orbitPeople,
    levelPct: lvlPct,
    moodC: app?.mood?.c,
    dark: app?.themeOverride === "dark",
    hideLevelArc: true,
    editable: false,
    levelBadge: lvlNum
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--bos-title-font)",
      fontWeight: 700,
      fontSize: 28,
      marginTop: 6,
      color: "var(--text)"
    }
  }, app?.userName || "Ты")), universeOpen && typeof UniverseFieldLive === "function" && /*#__PURE__*/React.createElement(UniverseFieldLive, {
    app: app,
    people: orbitPeople,
    from: universeFrom,
    onClose: () => setUniverseOpen(false)
  }), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-card",
    style: {
      marginTop: 16,
      padding: 0,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("levels", {
      from: "profile"
    }),
    className: "tap",
    style: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: "transparent",
      border: 0,
      cursor: "pointer",
      textAlign: "left",
      padding: "13px 14px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      width: 40,
      height: 40,
      flexShrink: 0,
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "40",
    height: "40",
    viewBox: "0 0 40 40",
    style: {
      position: "absolute",
      inset: 0,
      transform: "rotate(-90deg)",
      transformBox: "fill-box",
      transformOrigin: "center"
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "20",
    cy: "20",
    r: "18",
    fill: "none",
    stroke: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)",
    strokeWidth: "2.5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "20",
    cy: "20",
    r: "18",
    fill: "none",
    stroke: "url(#bosLvlRing)",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeDasharray: "113.1",
    strokeDashoffset: 113.1 * (1 - Math.max(0, Math.min(100, lvlPct)) / 100)
  }), /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "bosLvlRing",
    x1: "0",
    y1: "0",
    x2: "1",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0",
    stopColor: "#FEDE34"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "1",
    stopColor: "#EF9F14"
  })))), /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-chip-bg",
    style: {
      width: 30,
      height: 30,
      borderRadius: "50%",
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(I.Sparkles, {
    size: 15,
    color: "var(--text)"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, "\u0423\u0440\u043E\u0432\u0435\u043D\u044C ", lvlNum), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 12.5,
      marginTop: 1
    }
  }, "\u0414\u043E ", lvlNum + 1, " \u0443\u0440\u043E\u0432\u043D\u044F \u2014 ", lvlPct, "% \xB7 ", _xp, " XP")), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18,
    className: "bos-sys-text-2"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("achievements", {
      from: "profile"
    }),
    className: "tap",
    style: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: "transparent",
      border: 0,
      borderTop: "0.5px solid var(--line)",
      cursor: "pointer",
      textAlign: "left",
      padding: "13px 14px"
    }
  }, chip(I.Trophy), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, "\u0414\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u044F"), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 12.5,
      marginTop: 1
    }
  }, _achEarnedN + " из " + _achTotal + (_achEarnedN === 0 ? " · открой первую" : ""))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      marginRight: 4
    }
  }, _achEmojis.map((e, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 24,
      height: 24,
      borderRadius: 7,
      background: "var(--card-2)",
      display: "grid",
      placeItems: "center",
      fontSize: 12,
      marginLeft: i ? -7 : 0,
      border: "1.5px solid var(--card)"
    }
  }, e))), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18,
    className: "bos-sys-text-2"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("friends", {
      from: "profile"
    }),
    className: "tap",
    style: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: "transparent",
      border: 0,
      borderTop: "0.5px solid var(--line)",
      cursor: "pointer",
      textAlign: "left",
      padding: "13px 14px"
    }
  }, chip(I.Users), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, "\u0414\u0440\u0443\u0437\u044C\u044F"), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 12.5,
      marginTop: 1
    }
  }, livePeople.length > 0 ? livePeople.length + (livePeople.length === 1 ? " человек на орбите" : " на твоей орбите") : "Позови первого — он появится на орбите")), livePeople.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginRight: 4,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(PeopleStackLive, {
    people: livePeople,
    size: 24,
    max: 4
  })), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18,
    className: "bos-sys-text-2"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-card",
    style: {
      marginTop: 12,
      padding: 0,
      overflow: "hidden"
    }
  }, navRow(I.Compass, "Как устроен Balance", "guide"), navRow(I.Settings, "Настройки", "settings"), navRow(I.Bell, "Уведомления", "notifications"), navRow(I.Help, "Поддержка и помощь", "support", true)), /*#__PURE__*/React.createElement(SysBtn, {
    onClick: () => navigate("onboarding", {
      from: "profile"
    }),
    style: {
      marginTop: 12,
      color: "var(--accent-red)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 32,
      height: 32,
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      background: "rgba(239,68,68,0.12)"
    }
  }, /*#__PURE__*/React.createElement(I.Logout, {
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 16,
      fontWeight: 600
    }
  }, "\u0412\u044B\u0439\u0442\u0438")), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      textAlign: "center",
      padding: "18px 14px 4px",
      fontSize: 12.5,
      opacity: 0.85
    }
  }, "\u0421\u0434\u0435\u043B\u0430\u043D\u043E \u0441 \uD83D\uDC9B"));
}
function AILive() {
  var {
    navigate
  } = useNav();
  var app = useApp();
  var {
    open: openSheet
  } = useSheet();
  var t = useAIT();
  var [ask, setAsk] = useP("");
  // Same orb DNA as intro — pulled into the AI hub
  var orbTint = ["#cfe1ff", "#7aa4d0", "#1a2c48"];

  // ── LIVE user: a REAL coach hub, driven by live data + the AI login-brief ──
  // Everything below is computed from THIS person's own habits, state, XP and the
  // brief the AI generated for them at login. No scripted "Павел" insights.
  var isDarkAI = app.themeOverride === "dark"; // тёмная тема: тёмное стекло кнопки/чипов
  var brief = app.aiBrief || null;
  var liveHabits = (app.habits || []).filter(h => !h.shelved && !h.goalOnly);
  var doneToday = liveHabits.filter(h => h && h.done).length;
  var maxStreak = typeof bosMaxStreak === "function" ? bosMaxStreak(liveHabits) : 0;
  var liveXP = typeof bosLiveXPLive === "function" ? bosLiveXPLive(app) : 0;
  var lvl = typeof bosLevelInfoLive === "function" ? bosLevelInfoLive(liveXP) : {
    level: 1
  };
  var moodName = app.mood && app.mood.t || "";
  var moodIcon = app.mood && app.mood.i || "";
  // ONE real line about the user today: prefer the AI brief summary; otherwise
  // derive a specific, TRUE line from their actual completion / streak / state.
  var briefSummary = brief && brief.summary && ("" + brief.summary).trim() || "";
  // A brand-new live user (no habits AND no real brief) gets an HONEST empty
  // state below — a check-in / start-chatting invite, never invented advice.
  var isBlank = liveHabits.length === 0 && !briefSummary;

  // The hero orb tint follows the user's CURRENT state colour — the same mood tint
  // the home hero orb uses (tintFromMood(app.mood.c)) — so it reads as "you, right now".
  var moodC = app.mood && app.mood.c;
  var liveTint = moodC && typeof tintFromMood === "function" ? tintFromMood(moodC) : orbTint;
  var headline = briefSummary;
  if (!headline) {
    if (doneToday > 0 && liveHabits.length) headline = "Сегодня закрыто " + doneToday + " из " + liveHabits.length + ". Хороший темп — давай удержим его.";else if (maxStreak >= 2) headline = "Твоя серия — " + maxStreak + " дн. подряд. Одно небольшое действие сейчас её продлит.";else if (liveHabits.length) headline = "Новый день начался. Выбери одну привычку, с которой стартуешь.";else if (moodName) headline = "Состояние сейчас — «" + moodName + "». Начнём с одного маленького шага под него.";else headline = "Я рядом. Расскажи, как ты, — и наметим один маленький шаг на сегодня.";
  }
  // The brief's optional one-line next-step hint, shown softly under the headline.
  var hint = brief && brief.hint && ("" + brief.hint).trim() || "";

  // Real next-step suggestions = the brief pills ({ i: emoji, t: text }). The pill
  // text doubles as the chat prompt — the same contract the chat itself uses.
  // Fallback to context-aware prompts so a returning user never sees an empty list.
  var pills = brief && Array.isArray(brief.pills) && brief.pills.length ? brief.pills.slice(0, 4) : [];
  if (!pills.length && !isBlank && typeof buildQuickPrompts === "function") pills = buildQuickPrompts(app).slice(0, 4);
  // МИКС гарантирован (David): 1-2 чипа → реальный функционал, 1-2 → чат.
  if (!isBlank && typeof bosMixPillsLive === "function") pills = bosMixPillsLive(pills, app);
  var planPrompt = "Помоги составить простой план на сегодня по моим привычкам.";

  // «Следующие шаги» route to REAL features, not always the chat. New pills carry
  // { label, kind:"action"|"chat", route?, params?, prompt? }. action → open that
  // screen; chat → open the chat primed with prompt. Legacy/string pills (the old
  // { i, t } brief shape) gracefully fall back to a chat entry on their text.
  var pillLabel = p => typeof p === "string" ? p : p && (p.label || p.t) || "";
  var goPill = p => {
    if (p && p.kind === "action" && p.route) return navigate(p.route, p.params || {});
    if (p && p.kind === "chat") return navigate("ai-chat", {
      prompt: p.prompt || pillLabel(p)
    });
    navigate("ai-chat", {
      prompt: pillLabel(p)
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 12px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "4px 4px 14px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      letterSpacing: 0.4
    }
  }, (app.userName || "").trim() ? "Персонально · для " + app.userName.trim() : "Твой помощник"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: "var(--text)",
      letterSpacing: "-0.5px",
      marginTop: 2
    }
  }, "Balance AI")), /*#__PURE__*/React.createElement("div", {
    "data-tour": "ai-hero",
    style: {
      background: "var(--card)",
      borderRadius: 22,
      padding: "15px 16px",
      boxShadow: "var(--card-shadow)",
      display: "flex",
      gap: 14,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      width: 64,
      height: 64,
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "-80 -80 160 160",
    width: "64",
    height: "64",
    style: {
      overflow: "visible"
    }
  }, /*#__PURE__*/React.createElement(SiriOrb, {
    r: 46,
    tint: liveTint,
    t: t,
    intensity: 1
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-4)",
      fontWeight: 700,
      letterSpacing: 1.2,
      textTransform: "uppercase"
    }
  }, moodName ? "Сейчас · " + (moodIcon ? moodIcon + " " : "") + moodName : "Сегодня"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--bos-title-font)",
      fontSize: 14.5,
      lineHeight: 1.4,
      marginTop: 5,
      letterSpacing: "-0.2px",
      color: "var(--text)"
    }
  }, headline), hint && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-4)",
      marginTop: 4,
      lineHeight: 1.45
    }
  }, hint))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 22,
      padding: 10,
      marginTop: 10,
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "0 2px 0 8px"
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: ask,
    onChange: e => setAsk(e.target.value),
    placeholder: "\u0421\u043F\u0440\u043E\u0441\u0438\u0442\u044C Balance AI\u2026",
    onKeyDown: e => e.key === "Enter" && navigate("ai-chat", ask.trim() ? {
      prompt: ask
    } : {}),
    style: {
      flex: 1,
      border: 0,
      outline: 0,
      background: "transparent",
      color: "var(--text)",
      fontSize: 14,
      padding: "8px 4px"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("ai-chat", ask.trim() ? {
      prompt: ask
    } : {}),
    className: "tap hit44",
    "aria-label": "\u0421\u043F\u0440\u043E\u0441\u0438\u0442\u044C",
    style: {
      width: 34,
      height: 34,
      borderRadius: "50%",
      background: isDarkAI ? "#f2f2f5" : "#0a0a0a",
      border: 0,
      color: isDarkAI ? "#0a0a0a" : "#fff",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(I.Send, {
    size: 13
  })))), !isBlank && pills.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 18,
      color: "var(--text-3)",
      padding: "0 4px"
    }
  }, "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0435 \u0448\u0430\u0433\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 22,
      boxShadow: "var(--card-shadow)",
      overflow: "hidden",
      marginTop: 8
    }
  }, pills.slice(0, 4).map((p, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => goPill(p),
    className: "tap",
    "data-no-haptic": true,
    style: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: "transparent",
      border: 0,
      borderTop: i ? "0.5px solid var(--line)" : 0,
      cursor: "pointer",
      textAlign: "left",
      padding: "13px 14px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 32,
      height: 32,
      borderRadius: "50%",
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      fontSize: 15,
      background: (typeof BOS_TILE_SHEEN === "string" ? BOS_TILE_SHEEN + ", " : "") + (isDarkAI ? "rgba(255,255,255,0.08)" : "var(--surface-3)"),
      boxShadow: typeof bosTileGlass === "function" ? bosTileGlass(isDarkAI) : "none"
    }
  }, p && p.i || "✨"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, pillLabel(p)), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    color: "var(--text-4)"
  }))))), isBlank ?
  /*#__PURE__*/
  /* HONEST empty state for a brand-new live user — no fake recommendations.
     Two real first steps: check in your state, or just start a conversation. */
  React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("mood"),
    className: "tap",
    style: {
      width: "100%",
      marginTop: 12,
      background: "var(--card)",
      border: 0,
      borderRadius: 22,
      padding: 16,
      boxShadow: "var(--card-shadow)",
      display: "flex",
      alignItems: "center",
      gap: 13,
      textAlign: "left",
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 46,
      height: 46,
      borderRadius: 14,
      background: "linear-gradient(135deg,#e9f1ff,#cfe1ff)",
      display: "grid",
      placeItems: "center",
      fontSize: 22,
      flexShrink: 0
    }
  }, "\uD83E\uDDED"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 600
    }
  }, "\u041E\u0442\u043C\u0435\u0442\u0438\u0442\u044C \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-4)",
      marginTop: 2,
      lineHeight: 1.45
    }
  }, "\u041F\u0430\u0440\u0430 \u0441\u0435\u043A\u0443\u043D\u0434 \u2014 \u0438 \u0441\u043E\u0432\u0435\u0442\u044B \u043D\u0430\u0447\u043D\u0443\u0442 \u043F\u043E\u0434\u0441\u0442\u0440\u0430\u0438\u0432\u0430\u0442\u044C\u0441\u044F \u043F\u043E\u0434 \u0442\u0435\u0431\u044F.")), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18,
    color: "var(--text-4)"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("ai-chat", {
      prompt: "Расскажу немного о себе и своих целях"
    }),
    className: "tap",
    style: {
      width: "100%",
      marginTop: 10,
      background: "var(--card)",
      border: 0,
      borderRadius: 22,
      padding: 16,
      boxShadow: "var(--card-shadow)",
      display: "flex",
      alignItems: "center",
      gap: 13,
      textAlign: "left",
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 46,
      height: 46,
      borderRadius: 14,
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
  }, "\u0420\u0430\u0441\u0441\u043A\u0430\u0437\u0430\u0442\u044C \u043E \u0441\u0435\u0431\u0435"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-4)",
      marginTop: 2,
      lineHeight: 1.45
    }
  }, "\u041F\u0430\u0440\u0430 \u043C\u0438\u043D\u0443\u0442 \u2014 \u0438 \u0418\u0418 \u0443\u0437\u043D\u0430\u0435\u0442 \u0442\u0432\u043E\u0438 \u0446\u0435\u043B\u0438 \u0438 \u0440\u0438\u0442\u043C \u0434\u043D\u044F.")), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18,
    color: "var(--text-4)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 18,
      padding: "0 24px",
      lineHeight: 1.5
    }
  }, "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0438 \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F \u0437\u0434\u0435\u0441\u044C, \u043A\u0430\u043A \u0442\u043E\u043B\u044C\u043A\u043E \u043D\u0430\u0431\u0435\u0440\u0451\u0442\u0441\u044F \u043D\u0435\u043C\u043D\u043E\u0433\u043E \u0442\u0432\u043E\u0438\u0445 \u0434\u0430\u043D\u043D\u044B\u0445.")) : null, /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 18,
      color: "var(--text-3)",
      padding: "0 4px"
    }
  }, "\u0421\u043A\u043E\u0440\u043E \u0432 Balance AI"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginTop: 8
    }
  }, [{
    i: "📊",
    t: "Аналитика",
    need: 10,
    d: "Твои закономерности: что качает, а что мешает.",
    details: [["📈", "Что качает энергию", "Какие привычки реально двигают серию и настроение — по твоим отметкам."], ["🕳", "Где проседает", "Дни и связки, на которых чаще всего рвётся ритм."], ["🧩", "Связки привычек", "Что с чем работает в паре — и что стоит переставить."]]
  }, {
    i: "🧠",
    t: "Наставник",
    need: 15,
    d: "Личная программа и разбор недели.",
    details: [["🗺", "Программа под тебя", "Личный план на неделю из твоих целей и ритма."], ["🔍", "Разбор недели", "Что получилось, что нет и почему — раз в неделю, честно."], ["⚡", "Челленджи под ритм", "Персональные вызовы там, где тебе по силам расти."]]
  }].map(f => {
    var unlocked = lvl.level >= f.need;
    var pct = Math.max(6, Math.min(100, Math.round(lvl.level / f.need * 100)));
    var chipBg = (typeof BOS_TILE_SHEEN === "string" ? BOS_TILE_SHEEN + ", " : "") + (isDarkAI ? "rgba(255,255,255,0.08)" : "var(--surface-3)");
    var glass = typeof bosTileGlass === "function" ? bosTileGlass(isDarkAI) : "none";
    var openDetails = () => openSheet(/*#__PURE__*/React.createElement("div", {
      style: {
        padding: "2px 18px 8px",
        color: "var(--text)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        marginBottom: 14
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 56,
        height: 56,
        borderRadius: 18,
        background: chipBg,
        boxShadow: glass,
        display: "grid",
        placeItems: "center",
        fontSize: 27
      }
    }, f.i), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 20,
        fontWeight: 800,
        letterSpacing: "-0.3px",
        marginTop: 10
      }
    }, f.t), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: "var(--text-3)",
        marginTop: 4
      }
    }, unlocked ? "Готовим к запуску — ты уже открыл" : "Откроется на " + f.need + " уровне · у тебя " + lvl.level + "-й")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, f.details.map((d, j) => /*#__PURE__*/React.createElement("div", {
      key: j,
      style: {
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: 13,
        borderRadius: 18,
        background: isDarkAI ? "rgba(255,255,255,0.06)" : "var(--surface-2)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 34,
        height: 34,
        borderRadius: 11,
        background: chipBg,
        boxShadow: glass,
        display: "grid",
        placeItems: "center",
        fontSize: 16,
        flexShrink: 0
      }
    }, d[0]), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14.5,
        fontWeight: 600
      }
    }, d[1]), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: "var(--text-4)",
        marginTop: 2,
        lineHeight: 1.45
      }
    }, d[2]))))), !unlocked && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: 6,
        borderRadius: 999,
        background: isDarkAI ? "rgba(255,255,255,0.10)" : "var(--surface-3)",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        height: "100%",
        width: pct + "%",
        background: "linear-gradient(135deg,#FEDE34,#EF9F14)",
        borderRadius: 999
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "var(--text-4)",
        marginTop: 6,
        fontWeight: 600,
        textAlign: "center"
      }
    }, "\u0423\u0440\u043E\u0432\u0435\u043D\u044C ", lvl.level, " \u0438\u0437 ", f.need, " \u2014 \u043A\u0430\u0436\u0434\u0430\u044F \u043E\u0442\u043C\u0435\u0442\u043A\u0430 \u043F\u0440\u0438\u0431\u043B\u0438\u0436\u0430\u0435\u0442"))));
    return /*#__PURE__*/React.createElement("button", {
      key: f.t,
      onClick: openDetails,
      className: "tap",
      style: {
        textAlign: "left",
        border: 0,
        cursor: "pointer",
        borderRadius: 22,
        padding: 15,
        background: "var(--card)",
        boxShadow: "var(--card-shadow)",
        color: "var(--text)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 40,
        height: 40,
        borderRadius: 13,
        background: chipBg,
        boxShadow: glass,
        display: "grid",
        placeItems: "center",
        fontSize: 20
      }
    }, f.i), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10.5,
        fontWeight: 700,
        color: "var(--text-3)",
        background: isDarkAI ? "rgba(255,255,255,0.08)" : "var(--surface-3)",
        borderRadius: 999,
        padding: "4px 9px"
      }
    }, unlocked ? "✨ скоро" : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(I.Lock, {
      size: 10,
      strokeWidth: 2.4
    }), " ", f.need, " \u0443\u0440."))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 700,
        marginTop: 12,
        letterSpacing: "-0.2px"
      }
    }, f.t), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "var(--text-4)",
        marginTop: 3,
        lineHeight: 1.4
      }
    }, f.d), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 11
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: 5,
        borderRadius: 999,
        background: isDarkAI ? "rgba(255,255,255,0.10)" : "var(--surface-3)",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        height: "100%",
        width: pct + "%",
        background: isDarkAI ? "#f2f2f5" : "#0a0a0a",
        borderRadius: 999
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "var(--text-4)",
        marginTop: 5,
        fontWeight: 600
      }
    }, unlocked ? "Готовим к запуску" : "Уровень " + lvl.level + " / " + f.need + " · подробнее ›")));
  })));
}

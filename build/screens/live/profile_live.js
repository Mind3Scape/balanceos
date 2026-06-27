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
  var openAvatar = () => openSheet(/*#__PURE__*/React.createElement(AvatarPickerSheet, {
    dark: app?.themeOverride === "dark"
  }));
  // LIVE: always real data.
  var _xp = bosLiveXPLive(app);
  var _li = bosLevelInfoLive(_xp);
  var lvlNum = _li.level;
  var lvlPct = _li.pct;

  // Real multiplayer: pull the people you've actually invited (referral circle) from
  // the cloud and put them on your orbit.
  var [livePeople, setLivePeople] = React.useState([]);
  React.useEffect(() => {
    var on = true;
    try {
      if (window.bosCloud && window.bosCloud.enabled()) {
        window.bosCloud.invitedPeople().then(list => {
          if (on && Array.isArray(list)) setLivePeople(list.map(p => ({
            avatar: p && p.avatar || "default"
          })));
        }).catch(() => {});
      }
    } catch (e) {}
    return () => {
      on = false;
    };
  }, []);
  var orbitPeople = livePeople;

  // Achievements badge — REAL earned set + emojis.
  var _liveAch = bosEarnedAchievementsLive(app).filter(a => a.earned);
  var _achTotal = BOS_ACHIEVEMENTS_LIVE.length;
  var _achEarnedN = _liveAch.length;
  var _achEmojis = _liveAch.slice(0, 3).map(a => a.i);
  var _achCircles = livePeople.length;
  var isDark = app?.themeOverride === "dark";
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
    size: 16
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
    title: ""
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(OrbitField, {
    avatar: app?.avatar,
    habits: app?.habits || [],
    people: orbitPeople,
    levelPct: lvlPct,
    onTap: openAvatar,
    moodC: app?.mood?.c,
    dark: app?.themeOverride === "dark"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      marginTop: 2,
      background: "#0a0a0a",
      color: "#FEDE34",
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: 0.3,
      padding: "4px 12px",
      borderRadius: 999
    }
  }, /*#__PURE__*/React.createElement(I.Sparkles, {
    size: 11
  }), " \u0423\u0440\u043E\u0432\u0435\u043D\u044C ", lvlNum), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--bos-title-font)",
      fontWeight: 700,
      fontSize: 28,
      marginTop: 14,
      color: "var(--text)"
    }
  }, app?.userName || "Ты"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(StatTrioLive, {
    isDark: isDark,
    card: statCard,
    items: [{
      l: "Уровень",
      v: lvlNum,
      icon: /*#__PURE__*/React.createElement(I.Trophy, {
        size: 14,
        color: "var(--text-4)"
      })
    }, {
      l: "До " + (lvlNum + 1) + " ур.",
      v: lvlPct,
      suf: "%",
      icon: /*#__PURE__*/React.createElement(I.ChartBar, {
        size: 14,
        color: "var(--text-4)"
      })
    }, {
      l: "Опыт",
      v: _xp,
      icon: /*#__PURE__*/React.createElement(I.Sparkles, {
        size: 14,
        color: "var(--text-4)"
      })
    }]
  }))), /*#__PURE__*/React.createElement(SysCard, {
    className: "tap",
    onClick: () => navigate("achievements", {
      from: "profile"
    }),
    style: {
      marginTop: 22,
      padding: 14,
      display: "flex",
      alignItems: "center",
      gap: 13,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 42,
      height: 42,
      borderRadius: 14,
      background: "rgba(254,222,52,0.16)",
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
      fontSize: 16,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, "\u0414\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u044F"), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 12.5,
      marginTop: 2
    }
  }, _achEarnedN + " из " + _achTotal + (_achCircles > 0 ? " · " + _achCircles + (_achCircles === 1 ? " приглашён" : " приглашено") : _achEarnedN === 0 ? " · открой первую" : ""))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      marginRight: 4
    }
  }, _achEmojis.map((e, i) => /*#__PURE__*/React.createElement("span", {
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
  }, e))), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18,
    className: "bos-sys-text-2"
  })), /*#__PURE__*/React.createElement(SysCard, {
    className: "tap",
    onClick: () => openSheet(/*#__PURE__*/React.createElement(FriendsSheetLive, {
      dark: app?.themeOverride === "dark"
    })),
    style: {
      marginTop: 12,
      padding: 14,
      display: "flex",
      alignItems: "center",
      gap: 13,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 42,
      height: 42,
      borderRadius: 14,
      background: "rgba(95,168,255,0.16)",
      display: "grid",
      placeItems: "center",
      fontSize: 22,
      flexShrink: 0
    }
  }, "\uD83E\uDE90"), /*#__PURE__*/React.createElement("div", {
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
      marginTop: 2
    }
  }, livePeople.length > 0 ? livePeople.length + (livePeople.length === 1 ? " человек на орбите" : " на твоей орбите") : "Позови первого — он появится на орбите")), livePeople.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      marginRight: 4
    }
  }, livePeople.slice(0, 4).map((p, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      marginLeft: i ? -8 : 0
    }
  }, /*#__PURE__*/React.createElement(BosAvatar, {
    avatar: p.avatar,
    size: 26,
    style: {
      border: "1.5px solid var(--card)"
    }
  })))), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 18,
    className: "bos-sys-text-2"
  })), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-card",
    style: {
      marginTop: 12,
      padding: 0,
      overflow: "hidden"
    }
  }, navRow(I.Settings, "Настройки", "settings"), navRow(I.Bell, "Уведомления", "notifications"), navRow(I.Help, "Поддержка и помощь", "support", true)), /*#__PURE__*/React.createElement(SysBtn, {
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
  }, "\u0412\u044B\u0439\u0442\u0438")));
}
function AILive() {
  var {
    navigate
  } = useNav();
  var app = useApp();
  var t = useAIT();
  var [ask, setAsk] = useP("");
  // Same orb DNA as intro — pulled into the AI hub
  var orbTint = ["#cfe1ff", "#7aa4d0", "#1a2c48"];

  // ── LIVE user: a REAL coach hub, driven by live data + the AI login-brief ──
  // Everything below is computed from THIS person's own habits, state, XP and the
  // brief the AI generated for them at login. No scripted "Павел" insights.
  var brief = app.aiBrief || null;
  var liveHabits = app.habits || [];
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
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "4px 4px 14px"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
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
  }, "Balance AI")), /*#__PURE__*/React.createElement("button", {
    "data-tour": "ai-chat-btn",
    onClick: () => navigate("ai-chat"),
    className: "tap",
    style: {
      height: 36,
      padding: "0 14px",
      borderRadius: 999,
      background: "#0a0a0a",
      color: "#fff",
      border: 0,
      fontSize: 13,
      fontWeight: 500,
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(I.MessageCircle, {
    size: 14
  }), " \u0427\u0430\u0442")), /*#__PURE__*/React.createElement("div", {
    "data-tour": "ai-hero",
    style: {
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(160deg, #0e1a2e 0%, #0a1424 100%)",
      borderRadius: 22,
      padding: "22px 22px 24px",
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      background: "radial-gradient(circle at 80% 20%, rgba(180,210,255,0.18) 0%, transparent 40%), radial-gradient(circle at 10% 90%, rgba(120,160,210,0.15) 0%, transparent 40%)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      alignItems: "center",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      width: 112,
      height: 112,
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "-80 -80 160 160",
    width: "112",
    height: "112",
    style: {
      overflow: "visible"
    }
  }, /*#__PURE__*/React.createElement(SiriOrb, {
    r: 42,
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
      fontSize: 11,
      color: "rgba(180,210,255,0.85)",
      fontWeight: 600,
      letterSpacing: 1.4,
      textTransform: "uppercase"
    }
  }, moodName ? "Сейчас · " + (moodIcon ? moodIcon + " " : "") + moodName : "Сегодня"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--bos-title-font)",
      fontSize: 19,
      lineHeight: 1.28,
      marginTop: 6,
      letterSpacing: "-0.3px"
    }
  }, headline), hint && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "rgba(255,255,255,0.7)",
      marginTop: 8,
      lineHeight: 1.5
    }
  }, hint))), !isBlank && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 16,
      position: "relative"
    }
  }, [["Сегодня", liveHabits.length ? doneToday + "/" + liveHabits.length : "—"], ["Серия", maxStreak ? maxStreak + " дн" : "—"], ["Уровень", lvl.level]].map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 14,
      padding: "10px 8px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      letterSpacing: "-0.3px"
    }
  }, s[1]), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "rgba(255,255,255,0.6)",
      marginTop: 2,
      letterSpacing: 0.4
    }
  }, s[0])))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 16,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("ai-chat", {
      prompt: planPrompt
    }),
    className: "tap",
    style: {
      flex: 1,
      background: "var(--card)",
      color: "#0a1424",
      border: 0,
      borderRadius: 999,
      padding: "12px 14px",
      fontSize: 14,
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(I.Sparkles, {
    size: 15
  }), " \u041F\u043E\u0441\u0442\u0440\u043E\u0438\u0442\u044C \u043F\u043B\u0430\u043D"), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("ai-chat"),
    className: "tap",
    style: {
      background: "rgba(255,255,255,0.1)",
      color: "#fff",
      border: "1px solid rgba(255,255,255,0.15)",
      borderRadius: 999,
      padding: "12px 16px",
      fontSize: 14,
      fontWeight: 500,
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(I.MessageCircle, {
    size: 14
  }), " \u041F\u043E\u0433\u043E\u0432\u043E\u0440\u0438\u0442\u044C"))), isBlank ?
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
  }, "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0438 \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F \u0437\u0434\u0435\u0441\u044C, \u043A\u0430\u043A \u0442\u043E\u043B\u044C\u043A\u043E \u043D\u0430\u0431\u0435\u0440\u0451\u0442\u0441\u044F \u043D\u0435\u043C\u043D\u043E\u0433\u043E \u0442\u0432\u043E\u0438\u0445 \u0434\u0430\u043D\u043D\u044B\u0445.")) : (
  /* Real next-step suggestions — the AI brief pills as tappable cards.
     Tap → open the chat already primed with that step. */
  pills.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 18,
      color: "var(--text-3)",
      padding: "0 4px"
    }
  }, "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0435 \u0448\u0430\u0433\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 8
    }
  }, pills.map((p, i) => {
    var isChat = !p || typeof p === "string" || p.kind !== "action";
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      onClick: () => goPill(p),
      className: "tap",
      style: {
        width: "100%",
        background: "var(--card)",
        borderRadius: 22,
        boxShadow: "var(--card-shadow)",
        border: 0,
        padding: 14,
        display: "flex",
        alignItems: "center",
        gap: 12,
        textAlign: "left",
        color: "var(--text)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 44,
        height: 44,
        borderRadius: 14,
        background: "linear-gradient(135deg, #e9f1ff, #cfe1ff)",
        display: "grid",
        placeItems: "center",
        fontSize: 22,
        flexShrink: 0
      }
    }, p && p.i || "✨"), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14.5,
        fontWeight: 600,
        color: "var(--text)"
      }
    }, pillLabel(p)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: "var(--text-4)",
        marginTop: 2,
        lineHeight: 1.45
      }
    }, isChat ? "Обсудить с помощником →" : "Открыть →")), /*#__PURE__*/React.createElement(I.ChevronRight, {
      size: 18,
      color: "var(--text-4)",
      style: {
        flexShrink: 0
      }
    }));
  })))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 18,
      color: "var(--text-3)",
      padding: "0 4px"
    }
  }, "\u0421\u043F\u0440\u043E\u0441\u0438 \u0447\u0442\u043E \u0443\u0433\u043E\u0434\u043D\u043E"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 22,
      padding: 14,
      marginTop: 8,
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "2px 6px"
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
      padding: "10px 6px"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("ai-chat", ask.trim() ? {
      prompt: ask
    } : {}),
    className: "tap hit44",
    style: {
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: "#0a0a0a",
      border: 0,
      color: "#fff",
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(I.Send, {
    size: 14
  })))));
}

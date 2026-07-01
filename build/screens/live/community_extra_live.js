/* COMMUNITY EXTRA — LIVE-only forks of the remaining Community sub-screens (real
   Telegram user, app.mode === "live" is ALWAYS true here). Giving the live user its
   OWN screen files keeps the two demo modes ('demo' / 'fresh') frozen — future live
   edits can never break the showcase. Sibling file: community_live.jsx
   (CommunityLive + TeamDetailLive); this one carries the six detail screens.

   What the demo/fresh branches contributed (all stripped here):
   • TeamCreateLive — the create form is mode-agnostic; the only demo branch was the
     `app?.mode === "live"` guard around mirroring the new team to the cloud — ALWAYS
     true for the live user, so it's hardcoded on (the cloud-enabled + cloudId guards
     stay). The member-picker chips are the form's own roster (all modes), kept.
   • TeamSettingsLive — drops the demo-only SUGGEST invite chips (gated by
     `app?.mode !== "live"` → always false live) and their array. Keeps the real
     "Пригласить по ссылке" referral button (was gated `mode === "live" && cloudId`).
   • LevelsLive — drops every `app?.mode === "demo"` curated number (lvl 7 / 1240 XP /
     980 credits / invited 2 / Павел's achievement array) and collapses the live ternaries
     to the REAL date-keyed XP model (bosLiveXPLive/bosLevelInfoLive), real earned achievements
     (bosEarnedAchievementsLive) and the real referral count (window.bosCloud.invitedPeople).
     The unused `badges` array is dropped; the rewards catalog + circle milestones are kept.
   • CourseDetailLive — no demo branches; faithful fork of the static programme screen.
   • TeamChatLive — `live` is always true, so the demo/fresh SEED conversation (and the
     emoji-placeholder Photo path / m.photo bubbles it fed) is dropped. Cloud chat
     (cloudId) + the local-live persisted history path stay; real photos use RealPhoto.
   • ContactDetailLive — no demo branches; faithful fork (reads its contact from
     useNav().params), with the iOS-Headline typography polish.

   Everything else reuses the shared globals already defined in community.jsx +
   app-wide (PageHeader, Switch, Segmented, SysCard, AvatarStack, BosAvatar, ShareAppSheet,
   TEAM_EMBLEMS, SplitEditor, DurationPicker, ConfirmActionSheet, TeamShareSheet,
   bosConfirmExitTeam, bosCompressImage, bosUserColor, bosMsgTime, BOS_TEAM_PALETTE,
   the icon object I, the bos* XP helpers, window.bosCloud, hooks useApp/useNav/useSheet,
   and useCS = React.useState). The ONLY new top-level declarations in this file are
   TeamCreateLive, TeamSettingsLive, LevelsLive, CourseDetailLive, TeamChatLive and
   ContactDetailLive. */

function TeamCreateLive() {
  var {
    navigate,
    params
  } = useNav();
  var app = useApp();
  var {
    open: openSheet
  } = useSheet();
  // Quick-add team preset (from the Команды tab chip) → {i,t,accent,goalType,goalTitle,target,unit}.
  // Seeds name/emblem/accent + the goal config, so a chip like «30 дней спорта» opens pre-filled.
  var preset = params?.preset || null;
  var [name, setName] = useCS(preset?.t || "");
  var [emblem, setEmblem] = useCS(preset?.i || "✨");
  var [accent, setAccent] = useCS(preset?.accent || BOS_GREY); // neutral GREY default (David: «дефолтный цвет серый»); a chip preset overrides it
  var [duration, setDuration] = useCS("month");
  var [vis, setVis] = useCS("private");
  var [saving, setSaving] = useCS(false);

  // Goal config
  var [goalType, setGoalType] = useCS(preset?.goalType || "collective"); // collective | streak | race
  var [goalTitle, setGoalTitle] = useCS(preset?.goalTitle || "50 добрых дел");
  var [target, setTarget] = useCS(preset?.target || 50);
  var [unit, setUnit] = useCS(preset?.unit || "дел");
  var [linkedHabits, setLinkedHabits] = useCS({
    "🙏": true,
    "🧘🏼‍♀️": false,
    "📖": false,
    "🥗": false,
    "🏃🏼‍♀️": false
  });
  var [stakes, setStakes] = useCS(true);
  var [stakeAmount, setStakeAmount] = useCS(100);

  // A real user starts a team as just THEMSELVES — no invented roster (the old
  // Павел/Ник/Светлана… were demo personas leaking into live). Others come in via
  // the «Пригласить» link, and the goal split fills out as they actually join.
  var _youName = (app?.userName || "").trim();
  var allMembers = [{
    name: (_youName ? _youName + " " : "") + "(вы)",
    initials: (_youName || "В").slice(0, 1).toUpperCase(),
    color: "#FEDE34",
    on: true,
    you: true
  }];
  var [members, setMembers] = useCS(allMembers);
  var toggleMember = i => setMembers(m => m.map((x, j) => j === i ? {
    ...x,
    on: !x.on
  } : x));
  var activeMembers = members.filter(m => m.on);
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
  }
  // «Гонка» (race) ВРЕМЕННО убрана из пикера (David: «может вернём позже»). Логика гонки в
  // community_live.jsx цела → вернуть = раскомментировать строку обратно.
  // { id: "race",    e: "🏁", t: "Гонка",              d: "Бок о бок — первый до цели побеждает, остальные получают часть XP.",  example: `напр. первый до ${target} ${unit}` },
  ];
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
  var emblemChoices = TEAM_EMBLEMS;
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u0443",
    onBack: () => navigate("community")
  }), /*#__PURE__*/React.createElement("div", {
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
  }, bosIcon(emblem, 92, accent)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    "data-haptic": "selection",
    onClick: () => openSheet(/*#__PURE__*/React.createElement(EmojiPickerLive, {
      onPick: setEmblem,
      current: emblem,
      accent: accent
    })),
    className: "tap",
    "aria-label": "\u0421\u043C\u0435\u043D\u0438\u0442\u044C \u0438\u043A\u043E\u043D\u043A\u0443",
    style: {
      width: 52,
      height: 52,
      borderRadius: 15,
      background: "rgba(255,255,255,0.8)",
      border: 0,
      display: "grid",
      placeItems: "center",
      fontSize: 26,
      flexShrink: 0,
      cursor: "pointer",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      WebkitBackdropFilter: "blur(8px)",
      backdropFilter: "blur(8px)"
    }
  }, bosIcon(emblem, 28, accent)), /*#__PURE__*/React.createElement("input", {
    value: name,
    onChange: e => setName(e.target.value),
    placeholder: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u044B",
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 20,
      fontWeight: 700,
      color: "var(--text)",
      border: 0,
      outline: 0,
      background: "transparent",
      padding: 0,
      letterSpacing: "-0.4px"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    "data-tour": "team-modes",
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 22
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
        borderRadius: 22,
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
      borderRadius: 22,
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
  }, "\u0415\u0434\u0438\u043D\u0438\u0446\u0430"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(BosUnitSelectLive, {
    value: unit,
    onChange: setUnit
  }))))), /*#__PURE__*/React.createElement("div", {
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
  }, "\u041A\u0430\u0436\u0434\u0430\u044F \u043E\u0442\u043C\u0435\u0442\u043A\u0430 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0430 \u043F\u043E \u043A\u043E\u043C\u0430\u043D\u0434\u043D\u043E\u0439 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0435 \u0434\u0432\u0438\u0433\u0430\u0435\u0442 \u0446\u0435\u043B\u044C \u043D\u0430 +1 \u2014 \u0437\u0430\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0435 \u0435\u0451 \u0432\u043C\u0435\u0441\u0442\u0435.")), /*#__PURE__*/React.createElement("span", {
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
  }), " \u041D\u043E\u0432\u0430\u044F \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0430"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement(DurationPicker, {
    value: duration,
    onChange: setDuration
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
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
    "data-tour": "team-stakes",
    style: {
      background: "var(--card)",
      borderRadius: 22,
      padding: 16,
      marginTop: 22,
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
    style: {
      background: "var(--card)",
      borderRadius: 22,
      padding: 16,
      marginTop: 22,
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
  }, /*#__PURE__*/React.createElement(BuddyFaceLive, {
    avatar: p.avatar,
    name: p.name,
    size: 22
  }), p.name, p.on && /*#__PURE__*/React.createElement(I.Check, {
    size: 12,
    strokeWidth: 3
  }))), /*#__PURE__*/React.createElement("button", {
    className: "tap",
    onClick: () => openSheet(/*#__PURE__*/React.createElement(ShareAppSheetLive, null)),
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
    disabled: saving,
    style: {
      marginTop: 20,
      opacity: saving ? 0.65 : 1
    },
    onClick: () => {
      if (saving) return;
      setSaving(true);
      if (window.tgHaptic) {
        try {
          window.tgHaptic("success");
        } catch (e) {}
      }
      var dur = {
        week: "Эта неделя",
        month: "Этот месяц",
        quarter: "3 месяца",
        year: "Год"
      }[duration] || "Этот месяц";
      var nt = app?.addTeam({
        name: name.trim() || "Новая команда",
        emblem,
        accent,
        vis,
        // private / public — preserved from the toggle above
        goal: goalTitle || target + " " + unit,
        type: goalType,
        // collective | streak | race — store the MODE locally too (was cloud-only → detail couldn't show it)
        target: Number(target) || 0,
        current: 0,
        unit,
        stake: stakes ? Number(stakeAmount) || 0 : 0,
        // optional XP wager per person
        date: dur,
        progress: 0,
        members: activeMembers.map(m => ({
          name: m.name,
          initials: m.initials,
          color: m.color,
          pct: 0
        }))
      });
      // D3 — mirror to the cloud so a public team is discoverable by everyone and
      // can be joined by link. (Live user: the old `app?.mode === "live"` gate is
      // always true, so it's dropped — the cloud-enabled guard stays.) The local team
      // keeps working even if the cloud is off.
      try {
        if (nt && window.bosCloud && window.bosCloud.enabled()) {
          window.bosCloud.createTeam({
            name: nt.name,
            emblem,
            vis,
            goalKind: nt.goal,
            goalTarget: Number(target) || 0,
            goal: {
              type: goalType,
              target: Number(target) || 0,
              unit: unit,
              title: goalTitle || target + " " + unit,
              stake: stakes ? Number(stakeAmount) || 0 : 0
            }
          }).then(row => {
            if (row && row.id && app.updateTeam) app.updateTeam(nt._id, {
              cloudId: row.id
            });
          });
        }
      } catch (e) {}
      setTimeout(() => navigate("community"), 300);
    }
  }, saving ? "Создаём…" : "Создать команду"));
}

/* Team settings — full screen opened from the gear in Team detail. Edits are
   local until "Сохранить" → updateTeam; team detail re-reads the live team by _id. */
function TeamSettingsLive() {
  var {
    navigate,
    params
  } = useNav();
  var app = useApp();
  var {
    open: openSheet
  } = useSheet();
  var team = params?.team || {};
  var [name, setName] = useCS(team.name || "");
  var [emblem, setEmblem] = useCS(team.emblem || "✨");
  var [accent, setAccent] = useCS(team.accent || BOS_GREY);
  var [goal, setGoal] = useCS(team.goal || "");
  var [priv, setPriv] = useCS(team.vis !== "public");
  var [notify, setNotify] = useCS(team.notify !== false);
  var [members, setMembers] = useCS(team.members || []);
  // GOAL CONFIG — now editable here too (was create-only → «не все режимы связаны»).
  var [goalType, setGoalType] = useCS(team.type || "collective"); // collective | streak | race
  var [target, setTarget] = useCS(team.target || 0);
  var [unit, setUnit] = useCS(team.unit || "дел");
  var [stakes, setStakes] = useCS((team.stake || 0) > 0);
  var [stakeAmount, setStakeAmount] = useCS(team.stake || 100);
  var [saving, setSaving] = useCS(false);
  // A cloud team's members live in the cloud — load the REAL roster so the list never shows
  // the stale local cache (the phantom «йога-тест» members). Local teams keep their own.
  React.useEffect(() => {
    if (!(team.cloudId && window.bosCloud && window.bosCloud.enabled() && window.bosCloud.teamMembers)) return;
    var on = true;
    window.bosCloud.teamMembers(team.cloudId).then(mem => {
      if (!on || !Array.isArray(mem)) return;
      var palette = typeof BOS_TEAM_PALETTE !== "undefined" ? BOS_TEAM_PALETTE : ["#7FB3F2"];
      setMembers(mem.map((m, j) => ({
        id: m.id,
        name: m.name || "Участник",
        avatar: m.avatar,
        initials: (m.name || "У").slice(0, 1).toUpperCase(),
        color: palette[j % palette.length]
      })));
    }).catch(() => {});
    return () => {
      on = false;
    };
  }, [team.cloudId]);
  var emblems = TEAM_EMBLEMS;
  var removeMember = i => setMembers(ms => ms.filter((_, j) => j !== i));
  var save = () => {
    if (saving) return;
    setSaving(true);
    if (window.tgHaptic) {
      try {
        window.tgHaptic("success");
      } catch (e) {}
    }
    var stakeVal = stakes ? Number(stakeAmount) || 0 : 0;
    var tgt = Number(target) || 0;
    var goalText = goal.trim() || team.goal;
    var patch = {
      name: name.trim() || team.name,
      emblem,
      accent,
      goal: goalText,
      vis: priv ? "private" : "public",
      notify,
      members,
      type: goalType,
      target: tgt,
      unit,
      stake: stakeVal
    };
    app?.updateTeam(team._id, patch);
    // Persist the goal CONFIG + meta to the cloud (new updateTeam) so the mode/target/ставка
    // survive a reload and feed teamGoalProgress for everyone — was local-only («бутафорски»).
    try {
      if (team.cloudId && window.bosCloud && window.bosCloud.enabled() && window.bosCloud.updateTeam) {
        window.bosCloud.updateTeam(team.cloudId, {
          name: patch.name,
          emblem,
          vis: patch.vis,
          goalKind: goalText,
          goalTarget: tgt,
          goal: {
            type: goalType,
            target: tgt,
            unit,
            title: goalText,
            stake: stakeVal
          }
        });
      }
    } catch (e) {}
    setTimeout(() => navigate("team-detail", {
      team: {
        ...team,
        ...patch
      }
    }), 300);
  };
  // This screen is owner-only (gated by the gear), so deleting goes through the cloud
  // deleteTeam + a confirm sheet (was a silent local-only removeTeam).
  var del = () => bosConfirmExitTeam({
    app,
    team,
    isOwner: true,
    navigate,
    openSheet
  });
  var card = {
    background: "#fff",
    borderRadius: 22,
    marginTop: 8,
    boxShadow: "var(--card-shadow)"
  };
  var goalTypes = [{
    id: "collective",
    e: "🌊",
    t: "Общий счёт",
    d: "Отметки всех складываются в одно число."
  }, {
    id: "streak",
    e: "🔥",
    t: "Серия у каждого",
    d: "Каждый держит серию — команда проходит, только если прошли все."
  }
  // «Гонка» временно скрыта (David: «может вернём позже») — вернуть = раскомментировать.
  // { id: "race",    e: "🏁", t: "Гонка", d: "Бок о бок — первый до цели побеждает, остальные получают часть XP." },
  ];
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0446\u0435\u043B\u0438",
    onBack: () => navigate("team-detail", {
      team
    })
  }), /*#__PURE__*/React.createElement("div", {
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
  }, bosIcon(emblem, 92, accent)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    "data-haptic": "selection",
    onClick: () => openSheet(/*#__PURE__*/React.createElement(EmojiPickerLive, {
      onPick: setEmblem,
      current: emblem,
      accent: accent
    })),
    className: "tap",
    "aria-label": "\u0421\u043C\u0435\u043D\u0438\u0442\u044C \u0438\u043A\u043E\u043D\u043A\u0443",
    style: {
      width: 52,
      height: 52,
      borderRadius: 15,
      background: "rgba(255,255,255,0.8)",
      border: 0,
      display: "grid",
      placeItems: "center",
      fontSize: 26,
      flexShrink: 0,
      cursor: "pointer",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      WebkitBackdropFilter: "blur(8px)",
      backdropFilter: "blur(8px)"
    }
  }, bosIcon(emblem, 28, accent)), /*#__PURE__*/React.createElement("input", {
    value: name,
    onChange: e => setName(e.target.value),
    placeholder: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u044B",
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 20,
      fontWeight: 700,
      color: "var(--text)",
      border: 0,
      outline: 0,
      background: "transparent",
      padding: 0,
      letterSpacing: "-0.4px"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 22
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
        borderRadius: 22,
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
      borderRadius: 22,
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
  }, "\u0427\u0435\u0433\u043E \u0432\u044B \u0445\u043E\u0442\u0438\u0442\u0435"), /*#__PURE__*/React.createElement("input", {
    value: goal,
    onChange: e => setGoal(e.target.value),
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
      borderBottom: goalType !== "streak" ? "1px solid var(--line)" : "0"
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
  }, "\u0415\u0434\u0438\u043D\u0438\u0446\u0430"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(BosUnitSelectLive, {
    value: unit,
    onChange: setUnit
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Segmented, {
    value: priv ? "private" : "public",
    onChange: v => setPriv(v === "private"),
    options: [{
      value: "private",
      label: "Приватная"
    }, {
      value: "public",
      label: "Публичная"
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 22,
      padding: 16,
      marginTop: 14,
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
  }, "\u041A\u043E\u0433\u0434\u0430 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438 \u043E\u0442\u043C\u0435\u0447\u0430\u044E\u0442\u0441\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 2,
      lineHeight: 1.5
    }
  }, "\u0422\u0438\u0445\u0438\u0439 \u043F\u0443\u0448, \u043A\u043E\u0433\u0434\u0430 \u043A\u0442\u043E-\u0442\u043E \u0437\u0430\u043A\u0440\u044B\u043B \u043A\u043E\u043C\u0430\u043D\u0434\u043D\u0443\u044E \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0443.")), /*#__PURE__*/React.createElement(Switch, {
    on: notify,
    onChange: setNotify
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 22,
      padding: 16,
      marginTop: 14,
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
  }, "\u0414\u043E\u0439\u0434\u0451\u0442\u0435 \u0434\u043E \u0446\u0435\u043B\u0438 \u2014 \u0431\u0430\u043D\u043A \u0432\u0435\u0440\u043D\u0451\u0442\u0441\u044F \u0432\u0434\u0432\u043E\u0435 \u0431\u043E\u043B\u044C\u0448\u0435. \u041D\u0435 \u0434\u043E\u0439\u0434\u0451\u0442\u0435 \u2014 \u0441\u0442\u0430\u0432\u043A\u0438 \u0441\u0433\u043E\u0440\u0430\u044E\u0442.")), /*#__PURE__*/React.createElement(Switch, {
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
  }, /*#__PURE__*/React.createElement("span", null, members.length, " ", members.length === 1 ? "участник" : "участников"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      color: "var(--text)"
    }
  }, "\u0431\u0430\u043D\u043A ", stakeAmount * Math.max(1, members.length), " XP")))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...card,
      padding: "8px 16px",
      marginTop: 14
    }
  }, members.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "8px 0"
    }
  }, /*#__PURE__*/React.createElement(BuddyFaceLive, {
    avatar: m.avatar,
    name: m.name,
    size: 36
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)"
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
  }, "\u041F\u043E\u043A\u0430 \u043D\u0438\u043A\u043E\u0433\u043E. \u041F\u0440\u0438\u0433\u043B\u0430\u0441\u0438 \u0434\u0440\u0443\u0437\u0435\u0439 \u043D\u0438\u0436\u0435.")), team.cloudId && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 22,
      padding: 16,
      marginTop: 14,
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      lineHeight: 1.45,
      marginBottom: 12
    }
  }, "\u041F\u0440\u0438\u0448\u043B\u0438 \u0441\u0441\u044B\u043B\u043A\u0443 \u2014 \u0434\u0440\u0443\u0433 \u043E\u0442\u043A\u0440\u043E\u0435\u0442 \u0446\u0435\u043B\u044C \u0432 Telegram \u0438 \u043F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u0442\u0441\u044F \u043A \u043E\u0431\u0449\u0435\u0439 \u0446\u0435\u043B\u0438. \u0417\u0430 \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u043D\u044B\u0435 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438 \u0431\u043E\u043B\u044C\u0448\u0435 XP."), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      var link = typeof bosTeamInviteLink === "function" ? bosTeamInviteLink(team.cloudId) : "https://t.me/BalanceOS8_bot?startapp=team_" + team.cloudId;
      var text = "Вести привычки вместе — веселее, и за совместные привычки больше XP ✨ Присоединяйся к цели «" + (team.name || "") + "» в BalanceOS";
      if (window.bosShare) window.bosShare(link, text);else {
        try {
          navigator.clipboard.writeText(link);
        } catch (e) {}
      }
      if (window.tgHaptic) {
        try {
          window.tgHaptic("light");
        } catch (e) {}
      }
    },
    className: "tap",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "10px 16px",
      borderRadius: 999,
      background: "#0a0a0a",
      color: "#fff",
      border: 0,
      fontSize: 13.5,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement(I.Share, {
    size: 15
  }), " \u041F\u0440\u0438\u0433\u043B\u0430\u0441\u0438\u0442\u044C \u043F\u043E \u0441\u0441\u044B\u043B\u043A\u0435"))), /*#__PURE__*/React.createElement("button", {
    className: "bos-btn",
    disabled: saving,
    style: {
      marginTop: 20,
      opacity: saving ? 0.65 : 1
    },
    onClick: save
  }, saving ? "Сохраняем…" : "Сохранить"), /*#__PURE__*/React.createElement("button", {
    onClick: del,
    className: "tap",
    style: {
      width: "100%",
      background: "transparent",
      border: 0,
      color: "var(--accent-red)",
      padding: 14,
      marginTop: 6,
      fontSize: 15,
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 7
    }
  }, /*#__PURE__*/React.createElement(I.Trash, {
    size: 17
  }), " \u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0446\u0435\u043B\u044C"));
}

/* ПРАВКА КРУГА НА МЕСТЕ — карандаш в комнате открывает ЭТУ шторку (не уводит на отдельный
   экран). Те же поля и тот же save (app.updateTeam + cloud updateTeam), что в TeamSettingsLive —
   комната под шторкой обновляется живьём, т.к. читает app.teams. Иконка = embedded EmojiPickerLive
   через двухвью (one-sheet host). «Все настройки и участники» → полный экран (ничего не теряем). */
function TeamQuickEditSheetLive({
  team,
  navigate
}) {
  // navigate приходит ПРОПОМ от открывающего (TeamDetailLive) — шторки рендерятся ВНЕ NavCtx,
  // поэтому useNav() здесь null (это и роняло экран при тапе на карандаш). David: фикс краша.
  var app = useApp();
  var {
    open: openSheet,
    close
  } = useSheet();
  var [view, setView] = useCS("form");
  var [name, setName] = useCS(team.name || "");
  var [emblem, setEmblem] = useCS(team.emblem || "✨");
  var [accent, setAccent] = useCS(team.accent || BOS_GREY);
  var [goal, setGoal] = useCS(team.goal || "");
  var [goalType, setGoalType] = useCS(team.type || "collective");
  var [target, setTarget] = useCS(team.target || 0);
  var [unit, setUnit] = useCS(team.unit || "дел");
  var [priv, setPriv] = useCS(team.vis !== "public");
  var [stakes, setStakes] = useCS((team.stake || 0) > 0);
  var [stakeAmount, setStakeAmount] = useCS(team.stake || 100);
  var [saving, setSaving] = useCS(false);
  var goalTypes = [{
    id: "collective",
    e: "🌊",
    t: "Общий счёт",
    d: "Отметки всех складываются в одно число."
  }, {
    id: "streak",
    e: "🔥",
    t: "Серия у каждого",
    d: "Команда проходит, только если прошли все."
  }
  // «Гонка» временно скрыта (David: «может вернём позже») — вернуть = раскомментировать.
  // { id: "race",    e: "🏁", t: "Гонка", d: "Первый до цели побеждает, остальные — часть XP." },
  ];
  var save = () => {
    if (saving) return;
    setSaving(true);
    if (window.tgHaptic) {
      try {
        window.tgHaptic("success");
      } catch (e) {}
    }
    var stakeVal = stakes ? Number(stakeAmount) || 0 : 0;
    var tgt = Number(target) || 0;
    var goalText = goal.trim() || team.goal;
    var patch = {
      name: name.trim() || team.name,
      emblem,
      accent,
      goal: goalText,
      vis: priv ? "private" : "public",
      type: goalType,
      target: tgt,
      unit,
      stake: stakeVal
    };
    app?.updateTeam(team._id, patch);
    try {
      if (team.cloudId && window.bosCloud && window.bosCloud.enabled() && window.bosCloud.updateTeam) {
        window.bosCloud.updateTeam(team.cloudId, {
          name: patch.name,
          emblem,
          vis: patch.vis,
          goalKind: goalText,
          goalTarget: tgt,
          goal: {
            type: goalType,
            target: tgt,
            unit,
            title: goalText,
            stake: stakeVal
          }
        });
      }
    } catch (e) {}
    close();
  };
  if (view === "picker") {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "2px 16px 18px"
      }
    }, /*#__PURE__*/React.createElement(EmojiPickerLive, {
      embedded: true,
      current: emblem,
      accent: accent,
      onPick: e => {
        setEmblem(e);
        setView("form");
      }
    }), /*#__PURE__*/React.createElement("button", {
      onClick: () => setView("form"),
      className: "tap",
      style: {
        width: "100%",
        marginTop: 12,
        background: "var(--surface-3)",
        border: 0,
        borderRadius: 14,
        padding: "12px",
        fontSize: 14,
        fontWeight: 600,
        color: "var(--text-2)"
      }
    }, "\u041D\u0430\u0437\u0430\u0434"));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 18px 20px",
      maxHeight: "80vh",
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      fontSize: 18,
      fontWeight: 700,
      letterSpacing: "-0.3px",
      marginBottom: 6
    }
  }, "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0446\u0435\u043B\u044C"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: `linear-gradient(135deg, ${accent} 0%, ${accent}66 60%, var(--card-fade) 100%)`,
      borderRadius: 22,
      padding: 16,
      marginTop: 6,
      position: "relative",
      overflow: "hidden",
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    "data-haptic": "selection",
    onClick: () => setView("picker"),
    className: "tap",
    "aria-label": "\u0421\u043C\u0435\u043D\u0438\u0442\u044C \u0438\u043A\u043E\u043D\u043A\u0443",
    style: {
      width: 50,
      height: 50,
      borderRadius: 15,
      background: "rgba(255,255,255,0.8)",
      border: 0,
      display: "grid",
      placeItems: "center",
      fontSize: 24,
      flexShrink: 0,
      cursor: "pointer",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
    }
  }, bosIcon(emblem, 26, accent)), /*#__PURE__*/React.createElement("input", {
    value: name,
    onChange: e => setName(e.target.value),
    placeholder: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u0440\u0443\u0433\u0430",
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 20,
      fontWeight: 700,
      color: "var(--text)",
      border: 0,
      outline: 0,
      background: "transparent",
      padding: 0,
      letterSpacing: "-0.4px"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 18
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
        padding: 12,
        display: "flex",
        alignItems: "center",
        gap: 12,
        textAlign: "left",
        boxShadow: "var(--card-shadow)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: active ? "#0a0a0a" : "#e8e8e8",
        color: active ? "#fff" : "var(--text)",
        display: "grid",
        placeItems: "center",
        fontSize: 16,
        flexShrink: 0
      }
    }, gt.e), /*#__PURE__*/React.createElement("div", {
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
    }, gt.t), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "var(--text-4)",
        marginTop: 2,
        lineHeight: 1.4
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
      padding: 14,
      marginTop: 10,
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: goal,
    onChange: e => setGoal(e.target.value),
    placeholder: "50 \u0434\u043E\u0431\u0440\u044B\u0445 \u0434\u0435\u043B",
    style: {
      width: "100%",
      fontSize: 18,
      fontWeight: 600,
      color: "var(--text)",
      border: 0,
      outline: 0,
      padding: "4px 0 10px",
      background: "transparent",
      borderBottom: goalType !== "streak" ? "1px solid var(--line)" : "0"
    }
  }), goalType !== "streak" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    inputMode: "numeric",
    pattern: "[0-9]*",
    value: target,
    onChange: e => setTarget(parseInt(e.target.value.replace(/\D/g, "")) || 0),
    style: {
      flex: "0 0 80px",
      fontSize: 24,
      fontWeight: 700,
      color: "var(--text)",
      border: 0,
      outline: 0,
      background: "transparent",
      padding: 0
    }
  }), /*#__PURE__*/React.createElement(BosUnitSelectLive, {
    value: unit,
    onChange: setUnit
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Segmented, {
    value: priv ? "private" : "public",
    onChange: v => setPriv(v === "private"),
    options: [{
      value: "private",
      label: "Приватная"
    }, {
      value: "public",
      label: "Публичная"
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 18,
      padding: 14,
      marginTop: 18,
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
      flex: 1,
      fontSize: 14,
      color: "var(--text-2)",
      fontWeight: 500
    }
  }, "\u0412\u0441\u0435 \u0441\u0442\u0430\u0432\u044F\u0442 XP", /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-4)",
      marginTop: 2,
      lineHeight: 1.4,
      fontWeight: 400
    }
  }, "\u0414\u043E\u0439\u0434\u0451\u0442\u0435 \u2014 \u0431\u0430\u043D\u043A \u0440\u0430\u0441\u043A\u0440\u043E\u0435\u0442\u0441\u044F. \u041E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E.")), /*#__PURE__*/React.createElement(Switch, {
    on: stakes,
    onChange: setStakes
  })), stakes && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      paddingTop: 12,
      borderTop: "1px solid var(--line)",
      display: "flex",
      alignItems: "baseline",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    inputMode: "numeric",
    pattern: "[0-9]*",
    value: stakeAmount,
    onChange: e => setStakeAmount(parseInt(e.target.value.replace(/\D/g, "")) || 0),
    style: {
      flex: "0 0 70px",
      fontSize: 20,
      fontWeight: 700,
      color: "var(--text)",
      border: 0,
      outline: 0,
      background: "transparent",
      padding: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-4)"
    }
  }, "XP \u0441 \u043A\u0430\u0436\u0434\u043E\u0433\u043E"))), /*#__PURE__*/React.createElement("button", {
    className: "bos-btn",
    disabled: saving,
    style: {
      marginTop: 18,
      opacity: saving ? 0.65 : 1
    },
    onClick: save
  }, saving ? "Сохраняем…" : "Сохранить"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      close();
      navigate("team-settings", {
        team
      });
    },
    className: "tap",
    style: {
      width: "100%",
      background: "transparent",
      border: 0,
      color: "var(--text-3)",
      padding: "12px",
      marginTop: 4,
      fontSize: 13.5,
      fontWeight: 600
    }
  }, "\u0412\u0441\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0438 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438 \u2192"), /*#__PURE__*/React.createElement("button", {
    onClick: () => bosConfirmExitTeam({
      app,
      team,
      isOwner: true,
      navigate,
      openSheet
    }),
    className: "tap",
    style: {
      width: "100%",
      background: "transparent",
      border: 0,
      color: "var(--accent-red)",
      padding: "12px",
      marginTop: 2,
      fontSize: 13.5,
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 7
    }
  }, /*#__PURE__*/React.createElement(I.Trash, {
    size: 16
  }), " \u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0446\u0435\u043B\u044C"));
}

/* LIVE fork of the «add team habit» sheet — uses OUR standard icon picker (EmojiPickerLive:
   эмодзи/символы/палитра), like creating a personal habit, instead of the core sheet's cramped
   12-emoji row (David: «выбор эмодзи не по нашим стандартам — посмотри как делаем привычки»).
   One-sheet host → picker is an in-place SECOND view (form ↔ picker), not a nested sheet.
   Demo keeps the core TeamHabitSheet untouched. */
function TeamHabitSheetLive({
  team,
  members = [],
  onAdd
}) {
  var {
    close
  } = useSheet();
  var [view, setView] = useCS("form");
  var [emoji, setEmoji] = useCS("🙏");
  var [name, setName] = useCS("");
  var [movesGoal, setMovesGoal] = useCS(true);
  var [isMain, setIsMain] = useCS(false);
  var [count, setCount] = useCS(1); // НОРМА по умолчанию (раз/день) — тренер задаёт, каждый поправит у себя
  var [picked, setPicked] = useCS(() => members.map((_, i) => i));
  var toggleMember = i => setPicked(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);
  var participants = members.filter((_, i) => picked.includes(i)).map(m => ({
    name: m.name,
    initials: m.initials,
    color: m.color,
    avatar: m.avatar
  }));
  var save = () => {
    onAdd && onAdd({
      emoji,
      name: name.trim() || "Новая привычка",
      isMain,
      movesGoal,
      goalPerDay: Math.max(1, count),
      participants,
      total: Math.max(1, participants.length || members.length || 1)
    });
    close();
  };
  if (view === "picker") {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "2px 8px 8px",
        color: "var(--text)"
      }
    }, /*#__PURE__*/React.createElement(EmojiPickerLive, {
      embedded: true,
      current: emoji,
      onPick: e => {
        setEmoji(e);
        setView("form");
      }
    }), /*#__PURE__*/React.createElement("button", {
      className: "tap",
      onClick: () => setView("form"),
      style: {
        width: "100%",
        marginTop: 4,
        background: "transparent",
        border: 0,
        color: "var(--text-3)",
        padding: 12,
        fontSize: 14.5,
        fontWeight: 600,
        cursor: "pointer"
      }
    }, "\u041D\u0430\u0437\u0430\u0434"));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 20px 8px",
      color: "var(--text)"
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
      color: "var(--text-3)",
      marginTop: 3
    }
  }, "\u041E\u0431\u0449\u0430\u044F \u0434\u043B\u044F \u0432\u0441\u0435\u0445 \u0432 \xAB", team?.name || "команде", "\xBB")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: "var(--surface-3)",
      borderRadius: 16,
      padding: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    "data-haptic": "selection",
    onClick: () => setView("picker"),
    className: "tap",
    style: {
      width: 48,
      height: 48,
      borderRadius: 14,
      background: BOS_TILE_SHEEN + ", var(--card)",
      boxShadow: bosTileGlass(false),
      display: "grid",
      placeItems: "center",
      fontSize: 24,
      flexShrink: 0,
      border: 0,
      cursor: "pointer"
    }
  }, bosIcon(emoji, 24, null)), /*#__PURE__*/React.createElement("input", {
    value: name,
    onChange: e => setName(e.target.value),
    placeholder: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438",
    "aria-label": "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438",
    style: {
      flex: 1,
      minWidth: 0,
      border: 0,
      outline: "none",
      background: "transparent",
      fontSize: 17,
      fontWeight: 600,
      color: "var(--text)",
      letterSpacing: "-0.2px",
      padding: "6px 0"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      background: "var(--surface-3)",
      borderRadius: 14,
      padding: "11px 14px",
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5
    }
  }, count, " ", count === 1 ? "раз" : "раз(а)", " \u0432 \u0434\u0435\u043D\u044C"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 1
    }
  }, "\u041D\u043E\u0440\u043C\u0430 \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E \u2014 \u043A\u0430\u0436\u0434\u044B\u0439 \u043F\u043E\u043F\u0440\u0430\u0432\u0438\u0442 \u043F\u043E\u0434 \u0441\u0435\u0431\u044F")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setCount(Math.max(1, count - 1)),
    className: "tap hit44",
    style: {
      width: 32,
      height: 32,
      borderRadius: 999,
      background: "var(--card)",
      border: 0,
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)"
    }
  }, /*#__PURE__*/React.createElement(I.Minus, {
    size: 16,
    strokeWidth: 2.4
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setCount(count + 1),
    className: "tap hit44",
    style: {
      width: 32,
      height: 32,
      borderRadius: 999,
      background: "var(--card)",
      border: 0,
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)"
    }
  }, /*#__PURE__*/React.createElement(I.Plus, {
    size: 16,
    strokeWidth: 2.4
  })))), members.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
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
        background: on ? "#0a0a0a" : "var(--surface-3)",
        color: on ? "#fff" : "var(--text-3)",
        border: 0,
        fontSize: 12,
        fontWeight: 500
      }
    }, /*#__PURE__*/React.createElement(BuddyFaceLive, {
      avatar: m.avatar,
      name: m.name,
      size: 22
    }), m.name, on && /*#__PURE__*/React.createElement(I.Check, {
      size: 12,
      strokeWidth: 3
    }));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-3)",
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
      color: "var(--text-4)",
      marginTop: 1
    }
  }, "\u041E\u0442\u043C\u0435\u0442\u043A\u0430 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0430 = +1 \u043A \u043E\u0431\u0449\u0435\u0439 \u0446\u0435\u043B\u0438")), /*#__PURE__*/React.createElement(Switch, {
    on: movesGoal,
    onChange: setMovesGoal
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
      color: "var(--text-4)",
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

/* LEVELS / CREDITS — gamification (theme-aware). LIVE: every number comes from the
   REAL date-keyed XP model + real referral circle + real earned achievements; the
   demo's curated 7 / 1240 / 980 / Павел-array are all gone. */
function LevelsLive() {
  var {
    navigate
  } = useNav();
  var {
    open: openSheet
  } = useSheet();
  var app = useApp ? useApp() : null;
  var isDark = app?.themeOverride === "dark";
  // LIVE: real count of people you've actually invited (referral circle) — same source as
  // the profile orbit.
  var [liveInvited, setLiveInvited] = React.useState(0);
  React.useEffect(() => {
    var on = true;
    if (window.bosCloud && window.bosCloud.invitedPeople) {
      window.bosCloud.invitedPeople().then(list => {
        if (on && Array.isArray(list)) setLiveInvited(list.length);
      }).catch(() => {});
    }
    return () => {
      on = false;
    };
  }, []);
  var invited = liveInvited; // people you've drawn into the app
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
  // LIVE: real earned ladder (never Павел's curated array).
  var ach = typeof bosEarnedAchievementsLive === "function" ? bosEarnedAchievementsLive(app) : [];
  var achEarned = ach.filter(a => a.earned);
  // LIVE: real numbers from the date-keyed habit model (T0.2). Titles are shared.
  var _xpLive = bosLiveXPLive(app);
  var _li = bosLevelInfoLive(_xpLive);
  var LEVEL_TITLES = ["Новичок", "Первые шаги", "Набираю ритм", "В потоке", "Стойкость", "Уверенность", "Преданный делу", "Сосредоточенный", "Мастер привычек", "Вдохновитель", "Наставник", "Легенда"];
  var titleFor = l => LEVEL_TITLES[Math.min(Math.max(1, l), LEVEL_TITLES.length) - 1];
  var lvl = _li.level;
  var xp = _xpLive;
  var next = _li.next;
  var pctBar = _li.pct;
  // Копилка (кошелёк) = заработано − потрачено. Уровень (hero) считается от ПОЛНОГО _xpLive, и трата его
  // НЕ трогает (David). Плейсхолдер-список «Награды за XP» убран — теперь трата идёт на ПАРТНЁРОВ (живое).
  var credits = typeof bosLiveSpendableXPLive === "function" ? bosLiveSpendableXPLive(app) : _xpLive;
  var netLeft = Math.max(0, 10 - lvl); // Нетворк открывается с 10 уровня
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
      borderRadius: 22,
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
      fontWeight: 600,
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
  }, Math.max(0, next - xp), " XP \u0434\u043E ", lvl + 1, " \u0443\u0440\u043E\u0432\u043D\u044F \xB7 ", titleFor(lvl + 1))))), /*#__PURE__*/React.createElement(SysCard, {
    style: {
      padding: 18,
      marginTop: 16,
      borderRadius: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 52,
      height: 52,
      borderRadius: 16,
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      fontSize: 26,
      background: "linear-gradient(150deg,#eef1f6,#dadfe7)",
      boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.06)"
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
  }, "\u041A\u043E\u043F\u0438\u043B\u043A\u0430"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      fontWeight: 800,
      letterSpacing: "-1px",
      lineHeight: 1,
      marginTop: 3
    }
  }, credits.toLocaleString(), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: "var(--text-4)"
    }
  }, "XP")))), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 12.5,
      marginTop: 13,
      lineHeight: 1.45
    }
  }, "\u0422\u0432\u043E\u044F \u0432\u0430\u043B\u044E\u0442\u0430 \u0434\u043B\u044F ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text-2)"
    }
  }, "\u0436\u0438\u0432\u043E\u0433\u043E"), " \u2014 \u0442\u0440\u0430\u0442\u044C \u043D\u0430 \u043C\u0435\u0434\u0438\u0442\u0430\u0446\u0438\u0438, \u0442\u0430\u043D\u0446\u044B, \u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0438 \u043E\u0442 \u043F\u0430\u0440\u0442\u043D\u0451\u0440\u043E\u0432 \u043D\u0438\u0436\u0435. ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text-2)"
    }
  }, "\u0423\u0440\u043E\u0432\u0435\u043D\u044C \u043E\u0442 \u0442\u0440\u0430\u0442\u044B \u043D\u0435 \u043F\u0430\u0434\u0430\u0435\u0442"), " \u2014 \u043E\u043D \u0440\u0430\u0441\u0442\u0451\u0442 \u0441\u0430\u043C.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22
    }
  }, typeof PartnersShowcaseLive === "function" && /*#__PURE__*/React.createElement(PartnersShowcaseLive, {
    app: app,
    navigate: navigate,
    from: "levels"
  })), /*#__PURE__*/React.createElement(SysCard, {
    style: {
      padding: 16,
      marginTop: 22,
      display: "flex",
      alignItems: "center",
      gap: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 46,
      height: 46,
      borderRadius: 14,
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      fontSize: 22,
      background: "var(--surface-3)"
    }
  }, netLeft > 0 ? "🔒" : "🌐"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700
    }
  }, "\u041D\u0435\u0442\u0432\u043E\u0440\u043A", netLeft > 0 ? " · с 10 уровня" : ""), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 12.5,
      marginTop: 2,
      lineHeight: 1.4
    }
  }, netLeft > 0 ? /*#__PURE__*/React.createElement(React.Fragment, null, "\u0416\u0438\u0432\u044B\u0435 \u0441\u043E\u0437\u0432\u043E\u043D\u044B \u0438 \u043C\u0435\u043D\u0442\u043E\u0440\u044B \u0437\u0430 XP. \u0415\u0449\u0451 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text-2)"
    }
  }, netLeft, " ", ruPpl(netLeft, ["уровень", "уровня", "уровней"])), ".") : "Открыт — живые созвоны и менторы за XP.")), netLeft <= 0 && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      app?.setCommunityView?.({
        section: "community",
        commTab: "network"
      });
      navigate("community");
    },
    className: "tap",
    style: {
      background: "#0a0a0a",
      color: "#fff",
      border: 0,
      borderRadius: 999,
      padding: "9px 15px",
      fontSize: 13,
      fontWeight: 600,
      flexShrink: 0
    }
  }, "\u041E\u0442\u043A\u0440\u044B\u0442\u044C")), /*#__PURE__*/React.createElement(SysCard, {
    style: {
      padding: 14,
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "var(--text-4)",
      padding: "0 0 4px"
    }
  }, "\u041A\u0430\u043A \u0440\u0430\u0441\u0442\u0451\u0442 \u0443\u0440\u043E\u0432\u0435\u043D\u044C"), [{
    t: "Выполнить привычку",
    v: "+10"
  }, {
    t: "Идеальный день",
    v: "+30"
  }, {
    t: "Серия 7 дней",
    v: "+75"
  }, {
    t: "Достичь цели",
    v: "+250"
  }, {
    t: "Привести друга",
    v: "+150",
    infl: true
  }].map((r, i, arr) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "9px 0",
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
      color: r.infl ? "#2f8fd6" : "#E0A500",
      fontWeight: 700
    }
  }, r.v, " XP"))), /*#__PURE__*/React.createElement("button", {
    onClick: () => openSheet(/*#__PURE__*/React.createElement(ShareAppSheetLive, {
      dark: isDark
    })),
    className: "tap",
    style: {
      width: "100%",
      marginTop: 12,
      background: isDark ? "#fff" : "#0a0a0a",
      color: isDark ? "#0a0a0a" : "#fff",
      border: 0,
      borderRadius: 999,
      padding: 12,
      fontSize: 14.5,
      fontWeight: 600
    }
  }, "\u041F\u0440\u0438\u0433\u043B\u0430\u0441\u0438\u0442\u044C \u0434\u0440\u0443\u0433\u0430 \xB7 +150 XP")), /*#__PURE__*/React.createElement(SysCard, {
    className: "tap",
    onClick: () => navigate("achievements", {
      from: "levels"
    }),
    style: {
      padding: 14,
      marginTop: 22,
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
      borderRadius: 14,
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
  })));
}

/* ─── COURSE DETAIL — full programme description. No demo branches; faithful fork. ─── */
function CourseDetailLive() {
  var {
    navigate,
    params
  } = useNav();
  var app = useApp();
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
  // КУРС → КРУГ: записался → программа тренера падает к тебе — КРУГ (команда) в «Цели» + ПРАКТИКА
  // в «Привычки». courseId на круге = защита от дубля при повторном заходе. David: «вступление в курс
  // роняет практику+круг в Привычки». Зеркало GoalSettingsLive/TeamCreateLive (тот же движок круга).
  var alreadyEnrolled = enrolled || (app?.teams || []).some(t => t.courseId === c.id);
  var enrollCourse = () => {
    if (window.tgHaptic) {
      try {
        window.tgHaptic("success");
      } catch (e) {}
    }
    var existing = (app?.teams || []).find(t => t.courseId === c.id);
    if (existing) {
      navigate("team-detail", {
        team: existing
      });
      return;
    } // уже записан → сразу в круг
    setEnrolled(true);
    var days = parseInt(String(c.length || "").replace(/\D/g, ""), 10) || 21;
    var practiceName = "Практика · " + c.t;
    var teamObj = {
      name: c.t,
      emblem: c.i,
      accent: "#0a0a0a",
      vis: "private",
      courseId: c.id,
      goal: days + " дней",
      type: "collective",
      target: days,
      current: 0,
      unit: "дней",
      stake: 0,
      date: c.cohort || "",
      progress: 0,
      members: []
    };
    var nt = app?.addTeam(teamObj); // круг → сразу в «Целях» (работает офлайн)
    var personalHabit = {
      name: practiceName,
      emoji: c.i,
      color: null,
      days: [1, 1, 1, 1, 1, 1, 1],
      goalPerDay: 1,
      reminder: {
        on: false,
        time: "09:00"
      },
      log: {}
    };
    var opened = false;
    try {
      if (nt && window.bosCloud && window.bosCloud.enabled()) {
        window.bosCloud.createTeam({
          name: c.t,
          emblem: c.i,
          vis: "private",
          goalKind: teamObj.goal,
          goalTarget: days,
          goal: {
            type: "collective",
            target: days,
            unit: "дней",
            title: c.t
          }
        }).then(async row => {
          if (row && row.id) {
            if (app.updateTeam) app.updateTeam(nt._id, {
              cloudId: row.id
            });
            var th = null;
            try {
              th = await window.bosCloud.addTeamHabit(row.id, {
                name: practiceName,
                emoji: c.i,
                isMain: true
              });
            } catch (e) {}
            app?.addHabit({
              ...personalHabit,
              teamId: row.id,
              teamHabitId: th && th.id
            }); // практика как ЛИЧНАЯ, связана с кругом
          } else {
            app?.addHabit(personalHabit);
          }
          navigate("team-detail", {
            team: {
              ...nt,
              cloudId: row && row.id
            }
          });
        }).catch(() => {
          app?.addHabit(personalHabit);
          navigate("team-detail", {
            team: nt
          });
        });
        opened = true;
      }
    } catch (e) {}
    if (!opened) {
      app?.addHabit(personalHabit);
      navigate("team-detail", {
        team: nt
      });
    } // офлайн/превью
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
      borderRadius: 22,
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
      fontWeight: 600,
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
    style: {
      marginTop: 22,
      background: "var(--card)",
      borderRadius: 22,
      overflow: "hidden",
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "var(--text-4)",
      padding: "14px 18px 2px"
    }
  }, "\u041F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430"), programme.map((p, i) => /*#__PURE__*/React.createElement("div", {
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
    style: {
      marginTop: 22,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: "1 / -1",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "var(--text-4)",
      padding: "0 4px"
    }
  }, "\u0427\u0442\u043E \u0432\u0445\u043E\u0434\u0438\u0442"), includes.map((it, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: "var(--card)",
      borderRadius: 22,
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
      fontWeight: 600,
      color: "var(--text)"
    }
  }, it.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 3,
      lineHeight: 1.45
    }
  }, it.b)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      background: "var(--card)",
      borderRadius: 22,
      padding: 16,
      boxShadow: "var(--card-shadow)",
      display: "flex",
      gap: 14,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(BuddyFaceLive, {
    name: "\u041C\u0430\u0440\u043A \u0425\u0430\u043B\u0432\u0435\u0440\u0441\u043E\u043D",
    size: 52
  }), /*#__PURE__*/React.createElement("div", {
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
    style: {
      marginTop: 22,
      background: "var(--card)",
      borderRadius: 22,
      overflow: "hidden",
      boxShadow: "var(--card-shadow)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "var(--text-4)",
      padding: "14px 18px 2px"
    }
  }, "FAQ"), FAQ.map((f, i) => /*#__PURE__*/React.createElement("div", {
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
  }, "\u0415\u0434\u0438\u043D\u043E\u0440\u0430\u0437\u043E\u0432\u043E \xB7 \u043C\u043E\u0436\u043D\u043E \u0440\u0430\u0437\u0431\u0438\u0442\u044C \u043D\u0430 3 \u043C\u0435\u0441\u044F\u0446\u0430")), alreadyEnrolled ? /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      var ex = (app?.teams || []).find(t => t.courseId === c.id);
      if (ex) navigate("team-detail", {
        team: ex
      });
    },
    className: "tap",
    style: {
      background: "rgba(52,199,89,0.18)",
      color: "#34C759",
      border: 0,
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
    onClick: enrollCourse,
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

/* ─── TEAM CHAT — one shared chat for the whole team: messages + photos, in the
   flow of doing the goal together. LIVE only, so `live` is always true: the
   demo/fresh SEED conversation (and its emoji-placeholder Photo path) is gone.
   A cloud-linked team gets the REAL shared+realtime chat; a not-yet-synced local
   team keeps the per-team persisted history (survives reloads). ─── */
function TeamChatLive() {
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
  // D4 — a cloud-linked team gets the REAL shared+realtime chat; a local-only team
  // (no cloudId yet) keeps the local persisted behaviour below.
  var cloud = window.bosCloud && window.bosCloud.enabled() && team.cloudId ? window.bosCloud : null;
  var cloudId = cloud ? team.cloudId : null;
  var memberMapRef = React.useRef({});
  var myUidRef = React.useRef(null);
  var chatKey = "bos:chat:" + (app?.persistId || "live:local") + ":" + (team._id || team.name || "team");
  // Cloud chat hydrates from the server (below). A local team restores saved
  // history (or starts empty). No demo SEED here — this screen is live-only.
  var [msgs, setMsgs] = useCS(function () {
    if (cloudId) return [];
    try {
      var raw = localStorage.getItem(chatKey);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  });
  var [text, setText] = useCS("");
  var scrollRef = React.useRef(null);
  var fileRef = React.useRef(null);
  // Persist every change under the real profile — messages & photos survive
  // reloads and reopening the chat. On a full localStorage quota, drop the oldest
  // photos (keep all text) rather than failing the save.
  React.useEffect(function () {
    if (cloudId) return; // cloud chat lives on the server, not localStorage
    try {
      localStorage.setItem(chatKey, JSON.stringify(msgs));
    } catch (e) {
      try {
        localStorage.setItem(chatKey, JSON.stringify(msgs.filter(function (m) {
          return !m.img;
        })));
      } catch (e2) {}
    }
  }, [msgs, chatKey, cloudId]);
  // Pin to the latest message by scrolling the chat's OWN container — NOT
  // scrollIntoView, which bubbles up and yanked the page mid open-transition.
  React.useLayoutEffect(() => {
    var el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs.length]);
  var myName = app?.userName || "Вы";
  var nowLabel = () => {
    try {
      var d = new Date();
      return d.getHours() + ":" + ("0" + d.getMinutes()).slice(-2);
    } catch (e) {
      return "сейчас";
    }
  };

  // Map a cloud message row → the UI shape this screen already renders. Uses refs
  // (member roster + my uid) so the realtime handler always sees the latest.
  var mapRow = React.useCallback(r => {
    var mine = r.user_id === myUidRef.current;
    var prof = memberMapRef.current[r.user_id];
    return {
      id: r.id,
      _uid: r.user_id,
      me: mine,
      cloud: true,
      who: mine ? myName : prof ? prof.name : "Участник",
      c: prof ? prof.c : bosUserColor(r.user_id),
      avatar: prof ? prof.avatar : null,
      t: r.text || undefined,
      img: r.image_url || undefined,
      time: bosMsgTime(r.created_at)
    };
  }, [myName]);

  // Real member count for the header — from the loaded roster, never a fabricated «4».
  var [memberCount, setMemberCount] = React.useState(null);
  // D4 — cloud chat: load the roster + history, then live-subscribe to new messages.
  React.useEffect(() => {
    if (!cloudId) return;
    var on = true,
      unsub = function () {};
    cloud.uid().then(u => {
      myUidRef.current = u;
    });
    cloud.teamMembers(cloudId).then(mem => {
      var map = {};
      (mem || []).forEach(m => {
        map[m.id] = {
          name: m.name || "Участник",
          avatar: m.avatar,
          c: bosUserColor(m.id)
        };
      });
      memberMapRef.current = map;
      if (on) setMemberCount((mem || []).length);
      return cloud.loadMessages(cloudId);
    }).then(rows => {
      if (on) setMsgs((rows || []).map(mapRow));
    });
    unsub = cloud.subscribeMessages(cloudId, row => {
      setMsgs(prev => prev.some(m => m.id === row.id) ? prev : prev.concat([mapRow(row)]));
    });
    return () => {
      on = false;
      try {
        unsub();
      } catch (e) {}
    };
  }, [cloudId, mapRow]);
  var push = m => setMsgs(list => [...list, {
    who: myName,
    me: true,
    c: "#FEDE34",
    time: nowLabel(),
    ...m
  }]);
  // Append a freshly-sent cloud row (in case realtime is slow), de-duped by id.
  var absorb = row => {
    if (row) setMsgs(prev => prev.some(m => m.id === row.id) ? prev : prev.concat([mapRow(row)]));
  };
  var send = () => {
    var v = text.trim();
    if (!v) return;
    setText("");
    if (cloudId) cloud.sendMessage(cloudId, {
      text: v
    }).then(absorb);else push({
      t: v
    });
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
    bosCompressImage(file, 1280, 0.72).then(src => {
      if (cloudId) {
        fetch(src).then(r => r.blob()).then(blob => cloud.uploadChatPhoto(cloudId, blob).then(url => {
          if (url) cloud.sendMessage(cloudId, {
            imageUrl: url
          }).then(absorb);
        }));
      } else push({
        img: src
      });
    }).catch(() => {});
  };
  var otherBubble = isDark ? "rgba(255,255,255,0.07)" : "#fff";
  var mineBubble = isDark ? "#fff" : "#0a0a0a";
  var mineText = isDark ? "#0a0a0a" : "#fff";
  // Real photos only — the demo emoji-placeholder Photo path (m.photo) is gone.
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
    right: (() => {
      var n = memberCount != null ? memberCount : team.members && team.members.length;
      return n ? /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          color: "var(--text-4)",
          whiteSpace: "nowrap"
        }
      }, n, " \uD83D\uDC65") : null;
    })()
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
  }, msgs.length === 0 ? /*#__PURE__*/React.createElement("div", {
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
      padding: m.img ? 8 : "9px 13px"
    }
  }, m.img ? /*#__PURE__*/React.createElement(RealPhoto, {
    src: m.img,
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
  }, typeof BuddyFaceLive === "function" ? /*#__PURE__*/React.createElement(BuddyFaceLive, {
    avatar: m.avatar,
    name: m.who,
    size: 30
  }) : /*#__PURE__*/React.createElement("span", {
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
  }, (m.who || "?")[0]), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "78%",
      background: otherBubble,
      borderRadius: "18px 18px 18px 5px",
      padding: m.img ? 8 : "9px 13px",
      boxShadow: isDark ? "none" : "0 1px 2px rgba(0,0,0,0.05)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: m.img ? 4 : 2
    }
  }, m.who), m.img ? /*#__PURE__*/React.createElement(RealPhoto, {
    src: m.img,
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
      borderRadius: 22,
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
      background: text.trim() ? "#0a0a0a" : isDark ? "rgba(255,255,255,0.10)" : "rgba(120,120,128,0.18)",
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
    stroke: text.trim() ? "#fff" : "var(--text-4)",
    strokeWidth: "2.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 19V5M6 11l6-6 6 6"
  })))));
}

/* CONTACT DETAIL — public profile of a network member with their social-impact
   history, reviews, and bookable offers. No demo branches; faithful fork (reads its
   contact from useNav().params), with the iOS-Headline typography polish. */
function ContactDetailLive() {
  var {
    navigate,
    params
  } = useNav();
  var {
    open: openSheet
  } = useSheet();
  var app = useApp();
  var [booked, setBooked] = useCS({}); // booked offers (by index)
  var [added, setAdded] = useCS(false);
  // YOUR real level (was a hardcoded 8) so an offer's lock reflects actual XP.
  var userLevel = bosLevelInfoLive(bosLiveXPLive(app)).level;
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
      borderRadius: 14,
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
      borderRadius: 14,
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
      borderRadius: 14,
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
        borderRadius: 22,
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
        borderRadius: 14,
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
        color: "#fff",
        background: "#0a0a0a",
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
      borderRadius: 22,
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
      borderRadius: 14,
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
      fontWeight: 600,
      color: "var(--text)",
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
      borderRadius: 22,
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

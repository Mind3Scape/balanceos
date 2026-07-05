/* PROFILE SUB-SCREENS — LIVE-only forks (real Telegram user, app.mode === "live"
   is ALWAYS true here). Every demo ("Павел") and fresh branch is stripped: no
   curated April-2026 calendar, no scripted sample notifications, no demo
   ACHIEVEMENTS/courses ladder, no demo-only settings rows. Everything is real —
   real history from each habit's log, real Telegram sign-in, the real
   bosEarnedAchievementsLive / BOS_ACHIEVEMENTS_LIVE ladder, real cloud notifications.

   Reuses the shared core/ toolkit (SysCard, SysBtn, OrbitField, EditProfileSheet,
   InfoSheet, AvatarPickerSheet, DayRing) + the FeedbackSheetLive fork (shared_live.jsx)
   + framework (PageHeader, Switch, I, hooks useApp/useNav/useSheet, every
   bos* helper, BOS_ACHIEVEMENTS_LIVE / bosEarnedAchievementsLive, MOOD_OPTIONS, StaticOrb,
   tintFromMood, window.StateOrb, window.ALL_SPHERES / DEFAULT_SPHERES). useP is the
   React.useState alias now defined once in core/aliases.jsx.

   TYPOGRAPHY (iOS Headline polish): PRIMARY labels (settings-row labels,
   notification titles, history entry titles, achievement names, section titles)
   carry fontWeight: 600 + color: "var(--text)". Already-700 weights and
   secondary/caption text are left untouched.

   Top-level declarations in this file: SettingsLive, NotificationsLive, HistoryLive,
   SupportLive, AchievementsLive, ManifestLive, IconPickerLive + the friends family
   (bosHabitsWord, _bosFriendsPageCache, FriendsLive, FriendPreviewSheetLive) and
   StateHistorySheetLive. (GuideScreen is NOT defined in profile.jsx — it lives in
   app.jsx — so no GuideLive fork is made here.) */

// LIVE state-history sheet (Settings → «История состояния»): the user's REAL day-keyed
// mood marks, newest first. Honest empty state — never a fake calendar.
// Unified STATE + JOURNAL history (David: «состояние и дневник — одно и то же»): every day
// that has a mood mark OR a written note/tags, newest first, each row showing the state and
// the day's journal note together. Honest empty state.
function StateHistorySheetLive({
  app,
  dark = false
}) {
  var moods = typeof BOS_STATE !== "undefined" ? BOS_STATE : [];
  var dm = app && app.dayMoods || {};
  var dn = app && app.dayNotes || {};
  var keys = {};
  Object.keys(dm).forEach(k => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(k) && dm[k] != null) keys[k] = 1;
  });
  Object.keys(dn).forEach(k => {
    var e = dn[k];
    if (/^\d{4}-\d{2}-\d{2}$/.test(k) && e && (e.note != null && ("" + e.note).trim() || e.tags && e.tags.length)) keys[k] = 1;
  });
  var entries = Object.keys(keys).sort().reverse().map(k => {
    var e = dn[k] || {};
    return {
      key: k,
      m: dm[k] != null ? moods[dm[k]] || null : null,
      note: ("" + (e.note || "")).trim(),
      tags: e.tags || []
    };
  });
  var streak = typeof bosMoodStreak === "function" ? bosMoodStreak(dm) : 0;
  var C = dark ? {
    text: "#fff",
    sub: "rgba(255,255,255,0.5)",
    tile: "rgba(255,255,255,0.07)"
  } : {
    text: "#0a0a0a",
    sub: "rgba(0,0,0,0.5)",
    tile: "#f4f4f6"
  };
  var fmt = k => {
    try {
      var a = k.split("-");
      return new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long"
      }).format(new Date(+a[0], +a[1] - 1, +a[2]));
    } catch (e) {
      return k;
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 20px 22px",
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
  }, "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: C.sub,
      marginTop: 3
    }
  }, entries.length ? "Дней с записью: " + entries.length + (streak >= 2 ? "  ·  🔥 " + streak + " " + (typeof bosRuDays === "function" ? bosRuDays(streak) : "дней") + " подряд" : "") : "Здесь будут твои состояния и записи дневника")), entries.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "26px 6px",
      color: C.sub,
      fontSize: 14,
      lineHeight: 1.5
    }
  }, "\u041F\u043E\u043A\u0430 \u043F\u0443\u0441\u0442\u043E \u2014 \u043E\u0442\u043C\u0435\u0442\u044C \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u043D\u0430 \u0433\u043B\u0430\u0432\u043D\u043E\u043C \u044D\u043A\u0440\u0430\u043D\u0435.") : /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      maxHeight: "52vh",
      overflowY: "auto"
    }
  }, entries.map((e, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      padding: "11px 12px",
      background: C.tile,
      borderRadius: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: e.m ? "linear-gradient(160deg, " + e.m.c + ", " + e.m.c + "99)" : "rgba(127,181,255,0.18)",
      display: "grid",
      placeItems: "center",
      fontSize: 18,
      flexShrink: 0,
      marginTop: 1
    }
  }, e.m ? e.m.i : "📝"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600
    }
  }, e.m ? e.m.t : "Запись дня"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.sub,
      marginTop: 1
    }
  }, fmt(e.key)), e.note && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: C.text,
      marginTop: 6,
      lineHeight: 1.4,
      whiteSpace: "pre-wrap"
    }
  }, e.note), !e.note && e.tags.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: C.sub,
      marginTop: 5
    }
  }, e.tags.map(t => "#" + ("" + t).replace(/_/g, " ")).join("  ")))))));
}

// Склонение «привычка/привычки/привычек» для подписей друзей.
function bosHabitsWord(n) {
  n = Math.abs(n | 0);
  var d10 = n % 10,
    d100 = n % 100;
  if (d10 === 1 && d100 !== 11) return "привычка";
  if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) return "привычки";
  return "привычек";
}

/* СТРАНИЦА «ДРУЗЬЯ» (David: «страница друзей с карточками, превью их профилей, редактирование
   своего видимого профиля — нативно, как родное приложение iOS»). Раньше была куцая шторка-список;
   теперь полноценный экран в языке «Я»/Настроек (bos-sys-card, hairline-строки):
   1) ТВОЙ ВИДИМЫЙ ПРОФИЛЬ — как тебя видят друзья + карандаш (EditProfileSheet) + честная
      строка «Что видно другим» (имя, аватар, уровень, значки привычек — БЕЗ названий и записей).
   2) ТВОИ ЛЮДИ — реальные люди: приглашённые (реферальный круг) + участники твоих кругов
      (дедуп, без себя). Тап по карточке → ШТОРКА-превью профиля (FriendPreviewSheetLive).
   3) Золотая «Позвать друга» (ShareAppSheetLive) — та же механика +150 XP, что везде.
   Кэш в модульной переменной → мгновенный повторный вход (паттерн CircleFriendsStripLive). */
var _bosFriendsPageCache = null; // { people:[{id,name,avatar,invited,teams[]}], pub:{id:{level,lvlPct,habits,goals,people}} }
function FriendsLive() {
  var {
    navigate,
    params
  } = useNav();
  var app = useApp();
  var {
    open: openSheet
  } = useSheet();
  var isDark = app?.themeOverride === "dark";
  var back = params && params.from || "profile";
  // Кэш страницы ПЕРЕЖИВАЕТ перезапуск Telegram («Друзья открываются долго»): показываем прошлый
  // список МГНОВЕННО, сеть ревалидирует фоном. Память → localStorage → null (скелетон остаётся
  // только на самый первый вход в жизни).
  var [data, setData] = useP(() => {
    if (_bosFriendsPageCache) return _bosFriendsPageCache;
    try {
      var c = JSON.parse(localStorage.getItem("bos:cache:friendsPage") || "null");
      if (c && Array.isArray(c.people)) return c;
    } catch (e) {}
    return null;
  }); // null = загрузка
  var teamSig = (app?.teams || []).filter(t => t.cloudId).map(t => t.cloudId).join(",");
  React.useEffect(() => {
    var on = true;
    (async () => {
      if (!(window.bosCloud && window.bosCloud.enabled())) {
        if (on) setData({
          people: [],
          pub: {}
        });
        return;
      }
      var myId = null;
      try {
        myId = await window.bosCloud.uid();
      } catch (e) {}
      var seen = {},
        out = [];
      // 1+2) Приглашённые тобой + люди из твоих кругов — ОДНИМ ЗАЛПОМ. Раньше гонец ходил ПО ОДНОМУ
      // (uid → приглашённые → каждый круг по очереди ≈ (2+N) последовательных похода ≈ 1-2.5с
      // скелетона) — теперь все запросы летят параллельно; порядок сборки списка тот же.
      var teams = (app?.teams || []).filter(t => t.cloudId);
      var [inv, ...memLists] = await Promise.all([window.bosCloud.invitedPeople().catch(() => []), ...teams.map(t => window.bosCloud.teamMembers(t.cloudId).catch(() => []))]);
      // 1) Приглашённые тобой (реферальный круг) — в порядке приглашения.
      (inv || []).forEach(p => {
        if (p && p.id && p.id !== myId && !seen[p.id]) {
          seen[p.id] = 1;
          out.push({
            id: p.id,
            name: p.username || "Друг",
            avatar: p.avatar,
            invited: true,
            teams: []
          });
        }
      });
      // 2) Люди из твоих кругов — дедуп + запоминаем ОБЩИЕ круги (для превью).
      teams.forEach((t, ti) => {
        (memLists[ti] || []).forEach(m => {
          if (!m || !m.id || m.id === myId) return;
          if (!seen[m.id]) {
            seen[m.id] = 1;
            out.push({
              id: m.id,
              name: m.name || "Друг",
              avatar: m.avatar,
              invited: false,
              teams: []
            });
          }
          var f = out.find(x => x.id === m.id);
          if (f && !f.teams.some(x => x._id === t._id)) f.teams.push(t);
        });
      });
      // 3) Публичные орбиты друзей (уровень + значки привычек) — кормят подписи и превью.
      var pub = {};
      try {
        pub = (await window.bosCloud.profilesPublic(out.map(f => f.id))) || {};
      } catch (e) {}
      var d = {
        people: out,
        pub
      };
      _bosFriendsPageCache = d;
      try {
        localStorage.setItem("bos:cache:friendsPage", JSON.stringify(d));
      } catch (e) {}
      if (on) setData(d);
    })();
    return () => {
      on = false;
    };
  }, [teamSig]);
  var chip = icon => /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-chip-bg",
    style: {
      width: 30,
      height: 30,
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(icon, {
    size: 15,
    color: "var(--text)"
  }));
  var people = data && data.people;
  var pub = data && data.pub || {};
  var inviteFriend = () => {
    if (typeof ShareAppSheetLive === "function") openSheet(/*#__PURE__*/React.createElement(ShareAppSheetLive, {
      dark: isDark
    }));
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u0414\u0440\u0443\u0437\u044C\u044F",
    onBack: () => navigate(back)
  }), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-card",
    style: {
      marginTop: 6,
      padding: 0,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => openSheet(/*#__PURE__*/React.createElement(EditProfileSheet, {
      dark: isDark
    })),
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
  }, /*#__PURE__*/React.createElement(BuddyFaceLive, {
    avatar: app?.avatar,
    name: app?.userName,
    size: 46
  }), /*#__PURE__*/React.createElement("div", {
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
  }, app?.userName || "Ты"), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 12.5,
      marginTop: 1
    }
  }, "\u0422\u0430\u043A \u0442\u0435\u0431\u044F \u0432\u0438\u0434\u044F\u0442 \u0434\u0440\u0443\u0437\u044C\u044F")), /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-chip-bg",
    style: {
      width: 30,
      height: 30,
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(I.Pencil, {
    size: 14,
    color: "var(--text)"
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: () => openSheet(/*#__PURE__*/React.createElement(InfoSheet, {
      title: "\u0427\u0442\u043E \u0432\u0438\u0434\u043D\u043E \u0434\u0440\u0443\u0433\u0438\u043C",
      body: "\u0414\u0440\u0443\u0437\u044C\u044F \u0432\u0438\u0434\u044F\u0442 \u0442\u0432\u043E\u0451 \u0438\u043C\u044F, \u0430\u0432\u0430\u0442\u0430\u0440, \u0443\u0440\u043E\u0432\u0435\u043D\u044C \u0438 \u0437\u043D\u0430\u0447\u043A\u0438 \u043F\u0440\u0438\u0432\u044B\u0447\u0435\u043A \u2014 \u0431\u0435\u0437 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0439, \u0437\u0430\u043F\u0438\u0441\u0435\u0439 \u0438 \u0437\u0430\u043C\u0435\u0442\u043E\u043A. \u0412\u0441\u0451 \u043E\u0441\u0442\u0430\u043B\u044C\u043D\u043E\u0435 \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0443 \u0442\u0435\u0431\u044F.",
      cta: "\u041F\u043E\u043D\u044F\u0442\u043D\u043E",
      dark: isDark
    })),
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
  }, chip(I.Eye), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, "\u0427\u0442\u043E \u0432\u0438\u0434\u043D\u043E \u0434\u0440\u0443\u0433\u0438\u043C"), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    className: "bos-sys-text-2"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0422\u0432\u043E\u0438 \u043B\u044E\u0434\u0438", people && people.length ? " · " + people.length : ""), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-card",
    style: {
      marginTop: 8,
      padding: 0,
      overflow: "hidden"
    }
  }, people === null && [0, 1, 2].map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 14px",
      borderTop: i ? "0.5px solid var(--line)" : 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-skel",
    style: {
      width: 42,
      height: 42,
      borderRadius: "50%",
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "bos-skel",
    style: {
      display: "block",
      width: "42%",
      height: 12,
      borderRadius: 6
    }
  }))), people && people.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "24px 18px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      lineHeight: 1
    }
  }, "\uD83E\uDEE7"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)",
      marginTop: 9
    }
  }, "\u041F\u043E\u043A\u0430 \u043D\u0438\u043A\u043E\u0433\u043E \u0440\u044F\u0434\u043E\u043C"), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 12.5,
      marginTop: 4,
      lineHeight: 1.45,
      maxWidth: 240,
      margin: "4px auto 0"
    }
  }, "\u041F\u043E\u0437\u043E\u0432\u0438 \u0434\u0440\u0443\u0433\u0430 \u2014 \u043E\u043D \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0437\u0434\u0435\u0441\u044C \u0438 \u043D\u0430 \u0442\u0432\u043E\u0435\u0439 \u043E\u0440\u0431\u0438\u0442\u0435.")), people && people.map((f, i) => {
    // ЖИВАЯ строка друга (v530): золотое кольцо уровня вокруг лица (тот же язык, что
    // строка «Уровень» на «Я»), бейдж-цифра, справа — значки его РЕАЛЬНЫХ привычек из
    // публичной орбиты (эмодзи+цвет, без названий — то, что он и так показывает миру).
    var o = pub[f.id];
    var lvl = o && o.level || 0;
    var pctRing = Math.max(0, Math.min(100, o && o.lvlPct || 0));
    var hb = (o && o.habits || []).slice(0, 3);
    var sub = lvl > 0 ? "Уровень " + lvl + ((o.habits || []).length ? " · " + o.habits.length + " " + bosHabitsWord((o.habits || []).length) : "") : f.invited ? "Пришёл по твоему приглашению" : "Вместе в круге";
    return /*#__PURE__*/React.createElement("button", {
      key: f.id,
      onClick: () => openSheet(/*#__PURE__*/React.createElement(FriendPreviewSheetLive, {
        friend: f,
        pub: o,
        navigate: navigate
      })),
      className: "tap",
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
        padding: "12px 14px"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: "relative",
        width: 46,
        height: 46,
        flexShrink: 0,
        display: "grid",
        placeItems: "center"
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "46",
      height: "46",
      viewBox: "0 0 46 46",
      style: {
        position: "absolute",
        inset: 0,
        transform: "rotate(-90deg)"
      },
      "aria-hidden": true
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "23",
      cy: "23",
      r: "21.5",
      fill: "none",
      stroke: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
      strokeWidth: "2"
    }), pctRing > 0 && /*#__PURE__*/React.createElement("circle", {
      cx: "23",
      cy: "23",
      r: "21.5",
      fill: "none",
      stroke: "url(#bosFrLvl)",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeDasharray: "135.1",
      strokeDashoffset: 135.1 * (1 - pctRing / 100)
    }), /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
      id: "bosFrLvl",
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
    })))), /*#__PURE__*/React.createElement(BuddyFaceLive, {
      avatar: f.avatar,
      name: f.name,
      size: 38
    }), lvl > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        right: -3,
        bottom: -2,
        minWidth: 17,
        height: 17,
        borderRadius: 999,
        background: "linear-gradient(135deg,#FEDE34,#EF9F14)",
        color: "#0a0a0a",
        fontSize: 10,
        fontWeight: 800,
        display: "grid",
        placeItems: "center",
        padding: "0 3px",
        boxShadow: "0 0 0 2px var(--card)"
      }
    }, lvl)), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15.5,
        fontWeight: 600,
        color: "var(--text)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, f.name), /*#__PURE__*/React.createElement("div", {
      className: "bos-sys-text-3",
      style: {
        fontSize: 12.5,
        marginTop: 1
      }
    }, sub)), hb.length > 0 ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        marginRight: 2,
        flexShrink: 0
      }
    }, hb.map((hx, j) => /*#__PURE__*/React.createElement("span", {
      key: j,
      style: {
        width: 24,
        height: 24,
        borderRadius: 8,
        background: hx && hx.c ? hx.c + "26" : "var(--card-2)",
        display: "grid",
        placeItems: "center",
        fontSize: 12,
        marginLeft: j ? -6 : 0,
        border: "1.5px solid var(--card)"
      }
    }, hx && hx.e || "✨"))) : f.teams.length > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15,
        marginRight: 2
      }
    }, bosIcon(f.teams[0].emblem || "✨", 15, null)), /*#__PURE__*/React.createElement(I.ChevronRight, {
      size: 16,
      className: "bos-sys-text-2"
    }));
  })), (() => {
    var invited = Math.max(app?.invitedCount || 0, people ? people.filter(p => p.invited).length : 0);
    var miles = [{
      n: 3,
      b: 300
    }, {
      n: 7,
      b: 700
    }, {
      n: 15,
      b: 1500
    }, {
      n: 30,
      b: 3000
    }];
    var next = miles.find(m => m.n > invited);
    return /*#__PURE__*/React.createElement("button", {
      onClick: inviteFriend,
      className: "tap",
      style: {
        width: "100%",
        marginTop: 16,
        position: "relative",
        overflow: "hidden",
        border: 0,
        borderRadius: 22,
        padding: 16,
        background: "linear-gradient(135deg, #FEDE34, #EF9F14)",
        boxShadow: "0 8px 22px rgba(239,159,20,0.3)",
        color: "#0a0a0a",
        textAlign: "left",
        cursor: "pointer",
        display: "block"
      }
    }, /*#__PURE__*/React.createElement("div", {
      "aria-hidden": true,
      style: {
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle at 86% 8%, rgba(255,255,255,0.4) 0%, transparent 55%)",
        pointerEvents: "none"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 13,
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 44,
        height: 44,
        borderRadius: 14,
        background: "rgba(255,255,255,0.5)",
        display: "grid",
        placeItems: "center",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(I.Share, {
      size: 20
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 7
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15.5,
        fontWeight: 700,
        letterSpacing: "-0.2px"
      }
    }, "\u041F\u043E\u0437\u0432\u0430\u0442\u044C \u0434\u0440\u0443\u0433\u0430"), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        fontSize: 10.5,
        fontWeight: 800,
        color: "#FEDE34",
        background: "#0a0a0a",
        padding: "2px 8px",
        borderRadius: 999,
        flexShrink: 0
      }
    }, "+150 XP")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: "rgba(10,10,10,0.65)",
        marginTop: 2
      }
    }, "\u041E\u043D \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u043D\u0430 \u0442\u0432\u043E\u0435\u0439 \u043E\u0440\u0431\u0438\u0442\u0435 \u2014 \u0438 \u0432\u044B \u0431\u0443\u0434\u0435\u0442\u0435 \u0432\u0438\u0434\u0435\u0442\u044C \u0436\u0438\u0432\u043E\u0435 \u0434\u0440\u0443\u0433 \u0434\u0440\u0443\u0433\u0430")), /*#__PURE__*/React.createElement(I.ChevronRight, {
      size: 18
    })), next && /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative",
        marginTop: 13
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
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 0.7,
        color: "rgba(10,10,10,0.55)"
      }
    }, "\u0412\u0435\u0445\u0430 \xB7 +", next.b, " XP \u0431\u043E\u043D\u0443\u0441\u043E\u043C"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        color: "rgba(10,10,10,0.75)",
        fontVariantNumeric: "tabular-nums"
      }
    }, invited, " \u0438\u0437 ", next.n)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 4
      }
    }, Array.from({
      length: next.n
    }, (_, j) => /*#__PURE__*/React.createElement("span", {
      key: j,
      style: {
        flex: 1,
        height: 6,
        borderRadius: 999,
        background: j < invited ? "#0a0a0a" : "rgba(10,10,10,0.18)"
      }
    })))));
  })());
}

/* ШТОРКА-ПРЕВЬЮ ПРОФИЛЯ ДРУГА — его космос тем же OrbitField, что на «Я» (аватар в центре,
   золотое кольцо уровня, значки привычек на кольцах — из ПУБЛИЧНОЙ орбиты, без названий),
   тройка фактов и общие круги (тап → комната круга). navigate — пропом (шторки вне NavCtx). */
function FriendPreviewSheetLive({
  friend,
  pub,
  navigate
}) {
  var {
    open: openSheet,
    close
  } = useSheet();
  var app = useApp();
  var isDark = app?.themeOverride === "dark";
  var o = pub || {};
  var habits = (o.habits || []).map(h => ({
    emoji: h && h.e || "✨",
    color: h && h.c || null
  }));
  var goTeam = t => {
    close();
    if (typeof navigate === "function") navigate("team-detail", {
      team: t,
      from: "friends"
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "bos-sheet-scroll",
    style: {
      paddingLeft: 18,
      paddingRight: 18,
      textAlign: "center"
    }
  }, typeof OrbitField === "function" ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: -8
    }
  }, /*#__PURE__*/React.createElement(OrbitField, {
    avatar: friend.avatar,
    name: friend.name,
    habits: habits,
    people: [],
    levelPct: o.lvlPct || 2,
    dark: isDark,
    hideLevelArc: true,
    editable: false,
    levelBadge: o.level || 0
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(BuddyFaceLive, {
    avatar: friend.avatar,
    name: friend.name,
    size: 76
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--bos-title-font)",
      fontWeight: 700,
      fontSize: 24,
      marginTop: 0,
      color: "var(--text)",
      letterSpacing: "-0.4px"
    }
  }, friend.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-4)",
      marginTop: 3
    }
  }, friend.invited ? "На твоей орбите — по твоему приглашению" : "Вы вместе ведёте круг"), o.level > 0 || habits.length > 0 || o.goals > 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 8,
      marginTop: 14
    }
  }, [["Уровень", o.level || 1], ["Привычки", habits.length], ["Цели", o.goals || 0]].map(([l, v]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      background: "var(--surface-3)",
      borderRadius: 16,
      padding: "11px 6px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      color: "var(--text)",
      letterSpacing: "-0.3px"
    }
  }, v), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-4)",
      marginTop: 1,
      fontWeight: 600
    }
  }, l)))) : /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-4)",
      marginTop: 14,
      lineHeight: 1.45
    }
  }, "\u041E\u0440\u0431\u0438\u0442\u0430 \u0434\u0440\u0443\u0433\u0430 \u0435\u0449\u0451 \u043D\u0430\u043F\u043E\u043B\u043D\u044F\u0435\u0442\u0441\u044F \u2014 \u0437\u043D\u0430\u0447\u043A\u0438 \u0435\u0433\u043E \u043F\u0440\u0438\u0432\u044B\u0447\u0435\u043A \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F \u0437\u0434\u0435\u0441\u044C."), friend.teams && friend.teams.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "left",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "var(--text-4)",
      margin: "18px 2px 8px"
    }
  }, "\u0412\u043C\u0435\u0441\u0442\u0435 \u0432 \u043A\u0440\u0443\u0433\u0430\u0445"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      flexWrap: "wrap",
      justifyContent: "flex-start"
    }
  }, friend.teams.map(t => /*#__PURE__*/React.createElement("button", {
    key: t._id,
    onClick: () => goTeam(t),
    className: "tap",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      ...(typeof bosChipGlass === "function" ? bosChipGlass(isDark) : {
        background: "var(--surface-3)"
      }),
      padding: "7px 13px 7px 9px",
      borderRadius: 999,
      fontSize: 12.5,
      fontWeight: 600,
      color: "var(--text-2)",
      border: 0,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14
    }
  }, bosIcon(t.emblem || "✨", 14, null)), t.name)))), /*#__PURE__*/React.createElement("button", {
    onClick: () => openSheet(/*#__PURE__*/React.createElement(GoalFormSheetLive, {
      mode: "create",
      circleOn: true,
      navigate: navigate
    })),
    className: "tap",
    style: {
      width: "100%",
      background: "transparent",
      border: 0,
      color: "var(--text-3)",
      padding: "12px",
      marginTop: 14,
      fontSize: 13.5,
      fontWeight: 600
    }
  }, "\u0421\u043E\u0431\u0440\u0430\u0442\u044C \u043E\u0431\u0449\u0438\u0439 \u043A\u0440\u0443\u0433 \u2192"));
}
function SettingsLive() {
  var {
    navigate
  } = useNav();
  var app = useApp();
  var {
    open: openSheet
  } = useSheet();
  var routeDark = app?.themeOverride !== "light"; // settings is a dark route unless globally forced light
  // Push is a REAL saved setting for live users — persisted to localStorage by profile id,
  // and it gates the Telegram push the bot sends.
  var pushKey = "bos:push:" + (app?.persistId || "live");
  var [push, setPush] = useP(() => {
    try {
      var v = localStorage.getItem(pushKey);
      return v == null ? true : v === "1";
    } catch (e) {
      return true;
    }
  });
  var setPushPersist = on => {
    setPush(on);
    try {
      localStorage.setItem(pushKey, on ? "1" : "0");
    } catch (e) {}
  };
  var isDark = app?.themeOverride === "dark";
  var setDark = on => app?.setThemeOverride(on ? "dark" : "light");
  // «Эффект стекла» (David: «тоггл — и так и так посмотреть смогу, и нагружает телефон»):
  // ВЫКЛ глушит все backdrop-размытия через body.bos-noglass (CSS), вид почти тот же.
  var [glassOn, setGlassOn] = React.useState(() => {
    try {
      return localStorage.getItem("bos:glass") !== "0";
    } catch (e) {
      return true;
    }
  });
  var setGlassPersist = on => {
    setGlassOn(on);
    try {
      localStorage.setItem("bos:glass", on ? "1" : "0");
    } catch (e) {}
    try {
      window.dispatchEvent(new Event("bos:glassChanged"));
    } catch (e) {}
  };
  // Вкладка «Я» внизу (слияние Главной и «Привычек»): дефолт ВКЛ; выключил — заходи через
  // аватар в сводке дня. Если сводку убрали с доски, вкладка показывается принудительно
  // (app.jsx), чтобы дверь в настройки не захлопнулась.
  var [profTab, setProfTab] = React.useState(() => {
    try {
      return localStorage.getItem("bos:profileTab") !== "0";
    } catch (e) {
      return true;
    }
  });
  var setProfTabPersist = on => {
    setProfTab(on);
    try {
      localStorage.setItem("bos:profileTab", on ? "1" : "0");
    } catch (e) {}
    try {
      window.dispatchEvent(new Event("bos:profileTabChanged"));
    } catch (e) {}
  };
  // Grouped iOS-style sections (v279 reno): ONE card per group, hairline-divided rows inside.
  // Helpers are plain render-fns (not components) so toggling never remounts the list.
  var PRIVACY_BODY = "Мы храним только то, что нужно приложению: твои привычки, состояние и записи. Они привязаны к твоему аккаунту Telegram. Полные документы — на сайте проекта.";
  var chip = icon => /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-chip-bg",
    style: {
      width: 30,
      height: 30,
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(icon, {
    size: 16,
    color: "var(--text)"
  }));
  var row = (icon, label, onClick, last) => /*#__PURE__*/React.createElement("button", {
    key: label,
    onClick: onClick,
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
  }, icon ? chip(icon) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, label), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    className: "bos-sys-text-2"
  }));
  var toggleRow = (icon, label, val, set, last) => /*#__PURE__*/React.createElement("div", {
    key: label,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 14px",
      borderBottom: last ? "none" : "0.5px solid var(--line)"
    }
  }, chip(icon), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, label), /*#__PURE__*/React.createElement(Switch, {
    on: val,
    onChange: set,
    dark: isDark
  }));
  var group = (title, rows) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: title
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-card",
    style: {
      marginTop: 8,
      padding: 0,
      overflow: "hidden"
    }
  }, rows));
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
    onBack: () => navigate("profile")
  }), group("Профиль", [row(I.Pencil, "Редактировать профиль", () => openSheet(/*#__PURE__*/React.createElement(EditProfileSheet, {
    dark: routeDark
  }))), row(I.Globe, "Вход через Telegram", () => openSheet(/*#__PURE__*/React.createElement(InfoSheet, {
    title: "\u0412\u0445\u043E\u0434 \u0447\u0435\u0440\u0435\u0437 Telegram",
    body: "\u0422\u044B \u0432\u0445\u043E\u0434\u0438\u0448\u044C \u0447\u0435\u0440\u0435\u0437 \u0441\u0432\u043E\u0439 \u0430\u043A\u043A\u0430\u0443\u043D\u0442 Telegram \u2014 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C \u043D\u0435 \u043D\u0443\u0436\u0435\u043D. \u0422\u0432\u043E\u0438 \u0434\u0430\u043D\u043D\u044B\u0435 \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D\u044B \u043A \u043D\u0435\u043C\u0443 \u0438 \u043F\u0435\u0440\u0435\u043D\u043E\u0441\u044F\u0442\u0441\u044F \u043C\u0435\u0436\u0434\u0443 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430\u043C\u0438.",
    cta: "\u041F\u043E\u043D\u044F\u0442\u043D\u043E",
    dark: routeDark
  })), true)]), group("Предпочтения", [toggleRow(I.Eye, "Тёмная тема", isDark, setDark), toggleRow(I.Bell, "Push-уведомления", push, setPushPersist), toggleRow(I.Sparkles, "Эффект стекла", glassOn, setGlassPersist, true)]), group("Главный экран", [row(I.Home, "Главный экран", () => navigate("home-customize")),
  // Слияние: страницы «Привычки» больше нет, «Я» — четвёртая вкладка меню (по желанию).
  toggleRow(I.Person, "Вкладка «Я» внизу", profTab, setProfTabPersist, true)]), group("О приложении", [row(I.Compass, "Как устроен Balance", () => navigate("guide", {
    from: "settings"
  })), row(I.Sparkles, "Манифест", () => navigate("manifest", {
    from: "settings"
  })), row(null, "Политика конфиденциальности", () => openSheet(/*#__PURE__*/React.createElement(InfoSheet, {
    title: "\u041F\u043E\u043B\u0438\u0442\u0438\u043A\u0430 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438",
    body: PRIVACY_BODY,
    cta: "\u0413\u043E\u0442\u043E\u0432\u043E",
    dark: routeDark
  }))), row(null, "Условия использования", () => openSheet(/*#__PURE__*/React.createElement(InfoSheet, {
    title: "\u0423\u0441\u043B\u043E\u0432\u0438\u044F \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u044F",
    body: PRIVACY_BODY,
    cta: "\u0413\u043E\u0442\u043E\u0432\u043E",
    dark: routeDark
  })), true)]), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      textAlign: "center",
      padding: "16px 14px 2px",
      fontSize: 13
    }
  }, "\u0412\u0435\u0440\u0441\u0438\u044F ", APP_VERSION));
}

/* Лента уведомлений — ПРЕЗЕНТАЦИЯ (секция Б): «Требует решения» (заявки, Принять/✕),
   «Новое» (тебя приняли / вступили в круг / пришли по твоей ссылке), «Сообщения»
   (непрочитанные чаты). Отделена от загрузки, чтобы рендериться и с готовыми данными. */
function NotifFeedLive({
  data,
  busy,
  onApprove,
  onReject,
  onOpenTeam,
  onOpenChat,
  onOpenAccepted,
  onOpenFriends,
  onOpenBuddy,
  onOpenReminder
}) {
  var secHead = t => /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "var(--text-4)",
      padding: "8px 4px 0"
    }
  }, t);
  var face = (u, size) => typeof BuddyFaceLive === "function" ? /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(BuddyFaceLive, {
    avatar: u && u.avatar || "default",
    name: u && u.name || "",
    size: size || 40
  })) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 24,
      flexShrink: 0
    }
  }, "\uD83D\uDE42");
  var emblem = e => /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 13,
      flexShrink: 0,
      background: "linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe8))",
      display: "grid",
      placeItems: "center",
      fontSize: 20
    }
  }, typeof bosIcon === "function" ? bosIcon(e || "✨", 20, null) : e || "✨");
  var row = (key, left, title, sub, right, onClick) => /*#__PURE__*/React.createElement(SysCard, {
    key: key,
    onClick: onClick,
    style: {
      padding: 13,
      display: "flex",
      gap: 12,
      alignItems: "center",
      cursor: onClick ? "pointer" : "default"
    }
  }, left, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      fontSize: 14.5,
      color: "var(--text)",
      lineHeight: 1.3
    }
  }, title), sub && /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 12.5,
      marginTop: 2,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, sub)), right);
  var chatWord = n => n === 1 ? "новое сообщение" : n < 5 ? "новых сообщения" : "новых сообщений";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, (data.reminders || []).length > 0 && secHead("Напоминания"), (data.reminders || []).map((r, i) => row("rem-" + i, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 13,
      flexShrink: 0,
      background: r.habit && r.habit.color ? r.habit.color + "26" : "linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe8))",
      display: "grid",
      placeItems: "center",
      fontSize: 20
    }
  }, typeof bosIcon === "function" ? bosIcon(r.habit && r.habit.emoji || "⏰", 20, r.habit && r.habit.color) : r.habit && r.habit.emoji || "⏰"), "Пора: " + (r.habit && r.habit.name || "привычка"), "Ты просил напомнить в " + r.time + " · ещё не отмечено", /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    className: "bos-sys-text-3",
    style: {
      flexShrink: 0
    }
  }), () => onOpenReminder && onOpenReminder(r.habit))), data.requests.length > 0 && secHead("Требует решения"), data.requests.map(r => {
    var k = r.team.cloudId + ":" + r.user.id;
    var st = busy[k];
    return row(k, face(r.user), (r.user.name || "Гость") + " хочет в «" + r.team.name + "»", st === "done" ? "Принят — уже в круге ✓" : st === "rejected" ? "Заявка отклонена" : "Заявка на вступление", st === "done" || st === "rejected" ? null : /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        flexShrink: 0,
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        onApprove(r);
      },
      disabled: st === "busy",
      className: "tap",
      "data-haptic": "selection",
      style: {
        border: 0,
        cursor: "pointer",
        borderRadius: 999,
        padding: "9px 15px",
        fontSize: 13,
        fontWeight: 600,
        background: "var(--cta, #0a0a0a)",
        color: "var(--cta-ink, #fff)",
        opacity: st === "busy" ? 0.5 : 1
      }
    }, "\u041F\u0440\u0438\u043D\u044F\u0442\u044C"), /*#__PURE__*/React.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        onReject(r);
      },
      disabled: st === "busy",
      className: "tap",
      "aria-label": "\u041E\u0442\u043A\u043B\u043E\u043D\u0438\u0442\u044C",
      style: {
        border: 0,
        cursor: "pointer",
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: "var(--card-2)",
        color: "var(--text-3)",
        display: "grid",
        placeItems: "center",
        opacity: st === "busy" ? 0.5 : 1
      }
    }, /*#__PURE__*/React.createElement(I.X, {
      size: 15
    }))), null);
  }), (data.accepted.length > 0 || data.joined.length > 0 || (data.buddies || []).length > 0 || data.invited.length > 0) && secHead("Новое"), data.accepted.map(a => row("acc-" + a.row.id, emblem(a.row.emblem), "Тебя приняли в «" + a.row.name + "»", "Открыть круг", /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    className: "bos-sys-text-3",
    style: {
      flexShrink: 0
    }
  }), () => onOpenAccepted(a.row))), data.joined.map((j, i) => row("join-" + i, face(j.user), (j.user.name || "Гость") + " теперь в «" + j.team.name + "»", "Вступил по ссылке-приглашению", /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    className: "bos-sys-text-3",
    style: {
      flexShrink: 0
    }
  }), () => onOpenTeam(j.team))), (data.buddies || []).map((b, i) => row("bud-" + i, face(b.user), (b.user.name || "Друг") + " присоединился к привычке «" + (b.habit.name || "…") + "»", "Теперь ведёте её вместе — вы видите отметки друг друга", /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    className: "bos-sys-text-3",
    style: {
      flexShrink: 0
    }
  }), () => onOpenBuddy && onOpenBuddy(b.habit))), data.invited.map((p, i) => row("inv-" + i, face({
    name: p.user.username,
    avatar: p.user.avatar
  }), (p.user.username || "Гость") + " пришёл по твоему приглашению", "Теперь на твоей орбите · +150 XP", /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    className: "bos-sys-text-3",
    style: {
      flexShrink: 0
    }
  }), onOpenFriends)), data.chats.length > 0 && secHead("Сообщения"), data.chats.map((c, i) => row("chat-" + i, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 24,
      flexShrink: 0
    }
  }, "\uD83D\uDCAC"), c.count + " " + chatWord(c.count) + " в «" + c.team.name + "»", c.last && c.last.text || "📷 Фото", /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    className: "bos-sys-text-3",
    style: {
      flexShrink: 0
    }
  }), () => onOpenChat(c.team))));
}
function NotificationsLive() {
  var {
    navigate,
    params
  } = useNav();
  var app = typeof useApp === "function" ? useApp() : null;
  // LIVE (секция Б): события из облака одним сборщиком bosNotifCollectLive (shared_live) —
  // заявки/вступившие/рефералы/«тебя приняли»/чаты. Показ = прочитано для «Новое»
  // (bosNotifAbsorbLive гасит точку); заявки живут до решения, чаты — до открытия чата.
  var [data, setData] = React.useState(null); // null = загрузка (скелет)
  var [busy, setBusy] = React.useState({}); // "<teamId>:<userId>" → busy|done|rejected
  var [cleared, setCleared] = React.useState(false); // «Очистить» прячет «Новое»+«Сообщения»
  React.useEffect(() => {
    var on = true;
    var emptyD = {
      requests: [],
      joined: [],
      invited: [],
      accepted: [],
      buddies: [],
      chats: [],
      absorb: null
    };
    if (!(window.bosCloud && window.bosCloud.enabled()) || typeof bosNotifCollectLive !== "function") {
      setData(emptyD);
      return;
    }
    bosNotifCollectLive(app).then(d => {
      if (!on) return;
      setData(d);
      if (typeof bosNotifAbsorbLive === "function") bosNotifAbsorbLive(d.absorb);
    }).catch(() => {
      if (on) setData(emptyD);
    });
    return () => {
      on = false;
    };
  }, []);
  var setB = (k, v) => setBusy(b => Object.assign({}, b, {
    [k]: v
  }));
  var approve = async r => {
    var k = r.team.cloudId + ":" + r.user.id;
    setB(k, "busy");
    var ok = await window.bosCloud.approveMember(r.team.cloudId, r.user.id).catch(() => false);
    if (ok) {
      if (window.tgHaptic) {
        try {
          window.tgHaptic("success");
        } catch (e) {}
      }
      setB(k, "done");
      // Принятый не должен тут же всплыть «вступившим»: пометим его виденным сразу.
      if (data && data.absorb && typeof bosNotifAbsorbLive === "function") {
        var m = (data.absorb.members[r.team.cloudId] || []).concat([r.user.id]);
        bosNotifAbsorbLive({
          inv: data.absorb.inv,
          members: Object.assign({}, data.absorb.members, {
            [r.team.cloudId]: m
          })
        });
      }
    } else setB(k, null);
  };
  var reject = async r => {
    var k = r.team.cloudId + ":" + r.user.id;
    setB(k, "busy");
    var ok = await window.bosCloud.rejectMember(r.team.cloudId, r.user.id).catch(() => false);
    if (ok) {
      if (window.tgHaptic) {
        try {
          window.tgHaptic("light");
        } catch (e) {}
      }
      setB(k, "rejected");
    } else setB(k, null);
  };
  var openChat = t => {
    try {
      localStorage.setItem("bos:chatread:" + t.cloudId, String(Date.now()));
    } catch (e) {}
    navigate("team-chat", {
      team: t,
      from: "notifications"
    });
  };
  var openTeam = t => navigate("team-detail", {
    team: t,
    from: "notifications"
  });
  var openFriends = () => navigate("friends", {
    from: "notifications"
  });
  var openBuddy = h => navigate("habit-detail", {
    habit: h,
    from: "notifications"
  });
  var openReminder = h => navigate("habit-detail", {
    habit: h,
    from: "notifications"
  });
  var openAccepted = row => {
    // Круг ещё не в моих «Целях» (вступление подтвердил владелец, не я) → добавим локально
    // тем же форматом, что joinViaLink в shell, снимем «стук» и откроем комнату.
    var lt = {
      _id: "cloud-" + row.id,
      cloudId: row.id,
      joined: true,
      name: row.name,
      emblem: row.emblem || "✨",
      accent: "#dbe9ff",
      vis: row.vis,
      goal: "",
      members: [],
      target: row.goal_target || 0,
      current: 0,
      progress: 0
    };
    var team = (app?.teams || []).find(t => t.cloudId === row.id);
    if (!team && app && typeof app.addTeam === "function") team = app.addTeam(lt) || lt;
    if (typeof bosNotifKnockResolved === "function") bosNotifKnockResolved(row.id);
    navigate("team-detail", {
      team: team || lt,
      from: "notifications"
    });
  };
  var clearAll = () => {
    // «Новое» уже поглощено при показе; дочитаем чаты и спрячем всё, кроме заявок.
    if (data) data.chats.forEach(c => {
      try {
        localStorage.setItem("bos:chatread:" + c.team.cloudId, String(Date.now()));
      } catch (e) {}
    });
    try {
      window.dispatchEvent(new Event("bos:notifSeenChanged"));
    } catch (e) {}
    setCleared(true);
  };
  // Напоминания привычек — локальные, мгновенные (не ждут облако): показываем сразу.
  var dueRem = typeof bosDueRemindersLive === "function" ? bosDueRemindersLive(app?.habits) : [];
  var loading = data === null;
  var emptyBase = {
    requests: [],
    joined: [],
    invited: [],
    accepted: [],
    buddies: [],
    chats: []
  };
  var base = loading ? emptyBase : cleared ? Object.assign({}, data, {
    joined: [],
    invited: [],
    accepted: [],
    buddies: [],
    chats: []
  }) : data;
  var shown = Object.assign({}, base, {
    reminders: dueRem
  });
  var _bud = shown && shown.buddies || [];
  var isEmpty = shown && !shown.requests.length && !shown.joined.length && !shown.invited.length && !shown.accepted.length && !_bud.length && !shown.chats.length && !dueRem.length;
  var canClear = shown && (shown.joined.length || shown.invited.length || shown.accepted.length || _bud.length || shown.chats.length) ? true : false;
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F",
    onBack: () => navigate(params?.from || "profile"),
    right: canClear ? /*#__PURE__*/React.createElement("button", {
      onClick: clearAll,
      className: "tap bos-sys-text-2",
      style: {
        background: "transparent",
        border: 0,
        fontSize: 13
      }
    }, "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C") : null
  }), loading && !dueRem.length ? /*#__PURE__*/React.createElement("div", {
    className: "bos-acc-in",
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, [0, 1].map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "bos-sys-card",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-skel",
    style: {
      width: 38,
      height: 38,
      borderRadius: "50%",
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-skel",
    style: {
      display: "block",
      width: "60%",
      height: 12,
      borderRadius: 6
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "bos-skel",
    style: {
      display: "block",
      width: "40%",
      height: 10,
      borderRadius: 6,
      marginTop: 7
    }
  }))))) : isEmpty ? /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      textAlign: "center",
      padding: "60px 20px",
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 34,
      marginBottom: 10
    }
  }, "\uD83D\uDD14"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      color: "var(--text-2)",
      fontSize: 15
    }
  }, "\u041F\u043E\u043A\u0430 \u0442\u0438\u0445\u043E"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      lineHeight: 1.5
    }
  }, "\u0417\u0434\u0435\u0441\u044C \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F \u0437\u0430\u044F\u0432\u043A\u0438 \u0432 \u0442\u0432\u043E\u0438 \u043A\u0440\u0443\u0433\u0438,", /*#__PURE__*/React.createElement("br", null), "\u043D\u043E\u0432\u044B\u0435 \u043B\u044E\u0434\u0438 \u0438 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F.")) : /*#__PURE__*/React.createElement(NotifFeedLive, {
    data: shown,
    busy: busy,
    onApprove: approve,
    onReject: reject,
    onOpenTeam: openTeam,
    onOpenChat: openChat,
    onOpenAccepted: openAccepted,
    onOpenFriends: openFriends,
    onOpenBuddy: openBuddy,
    onOpenReminder: openReminder
  }));
}
function HistoryLive() {
  var {
    navigate
  } = useNav();
  var app = useApp();

  // Detect theme from wrapper class so all calendar visuals stay coherent.
  var wrapRef = React.useRef(null);
  var [isDark, setIsDark] = useP(false);
  React.useEffect(() => {
    var el = wrapRef.current;
    if (!el) return;
    var n = el.parentElement;
    while (n && !n.classList.contains("theme-light") && !n.classList.contains("theme-dark")) n = n.parentElement;
    setIsDark(!!(n && n.classList.contains("theme-dark")));
  }, []);

  // Theme tokens shared across the page
  var TH = isDark ? {
    cellEmpty: "rgba(255,255,255,0.05)",
    cellIdle: "rgba(255,255,255,0.10)",
    ringTrack: "rgba(255,255,255,0.13)",
    cellSelBg: "rgba(255,255,255,0.16)",
    todayBg: "rgba(255,255,255,0.14)",
    todayFg: "#fff",
    cellBorder: "rgba(255,255,255,0.10)",
    cellText: "#fff",
    cellMuted: "rgba(255,255,255,0.45)",
    yellowFill: "linear-gradient(160deg, #FEDE34, #EF9F14)",
    yellow: "#FEDE34",
    chipBg: "rgba(255,255,255,0.06)",
    progressBg: "rgba(255,255,255,0.08)",
    iconBg: "rgba(255,255,255,0.06)",
    outlineSel: "#fff",
    outlineToday: "rgba(255,255,255,0.45)",
    moodText: "rgba(0,0,0,0.75)" // emoji bg is colored so dark text reads
  } : {
    cellEmpty: "transparent",
    cellIdle: "#f5f5f5",
    ringTrack: "rgba(0,0,0,0.09)",
    cellSelBg: "rgba(0,0,0,0.07)",
    todayBg: "rgba(0,0,0,0.07)",
    todayFg: "var(--text)",
    cellBorder: "rgba(0,0,0,0.06)",
    cellText: "var(--text)",
    cellMuted: "var(--text-4)",
    yellowFill: "linear-gradient(160deg, #FEDE34, #EF9F14)",
    yellow: "#FEDE34",
    chipBg: "var(--surface-3)",
    progressBg: "var(--surface-3)",
    iconBg: "var(--surface-3)",
    outlineSel: "#0a0a0a",
    outlineToday: "rgba(0,0,0,0.35)",
    moodText: "rgba(0,0,0,0.75)"
  };

  // LIVE walks the user's REAL calendar (today = now).
  var MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  var DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var _now = new Date();
  var CUR_M = _now.getMonth();
  var year = _now.getFullYear();
  var today = _now.getDate();
  var _leap = y => y % 4 === 0 && y % 100 !== 0 || y % 400 === 0;
  var [mIdx, setMIdx] = useP(CUR_M);
  var monthName = MONTHS[mIdx];
  var daysInMonth = mIdx === 1 && _leap(year) ? 29 : DIM[mIdx];
  // Real weekday of the 1st of the shown month.
  var startWeekday = new Date(year, mIdx, 1).getDay();
  var isCurMonth = mIdx === CUR_M;
  var isFuture = mIdx > CUR_M;
  var lastLogged = isCurMonth ? today : daysInMonth; // past months fully logged; this one up to today

  // A day's completion = share of the user's habits logged on that real date.
  // h.log is keyed by local ISO date ("2026-06-23"); 0 habits → null (nothing to show).
  var liveHabits = app?.habits || [];
  var iso = d => year + "-" + (mIdx + 1 < 10 ? "0" : "") + (mIdx + 1) + "-" + (d < 10 ? "0" : "") + d;
  var completion = d => {
    if (isFuture || d > lastLogged) return null;
    if (!liveHabits.length) return null;
    var k = iso(d);
    var done = liveHabits.reduce((s, h) => s + (h && h.log && h.log[k] ? 1 : 0), 0);
    return done / liveHabits.length;
  };
  var [selDay, setSelDay] = useP(today);
  // «Компактно» (minimalist, default) ↔ «Подробно» — the SAME eye toggle as the habit-detail
  // calendar (David: «минималистичный вид + переключение как в привычках»).
  var [compact, setCompact] = useP(true);
  var blanks = Array.from({
    length: startWeekday
  }, (_, i) => ({
    blank: true,
    key: "b" + i
  }));
  var days = Array.from({
    length: daysInMonth
  }, (_, i) => ({
    d: i + 1,
    key: "d" + (i + 1)
  }));
  var cells = [...blanks, ...days];
  var weekday = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  // Heat-cell tokens for the squircle calendar — graphite fill by completion, grey glass rings,
  // no gold (David: золото на дне не подходит → серое стекло; единый язык с деталью привычки).
  var cellFut = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)";
  var todayRingC = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.42)";
  var selRingC = isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.28)";

  // The live user's REAL habits + whether each was logged on the selected date.
  var liveDayHabits = d => liveHabits.map(h => ({
    e: h.emoji || "✨",
    n: h.name || "Привычка",
    on: !!(h && h.log && h.log[iso(d)])
  }));
  var dayHabits = liveDayHabits(selDay);
  var selPct = completion(selDay);

  // Stats — REAL across all logged history.
  var totalDone, perfectDays, bestStreak;
  totalDone = liveHabits.reduce((s, h) => s + (h && h.log ? Object.keys(h.log).length : 0), 0);
  bestStreak = typeof bosMaxStreak === "function" ? bosMaxStreak(liveHabits) : 0;
  // A "perfect day" = a date on which every habit was logged. Gather all logged dates,
  // then count those where the done-count equals the number of habits.
  var allDates = {};
  liveHabits.forEach(h => {
    if (h && h.log) Object.keys(h.log).forEach(k => {
      allDates[k] = (allDates[k] || 0) + 1;
    });
  });
  perfectDays = liveHabits.length ? Object.keys(allDates).filter(k => allDates[k] >= liveHabits.length).length : 0;
  // Empty state: no habits at all, OR habits but not a single logged day yet.
  var liveHasHistory = liveHabits.length > 0 && totalDone > 0;
  var showEmpty = !liveHasHistory;
  return /*#__PURE__*/React.createElement("div", {
    ref: wrapRef,
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u041A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C",
    onBack: () => navigate("home")
  }), showEmpty ?
  /*#__PURE__*/
  /* No history yet — honest empty state, never a fake calendar. */
  React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      textAlign: "center",
      padding: "70px 24px",
      fontSize: 14,
      lineHeight: 1.55
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 38,
      marginBottom: 12
    }
  }, "\uD83D\uDDD3\uFE0F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 600,
      color: "var(--text)",
      marginBottom: 6
    }
  }, "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0438\u0441\u0442\u043E\u0440\u0438\u0438"), "\u041E\u0442\u043C\u0435\u0447\u0430\u0439 \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438, \u0438 \u0442\u0443\u0442 \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0442\u0432\u043E\u0439 \u0440\u0438\u0442\u043C.") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(StatTrioLive, {
    isDark: isDark,
    card: {
      background: "var(--card)",
      boxShadow: "var(--card-shadow)",
      transform: "translateZ(0)"
    },
    items: [{
      l: "Лучшая",
      v: bestStreak,
      suf: "д",
      icon: /*#__PURE__*/React.createElement(I.Flame, {
        size: 14,
        color: "var(--text-4)"
      })
    }, {
      l: "Идеальных",
      v: perfectDays,
      suf: "",
      icon: /*#__PURE__*/React.createElement(I.Trophy, {
        size: 14,
        color: "var(--text-4)"
      })
    }, {
      l: "Отметок",
      v: Math.round(totalDone),
      suf: "",
      icon: /*#__PURE__*/React.createElement(I.ChartBar, {
        size: 14,
        color: "var(--text-4)"
      })
    }]
  }), /*#__PURE__*/React.createElement(SysCard, {
    style: {
      padding: 16,
      marginTop: 12,
      borderRadius: 22,
      transform: "translateZ(0)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12
    }
  }, compact ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      letterSpacing: "-0.3px"
    }
  }, monthName, " ", year) : /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("button", {
    onClick: () => setCompact(c => !c),
    className: "tap",
    "aria-label": compact ? "Подробно" : "Компактно",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: TH.chipBg,
      border: 0,
      borderRadius: 999,
      padding: "5px 11px",
      color: "var(--text-2)",
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(I.Eye, {
    size: 14,
    color: "var(--text-3)"
  }), compact ? "Подробно" : "Компактно")), !compact && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setMIdx(m => Math.max(0, m - 1)),
    disabled: mIdx === 0,
    "data-haptic": "selection",
    className: "tap hit44",
    style: {
      background: TH.chipBg,
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
  }, monthName, " ", year), /*#__PURE__*/React.createElement("button", {
    onClick: () => setMIdx(m => Math.min(11, m + 1)),
    disabled: mIdx === 11,
    "data-haptic": "selection",
    className: "tap hit44",
    style: {
      background: TH.chipBg,
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
  }))), !compact && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 6,
      maxWidth: 300,
      width: "100%",
      margin: "14px auto 0"
    }
  }, weekday.map((w, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "bos-sys-text-3",
    style: {
      textAlign: "center",
      fontSize: 10.5,
      fontWeight: 600,
      letterSpacing: 0.6
    }
  }, w))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 6,
      maxWidth: 300,
      width: "100%",
      margin: compact ? "0 auto" : "6px auto 0"
    }
  }, cells.map(c => {
    if (c.blank) return /*#__PURE__*/React.createElement("span", {
      key: c.key,
      "aria-hidden": true,
      style: {
        aspectRatio: "1/1"
      }
    });
    var pct = completion(c.d);
    var fut = pct == null;
    var isSelected = selDay === c.d;
    var isToday = isCurMonth && c.d === today;
    var filled = !fut && pct > 0;
    var bg = fut ? cellFut : pct <= 0 ? TH.cellIdle : bosCellFill("#0a0a0a", pct);
    var ink = fut ? TH.cellMuted : pct <= 0 ? TH.cellText : bosCellInk("#0a0a0a", pct, isDark);
    var ring = isToday ? todayRingC : !compact && isSelected ? selRingC : null;
    var sh = [filled ? bosCellGlass(isDark) : "", ring ? "0 0 0 1.6px " + ring : ""].filter(Boolean).join(", ") || "none";
    return /*#__PURE__*/React.createElement("button", {
      key: c.key,
      onClick: compact ? undefined : () => setSelDay(c.d),
      className: "tap",
      style: {
        aspectRatio: "1/1",
        border: 0,
        borderRadius: "50%",
        padding: 0,
        display: "grid",
        placeItems: "center",
        position: "relative",
        fontSize: 12.5,
        fontWeight: isToday ? 700 : 500,
        cursor: compact ? "default" : "pointer",
        background: bg,
        boxShadow: sh,
        color: ink
      }
    }, !compact && !fut && /*#__PURE__*/React.createElement("span", {
      style: {
        position: "relative",
        zIndex: 1
      }
    }, c.d));
  })), !compact && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 11
    }
  }, "\u041C\u0435\u043D\u044C\u0448\u0435"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, [0, 0.25, 0.5, 0.75, 1].map((p, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 15,
      height: 15,
      borderRadius: "50%",
      background: p <= 0 ? TH.cellIdle : bosCellFill("#0a0a0a", p),
      boxShadow: p > 0 ? bosCellGlass(isDark) : "none"
    }
  }))), /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 11
    }
  }, "\u0411\u043E\u043B\u044C\u0448\u0435"))), !compact && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22,
      padding: "0 4px"
    }
  }, monthName, " ", selDay, " \xB7 ", selPct == null ? "Будущее" : selPct === 1 ? "Идеальный день ✨" : selPct === 0 ? "Пропущен" : `${Math.round(selPct * 100)}%`), /*#__PURE__*/React.createElement(SysCard, {
    style: {
      marginTop: 8,
      borderRadius: 22,
      overflow: "hidden",
      padding: 0,
      transform: "translateZ(0)"
    }
  }, selPct == null ? /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      padding: 24,
      textAlign: "center",
      fontSize: 14
    }
  }, "\u042D\u0442\u043E\u0442 \u0434\u0435\u043D\u044C \u0435\u0449\u0451 \u043D\u0435 \u043D\u0430\u0441\u0442\u0443\u043F\u0438\u043B.") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      borderBottom: "1px solid var(--line)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-2",
    style: {
      fontSize: 13
    }
  }, Math.round(selPct * dayHabits.length), " \u0438\u0437 ", dayHabits.length, " \u043F\u0440\u0438\u0432\u044B\u0447\u0435\u043A"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      height: 8,
      background: TH.progressBg,
      borderRadius: 999,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: selPct * 100 + "%",
      background: bosCellFill("#0a0a0a", 1),
      borderRadius: 999
    }
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: "-0.4px"
    }
  }, Math.round(selPct * 100), "%")), (() => {
    var dkey = iso(selDay);
    var dm = app?.dayMoods?.[dkey] != null && typeof bosStateResolve === "function" ? bosStateResolve(app.dayMoods[dkey]) : null;
    if (!dm) return null;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderBottom: "1px solid var(--line)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 36,
        height: 36,
        display: "grid",
        placeItems: "center",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(StaticOrb, {
      size: 34,
      tint: tintFromMood(dm.c),
      seed: 1.2,
      intensity: 0.7
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "bos-sys-text-3",
      style: {
        fontSize: 10.5,
        textTransform: "uppercase",
        letterSpacing: 1,
        fontWeight: 600
      }
    }, "\u0421\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 600,
        color: "var(--text)",
        marginTop: 2
      }
    }, (dm.i ? dm.i + " " : "") + dm.t)));
  })(), (() => {
    var nkey = iso(selDay);
    var dn = app?.dayNotes?.[nkey];
    if (!dn || !(dn.tags && dn.tags.length || dn.note)) return null;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "12px 16px",
        borderBottom: "1px solid var(--line)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "bos-sys-text-3",
      style: {
        fontSize: 10.5,
        textTransform: "uppercase",
        letterSpacing: 1,
        fontWeight: 600
      }
    }, "\u0416\u0443\u0440\u043D\u0430\u043B"), dn.tags && dn.tags.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 8
      }
    }, dn.tags.map((tg, k) => /*#__PURE__*/React.createElement("span", {
      key: k,
      style: {
        fontSize: 12.5,
        padding: "5px 10px",
        borderRadius: 999,
        ...bosChipGlass(isDark)
      }
    }, "#", tg))), dn.note && /*#__PURE__*/React.createElement("div", {
      className: "bos-sys-text-2",
      style: {
        fontSize: 14,
        marginTop: 8,
        lineHeight: 1.45
      }
    }, dn.note));
  })(), dayHabits.map((h, i) => {
    // The habit's OWN logged state for this date.
    var done = h.on;
    return /*#__PURE__*/React.createElement("div", {
      key: i
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 36,
        height: 36,
        borderRadius: 13,
        background: BOS_TILE_SHEEN + ", " + (isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)"),
        boxShadow: bosTileGlass(isDark),
        display: "grid",
        placeItems: "center",
        fontSize: 18,
        flexShrink: 0
      }
    }, bosIcon(h.e, 18, null)), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        fontSize: 15,
        fontWeight: 600,
        color: "var(--text)",
        letterSpacing: "-0.2px"
      }
    }, h.n), /*#__PURE__*/React.createElement("span", {
      className: "check-btn " + (done ? "" : "unchecked"),
      style: {
        width: 26,
        height: 26
      }
    }, done && /*#__PURE__*/React.createElement(I.Check, {
      size: 14,
      strokeWidth: 2.5,
      color: "#fff"
    }))), i < dayHabits.length - 1 && /*#__PURE__*/React.createElement("div", {
      className: "divider"
    }));
  }))))));
}
function SupportLive() {
  var {
    navigate
  } = useNav();
  var app = useApp();
  var {
    open: openSheet
  } = useSheet();
  var routeDark = app?.themeOverride !== "light";
  var [q, setQ] = useP("");
  var [openFaq, setOpenFaq] = useP(null);
  var FAQ = [{
    q: "Как работают серии",
    a: "Серия прибавляет день за каждый день, когда ты выполнил хотя бы одну привычку. Пропустишь день — серия обнуляется, но история остаётся."
  }, {
    q: "Позвать в совместную цель",
    a: "Открой цель → шестерёнка → раздел «Участники» → выбери друга из подсказок. Он получит уведомление и сможет присоединиться к общей цели."
  }, {
    q: "Конфиденциальность и данные",
    a: "Твои данные о привычках видны только тебе. В совместной цели друзья видят лишь отметки по общим привычкам — не личные."
  }, {
    q: "Подключение Apple Health",
    a: "Настройки → Привязанные аккаунты. После подключения шаги и тренировки будут автоматически отмечать связанные привычки."
  }, {
    q: "Отмена подписки",
    a: "Подписка управляется в App Store: Настройки телефона → Apple ID → Подписки → BalanceOS → Отменить."
  }].filter(f => !q || f.q.toLowerCase().includes(q.toLowerCase()));
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u041F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430 \u0438 \u043F\u043E\u043C\u043E\u0449\u044C",
    onBack: () => navigate("profile")
  }), /*#__PURE__*/React.createElement(SysCard, {
    style: {
      padding: 14,
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(I.Search, {
    size: 18,
    className: "bos-sys-text-2"
  }), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u0441\u0442\u0430\u0442\u044C\u044F\u043C",
    className: "bos-sys-text-2",
    style: {
      flex: 1,
      border: 0,
      outline: 0,
      background: "transparent",
      fontSize: 15,
      color: "inherit"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u041F\u043E\u043F\u0443\u043B\u044F\u0440\u043D\u044B\u0435 \u0442\u0435\u043C\u044B"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 8
    }
  }, FAQ.map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, /*#__PURE__*/React.createElement(SysBtn, {
    onClick: () => setOpenFaq(o => o === f.q ? null : f.q)
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, f.q), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    className: "bos-sys-text-2",
    style: {
      transform: openFaq === f.q ? "rotate(90deg)" : "none",
      transition: "transform 0.2s"
    }
  })), openFaq === f.q && /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-2",
    style: {
      fontSize: 13.5,
      lineHeight: 1.55,
      padding: "10px 16px 2px"
    }
  }, f.a))), FAQ.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 14,
      padding: "8px 4px"
    }
  }, "\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E. \u041D\u0430\u043F\u0438\u0448\u0438 \u043D\u0430\u043C \u043D\u0438\u0436\u0435.")), /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0421\u0432\u044F\u0436\u0438\u0442\u0435\u0441\u044C \u0441 \u043D\u0430\u043C\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(SysCard, {
    onClick: () => openSheet(/*#__PURE__*/React.createElement(FeedbackSheetLive, {
      title: "\u041D\u0430\u043F\u0438\u0441\u0430\u0442\u044C \u043D\u0430\u043C",
      dark: routeDark
    })),
    style: {
      padding: 18,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 6,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(I.Mail, {
    size: 20
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, "\u041D\u0430\u043F\u0438\u0441\u0430\u0442\u044C \u043D\u0430\u043C"), /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-text-2",
    style: {
      fontSize: 12
    }
  }, "support@balanceos.app")), /*#__PURE__*/React.createElement(SysCard, {
    onClick: () => openSheet(/*#__PURE__*/React.createElement(FeedbackSheetLive, {
      title: "\u0427\u0430\u0442 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0438",
      dark: routeDark
    })),
    style: {
      padding: 18,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 6,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(I.MessageCircle, {
    size: 20
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, "\u0427\u0430\u0442 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0438"), /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-text-2",
    style: {
      fontSize: 12
    }
  }, "\u041E\u0442\u0432\u0435\u0442 \u0432 \u0441\u0440\u0435\u0434\u043D\u0435\u043C 5 \u043C\u0438\u043D"))));
}
function AchievementsLive() {
  var {
    navigate,
    params
  } = useNav();
  var app = typeof useApp === "function" ? useApp() : null;
  var {
    open: openSheet
  } = useSheet();
  var dark = app?.themeOverride === "dark";
  var back = params?.from || "profile";
  // LIVE: achievements earned by real signals — the real bosEarnedAchievementsLive ladder.
  var LIST = bosEarnedAchievementsLive(app);
  var byId = {};
  LIST.forEach(a => {
    byId[a.id] = a;
  });
  var earnedN = LIST.filter(a => a.earned).length;
  var _achXP = LIST.filter(a => a.earned).reduce((s, a) => s + (a.xp || 0), 0);
  // Category ladders — each badge grows within its branch (Apple-Fitness-style award grid).
  // Emoji art for now (David: native custom art later); grouped by what earns it.
  var CATS = [{
    t: "Старт",
    ids: ["first_habit"]
  }, {
    t: "Уровни",
    ids: ["lvl5", "lvl10", "lvl15", "lvl20", "lvl25"]
  }, {
    t: "Серии привычек",
    ids: ["habit21", "habit60"]
  }, {
    t: "Забота о себе",
    ids: ["week_state", "care30", "care100", "care180", "year"]
  }, {
    t: "Цели и вместе",
    ids: ["goal", "team"]
  }];
  var showDetail = a => openSheet(typeof AchievementDetailSheetLive === "function" ? /*#__PURE__*/React.createElement(AchievementDetailSheetLive, {
    ach: a,
    dark: dark
  }) : /*#__PURE__*/React.createElement(InfoSheet, {
    dark: dark,
    title: a.t,
    body: (a.earned ? "Открыто ✓\n\n" : "Как открыть: " + (a.how || "") + "\n\n") + a.d + (a.xp ? "  ·  +" + a.xp + " XP" : ""),
    cta: "\u0413\u043E\u0442\u043E\u0432\u043E"
  }));
  var tile = a => /*#__PURE__*/React.createElement("button", {
    key: a.id,
    onClick: () => showDetail(a),
    className: "tap",
    "aria-label": a.t,
    style: {
      border: 0,
      background: "transparent",
      padding: 0,
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: "100%",
      maxWidth: 58,
      aspectRatio: "1",
      borderRadius: 16,
      display: "grid",
      placeItems: "center",
      fontSize: 27,
      position: "relative",
      background: a.earned ? a.accent + "26" : "var(--card-2)",
      boxShadow: a.earned ? "inset 0 0 0 1.5px " + a.accent + "55" : "none",
      filter: a.earned ? "none" : "grayscale(1)",
      opacity: a.earned ? 1 : 0.5
    }
  }, a.i, !a.earned && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: -2,
      bottom: -2,
      width: 18,
      height: 18,
      borderRadius: "50%",
      background: "var(--card)",
      display: "grid",
      placeItems: "center",
      fontSize: 9
    }
  }, "\uD83D\uDD12")));
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u0414\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u044F",
    onBack: () => navigate(back)
  }), CATS.map(cat => {
    var items = cat.ids.map(id => byId[id]).filter(Boolean);
    if (!items.length) return null;
    var got = items.filter(a => a.earned).length;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: cat.t
    }, /*#__PURE__*/React.createElement("div", {
      className: "section-label",
      style: {
        marginTop: 22,
        padding: "0 4px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline"
      }
    }, /*#__PURE__*/React.createElement("span", null, cat.t), /*#__PURE__*/React.createElement("span", {
      className: "bos-sys-text-3",
      style: {
        fontWeight: 600,
        fontSize: 12
      }
    }, got, "/", items.length)), /*#__PURE__*/React.createElement(SysCard, {
      style: {
        padding: "16px 14px",
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: 12
      }
    }, items.map(tile))));
  }));
}

// Manifesto — the full philosophical text behind the onboarding, for those who
// want to read it whole. Reached from Settings → «О приложении». No mode-specific
// behaviour in the original, so the live fork is a faithful copy with the Headline
// stanza weight kept as-is (already 600).
function ManifestLive() {
  var {
    navigate,
    params
  } = useNav();
  var Orb = window.StateOrb;
  var stanzas = [["Ты — точка.", "Точка внимания внутри бесконечного количества возможных вариантов жизни."], ["Ты не видишь мир таким, какой он есть.", "Ты видишь его таким, в каком состоянии находишься."], [null, "Большинство людей не выбирают своё состояние. Они позволяют новостям, обстоятельствам, страхам и чужому мнению выбирать его за них."], [null, "Тебе кажется, что твоей жизнью управляют обстоятельства. Но обстоятельства не определяют твои решения — их определяет твоё состояние."], [null, "В одном состоянии всё кажется невозможным. В другом — ты видишь решения, которые были рядом всё это время."], ["Это пространство — для одного.", "Научиться управлять своим состоянием. Расширять восприятие. Видеть больше возможностей. И осознанно выбирать направление движения."], [null, "Твоя жизнь не определяется тем, что происходит вокруг. Она определяется тем, из какого состояния ты встречаешь происходящее."], ["Путешествие начинается внутри.", "Это пространство учит главному: управлять не обстоятельствами, а собой."]];
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 22px 44px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u041C\u0430\u043D\u0438\u0444\u0435\u0441\u0442",
    onBack: () => navigate(params?.from || "settings")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      placeItems: "center",
      margin: "6px 0 22px"
    }
  }, Orb ? /*#__PURE__*/React.createElement(Orb, {
    size: 94,
    tint: ["#cfe1ff", "#7aa4d0", "#1a2c48"],
    intensity: 1
  }) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 26
    }
  }, stanzas.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, s[0] && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20.5,
      fontWeight: 600,
      letterSpacing: "-0.4px",
      lineHeight: 1.26,
      color: "var(--text)"
    }
  }, s[0]), s[1] && /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-2",
    style: {
      fontSize: 15.5,
      lineHeight: 1.62,
      marginTop: s[0] ? 8 : 0
    }
  }, s[1])))));
}
function IconPickerLive() {
  var {
    navigate,
    params
  } = useNav();
  var list = ["☀️", "🤸🏼‍♀️", "📖", "🙏", "🧭", "⌨️", "🦶", "🚭", "🌚", "👟", "🧁", "📞", "🥊", "🧘🏼‍♀️", "🏃🏼‍♀️", "📚", "✍🏼", "🥗", "💧", "🧊", "🔥", "🎯", "🎨", "🎵", "🌱", "☕"];
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u0412\u044B\u0431\u0435\u0440\u0438 \u0438\u043A\u043E\u043D\u043A\u0443",
    onBack: () => navigate("habit-settings", params)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(5,1fr)",
      gap: 10
    }
  }, list.map((e, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: "tap",
    onClick: () => navigate("habit-settings", {
      ...params,
      picked: e
    }),
    style: {
      aspectRatio: "1/1",
      background: "var(--card)",
      border: 0,
      borderRadius: 14,
      fontSize: 28,
      boxShadow: "var(--card-shadow)"
    }
  }, e))));
}

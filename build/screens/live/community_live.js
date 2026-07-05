/* COMMUNITY — LIVE-only fork of CommunityScreen + TeamDetailScreen (real Telegram
   user, app.mode === "live" is ALWAYS true here). Giving the live user its OWN
   screen files keeps the two demo modes ('demo' / 'fresh') frozen — future live
   edits can never break the showcase.

   What the demo/fresh branches contributed (all stripped here):
   • CommunityLive — drops the fabricated Нетворк people list (YourImpactCard +
     the curated `network` array + their message/booking buttons) and the demo-only
     Партнёры marketplace tab + its `partners` array. Live Нетворк ALWAYS shows the
     honest NetworkLockedLive banner (real XP paths, no fake people); the secondary
     scope bar is just Нетворк + Курсы. Курсы are real (kept), with live cohort
     windows computed from today. Teams + cloud "Открытые команды рядом" discovery
     are kept.
   • TeamDetailLive — drops the demo team calendar, demo activity feed, demo chat
     line, the fabricated leaderboard (contribution %, 👑 leader, expandable
     per-member habit chips) and the DEFAULT_TEAM_HABITS seed. Live keeps the REAL
     cloud roster (window.bosCloud.teamMembers → BOS_TEAM_PALETTE colours + dark
     initials), real team habits (teamHabitsFull / toggleTeamHabitToday), owner
     join-request approvals, leave/delete, and the share-link sheet.

   Everything else reuses the shared core/ toolkit (BOS_TEAM_PALETTE, AvatarStack,
   ConfirmActionSheet, TeamShareSheet, TeamHabitSheet, TeamRing) +
   the live forks in shared_live.jsx (NetworkLockedLive, PeopleMonthCalendarLive,
   CloudTeamsDiscoverLive) +
   framework (BosAvatar, PageHeader, the icon object I, the bos* helpers, window.bosCloud,
   hooks useApp/useNav/useSheet, and useCS = React.useState). The ONLY new top-level
   declarations in this file are `function CommunityLive` and `function TeamDetailLive`. */

// LIVE team card — shows the REAL cloud roster (member count + real avatars) for a team you're
// in, not the stale local t.members (that mismatch was «3 снаружи / 0 внутри»). AvatarStack
// already caps at 5 faces + a «+N» overflow chip (iOS-style) and uses each member's real
// avatar. Local-only teams fall back to their own members; empty cloud team = honest «ты один».
function LiveTeamCard({
  t,
  navigate
}) {
  // Карточка круга теперь БЕЛАЯ как привычки/цели (David: «в целях карточки того же цвета — единый
  // стиль»). Круги живут среди целей, поэтому делим единый белый вид; эмблема-watermark + чипы-стекло.
  var tgt = t.target || 0;
  var cur = t.current != null ? t.current : Math.round((t.progress || 0) * tgt);
  var gp = tgt > 0 ? Math.min(1, cur / tgt) : t.progress || 0;
  var palette = typeof BOS_TEAM_PALETTE !== "undefined" ? BOS_TEAM_PALETTE : ["#7FB3F2"];
  var _cloud = !!(t.cloudId && window.bosCloud && window.bosCloud.enabled() && window.bosCloud.teamMembers);
  // Ростер из ОБЩЕГО кэша круга (тот же bos:cache:team:roster:*, что ест деталь круга): лица видны
  // СРАЗУ, сеть ревалидирует фоном — карточка не показывает скелетон при каждом заходе на список.
  var [roster, setRoster] = React.useState(() => {
    var c = _cloud && typeof _bosTeamGet === "function" ? _bosTeamGet("roster:" + t.cloudId) : null;
    return Array.isArray(c) ? c : null;
  });
  React.useEffect(() => {
    if (!_cloud) return;
    var on = true;
    window.bosCloud.teamMembers(t.cloudId).then(mem => {
      if (!on || !Array.isArray(mem)) return;
      // Пишем в общий кэш ТОТ ЖЕ формат и порядок (owner первым), что и деталь круга — один кэш, два едока.
      var sorted = mem.slice().sort((a, b) => a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0);
      var mapped = sorted.map((m, j) => ({
        id: m.id,
        name: m.name || "Участник",
        avatar: m.avatar,
        role: m.role,
        initials: (m.name || "У").slice(0, 1).toUpperCase(),
        color: palette[j % palette.length]
      }));
      if (typeof _bosTeamPut === "function") _bosTeamPut("roster:" + t.cloudId, mapped);
      setRoster(mapped);
    }).catch(() => {
      if (on) setRoster([]);
    });
    return () => {
      on = false;
    };
  }, [t.cloudId]);
  var _loading = _cloud && roster === null; // cloud roster not back yet → skeleton, never «ты один»
  var members = _cloud ? roster || [] : t.members || [];
  var count = members.length;
  var ruPart = n => {
    var m = n % 10,
      h = n % 100;
    return m === 1 && h !== 11 ? "участник" : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? "участника" : "участников";
  };
  // Инфо ЧИПАМИ, не строчками вразброс (David: «чипы для разной инфо вместо разброса»).
  var chipS = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11.5,
    fontWeight: 600,
    color: "var(--text-2)",
    ...bosChipGlass(false),
    padding: "4px 10px",
    borderRadius: 999,
    whiteSpace: "nowrap"
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "tap",
    onClick: () => navigate("team-detail", {
      team: t
    }),
    style: {
      background: "var(--card)",
      boxShadow: "var(--card-shadow)",
      borderRadius: 22,
      padding: 18,
      position: "relative",
      overflow: "hidden",
      cursor: "pointer"
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
  }, bosIcon(t.emblem, 88, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: 18,
      color: "var(--text)",
      letterSpacing: "-0.4px"
    }
  }, t.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 8
    }
  }, t.goal && /*#__PURE__*/React.createElement("span", {
    style: chipS
  }, "\uD83C\uDFAF ", t.goal), t.date && /*#__PURE__*/React.createElement("span", {
    style: chipS
  }, "\uD83D\uDCC5 ", t.date), !_loading && count > 0 && /*#__PURE__*/React.createElement("span", {
    style: chipS
  }, "\uD83D\uDC65 ", count), /*#__PURE__*/React.createElement("span", {
    style: chipS
  }, t.vis === "public" ? "🌐 Открытая" : "🔒 Приватная")), /*#__PURE__*/React.createElement("div", {
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
  }, /*#__PURE__*/React.createElement("span", null, t.target ? "К цели" : "Прогресс цели"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text)"
    }
  }, t.target ? cur + " / " + tgt + " " + (t.unit || "") : Math.round(gp * 100) + "%")), /*#__PURE__*/React.createElement("div", {
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
  }, _loading ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex"
    }
  }, [0, 1, 2].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "bos-skel",
    style: {
      width: 28,
      height: 28,
      borderRadius: "50%",
      marginLeft: i ? -10 : 0,
      border: "2px solid var(--card)"
    }
  }))) : count > 0 ? /*#__PURE__*/React.createElement(PeopleStackLive, {
    people: members,
    size: 28,
    max: 5
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-4)"
    }
  }, "\u041F\u043E\u043A\u0430 \u0442\u044B \u043E\u0434\u0438\u043D \u2014 \u043F\u043E\u0437\u043E\u0432\u0438 \u0434\u0440\u0443\u0437\u0435\u0439"))));
}

/* Заголовок секции ленты «Найти» (v526, по макету): компактный UPPERCASE-кикер, как у
   полок внутри витрин — один ритм на всю страницу; onAll → маленькая «Все ›» справа
   (паттерн App Store «See All»), которая переключает чип на полный раздел. */
function CommSectionHeadLive({
  title,
  onAll
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 10,
      padding: "4px 4px 0"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "var(--text-4)"
    }
  }, title), onAll && /*#__PURE__*/React.createElement("button", {
    onClick: onAll,
    className: "tap",
    "data-haptic": "selection",
    style: {
      border: 0,
      background: "transparent",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: 1,
      fontSize: 12.5,
      fontWeight: 600,
      color: "var(--text-3)",
      padding: 0,
      flexShrink: 0
    }
  }, "\u0412\u0441\u0435 ", /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 13,
    color: "var(--text-4)"
  })));
}
function CommunityLive() {
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
    commTab
  } = cv;
  var setView = patch => app?.setCommunityView(patch);
  var resolve = (v, cur) => typeof v === "function" ? v(cur) : v;
  var setSection = v => setView({
    section: resolve(v, section)
  });
  var setCommTab = v => setView({
    commTab: resolve(v, commTab)
  });

  // LIVE has no Партнёры tab — if a stale view left commTab on "partners" (e.g. it was
  // selected before, or carried from another mode), fall back to "network" so the
  // content area is never blank.
  var commTabEff = commTab === "partners" ? "network" : commTab;
  // ── ОДНА ЛЕНТА С ЧИПАМИ (David: «двойное меню точно не вариант; самое элегантное?») ──
  // Вместо двух рядов вкладок — чипы-фильтры ОДНОЙ ленты: Все · Круги · Люди · Партнёры.
  // Совместимость: тур и онбординг-пилюли пишут старые section/commTab — если они
  // расходятся с сохранённым filter (их только что сменили извне), верим им; чипы пишут
  // ОБА представления согласованно. courses→Партнёры, network→Люди, discover→Все.
  // «Тренинги» ОТДЕЛЬНЫЙ чип (David: «тренинги может отдельно от партнёров выделить»):
  // партнёры = живые впечатления за XP, тренинги = бывшие «программы партнёров» (courses).
  var _pairFor = {
    all: "discover",
    nearby: "discover",
    circles: "discover",
    partners: "community",
    people: "community",
    training: "community"
  };
  var _legacyFilter = section === "community" ? commTabEff === "courses" ? "training" : "people" : "all";
  var _fOk = cv.filter && _pairFor[cv.filter] === section && (section !== "community" || cv.filter === "training" === (commTabEff === "courses"));
  var filter = _fOk ? cv.filter : _legacyFilter;
  // David: «Рядом» слит в «Партнёры» (карта+сетка одним блоком), «Тренинги» убраны из раздела —
  // фокус на карте партнёров, партнёрах и нетворке. Старое сохранённое состояние аккуратно переводим.
  if (filter === "nearby") filter = "partners";
  if (filter === "training") filter = "all";
  var setFilter = f => setView({
    filter: f,
    section: _pairFor[f] || "discover",
    commTab: f === "training" ? "courses" : "network"
  });
  var isDark = app?.themeOverride === "dark";
  var {
    open: _openSheet
  } = typeof useSheet === "function" ? useSheet() : {
    open: () => {}
  };

  // ── ПОИСК по ленте (Э2 редизайна): круги (облако + живые витрины) · партнёры · программы.
  // Дебаунс 350мс бережёт облако; от 2 символов. Пока ищем — чипы и лента уступают результатам.
  var [q, setQ] = React.useState("");
  var [qDeb, setQDeb] = React.useState("");
  var [cloudHits, setCloudHits] = React.useState(null); // null = ждём облако (для пустышки)
  React.useEffect(() => {
    var t = setTimeout(() => {
      setQDeb(q.trim());
      setCloudHits(null);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);
  var searching = qDeb.length >= 2;
  var _qq = qDeb.toLowerCase();
  var _hit = (...fs) => fs.some(f => ("" + (f || "")).toLowerCase().indexOf(_qq) !== -1);
  // Живые круги: фейк сведён к ОДНОМУ примеру (David) — реальные круги ищутся через
  // CloudTeamsDiscoverLive (настоящий поиск публичных кругов). Пример может совпасть по слову.
  var lcHits = searching && typeof LIVING_CIRCLES !== "undefined" ? LIVING_CIRCLES.slice(0, 1).filter(s => _hit(s.t, s.hook, (s.habits || []).map(h => h.name).join(" "))) : [];
  var pHits = searching && typeof BOS_PARTNERS !== "undefined" ? BOS_PARTNERS.filter(p => _hit(p.name, p.what, (p.tags || []).join(" "))) : [];

  // ── «Сейчас N человек держат практики» (VISION: живая строка вместо ленты) — честное
  // число из RPC bos_active_today; кэш на полчаса против моргания; 0/нет патча → скрыта.
  var [pulseN, setPulseN] = React.useState(() => {
    try {
      var v = JSON.parse(localStorage.getItem("bos:cache:pulseToday") || "null");
      return v && Date.now() - v.ts < 1800e3 ? v.n : null;
    } catch (e) {
      return null;
    }
  });
  React.useEffect(() => {
    var on = true;
    try {
      if (window.bosCloud && window.bosCloud.enabled() && window.bosCloud.activeToday) {
        window.bosCloud.activeToday().then(n => {
          if (!on || typeof n !== "number") return;
          setPulseN(n);
          try {
            localStorage.setItem("bos:cache:pulseToday", JSON.stringify({
              n,
              ts: Date.now()
            }));
          } catch (e) {}
        }).catch(() => {});
      }
    } catch (e) {}
    return () => {
      on = false;
    };
  }, []);
  var _pulseWord = n => {
    var a = n % 10,
      b = n % 100;
    return a === 1 && b !== 11 ? "человек в потоке" : a >= 2 && a <= 4 && (b < 12 || b > 14) ? "человека в потоке" : "человек в потоке";
  };

  // Real level for the live user — never the demo's curated 8/1240/2000. The
  // typeof guard keeps this safe if the XP helpers aren't loaded yet.
  var _commLvl = typeof bosLiveXPLive === "function" && typeof bosLevelInfoLive === "function" ? bosLevelInfoLive(bosLiveXPLive(app)) : null;
  var userLevel = _commLvl ? _commLvl.level : 1;
  var xpInLevel = _commLvl ? _commLvl.into : 0;
  var xpForNext = _commLvl ? _commLvl.span : 2000;
  var levelsLeft = Math.max(0, 10 - userLevel);
  var weeksToUnlock = Math.max(1, levelsLeft);
  var teams = app?.teams || []; // shared store — "Создать команду" adds here

  // Upcoming cohort window: a "D — D MMM" range that starts `startIn` days from the
  // REAL today and runs `days` long, so dates are never stale.
  var _ruMon = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  var _cohortWindow = (startIn, days) => {
    var a = new Date();
    a.setHours(0, 0, 0, 0);
    a.setDate(a.getDate() + startIn);
    var b = new Date(a);
    b.setDate(b.getDate() + (days - 1));
    return a.getMonth() === b.getMonth() ? a.getDate() + " — " + b.getDate() + " " + _ruMon[b.getMonth()] : a.getDate() + " " + _ruMon[a.getMonth()] + " — " + b.getDate() + " " + _ruMon[b.getMonth()];
  };
  var courses = [{
    id: "overload",
    i: "⚡",
    accent: "#fef3c7",
    t: "Перегрузка",
    d: "Перенастрой мышление и очисти негативные убеждения.",
    price: "110 000 ₽",
    lvl: "Интенсив",
    length: "3 дня",
    cohort: _cohortWindow(12, 3)
  }, {
    id: "breakthrough",
    i: "🚀",
    accent: "#dbe9ff",
    t: "Прорыв",
    d: "Открой новые пути и преодолей пределы.",
    price: "110 000 ₽",
    lvl: "Продвинутый",
    length: "7 дней",
    cohort: _cohortWindow(33, 7)
  }, {
    id: "marathon",
    i: "🏃🏼‍♀️",
    accent: "#d6f3df",
    t: "Марафон",
    d: "21-дневная программа устойчивых привычек.",
    price: "110 000 ₽",
    lvl: "Базовый",
    length: "21 день",
    cohort: _cohortWindow(54, 21)
  }];
  // Хиты программ считаются ЗДЕСЬ (courses объявлен строкой выше — обращение раньше уронило бы TDZ).
  var cHits = searching ? courses.filter(c => _hit(c.t, c.d, c.lvl)) : [];
  var nothingFound = searching && cloudHits === 0 && !lcHits.length && !pHits.length;
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
      letterSpacing: "-0.5px",
      color: "var(--text)"
    }
  }, "\u0421\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      background: "var(--card, #fff)",
      borderRadius: 999,
      padding: "10px 15px",
      boxShadow: "var(--card-shadow)",
      margin: "0 2px 10px"
    }
  }, /*#__PURE__*/React.createElement(I.Search, {
    size: 16,
    strokeWidth: 2,
    color: "var(--text-4)",
    style: {
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "\u041D\u0430\u0439\u0442\u0438 \u043A\u0440\u0443\u0433 \u0438\u043B\u0438 \u043F\u0430\u0440\u0442\u043D\u0451\u0440\u0430",
    "aria-label": "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0443",
    style: {
      flex: 1,
      minWidth: 0,
      border: 0,
      outline: "none",
      background: "transparent",
      fontSize: 14.5,
      color: "var(--text)"
    }
  }), q && /*#__PURE__*/React.createElement("button", {
    onClick: () => setQ(""),
    className: "tap",
    "aria-label": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C",
    style: {
      border: 0,
      background: "var(--surface-3)",
      borderRadius: 999,
      width: 22,
      height: 22,
      display: "grid",
      placeItems: "center",
      cursor: "pointer",
      flexShrink: 0,
      color: "var(--text-3)"
    }
  }, /*#__PURE__*/React.createElement(I.X, {
    size: 12,
    strokeWidth: 2.6
  }))), !searching &&
  /*#__PURE__*/
  /* Full-bleed (David: «карточки должны обрезаться самим экраном»): лента выезжает за
     паддинг страницы (12px) и режется физическим краем — как в iOS, без масок. */
  React.createElement("div", {
    className: "bos-hscroll",
    style: {
      display: "flex",
      gap: 7,
      padding: "2px 14px 0",
      margin: "0 -12px",
      overflowX: "auto",
      scrollbarWidth: "none",
      WebkitOverflowScrolling: "touch",
      touchAction: "pan-x"
    }
  }, [["all", "Все", I.Globe], ["circles", "Круги", I.Group], ["people", "Люди", I.Users], ["partners", "Партнёры", I.Heart]].map(([id, t, Ic]) => {
    var on = filter === id;
    var glass = !on && typeof bosChipGlass === "function" ? bosChipGlass(isDark) : {};
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      onClick: () => setFilter(id),
      className: "tap",
      "data-haptic": "selection",
      "data-tour": id === "people" ? "network" : undefined,
      style: {
        border: 0,
        cursor: "pointer",
        borderRadius: 999,
        padding: "8px 13px",
        fontSize: 13.5,
        fontWeight: 600,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        transition: "background 0.2s, color 0.2s",
        ...glass,
        background: on ? "var(--cta, #0a0a0a)" : glass.background,
        color: on ? "var(--cta-ink, #fff)" : "var(--text-2)"
      }
    }, /*#__PURE__*/React.createElement(Ic, {
      size: 14,
      strokeWidth: 2.1,
      color: on ? "var(--cta-ink, #fff)" : "var(--text-3)"
    }), t);
  })), !searching && pulseN > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "12px 4px 0"
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: "#34C759",
      boxShadow: "0 0 0 3px rgba(52,199,89,0.16)",
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-3)"
    }
  }, "\u0421\u0435\u0439\u0447\u0430\u0441 ", pulseN, " ", _pulseWord(pulseN))), searching && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      marginTop: 12
    }
  }, lcHits.length > 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "var(--text-4)",
      padding: "4px 4px 8px"
    }
  }, "\uD83C\uDF31 \u0416\u0438\u0432\u044B\u0435 \u043A\u0440\u0443\u0433\u0438"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, lcHits.map(s => /*#__PURE__*/React.createElement("button", {
    key: s.id,
    onClick: () => {
      if (window.tgHaptic) {
        try {
          window.tgHaptic("selection");
        } catch (e) {}
      }
      if (typeof LivingCircleSheetLive === "function") _openSheet(/*#__PURE__*/React.createElement(LivingCircleSheetLive, {
        circle: s,
        navigate: navigate
      }));
    },
    className: "tap",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: "var(--card)",
      borderRadius: 22,
      padding: 14,
      boxShadow: "var(--card-shadow)",
      border: 0,
      textAlign: "left",
      width: "100%",
      cursor: "pointer",
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 14,
      background: "linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))",
      display: "grid",
      placeItems: "center",
      fontSize: 24,
      flexShrink: 0
    }
  }, bosIcon(s.i, 24, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 600
    }
  }, s.t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-4)",
      marginTop: 2,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, s.hook)), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    color: "var(--text-4)",
    style: {
      flexShrink: 0
    }
  }))))), /*#__PURE__*/React.createElement(CloudTeamsDiscoverLive, {
    app: app,
    query: qDeb,
    onCount: setCloudHits
  }), pHits.length > 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "var(--text-4)",
      padding: "4px 4px 8px"
    }
  }, "\uD83C\uDF81 \u041F\u0430\u0440\u0442\u043D\u0451\u0440\u044B"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, pHits.map(p => /*#__PURE__*/React.createElement("button", {
    key: p.id,
    onClick: () => {
      if (window.tgHaptic) {
        try {
          window.tgHaptic("selection");
        } catch (e) {}
      }
      navigate("partner-detail", {
        partner: p,
        from: "community"
      });
    },
    className: "tap",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: "var(--card)",
      borderRadius: 22,
      padding: 14,
      boxShadow: "var(--card-shadow)",
      border: 0,
      textAlign: "left",
      width: "100%",
      cursor: "pointer",
      color: "var(--text)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 14,
      background: typeof bosMixHex === "function" && isDark ? bosMixHex(p.accent, "#101014", 0.48) : p.accent,
      display: "grid",
      placeItems: "center",
      fontSize: 24,
      flexShrink: 0
    }
  }, bosIcon(p.emblem, 24, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 600
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-4)",
      marginTop: 2,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, p.what, " \xB7 ", p.cost, " XP")), /*#__PURE__*/React.createElement(I.ChevronRight, {
    size: 16,
    color: "var(--text-4)",
    style: {
      flexShrink: 0
    }
  }))))), nothingFound && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--card)",
      borderRadius: 22,
      padding: "26px 18px",
      boxShadow: "var(--card-shadow)",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      lineHeight: 1
    }
  }, "\uD83D\uDD2D"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 600,
      color: "var(--text)",
      marginTop: 9
    }
  }, "\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0448\u043B\u043E\u0441\u044C"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-4)",
      marginTop: 5,
      lineHeight: 1.45
    }
  }, "\u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439 \u0434\u0440\u0443\u0433\u043E\u0435 \u0441\u043B\u043E\u0432\u043E \u2014 \u0438\u043B\u0438 \u0441\u043E\u0431\u0435\u0440\u0438 \u0441\u0432\u043E\u0439 \u043A\u0440\u0443\u0433 \u043D\u0430 \xAB\u041F\u0440\u0438\u0432\u044B\u0447\u043A\u0430\u0445\xBB \u0447\u0435\u0440\u0435\u0437 \xAB+\xBB."))), !searching && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      marginTop: 14
    }
  }, filter === "all" && /*#__PURE__*/React.createElement(React.Fragment, null, typeof PartnersMapLive === "function" && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(CommSectionHeadLive, {
    title: "\uD83D\uDDFA \u041F\u0430\u0440\u0442\u043D\u0451\u0440\u044B \u0440\u044F\u0434\u043E\u043C",
    onAll: () => setFilter("partners")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(PartnersMapLive, {
    app: app,
    navigate: navigate,
    from: "community"
  }))), typeof PartnersShowcaseLive === "function" && /*#__PURE__*/React.createElement(PartnersShowcaseLive, {
    app: app,
    navigate: navigate,
    onAll: () => setFilter("partners")
  })), filter === "partners" && /*#__PURE__*/React.createElement(React.Fragment, null, typeof PartnersMapLive === "function" && /*#__PURE__*/React.createElement(PartnersMapLive, {
    app: app,
    navigate: navigate,
    from: "community"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      padding: "4px 4px 0"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "var(--text-4)"
    }
  }, "\uD83C\uDF81 \u041F\u0430\u0440\u0442\u043D\u0451\u0440\u044B \xB7 \u043F\u043E\u0442\u0440\u0430\u0442\u0438\u0442\u044C XP"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text)"
    }
  }, "\uD83E\uDE99 ", typeof bosLiveSpendableXPLive === "function" ? bosLiveSpendableXPLive(app) : 0)), typeof PartnersGridLive === "function" && /*#__PURE__*/React.createElement(PartnersGridLive, {
    app: app,
    navigate: navigate,
    from: "community"
  })), filter === "all" && typeof NetworkPeekLive === "function" &&
  /*#__PURE__*/
  /* Баннер «Люди» — ВТОРЫМ блоком, заметный (David: «суть нравится, но тоненький и в
     незаметном месте»). Тап → чип «Люди». */
  React.createElement(NetworkPeekLive, {
    unlocked: userLevel >= 10,
    onOpen: () => setFilter("people")
  }), (filter === "all" || filter === "circles") && /*#__PURE__*/React.createElement(React.Fragment, null, filter === "all" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(CommSectionHeadLive, {
    title: "\uD83C\uDF31 \u041A\u0440\u0443\u0433\u0438",
    onAll: () => setFilter("circles")
  }), /*#__PURE__*/React.createElement("div", {
    className: "bos-hscroll",
    style: {
      display: "flex",
      alignItems: "stretch",
      gap: 10,
      overflowX: "auto",
      padding: "3px 12px 14px 4px",
      margin: "-2px -12px 0 0",
      scrollSnapType: "x proximity",
      WebkitOverflowScrolling: "touch"
    }
  }, LIVING_CIRCLES.slice(0, 1).map((s, i) => /*#__PURE__*/React.createElement(LivingCircleCardLive, {
    key: s.id,
    circle: s,
    w: 300,
    variant: "chips",
    onTap: () => {
      if (window.tgHaptic) {
        try {
          window.tgHaptic("selection");
        } catch (e) {}
      }
      if (typeof LivingCircleSheetLive === "function") _openSheet(/*#__PURE__*/React.createElement(LivingCircleSheetLive, {
        circle: s,
        navigate: navigate
      }));
    }
  })), SEED_CIRCLES.map(s => {
    var mine = (app?.teams || []).find(t => t.seedId === s.id);
    return /*#__PURE__*/React.createElement("button", {
      key: s.id,
      onClick: () => {
        if (window.tgHaptic) {
          try {
            window.tgHaptic("selection");
          } catch (e) {}
        }
        if (mine) {
          navigate("team-detail", {
            team: mine,
            from: "community"
          });
          return;
        }
        _openSheet(/*#__PURE__*/React.createElement(ChallengeStartSheetLive, {
          seed: s,
          onStart: () => bosStartSeedCircleLive(app, navigate, s)
        }));
      },
      className: "tap",
      style: {
        flex: "0 0 auto",
        width: 152,
        scrollSnapAlign: "start",
        background: "var(--card)",
        border: 0,
        borderRadius: 18,
        padding: 13,
        textAlign: "left",
        color: "var(--text)",
        boxShadow: "var(--card-shadow)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 9,
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 40,
        height: 40,
        borderRadius: 13,
        background: BOS_TILE_SHEEN + ", linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe8))",
        boxShadow: typeof bosTileGlass === "function" ? bosTileGlass(isDark) : "none",
        display: "grid",
        placeItems: "center",
        fontSize: 20
      }
    }, bosIcon(s.emblem, 20, null)), /*#__PURE__*/React.createElement("span", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: "-0.2px",
        lineHeight: 1.25
      }
    }, s.name), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11.5,
        color: mine ? "#34C759" : "var(--text-4)",
        marginTop: 3,
        lineHeight: 1.35
      }
    }, mine ? "Ты в деле ✓" : s.goalText + " · +" + s.reward + " XP")));
  }))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(CommSectionHeadLive, {
    title: "\u2728 \u0416\u0438\u0432\u044B\u0435 \u043A\u0440\u0443\u0433\u0438"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      padding: "0 4px 8px",
      lineHeight: 1.4
    }
  }, "\u041F\u0440\u0438\u043C\u0435\u0440 \u043A\u0440\u0443\u0433\u0430 \u2014 \u0442\u0430\u043A \u043E\u043D \u0432\u044B\u0433\u043B\u044F\u0434\u0438\u0442, \u043A\u043E\u0433\u0434\u0430 \u043D\u0430\u043F\u043E\u043B\u043D\u0438\u0442\u0441\u044F \u0436\u0438\u0437\u043D\u044C\u044E \uD83D\uDC47"), LIVING_CIRCLES.slice(0, 1).map(s => /*#__PURE__*/React.createElement(LivingCircleCardLive, {
    key: s.id,
    circle: s,
    variant: "chips",
    onTap: () => {
      if (window.tgHaptic) {
        try {
          window.tgHaptic("selection");
        } catch (e) {}
      }
      if (typeof LivingCircleSheetLive === "function") _openSheet(/*#__PURE__*/React.createElement(LivingCircleSheetLive, {
        circle: s,
        navigate: navigate
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(CloudTeamsDiscoverLive, {
    app: app
  })), /*#__PURE__*/React.createElement(CirclesMosaicLive, {
    kicker: "\uD83D\uDD25 \u0427\u0435\u043B\u043B\u0435\u043D\u0434\u0436\u0438"
  }, SEED_CIRCLES.map(s => {
    var mine = (app?.teams || []).find(t => t.seedId === s.id);
    return /*#__PURE__*/React.createElement(CircleTileLive, {
      key: s.id,
      emoji: s.emblem,
      title: s.name,
      meta: s.goalText + " · +" + s.reward + " XP",
      joined: !!mine,
      onTap: () => {
        if (window.tgHaptic) {
          try {
            window.tgHaptic("selection");
          } catch (e) {}
        }
        if (mine) {
          navigate("team-detail", {
            team: mine,
            from: "community"
          });
          return;
        }
        _openSheet(/*#__PURE__*/React.createElement(ChallengeStartSheetLive, {
          seed: s,
          onStart: () => bosStartSeedCircleLive(app, navigate, s)
        }));
      }
    });
  })), /*#__PURE__*/React.createElement(CirclesMosaicLive, {
    kicker: "\uD83E\uDD1D \u0421\u043E\u0431\u0435\u0440\u0438 \u0441\u0432\u043E\u0439"
  }, CIRCLE_STARTERS.map(s => /*#__PURE__*/React.createElement(CircleTileLive, {
    key: s.t,
    emoji: s.i,
    title: s.t,
    meta: s.target + " " + s.unit + " · " + (s.goalType === "streak" ? "серия вместе" : "счёт общий"),
    onTap: () => {
      if (window.tgHaptic) {
        try {
          window.tgHaptic("selection");
        } catch (e) {}
      }
      _openSheet(/*#__PURE__*/React.createElement(GoalFormSheetLive, {
        mode: "create",
        circleOn: true,
        preset: s,
        navigate: navigate
      }));
    }
  })))), typeof CircleFriendsStripLive === "function" && /*#__PURE__*/React.createElement(CircleFriendsStripLive, {
    app: app,
    navigate: navigate
  }), filter === "circles" && /*#__PURE__*/React.createElement(React.Fragment, null, typeof InviteFriendsCardLive === "function" && /*#__PURE__*/React.createElement(InviteFriendsCardLive, {
    isDark: isDark
  }))), filter === "people" &&
  /*#__PURE__*/
  // Живого нетворка ещё нет — честный замок (реальные пути XP, без выдуманных людей).
  React.createElement("div", {
    style: {
      marginTop: 0
    }
  }, /*#__PURE__*/React.createElement(NetworkLockedLive, {
    navigate: navigate,
    live: true,
    level: userLevel,
    xp: xpInLevel,
    xpMax: xpForNext,
    levelsLeft: levelsLeft,
    weeks: weeksToUnlock,
    onUnlock: () => {},
    onSwitchToCommunity: () => setFilter("partners")
  })), filter === "all" && typeof InviteFriendsCardLive === "function" && /*#__PURE__*/React.createElement(InviteFriendsCardLive, {
    isDark: isDark
  })));
}

/* Per-team stale-while-revalidate cache (roster / habits / anchor-progress / goal) so
   re-opening a team renders INSTANTLY from the last-known data instead of flashing through
   a skeleton every time (David: «каждый раз вижу обновление экрана, дёргать не нравится»).
   Keyed by cloudId; the effects below still revalidate in the background.
   ПЕРЕЖИВАЕТ ПЕРЕЗАПУСК: write-through в localStorage (David: «при переходе всё двигается,
   скачок интерфейса» — раньше кэш жил только в памяти и после рестарта Telegram каждый
   первый вход дёргался). Событие bos:teamCacheChanged — плитка команды на «Привычках»
   ест ТОТ ЖЕ кэш и обновляется вслед за деталью. */
var _bosTeamCache = {};
function _bosTeamGet(k) {
  if (!k) return null;
  if (_bosTeamCache[k] !== undefined) return _bosTeamCache[k];
  var v = null;
  try {
    v = JSON.parse(localStorage.getItem("bos:cache:team:" + k) || "null");
  } catch (e) {
    v = null;
  }
  _bosTeamCache[k] = v;
  return v;
}
function _bosTeamPut(k, v) {
  if (k) {
    _bosTeamCache[k] = v;
    try {
      localStorage.setItem("bos:cache:team:" + k, JSON.stringify(v));
    } catch (e) {}
    try {
      window.dispatchEvent(new Event("bos:teamCacheChanged"));
    } catch (e) {}
  }
  return v;
}

/* ОРБИТА КРУГА — герой комнаты команды. ЕДИНЫЙ космос со страницей «Я»: переиспользуем тот же
   общий OrbitField (один стандарт, одна логика расстановки — David: «должно быть едино и целостно,
   там стандарт»). Для круга: центр = ЭМБЛЕМА (без карандаша, editable=false); планеты = люди;
   активные сегодня идут на ВНУТРЕННЕЕ кольцо и ГОРЯТ (✓), неактивные приглушены — зеркалит «сильнейшая
   привычка ближе к центру» на «Я» (та же логика «кто куда зачем»). Кольца множатся с ростом числа
   людей — это уже встроено в OrbitField (пояса 6/12/18 → «+N»). */
function TeamOrbitLive({
  emblem,
  faces,
  isDark
}) {
  var list = Array.isArray(faces) ? faces : [];
  var anyActive = list.some(function (f) {
    return f && f.done;
  });
  // active-first → самые включённые ближе к центру (зеркалит сортировку привычек по силе на «Я»).
  // lit передаём ТОЛЬКО когда есть хоть один активный, иначе все полные (нейтральный покой, не серость).
  var people = list.slice().sort(function (a, b) {
    return (b && b.done ? 1 : 0) - (a && a.done ? 1 : 0);
  }).map(function (f) {
    return {
      avatar: f && f.avatar,
      name: f && f.name,
      lit: anyActive ? !!(f && f.done) : undefined
    };
  });
  return /*#__PURE__*/React.createElement(OrbitField, {
    avatar: emblem ? "emoji:" + emblem : "default",
    name: "",
    habits: [],
    people: people,
    moodC: null,
    dark: isDark,
    hideLevelArc: true,
    editable: false
  });
}
function TeamDetailLive() {
  var {
    navigate,
    params
  } = useNav();
  var app = useApp();
  var {
    open: openSheet
  } = useSheet();
  var passed = params?.team || {
    _id: "seed-1",
    name: "Команда создателей",
    emblem: "✨",
    accent: "#fef3c7",
    goal: "50 добрых дел за месяц",
    date: "1 — 31 дек",
    progress: 0,
    members: []
  };
  // Откуда пришли в комнату круга — «Назад» и выход возвращают ИМЕННО туда (David: «после выхода
  // из команды кидает не обратно, а на Найти»). Дефолт "community" сохраняет прежнее поведение.
  var from = params?.from || "community";
  // Read the LIVE team from the store so a just-added habit appears immediately.
  var t = (app?.teams || []).find(x => x._id === passed._id) || passed;
  // ЦВЕТА ПОКА ВЫКЛ (David): единое ЕДВА-серое СТЕКЛО для комнаты круга; включим позже.
  var accent = "#EAEAEF";
  var isDark = app?.themeOverride === "dark";
  // The goal MODE — shown as a chip so the team's rule (общий счёт / серия / гонка) is ALWAYS
  // visible, not hidden behind the async cloud progress (David: «не вижу их отражение»).
  var teamModeMeta = {
    collective: {
      e: "🌊",
      t: "Общий счёт"
    },
    streak: {
      e: "🔥",
      t: "Серия у каждого"
    },
    race: {
      e: "🏁",
      t: "Гонка"
    }
  }[t.type || "collective"];
  // LIVE = real user: honest data or empty, NEVER fake standings/activity/calendar —
  // even for a team without a cloud link yet.

  // Real team-chat preview + unread badge for LIVE cloud teams. Guarded on the cloud
  // being enabled AND the team having a cloudId — a freshly-created local team has
  // neither yet, so this stays inert until it syncs.
  var _chatLive = !!(window.bosCloud && window.bosCloud.enabled() && t.cloudId);
  var _readKey = t.cloudId ? "bos:chatread:" + t.cloudId : null;
  var [chatPeek, setChatPeek] = React.useState(null); // { last, unread } for live teams
  React.useEffect(() => {
    if (!_chatLive) return;
    var on = true;
    (async () => {
      try {
        var me = await window.bosCloud.uid();
        var rows = await window.bosCloud.loadMessages(t.cloudId);
        if (!on || !Array.isArray(rows)) return;
        // Compare each message's server created_at to the stored read-marker created_at —
        // SAME time base on both sides (a device clock drifts vs the server, so on skewed
        // phones a Date.now() compare would stick or never show the badge).
        var lastReadRaw = _readKey && localStorage.getItem(_readKey) || 0;
        var lastReadMs = lastReadRaw ? new Date(lastReadRaw).getTime() : 0;
        var last = rows.length ? rows[rows.length - 1] : null;
        var lastText = last ? last.text || (last.image_url ? "📷 Фото" : "") : "";
        var unread = rows.filter(r => r && r.user_id !== me && new Date(r.created_at).getTime() > lastReadMs).length;
        // Carry the last message's created_at so markChatRead can store it as the read marker
        // (same time base as messages). No messages yet → null → everything counts as read.
        setChatPeek({
          last: lastText,
          unread: unread,
          lastAt: last ? last.created_at : null
        });
      } catch (e) {}
    })();
    return () => {
      on = false;
    };
  }, [_chatLive, t.cloudId]);
  var markChatRead = () => {
    // Store the LAST loaded message's created_at (server time base) — NOT Date.now() (device
    // clock). If nothing was loaded yet, store "" so the next compare treats all as read.
    try {
      if (_readKey) localStorage.setItem(_readKey, chatPeek && chatPeek.lastAt ? String(chatPeek.lastAt) : "");
    } catch (e) {}
    setChatPeek(p => p ? {
      ...p,
      unread: 0
    } : p);
    // Погасим значок и на ВНЕШНЕЙ плитке круга (сброс общего кэша непрочитанного).
    try {
      if (t.cloudId && typeof bosTeamUnreadClear === "function") bosTeamUnreadClear(t.cloudId);
    } catch (e) {}
  };

  // LIVE teams: load the REAL roster (real names + avatars + roles) from the cloud, so the
  // member list is honest — real teammates, no fabricated standings until real progress exists.
  var _rosterLive = !!(window.bosCloud && window.bosCloud.enabled() && t.cloudId);
  var [cloudRoster, setCloudRoster] = React.useState(() => _bosTeamGet("roster:" + t.cloudId));
  var [meId, setMeId] = React.useState(null); // current user's cloud id — to find myself in the roster
  var [rosterTick, setRosterTick] = React.useState(0);
  React.useEffect(() => {
    if (!_rosterLive) {
      setMeId(null);
      return;
    }
    var on = true;
    window.bosCloud.uid().then(id => {
      if (on) setMeId(id || null);
    }).catch(() => {});
    return () => {
      on = false;
    };
  }, [_rosterLive, t.cloudId]);
  React.useEffect(() => {
    if (!_rosterLive) return;
    var on = true;
    window.bosCloud.teamMembers(t.cloudId).then(mem => {
      if (!on || !Array.isArray(mem)) return;
      var palette = BOS_TEAM_PALETTE;
      // owner first, then members, in join order
      var sorted = mem.slice().sort((a, b) => a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0);
      setCloudRoster(_bosTeamPut("roster:" + t.cloudId, sorted.map((m, i) => ({
        id: m.id,
        name: m.name || "Участник",
        avatar: m.avatar,
        role: m.role,
        initials: (m.name || "У").slice(0, 1).toUpperCase(),
        color: palette[i % palette.length]
      }))));
    }).catch(() => {});
    return () => {
      on = false;
    };
  }, [_rosterLive, t.cloudId, rosterTick]);
  // E: the CREATOR sees pending join requests here and approves / rejects them.
  // Derive ownership from the REAL roster role, so a creator opening their team on a
  // second device (where t.joined may be truthy after cloud hydration) still gets the
  // gear + approval panel. Fall back to the old !t.joined heuristic only until the
  // roster + my id have loaded.
  var _meMember = meId && Array.isArray(cloudRoster) ? cloudRoster.find(m => m.id === meId) : null;
  var _isOwner = _meMember ? _meMember.role === "owner" : !t.joined;
  var [pending, setPending] = React.useState([]);
  React.useEffect(() => {
    if (!(_rosterLive && _isOwner) || !window.bosCloud.pendingRequests) return;
    var on = true;
    window.bosCloud.pendingRequests(t.cloudId).then(p => {
      if (on) setPending(Array.isArray(p) ? p : []);
    }).catch(() => {});
    return () => {
      on = false;
    };
  }, [_rosterLive, _isOwner, t.cloudId, rosterTick]);
  var approveReq = uid => {
    window.bosCloud.approveMember(t.cloudId, uid).then(ok => {
      if (ok) {
        setPending(p => p.filter(x => x.id !== uid));
        setRosterTick(n => n + 1);
      }
    });
  };
  var rejectReq = uid => {
    window.bosCloud.rejectMember(t.cloudId, uid).then(ok => {
      if (ok) setPending(p => p.filter(x => x.id !== uid));
    });
  };

  // REAL shared team habits for live teams (from the cloud): real names + per-member completion.
  var [liveTeamHabits, setLiveTeamHabits] = React.useState(() => _bosTeamGet("habits:" + t.cloudId));
  var [habitsTick, setHabitsTick] = React.useState(0);
  var [mainProg, setMainProg] = React.useState(() => _bosTeamGet("mainprog:" + t.cloudId)); // per-member day-map for the anchor habit (who did which day)
  var [goalProg, setGoalProg] = React.useState(() => _bosTeamGet("goal:" + t.cloudId)); // team-goal progress COMPUTED from habit marks (current + per-member contribution)
  var [settlements, setSettlements] = React.useState(null); // { user_id: {xp, won} } — team-goal XP payouts (cloud ledger)
  var settledRef = React.useRef(false); // settle-once guard (per mount per reached goal)
  React.useEffect(() => {
    if (!_rosterLive || !window.bosCloud.teamHabitsFull) return;
    var on = true;
    window.bosCloud.teamHabitsFull(t.cloudId).then(hs => {
      if (on) setLiveTeamHabits(_bosTeamPut("habits:" + t.cloudId, Array.isArray(hs) ? hs : []));
    }).catch(() => {});
    return () => {
      on = false;
    };
  }, [_rosterLive, t.cloudId, habitsTick]);
  var toggleMyTeamHabit = h => {
    if (!h || !h.id) return;
    // Derive the next state INSIDE the updater from the CURRENT item x (not the captured
    // outer h) so a fast double-tap can't double-count, and clamp doneToday to [0, total].
    setLiveTeamHabits(list => (list || []).map(x => {
      if (x.id !== h.id) return x;
      var next = !x.doneByMe;
      var cap = Number.isFinite(x.total) ? x.total : x.doneToday + 1;
      var doneToday = Math.max(0, Math.min(cap, x.doneToday + (next ? 1 : -1)));
      return {
        ...x,
        doneByMe: next,
        doneToday: doneToday
      };
    }));
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
    var _wantOn = !h.doneByMe;
    window.bosCloud.toggleTeamHabitToday(h.id, _wantOn).then(ok => {
      // Аудит #8: сервер отклонил запись → откатываем оптимистичную отметку, чтобы галочка не
      // «врала» (стоит, а на сервере пусто). При успехе — просто освежаем с сервера.
      if (ok === false) {
        setLiveTeamHabits(list => (list || []).map(x => {
          if (x.id !== h.id) return x;
          var cap = Number.isFinite(x.total) ? x.total : x.doneToday + 1;
          var doneToday = Math.max(0, Math.min(cap, x.doneToday + (_wantOn ? -1 : 1)));
          return {
            ...x,
            doneByMe: !_wantOn,
            doneToday: doneToday
          };
        }));
        if (window.tgHaptic) {
          try {
            window.tgHaptic("error");
          } catch (e) {}
        }
      }
      setHabitsTick(n => n + 1);
    });
  };
  var addTeamHabitCloud = h => {
    var first = !(liveTeamHabits && liveTeamHabits.length);
    window.bosCloud.addTeamHabit(t.cloudId, {
      ...h,
      isMain: h && h.isMain || first
    }).then(() => setHabitsTick(n => n + 1));
  };
  // A CLOUD team's roster lives in the cloud; the passed-in t.members is a STALE local
  // cache (the «3 снаружи / 0 внутри» mismatch). Until the real roster loads we show a
  // skeleton — NEVER the stale members, which used to flash phantom people for a beat
  // (David: «проскакивает заполненный демо-вариант»). Mirrors the teamHabits gate below.
  var _rosterLoading = _rosterLive && cloudRoster === null;
  var members = _rosterLive ? cloudRoster || [] : t.members?.length ? t.members : [];
  var ranked = members; // live: roster order (owner first), no contribution sort
  // Live: real cloud habits when synced, else the team's own habits, else empty.
  var teamHabits = _rosterLive ? liveTeamHabits || [] : Array.isArray(t.habits) ? t.habits : [];
  var main = teamHabits.find(h => h.isMain);
  var others = teamHabits.filter(h => !h.isMain);
  // ADOPT — «приходит как личная» (David): командная привычка становится твоей ЛИЧНОЙ (своё
  // время/значок), отмечаешь её на «Привычки», отметка зеркалится в командный счёт (toggleHabit →
  // toggleTeamHabitToday). Линк = поле teamHabitId. ЭТАП 2: дедуп — если уже ведёшь такую, предложить
  // ПРИВЯЗАТЬ существующую (без дубля, серия/время сохранятся). ЕДИНАЯ отметка: адаптированная
  // привычка отмечается через её личную копию (один источник) — никакого прямого team-write.
  var myHabits = app?.habits || [];
  var _todayK = new Date().toISOString().slice(0, 10);
  var adoptedFor = h => h && h.id != null ? myHabits.find(x => x.teamHabitId === h.id) : null; // id-guard: у офлайн-команды привычки без id — undefined===undefined ложно матчил первую попавшуюся
  var _dupeFor = h => h && myHabits.find(x => !x.teamHabitId && (x.name || "").trim().toLowerCase() === (h.name || "").trim().toLowerCase());
  var _createLinkedHabit = h => {
    app?.addHabit({
      name: h.name,
      emoji: h.emoji,
      color: h.color || null,
      teamId: t.cloudId,
      teamHabitId: h.id,
      log: {},
      days: [1, 1, 1, 1, 1, 1, 1],
      goalPerDay: h.goalPerDay || 1,
      reminder: {
        on: false,
        time: "09:00"
      }
    });
    if (window.tgHaptic) {
      try {
        window.tgHaptic("success");
      } catch (e) {}
    }
  };
  var adoptTeamHabit = h => {
    if (!h || !h.id || adoptedFor(h)) return;
    var dupe = _dupeFor(h);
    if (dupe) {
      openSheet(/*#__PURE__*/React.createElement(TeamAdoptChoiceLive, {
        dupeName: (dupe.name || "").trim(),
        onLink: () => {
          app?.updateHabit(dupe.id, {
            teamId: t.cloudId,
            teamHabitId: h.id
          });
        },
        onCreate: () => _createLinkedHabit(h)
      }));
    } else {
      _createLinkedHabit(h);
    }
  };
  // Mark an ADOPTED team habit = toggle its personal copy (single source → mirrors to team_habit_logs).
  var markAdopted = h => {
    var a = adoptedFor(h);
    if (!a) return;
    app?.toggleHabit(a.id);
    if (window.tgHaptic) {
      try {
        window.tgHaptic("light");
      } catch (e) {}
    }
    setHabitsTick(n => n + 1);
  };
  var myDone = h => {
    var a = adoptedFor(h);
    return a ? !!(a.log && a.log[_todayK]) : !!(h && h.doneByMe);
  };
  // Per-person "who did which day" for the team ANCHOR habit → feeds the SAME month calendar
  // the personal/shared habits use (data already per-user in team_habit_logs). Light poll.
  var _tCalKey = (d, mi) => {
    var y = new Date().getFullYear();
    return y + "-" + String(mi + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  };
  var _mainId = main && main.id;
  React.useEffect(() => {
    var on = true;
    if (!_rosterLive || !_mainId || !window.bosCloud.teamHabitProgress) {
      setMainProg(null);
      return;
    }
    var load = () => window.bosCloud.teamHabitProgress(t.cloudId, _mainId).then(d => {
      if (on && d && d.members) setMainProg(_bosTeamPut("mainprog:" + t.cloudId, d.members));
    }).catch(() => {});
    load();
    var iv = setInterval(load, 20000);
    return () => {
      on = false;
      clearInterval(iv);
    };
  }, [_rosterLive, t.cloudId, _mainId, habitsTick]);
  // Team GOAL progress — computed from the habit marks per mode (collective/streak/race).
  React.useEffect(() => {
    var on = true;
    if (!_rosterLive || !t.cloudId || !window.bosCloud.teamGoalProgress) {
      setGoalProg(null);
      return;
    }
    var load = () => window.bosCloud.teamGoalProgress(t.cloudId).then(d => {
      if (on && d) setGoalProg(_bosTeamPut("goal:" + t.cloudId, d));
    }).catch(() => {});
    load();
    var iv = setInterval(load, 20000);
    return () => {
      on = false;
      clearInterval(iv);
    };
  }, [_rosterLive, t.cloudId, habitsTick]);
  // PAYOUT — when a STAKED goal is reached, OPEN the bank: idempotently settle MY row (co-op:
  // +stake; race: leader +bank), refresh the global team-goal XP so the level lifts, then read
  // everyone's payouts for the card. Settle runs once per mount (settledRef); the read re-runs on
  // each goalProg poll so other members' payouts appear as they open the team. Unlock-only —
  // nothing is ever deducted, so missing the goal just means the bank never opened.
  React.useEffect(() => {
    if (!_rosterLive || !t.cloudId || !window.bosCloud.settleTeamGoal) return;
    if (!goalProg || !goalProg.done || !(goalProg.stake > 0)) return;
    var on = true;
    var loadSettle = () => window.bosCloud.teamSettlements(t.cloudId).then(s => {
      if (on) setSettlements(s || {});
    }).catch(() => {});
    if (settledRef.current) {
      loadSettle();
    } else {
      settledRef.current = true;
      window.bosCloud.settleTeamGoal(t.cloudId).then(res => {
        if (!on) return;
        loadSettle();
        if (res && res.settled && app && app.refreshTeamGoalXP) app.refreshTeamGoalXP();
      }).catch(loadSettle);
    }
    return () => {
      on = false;
    };
  }, [_rosterLive, t.cloudId, goalProg]);
  // C+D (David): создание/правка общей привычки = ТА ЖЕ полная форма HabitFormSheetLive (teamFor),
  // а не урезанный TeamHabitSheetLive. onSave(data, editId): editId → updateTeamHabit (прогресс НЕ
  // трогаем — логи по team_habit_id), иначе addTeamHabit. onDelete → removeTeamHabit.
  var saveTeamHabit = (data, editId) => {
    if (editId != null) {
      setLiveTeamHabits(list => (list || []).map(x => x.id === editId ? Object.assign({}, x, {
        name: data.name,
        emoji: data.emoji,
        color: data.color,
        goalPerDay: data.goalPerDay,
        isMain: data.isMain
      }) : x));
      if (_rosterLive && window.bosCloud && window.bosCloud.updateTeamHabit) window.bosCloud.updateTeamHabit(editId, data).then(() => setHabitsTick(n => n + 1));
      return;
    }
    if (_rosterLive) addTeamHabitCloud(data);else app?.addTeamHabit(t._id, data);
  };
  var removeTeamHabitH = id => {
    setLiveTeamHabits(list => (list || []).filter(x => x.id !== id));
    if (_rosterLive && window.bosCloud && window.bosCloud.removeTeamHabit) window.bosCloud.removeTeamHabit(id).then(() => setHabitsTick(n => n + 1));
  };
  var openAddHabit = () => openSheet(/*#__PURE__*/React.createElement(HabitFormSheetLive, {
    mode: "create",
    navigate: navigate,
    teamFor: {
      team: t,
      suggestMain: !(teamHabits && teamHabits.length),
      onSave: saveTeamHabit,
      onDelete: removeTeamHabitH
    }
  }));
  var openEditTeamHabit = h => openSheet(/*#__PURE__*/React.createElement(HabitFormSheetLive, {
    mode: "edit",
    navigate: navigate,
    habit: {
      id: h.id,
      name: h.name,
      emoji: h.emoji,
      color: h.color || null,
      goalPerDay: h.goalPerDay || 1,
      duration: 0,
      isMain: !!h.isMain
    },
    teamFor: {
      team: t,
      onSave: saveTeamHabit,
      onDelete: removeTeamHabitH
    }
  }));
  // КТО СЕГОДНЯ В ПОТОКЕ — отметившие якорь сегодня (per-member из mainProg) + я, если отметил.
  // Кормит орбиту (планеты загораются) и честный стат «Сегодня».
  var flowSet = {};
  (mainProg || []).forEach(m => {
    if (m.days && m.days[_todayK]) flowSet[m.id] = true;
  });
  if (meId && main && main.doneByMe) flowSet[meId] = true;
  var orbitFaces = (Array.isArray(members) ? members : []).map(m => ({
    id: m.id,
    avatar: m.avatar,
    name: m.name,
    done: !!flowSet[m.id]
  }));
  var inFlowToday = (Array.isArray(members) ? members : []).filter(m => flowSet[m.id]).length;
  // ПУЛЬС 2.0 (David): кольцо ЧЕЛОВЕКА на орбите = его зона ответственности — доля закрытых
  // ИМ сегодня привычек круга (2 из 5 → 40% дуги), а центральное кольцо = общий счёт команды.
  // Данные бесплатные: teamHabitsFull уже несёт todayUsers (см. cloud.js). Себя считаем
  // ЛОКАЛЬНО (myDone) — кольцо отвечает на отметку мгновенно, без ожидания опроса.
  var _pulseTotal = teamHabits.length || 0;
  var _pulseFor = f => {
    if (!_pulseTotal) return null;
    if (meId && f.id === meId) return teamHabits.filter(h => myDone(h)).length / _pulseTotal;
    if (!teamHabits.some(h => Array.isArray(h.todayUsers))) return null; // старый кэш/оффлайн → active-фолбэк
    return teamHabits.filter(h => Array.isArray(h.todayUsers) && h.todayUsers.indexOf(f.id) !== -1).length / _pulseTotal;
  };
  // ── ЕДИНАЯ СТРАНИЦА ЦЕЛИ (David: «команда = та же цель + блок людей») ──
  // Всё, что ниже, — расчёты для вёрстки-близнеца GoalDetailLive: прогресс/банк/выплаты
  // подняты из бывшей мега-карточки, сами данные и опросы выше НЕ менялись.
  var gpd = goalProg;
  var gUnit = gpd && gpd.unit || t.unit || "";
  var gTgt = gpd && gpd.target || t.target || 0;
  var gCur = gpd ? gpd.current : t.current != null ? t.current : Math.round((t.progress || 0) * gTgt);
  var gDone = gTgt > 0 && gCur >= gTgt;
  var gp = gTgt > 0 ? Math.min(1, gCur / gTgt) : t.progress || 0;
  var gRemaining = Math.max(0, gTgt - gCur);
  var gType = gpd && gpd.type || t.type || "collective";
  var modeLabel = {
    streak: "Серия у каждого",
    race: "Гонка — лидер",
    collective: "Общий счёт"
  }[gType] || "Общий счёт";
  var contrib = gpd && Array.isArray(gpd.members) ? gpd.members : [];
  var isRace = gType === "race";
  var stake = gpd && gpd.stake || t.stake || 0;
  var bank = gpd && gpd.bank || stake * Math.max(1, contrib.length || members.length);
  var payFor = (m, i) => {
    if (!gDone || stake <= 0) return 0;
    if (settlements && settlements[m.id]) return settlements[m.id].xp || 0;
    return isRace ? i === 0 ? bank : 0 : stake;
  };
  var myPay = gDone && stake > 0 ? contrib.reduce((acc, m, i) => acc + (m.me ? payFor(m, i) : 0), 0) : 0;
  var gStyle = typeof bosLoadGoalStyle === "function" ? bosLoadGoalStyle() : {
    orbits: true
  };
  // Реальный цвет команды красит кольцо/чеки (как g.color у личной); нейтральный → графит.
  var teamColor = t.accent && ("" + t.accent).toLowerCase() !== "#0a0a0a" && t.accent !== "#8E8E93" && t.accent !== "#EAEAEF" ? t.accent : null;
  var ringInk = teamColor || (isDark ? "#e6e6ea" : "#0a0a0a");
  var card = isDark ? {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)"
  } : {
    background: "#fff",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
  };
  var CountC = typeof Count === "function" ? Count : function (p) {
    return p.value;
  };
  // David-редизайн детали общей цели: инфа под орбитой → ЧИПЫ; hero тянется до самого верха (как у
  // партнёра), правка/позвать/ЧАТ стеклом справа В hero. desc = заметка создателя (синкается всем
  // через goal.desc), aiChips = 1-2 честных наблюдения по реальному состоянию цели.
  var desc = gpd && gpd.desc || t.desc || "";
  var modeMeta = {
    collective: {
      e: "🌊",
      t: "Общий счёт"
    },
    streak: {
      e: "🔥",
      t: "Серия у каждого"
    },
    race: {
      e: "🏁",
      t: "Гонка"
    }
  }[gType] || {
    e: "🌊",
    t: "Общий счёт"
  };
  // ЧИПЫ ОБЩЕЙ ЦЕЛИ (David: прогресс НЕ дублируем — его видно по орбите; показываем ПУЛЬС и важные
  // данные круга): сегодня в деле · лидер/топ-вкладчик · банк · люди. gDone → празднуем. Пусто → зов.
  var _peopleWord = function (n) {
    return n % 10 === 1 && n % 100 !== 11 ? "человек" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "человека" : "человек";
  };
  var teamChips = function () {
    if (gDone) return [{
      t: "🎉 Цель достигнута",
      hot: true
    }];
    var out = [];
    if (inFlowToday > 0) out.push({
      t: "🔥 сегодня " + inFlowToday + " в деле",
      hot: true
    });
    var top = null;
    (contrib || []).forEach(function (m) {
      if (m && (top === null || m.value > top.value)) top = m;
    });
    if (top && top.value > 0) out.push({
      t: (isRace ? "🏆 лидер " : "⭐ ") + (top.me ? "Ты" : ("" + (top.name || "")).split(" ")[0]) + " · " + top.value + (gUnit ? " " + gUnit : "")
    });
    if (stake > 0) out.push({
      t: "🪙 банк " + bank + " XP"
    });
    if (!_rosterLoading) out.push({
      t: "👥 " + members.length + " " + _peopleWord(members.length)
    });
    if (!out.length) out.push({
      t: "✨ Позовите людей и начните",
      hot: true
    });
    return out.slice(0, 4);
  }();
  var H = bosGoalHero(teamColor, isDark);
  var heroBtn = {
    width: 38,
    height: 38,
    borderRadius: "50%",
    border: 0,
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    background: H.btnBg,
    color: H.btnInk,
    flexShrink: 0
  };
  var heroChip = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    background: H.chipBg,
    borderRadius: 999,
    padding: "5px 11px",
    fontSize: 12,
    fontWeight: 600,
    color: H.chipInk,
    whiteSpace: "nowrap"
  };
  var heroChipAI = Object.assign({}, heroChip, {
    background: H.chipAiBg,
    color: H.chipAiInk,
    boxShadow: H.onDark ? "none" : "0 1px 4px rgba(40,60,110,0.12)"
  });
  var editGoalLike = {
    _id: t._id,
    id: t.id,
    cloudId: t.cloudId,
    __isTeam: true,
    __team: t,
    name: t.name,
    emoji: t.emblem,
    color: t.accent,
    target: t.target,
    unit: t.unit,
    deadline: t.date || t.deadline || "",
    circle: true,
    type: t.type,
    vis: t.vis,
    stake: t.stake,
    goal: t.goal,
    desc: desc,
    joined: t.joined,
    habitIds: []
  };
  // Сводки для свёрнутых секций единого блока (David: «краткая сводка на каждом»).
  var _myDoneCount = teamHabits.filter(h => myDone(h)).length;
  var _habitWordT = n => n % 10 === 1 && n % 100 !== 11 ? "привычка" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "привычки" : "привычек";
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      paddingBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      background: H.bg,
      marginTop: "calc(-1 * max(60px, var(--tg-top-inset, env(safe-area-inset-top, 0px))))",
      padding: "calc(max(60px, var(--tg-top-inset, env(safe-area-inset-top, 0px))) + 10px) 18px 20px",
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate(from),
    className: "tap",
    "aria-label": "\u041D\u0430\u0437\u0430\u0434",
    style: heroBtn
  }, /*#__PURE__*/React.createElement(I.ChevronLeft, {
    size: 20,
    strokeWidth: 2.4
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, _isOwner && /*#__PURE__*/React.createElement("button", {
    onClick: () => openSheet(/*#__PURE__*/React.createElement(GoalFormSheetLive, {
      mode: "edit",
      circleOn: true,
      navigate: navigate,
      returnTo: from,
      goal: editGoalLike
    })),
    className: "tap",
    "data-haptic": "selection",
    "aria-label": "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0446\u0435\u043B\u0438",
    style: heroBtn
  }, /*#__PURE__*/React.createElement(I.Pencil, {
    size: 16,
    strokeWidth: 2
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => openSheet(/*#__PURE__*/React.createElement(TeamShareSheetLive, {
      team: t
    })),
    className: "tap",
    "data-haptic": "selection",
    "aria-label": "\u041F\u043E\u0437\u0432\u0430\u0442\u044C \u0432 \u043A\u0440\u0443\u0433",
    style: heroBtn
  }, /*#__PURE__*/React.createElement(I.Share, {
    size: 16,
    strokeWidth: 2
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      markChatRead();
      navigate("team-chat", {
        team: t,
        from
      });
    },
    className: "tap",
    "aria-label": "\u0427\u0430\u0442 \u0446\u0435\u043B\u0438",
    style: {
      ...heroBtn,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "auto",
      borderRadius: 999,
      padding: "0 16px",
      gap: 7,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(I.MessageCircle, {
    size: 16,
    strokeWidth: 2
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      letterSpacing: "-0.2px"
    }
  }, "\u0427\u0430\u0442"), _chatLive && chatPeek && chatPeek.unread > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: -3,
      right: -3,
      background: "#FF3B30",
      color: "#fff",
      fontSize: 10,
      fontWeight: 700,
      borderRadius: 999,
      minWidth: 17,
      height: 17,
      padding: "0 4px",
      display: "grid",
      placeItems: "center",
      border: "1.5px solid " + (H.onDark ? "rgba(0,0,0,0.45)" : "#fff")
    }
  }, chatPeek.unread > 99 ? "99+" : chatPeek.unread)))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginTop: 4
    }
  }, gStyle.orbits ? /*#__PURE__*/React.createElement("div", {
    style: {
      width: 172,
      height: 172,
      margin: "0 auto",
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(GoalOrbitMini, {
    centerEmoji: t.emblem || "👥",
    centerColor: teamColor,
    habits: teamHabits.map(h => ({
      emoji: h.emoji,
      color: h.color,
      done: myDone(h)
    })),
    people: orbitFaces.map(f => ({
      avatar: f.avatar,
      name: f.name,
      active: f.done,
      progress: _pulseFor(f)
    })),
    size: 172,
    dark: isDark,
    progress: gp
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: 150,
      height: 150,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "150",
    height: "150",
    viewBox: "0 0 140 140",
    style: {
      transform: "rotate(-90deg)"
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "70",
    cy: "70",
    r: "54",
    fill: "none",
    stroke: isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.08)",
    strokeWidth: "13"
  }), gp > 0 && /*#__PURE__*/React.createElement("circle", {
    cx: "70",
    cy: "70",
    r: "54",
    fill: "none",
    stroke: ringInk,
    strokeWidth: "13",
    strokeLinecap: "round",
    strokeDasharray: 2 * Math.PI * 54,
    strokeDashoffset: 2 * Math.PI * 54 * (1 - gp),
    style: {
      transition: "stroke-dashoffset 0.6s ease",
      ...(gDone ? {
        filter: "drop-shadow(0 0 6px " + ringInk + "80)"
      } : {})
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "grid",
      placeItems: "center",
      fontSize: 36,
      lineHeight: 1
    }
  }, bosIcon(t.emblem || "👥", 34, null))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      fontWeight: 800,
      marginTop: 8,
      letterSpacing: "-0.5px",
      color: H.ink
    }
  }, /*#__PURE__*/React.createElement(CountC, {
    value: Math.round(gp * 100)
  }), "%"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 21,
      fontWeight: 700,
      color: H.ink,
      marginTop: 5,
      letterSpacing: "-0.4px"
    }
  }, t.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: H.sub,
      marginTop: 4
    }
  }, modeMeta.e, " ", modeMeta.t, " \xB7 ", t.vis === "public" ? "🌐 Открытая" : "🔒 Приватная"), desc ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: H.sub,
      marginTop: 7,
      lineHeight: 1.45,
      maxWidth: 300,
      marginLeft: "auto",
      marginRight: "auto"
    }
  }, desc) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 6,
      marginTop: 14
    }
  }, teamChips.map((ch, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: ch.hot ? heroChipAI : heroChip
  }, ch.t)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 16px 0"
    }
  }, stake > 0 && !gDone && /*#__PURE__*/React.createElement("div", {
    style: {
      ...card,
      borderRadius: 22,
      padding: 14,
      marginTop: 12,
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 13,
      background: "linear-gradient(135deg,#FEDE34,#EF9F14)",
      display: "grid",
      placeItems: "center",
      fontSize: 19,
      flexShrink: 0
    }
  }, "\uD83E\uDE99"), /*#__PURE__*/React.createElement("div", {
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
  }, "\u0411\u0430\u043D\u043A ", bank, " XP"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-4)",
      marginTop: 1
    }
  }, isRace ? "Лидер гонки забирает всё" : `Дойдёте — каждому вернётся +${stake}`))), gDone && stake > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      padding: "13px 15px",
      borderRadius: 22,
      background: "linear-gradient(135deg,#FEDE34,#EF9F14)",
      color: "#0a0a0a"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 800,
      letterSpacing: "-0.2px"
    }
  }, "\uD83C\uDF89 \u0426\u0435\u043B\u044C \u0434\u043E\u0441\u0442\u0438\u0433\u043D\u0443\u0442\u0430 \u2014 \u0431\u0430\u043D\u043A \u0440\u0430\u0441\u043A\u0440\u044B\u0442!"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      marginTop: 3,
      lineHeight: 1.4
    }
  }, isRace ? myPay > 0 ? `Ты лидер гонки — весь банк твой: +${myPay} XP 👑` : `Банк ${bank} XP забрал лидер гонки` : `Тебе +${myPay || stake} XP, и столько же каждому`)), contrib.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      marginTop: 12,
      flexWrap: "wrap"
    }
  }, contrib.map((m, i) => {
    var pay = payFor(m, i);
    return /*#__PURE__*/React.createElement("span", {
      key: m.id,
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        ...bosChipGlass(isDark),
        borderRadius: 999,
        padding: "3px 10px 3px 3px"
      }
    }, /*#__PURE__*/React.createElement(BuddyFaceLive, {
      avatar: m.avatar,
      name: m.name,
      size: 20
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11.5,
        fontWeight: 600,
        color: "var(--text-2)"
      }
    }, m.me ? "Ты" : (m.name || "").split(" ")[0], " \xB7 ", m.value), pay > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        fontWeight: 800,
        color: "#7a5300",
        background: "rgba(254,222,52,0.95)",
        borderRadius: 999,
        padding: "1px 6px"
      }
    }, "+", pay, isRace ? " 👑" : ""));
  })), _isOwner && pending.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "section-label",
    style: {
      marginTop: 22
    }
  }, "\u0417\u0430\u044F\u0432\u043A\u0438 \u043D\u0430 \u0432\u0441\u0442\u0443\u043F\u043B\u0435\u043D\u0438\u0435 (", pending.length, ")"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginTop: 8
    }
  }, pending.map((p, pi) => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    style: {
      background: "var(--card)",
      borderRadius: 22,
      boxShadow: "var(--card-shadow)",
      padding: 12,
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(BuddyFaceLive, {
    avatar: p.avatar,
    name: p.name,
    size: 40
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
  }, p.name || "Гость"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-4)",
      marginTop: 1
    }
  }, "\u0445\u043E\u0447\u0435\u0442 \u0432\u0441\u0442\u0443\u043F\u0438\u0442\u044C")), /*#__PURE__*/React.createElement("button", {
    onClick: () => approveReq(p.id),
    className: "tap",
    style: {
      flexShrink: 0,
      background: "var(--cta, #0a0a0a)",
      color: "var(--cta-ink, #fff)",
      border: 0,
      borderRadius: 999,
      padding: "8px 14px",
      fontSize: 13,
      fontWeight: 600
    }
  }, "\u041F\u0440\u0438\u043D\u044F\u0442\u044C"), /*#__PURE__*/React.createElement("button", {
    onClick: () => rejectReq(p.id),
    className: "tap",
    "aria-label": "\u041E\u0442\u043A\u043B\u043E\u043D\u0438\u0442\u044C",
    style: {
      flexShrink: 0,
      background: "var(--surface-3)",
      color: "var(--text-3)",
      border: 0,
      borderRadius: 999,
      width: 34,
      height: 34,
      fontSize: 16,
      lineHeight: 1
    }
  }, "\u2715"))))), /*#__PURE__*/React.createElement(BosSectionsAccordionLive, {
    dark: isDark,
    defaultOpen: "habits",
    sections: [{
      key: "habits",
      icon: /*#__PURE__*/React.createElement(I.Flame, {
        size: 17,
        color: "var(--text-3)"
      }),
      title: "Привычки",
      summary: teamHabits.length ? teamHabits.length + " " + _habitWordT(teamHabits.length) + " · сегодня " + _myDoneCount + " из " + teamHabits.length : "Пока пусто — добавь первую",
      render: () => /*#__PURE__*/React.createElement(React.Fragment, null, [main].concat(others).filter(Boolean).map((h, i) => {
        var done = myDone(h);
        var adopted = adoptedFor(h);
        var markInTeam = () => adopted ? markAdopted(h) : toggleMyTeamHabit(h);
        return /*#__PURE__*/React.createElement("div", {
          key: h.id || i,
          style: {
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 14px",
            borderTop: i ? "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)") : 0
          }
        }, _rosterLive ? /*#__PURE__*/React.createElement("button", {
          onClick: markInTeam,
          className: "tap",
          "aria-label": "\u041E\u0442\u043C\u0435\u0442\u0438\u0442\u044C \u0441\u0435\u0433\u043E\u0434\u043D\u044F",
          style: {
            width: 30,
            height: 30,
            borderRadius: "50%",
            flexShrink: 0,
            border: 0,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            background: done ? h.color || ringInk : isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)",
            boxShadow: done ? "none" : "inset 0 0 0 1.5px " + (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.14)")
          }
        }, done && /*#__PURE__*/React.createElement(I.Check, {
          size: 16,
          strokeWidth: 3,
          color: "#fff"
        })) : /*#__PURE__*/React.createElement("span", {
          "aria-hidden": true,
          style: {
            width: 30,
            height: 30,
            borderRadius: "50%",
            flexShrink: 0,
            background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)",
            boxShadow: "inset 0 0 0 1.5px " + (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.14)")
          }
        }), /*#__PURE__*/React.createElement("button", {
          className: "tap",
          onClick: () => {
            if (adopted) navigate("habit-detail", {
              habit: adopted,
              from: "team-detail"
            });
          },
          style: {
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: 0,
            background: "transparent",
            border: 0,
            textAlign: "left",
            color: "var(--text)",
            cursor: adopted ? "pointer" : "default"
          }
        }, /*#__PURE__*/React.createElement("span", {
          style: {
            width: 34,
            height: 34,
            borderRadius: 12,
            background: h.color ? h.color + "26" : isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)",
            display: "grid",
            placeItems: "center",
            fontSize: 17,
            flexShrink: 0
          }
        }, bosIcon(h.emoji, 18, h.color)), /*#__PURE__*/React.createElement("div", {
          style: {
            flex: 1,
            minWidth: 0
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 15,
            color: "var(--text)",
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }
        }, h.name, adopted && /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-4)",
            marginLeft: 7
          }
        }, "\xB7 \u0443 \u0441\u0435\u0431\u044F")), /*#__PURE__*/React.createElement("div", {
          style: {
            fontSize: 12,
            color: "var(--text-4)",
            marginTop: 1
          }
        }, h.isMain && /*#__PURE__*/React.createElement("span", {
          style: {
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            marginRight: 7
          }
        }, /*#__PURE__*/React.createElement("span", {
          style: {
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#EF9F14",
            display: "inline-block"
          }
        }), "\u042F\u043A\u043E\u0440\u044C"), h.doneToday != null && h.total != null ? h.doneToday + " из " + h.total + " сегодня" : "общая привычка")), adopted && /*#__PURE__*/React.createElement(I.ChevronRight, {
          size: 16,
          color: "var(--text-4)"
        })), _isOwner && /*#__PURE__*/React.createElement("button", {
          onClick: () => openEditTeamHabit(h),
          className: "tap",
          "data-haptic": "selection",
          "aria-label": "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u043E\u0431\u0449\u0443\u044E \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0443",
          style: {
            flexShrink: 0,
            width: 30,
            height: 30,
            borderRadius: 999,
            border: 0,
            background: isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)",
            display: "grid",
            placeItems: "center",
            color: "var(--text-3)",
            cursor: "pointer"
          }
        }, /*#__PURE__*/React.createElement(I.Pencil, {
          size: 14,
          strokeWidth: 2
        })), _rosterLive && !adopted && /*#__PURE__*/React.createElement("button", {
          onClick: () => adoptTeamHabit(h),
          className: "tap",
          style: {
            flexShrink: 0,
            background: "transparent",
            border: "1px dashed " + (isDark ? "rgba(255,255,255,0.24)" : "rgba(0,0,0,0.18)"),
            borderRadius: 999,
            padding: "5px 10px",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-3)",
            whiteSpace: "nowrap"
          }
        }, "\u0412\u0435\u0441\u0442\u0438 \u0443 \u0441\u0435\u0431\u044F"), _rosterLive && adopted && adopted.shelved && /*#__PURE__*/React.createElement("button", {
          onClick: () => {
            if (app?.updateHabit) app.updateHabit(adopted.id, {
              shelved: false
            });
            if (window.tgHaptic) {
              try {
                window.tgHaptic("success");
              } catch (e) {}
            }
          },
          className: "tap",
          style: {
            flexShrink: 0,
            background: "transparent",
            border: "1px dashed " + (isDark ? "rgba(255,255,255,0.24)" : "rgba(0,0,0,0.18)"),
            borderRadius: 999,
            padding: "5px 10px",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-3)",
            whiteSpace: "nowrap"
          }
        }, "\u0412\u0435\u0440\u043D\u0443\u0442\u044C \u043A \u0441\u0435\u0431\u0435"));
      }), teamHabits.length === 0 && /*#__PURE__*/React.createElement("div", {
        style: {
          padding: "14px 14px 2px",
          fontSize: 13,
          color: "var(--text-4)",
          lineHeight: 1.5
        }
      }, "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043E\u0431\u0449\u0438\u0445 \u043F\u0440\u0438\u0432\u044B\u0447\u0435\u043A. \u0414\u043E\u0431\u0430\u0432\u044C \u043F\u0435\u0440\u0432\u0443\u044E \u2014 \u043E\u043D\u0430 \u0441\u0442\u0430\u043D\u0435\u0442 \u044F\u043A\u043E\u0440\u0435\u043C \u0446\u0435\u043B\u0438."), /*#__PURE__*/React.createElement("button", {
        className: "tap",
        onClick: openAddHabit,
        style: {
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 14px",
          borderTop: teamHabits.length ? "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)") : 0,
          background: "transparent",
          border: 0,
          color: "var(--text-2)",
          cursor: "pointer"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 30,
          height: 30,
          borderRadius: "50%",
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          border: "1.5px dashed " + (isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.18)")
        }
      }, /*#__PURE__*/React.createElement(I.Plus, {
        size: 15,
        strokeWidth: 2.4,
        color: isDark ? "#fff" : "var(--text-2)"
      })), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 14.5,
          fontWeight: 600
        }
      }, "\u041F\u0440\u0438\u0432\u044B\u0447\u043A\u0430 \u0434\u043B\u044F \u044D\u0442\u043E\u0439 \u0446\u0435\u043B\u0438")))
    }, {
      key: "calendar",
      icon: /*#__PURE__*/React.createElement(I.Calendar, {
        size: 17,
        color: "var(--text-3)"
      }),
      title: "Календарь",
      summary: main ? "Отметки по «" + main.name + "»" : "Отметки по дням",
      render: () => _rosterLive && main && mainProg && mainProg.length > 0 ? /*#__PURE__*/React.createElement("div", {
        style: {
          padding: "10px 12px 12px"
        }
      }, /*#__PURE__*/React.createElement(PeopleMonthCalendarLive, {
        bare: true,
        label: "",
        people: mainProg.map(m => ({
          name: m.me ? "Ты" : m.name,
          initials: m.me ? "Я" : (m.name || "У").charAt(0).toUpperCase(),
          color: accent,
          you: !!m.me,
          avatar: m.avatar
        })),
        dayFrac: (pi, d, mi) => mainProg[pi] && mainProg[pi].days[_tCalKey(d, mi)] ? 1 : 0
      })) : /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          color: "var(--text-4)",
          padding: 14,
          lineHeight: 1.5
        }
      }, "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043E\u0442\u043C\u0435\u0442\u043E\u043A \u2014 \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F, \u043A\u043E\u0433\u0434\u0430 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438 \u043D\u0430\u0447\u043D\u0443\u0442 \u0437\u0430\u043A\u0440\u044B\u0432\u0430\u0442\u044C \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u0438 \u043A\u0440\u0443\u0433\u0430.")
    }, {
      key: "people",
      icon: /*#__PURE__*/React.createElement(I.Users, {
        size: 17,
        color: "var(--text-3)"
      }),
      title: "Люди",
      summary: _rosterLoading ? "загрузка…" : members.length + " " + _peopleWord(members.length) + (inFlowToday ? " · сегодня " + inFlowToday + " в деле" : ""),
      render: () => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        style: {
          overflow: "hidden"
        }
      }, _rosterLoading && [0, 1].map(i => /*#__PURE__*/React.createElement("div", {
        key: "sk" + i,
        style: {
          padding: 12,
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderTop: i ? "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)") : 0
        }
      }, /*#__PURE__*/React.createElement("span", {
        className: "bos-skel",
        style: {
          width: 40,
          height: 40,
          borderRadius: "50%"
        }
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1
        }
      }, /*#__PURE__*/React.createElement("span", {
        className: "bos-skel",
        style: {
          display: "block",
          width: "42%",
          height: 12,
          borderRadius: 6
        }
      }), /*#__PURE__*/React.createElement("span", {
        className: "bos-skel",
        style: {
          display: "block",
          width: "26%",
          height: 10,
          borderRadius: 6,
          marginTop: 7
        }
      })))), !_rosterLoading && ranked.map((m, i) => /*#__PURE__*/React.createElement("div", {
        key: m.id || i,
        style: {
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderTop: i ? "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)") : 0
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          display: "inline-flex",
          borderRadius: "50%",
          boxShadow: flowSet[m.id] ? "0 0 0 1.5px " + (isDark ? "#0f0f12" : "#fff") + ", 0 0 0 3.5px " + ringInk : "none"
        }
      }, /*#__PURE__*/React.createElement(BuddyFaceLive, {
        avatar: m.avatar,
        name: m.name,
        size: 38
      })), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          minWidth: 0
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 15,
          fontWeight: 600,
          color: "var(--text)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }
      }, m.id === meId ? "Ты" : m.name), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12,
          color: "var(--text-4)",
          marginTop: 1
        }
      }, m.role === "owner" ? "Создатель" : "Участник", flowSet[m.id] ? " · сегодня в деле" : "")))), /*#__PURE__*/React.createElement("button", {
        className: "tap",
        onClick: () => openSheet(/*#__PURE__*/React.createElement(TeamShareSheetLive, {
          team: t
        })),
        style: {
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 14px",
          borderTop: members.length || _rosterLoading ? "1px solid " + (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)") : 0,
          background: "transparent",
          border: 0,
          color: "var(--text-2)",
          cursor: "pointer"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 30,
          height: 30,
          borderRadius: "50%",
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          border: "1.5px dashed " + (isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.18)")
        }
      }, /*#__PURE__*/React.createElement(I.Plus, {
        size: 15,
        strokeWidth: 2.4,
        color: isDark ? "#fff" : "var(--text-2)"
      })), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 14.5,
          fontWeight: 600
        }
      }, "\u041F\u043E\u0437\u0432\u0430\u0442\u044C \u043B\u044E\u0434\u0435\u0439"))))
    }]
  }), !_isOwner && /*#__PURE__*/React.createElement("button", {
    onClick: () => bosConfirmExitTeam({
      app,
      team: t,
      isOwner: false,
      navigate,
      openSheet,
      returnTo: from
    }),
    className: "tap",
    style: {
      width: "100%",
      marginTop: 26,
      background: "transparent",
      border: 0,
      color: "var(--accent-red)",
      padding: 14,
      fontSize: 15,
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 7
    }
  }, /*#__PURE__*/React.createElement(I.Logout, {
    size: 17
  }), " \u041F\u043E\u043A\u0438\u043D\u0443\u0442\u044C \u0446\u0435\u043B\u044C")));
}

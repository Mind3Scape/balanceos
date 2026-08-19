/* ═══════════════════════════════════════════════════════════════════════════════════════
   СООБЩЕСТВО ПО МАКЕТАМ FIGMA — комнаты «Все · Группы · Люди · Места и события · Курсы».

   Собрано из атомов fig_kit.jsx по кадрам «Мои сообщества», «Группы», «Люди»,
   «Места и события», «Курсы». Числа — из узлов макета, не на глаз.

   ЧЕСТНОСТЬ ДАННЫХ. Группы и Люди — настоящие: облако, участники кругов, уровни.
   Мест/событий и курсов в бэкенде пока нет (David 19.08: «партнёров и курсов у нас нет —
   используй готовые макеты, чтобы было ощущение»). Поэтому такие карточки живут в
   ВИТРИНЕ: содержимое из макета + всё, что добавит сам David, лежит рядом в
   `bos:showcase:places` / `bos:showcase:courses`. Витринная карточка ПОМЕЧЕНА словом
   «Пример» — чтобы никто не принял её за живое место. Как только появятся таблицы,
   витрина уступит место настоящим строкам: чтение уже идёт через один и тот же список.

   ЧТО НУЖНО В БЭКЕНДЕ (заметка для David, ничего из этого я не выдумываю на клиенте):
     · profiles.last_seen      — строка «в сети · был(а) недавно» под именем человека
     · profiles.city           — город в строке группы и человека
     · teams.category          — рубрика группы («IT и разработка»)
     · teams.city              — город группы
     · places(…)               — места и события: фото, рейтинг, отзывы, цена XP, старая цена
     · courses(…)              — курсы: партнёр, рейтинг, цена ₽, скидка, промокод, рассрочка
     · reviews(…)              — отзывы и оценка (★ 5.0 (12) в карточках)
   ═══════════════════════════════════════════════════════════════════════════════════════ */

/* ── ВИТРИНА: содержимое прямо из кадров макета. Правится и дополняется руками David
      через «Добавить» — новое ложится в localStorage рядом с примерами. ── */
const FIG_SHOWCASE_PLACES = [
  { id: "sc-med", title: "Открытая медитация: Час осознанности с гидом в студии", city: "Москва",
    rate: 5.0, reviews: 12, priceXP: 2500, oldXP: 3200, cta: "Открыто", showcase: true,
    about: "Час тишины с ведущим: дыхание, тело, внимание. Приходить можно без опыта — коврики и пледы на месте.",
    cover: ["#C9A8E8", "#7FB3F2"], coverEmoji: "🧘", photos: [] },
  { id: "sc-salt", title: "Солевые пещеры: пробное посещение", city: "Москва",
    rate: 5.0, reviews: 12, priceXP: 1000, oldXP: 3200, cta: "Открыто", showcase: true,
    about: "Сорок минут в соляной комнате. Хорошо после болезни и в сезон, когда дышится тяжело.",
    cover: ["#86C7C2", "#9BD4A8"], coverEmoji: "🧂", photos: [] },
  { id: "sc-bath", title: "Баня по-чёрному: парение с мастером", city: "Москва",
    rate: 4.9, reviews: 31, priceXP: 3200, cta: "Открыто", showcase: true,
    about: "Классическое парение в три захода с травяными вениками и чаем между заходами.",
    cover: ["#F4A574", "#E8C868"], coverEmoji: "🔥", photos: [] },
];
const FIG_SHOWCASE_COURSES = [
  { id: "sc-tech", title: "Постановка техники, работа с опытным тренером", emoji: "🏋️",
    info: "Интенсив · 21 день · Начало 1 сентября", partner: "Студия «Тишина»", verified: true,
    rate: 5.0, reviews: 12, city: "Москва", discount: "-30 %", promo: "Ещё -10 % по промокоду",
    price: "178 400 ₽", oldPrice: "230 000 ₽", monthly: "14 860 ₽ в месяц", cta: "Подробнее", showcase: true },
  { id: "sc-break", title: "Прорыв: открыть новые пути и преодолеть пределы", emoji: "🚀",
    info: "Продвинутый · 7 дней · Начало 12 сентября", partner: "Balance Lab", verified: true,
    rate: 4.8, reviews: 40, city: "Онлайн", discount: "-15 %",
    price: "93 500 ₽", oldPrice: "110 000 ₽", monthly: "7 790 ₽ в месяц", cta: "Подробнее", showcase: true },
  { id: "sc-mar", title: "Марафон: 21 день устойчивых привычек", emoji: "🏃",
    info: "Базовый · 21 день · Начало 5 сентября", partner: "Balance Lab", verified: true,
    rate: 4.9, reviews: 86, city: "Онлайн",
    price: "39 000 ₽", monthly: "3 250 ₽ в месяц", cta: "Подробнее", showcase: true },
];
function figShowcaseRead(key, seed) {
  try {
    var raw = localStorage.getItem("bos:showcase:" + key);
    var mine = raw ? JSON.parse(raw) : [];
    return (Array.isArray(mine) ? mine : []).concat(seed);
  } catch (e) { return seed; }
}
function figShowcaseAdd(key, item) {
  try {
    var raw = localStorage.getItem("bos:showcase:" + key);
    var mine = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(mine)) mine = [];
    mine.unshift(item);
    localStorage.setItem("bos:showcase:" + key, JSON.stringify(mine.slice(0, 40)));
  } catch (e) {}
}

/* ── УРОВНИ ГРУПП: один запрос на все круги сразу (bosTeamXPBatch уже пакует). ── */
function useFigTeamLevels(teams) {
  var sig = (teams || []).map(function (t) { return t.cloudId; }).filter(Boolean).join(",");
  var [map, setMap] = React.useState({});
  React.useEffect(function () {
    if (!sig) { setMap({}); return; }
    var on = true;
    var ids = sig.split(",");
    Promise.all(ids.map(function (id) {
      return (typeof bosTeamXPBatch === "function") ? bosTeamXPBatch(id) : Promise.resolve(null);
    })).then(function (vals) {
      if (!on) return;
      var out = {};
      ids.forEach(function (id, i) {
        if (vals[i] == null) return;
        var L = (typeof bosCircleLevel === "function") ? bosCircleLevel(vals[i]) : null;
        if (L) out[id] = { level: L.level, pct: L.frac };
      });
      setMap(out);
    }).catch(function () {});
    return function () { on = false; };
  }, [sig]);
  return map;
}

/* ── ЛЮДИ: все участники моих кругов, без себя, с уровнем из профиля.
      Статуса «в сети» в базе нет — вместо выдуманного показываем ПРАВДУ: в каком круге
      вы вместе. Появится profiles.last_seen — строка сменится на макетную. ── */
var _figPeopleCache = null;
function useFigPeople(app) {
  var teams = (app && app.teams || []).filter(function (t) { return t.cloudId; });
  var sig = teams.map(function (t) { return t.cloudId; }).join(",");
  var [people, setPeople] = React.useState(_figPeopleCache || []);
  React.useEffect(function () {
    var on = true;
    var C = window.bosCloud;
    if (!(C && C.enabled && C.enabled() && C.teamMembers) || !sig) { setPeople([]); return; }
    (async function () {
      var myId = null; try { myId = await C.uid(); } catch (e) {}
      // Заблокированные (bos:block) не появляются в «Людях» — обещание кнопки «Заблокировать».
      var blocked = (typeof bosBlockedSet === "function") ? bosBlockedSet() : new Set();
      var seen = {}, out = [];
      for (var i = 0; i < teams.length; i++) {
        try {
          var mem = await C.teamMembers(teams[i].cloudId);
          (mem || []).forEach(function (m) {
            if (!m || !m.id || m.id === myId || blocked.has(m.id)) return;
            if (seen[m.id]) { seen[m.id].teams.push(teams[i]); return; }
            var row = { id: m.id, name: m.name || "Участник", avatar: m.avatar, teams: [teams[i]], level: null, lvlPct: 0 };
            seen[m.id] = row; out.push(row);
          });
        } catch (e) {}
      }
      // Уровни — одним запросом на всех.
      if (out.length && C.netProfiles) {
        try {
          var pr = await C.netProfiles(out.map(function (p) { return p.id; }));
          var byId = {};
          ((pr && pr.profiles) || []).forEach(function (p) { byId[p.id] = p; });
          out.forEach(function (p) {
            var q = byId[p.id];
            if (!q) return;
            if (q.level != null) p.level = q.level;
            if (q.name) p.name = q.name;
            if (q.avatar) p.avatar = q.avatar;
          });
        } catch (e) {}
      }
      if (on) { _figPeopleCache = out; setPeople(out); }
    })();
    return function () { on = false; };
  }, [sig]);
  return people;
}

/* Разбивка списка на карточки по 3 строки — в макете «Мои группы» и «Друзья» едут
   горизонтально страницами ровно по три строки в карточке 340. */
function figChunk(list, n) {
  var out = [];
  for (var i = 0; i < list.length; i += n) out.push(list.slice(i, i + n));
  return out;
}
function figPlural(n, one, few, many) {
  var a = n % 10, b = n % 100;
  return n + " " + ((a === 1 && b !== 11) ? one : (a >= 2 && a <= 4 && (b < 12 || b > 14)) ? few : many);
}

/* ── КОМНАТА «ВСЕ» (кадр «Мои сообщества») ─────────────────────────────────────────── */
function FigCommunityAllLive({ app, navigate, isDark, onSeg, lowCircles }) {
  const teams = (app && app.teams) || [];
  const myGroups = teams.filter(function (t) { return t && (t.joined !== false); });
  const levels = useFigTeamLevels(myGroups);
  const people = useFigPeople(app);
  const [lowOpen, setLowOpen] = React.useState(false);
  const { open: openSheet } = (typeof useSheet === "function") ? useSheet() : { open: null };

  const favIds = React.useMemo(function () {
    var out = {};
    try {
      myGroups.forEach(function (t) {
        var k = t.cloudId || t._id || t.id;
        if (k && localStorage.getItem("bos:favteam:" + k) === "1") out[k] = 1;
      });
    } catch (e) {}
    return out;
  }, [myGroups.length]);

  const dress = function (t) {
    var k = t.cloudId || t._id || t.id;
    var L = levels[t.cloudId] || null;
    return {
      key: k, team: t, name: t.name,
      avatar: (t.emblem && ("" + t.emblem).indexOf("url:") === 0) ? t.emblem : (t.emblem ? "emoji:" + t.emblem : null),
      category: t.category || (t.vis === "public" ? "Открытая группа" : "Приватная группа"),
      info: t.membersN ? figPlural(t.membersN, "участник", "участника", "участников") : null,
      level: L ? L.level : null, lvlPct: L ? L.pct : 0,
    };
  };
  const favGroups = myGroups.filter(function (t) { return favIds[t.cloudId || t._id || t.id]; }).map(dress);
  const groupRows = myGroups.map(dress);

  const places = React.useMemo(function () { return figShowcaseRead("places", FIG_SHOWCASE_PLACES); }, []);
  const courses = React.useMemo(function () { return figShowcaseRead("courses", FIG_SHOWCASE_COURSES); }, []);

  const openShowcase = function (item, kind) { if (openSheet) openSheet(<FigShowcaseDetailSheetLive item={item} kind={kind} />); };
  const openGroup = function (t) { navigate("team-detail", { team: t, from: "community" }); };
  const openChat = function (t) { navigate("team-detail", { team: t, from: "community", tab: "chat" }); };
  const openPerson = function (p) { navigate("person-profile", { person: { user_id: p.id, name: p.name, avatar: p.avatar, level: p.level }, from: "community" }); };

  return (
    <div className="fig-swap" style={{ display: "grid", gap: 0 }}>
      {/* МАЛО АКТИВНОСТИ — та же метрика, что решает вылет из круга, только мягче порог.
          Нет таких групп — блока нет: пустую плашку «всё хорошо» не рисуем. */}
      {lowCircles && lowCircles.length > 0 && (
        <React.Fragment>
          <FigSectionHead title="Мало активности" />
          <div style={{ padding: "0 16px 10px" }}>
            <FigCard>
              <button onClick={function () { setLowOpen(!lowOpen); }} className="tap" data-haptic="selection"
                style={{ width: "100%", border: 0, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center",
                  gap: 8, padding: "0 16px", minHeight: 82, textAlign: "left", color: "var(--text)" }}>
                <span style={{ display: "inline-flex", flexShrink: 0, width: 52 }}>
                  {lowCircles.slice(0, 3).map(function (t, i) {
                    return <span key={i} style={{ width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center",
                      fontSize: 15, overflow: "hidden", background: "var(--surface-3)", boxShadow: "0 0 0 2px var(--surface)", marginLeft: i ? -14 : 0 }}>
                      {bosIconOf(t, 15, null, "👥")}</span>;
                  })}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 17, lineHeight: "22px", letterSpacing: "-0.43px" }}>{figPlural(lowCircles.length, "группа", "группы", "групп")}</span>
                  <span style={{ display: "block", fontSize: 15, lineHeight: "20px", letterSpacing: "-0.23px", color: "var(--text-2)" }}>Ты давно не участвовал в этих сообществах</span>
                </span>
                <I.ChevronRight size={17} color="var(--text-3)" style={{ flexShrink: 0, transition: "transform .22s", transform: lowOpen ? "rotate(90deg)" : "none" }} />
              </button>
              {lowOpen && lowCircles.map(function (t, i) {
                return <div key={"lo" + i} className="fig-expand"><FigGroupRow group={dress(t)} onOpen={function () { openGroup(t); }} /></div>;
              })}
            </FigCard>
          </div>
        </React.Fragment>
      )}

      {/* ЛЮБИМЫЕ ГРУППЫ — те, что помечены звёздочкой в меню группы. */}
      {favGroups.length > 0 && (
        <React.Fragment>
          <FigSectionHead title="Любимые группы" sub={figPlural(favGroups.length, "группа", "группы", "групп")}
            onPress={function () { navigate("favorites", { from: "community" }); }} />
          <FigRail pad={12} gap={0}>
            {favGroups.map(function (g, i) {
              return <FigFavGroup key={g.key} group={g} rank={i + 1} onOpen={function () { openGroup(g.team); }} />;
            })}
          </FigRail>
        </React.Fragment>
      )}

      {/* МОИ ГРУППЫ — страницами по три строки, как в макете. */}
      {groupRows.length > 0 && (
        <React.Fragment>
          <FigSectionHead title="Мои группы" sub={figPlural(groupRows.length, "группа", "группы", "групп")}
            onPress={function () { onSeg("circles"); }} />
          {/* Одна страница — карточка ВО ВСЮ ширину (David: «пока групп немного, они должны
              занимать весь экран»); листание страницами по три включается со второй. */}
          <FigRail>
            {figChunk(groupRows, 3).map(function (page, pi, pages) {
              return (
                <FigCard key={pi} width={pages.length > 1 ? 340 : "100%"}>
                  {page.map(function (g, i) {
                    return <FigGroupRow key={g.key} group={g} first={i === 0}
                      onOpen={function () { openGroup(g.team); }}
                      onChat={function () { openChat(g.team); }}
                      onMenu={openSheet ? function () { openSheet(<FigGroupMenuSheetLive team={g.team} />); } : null} />;
                  })}
                </FigCard>
              );
            })}
          </FigRail>
        </React.Fragment>
      )}

      {/* ЛЮДИ — настоящие участники твоих групп. */}
      {people.length > 0 && (
        <React.Fragment>
          <FigSectionHead title="Друзья" sub={figPlural(people.length, "друг", "друга", "друзей")}
            onPress={function () { onSeg("people"); }} />
          <FigRail>
            {figChunk(people, 3).map(function (page, pi, pages) {
              return (
                <FigCard key={pi} width={pages.length > 1 ? 340 : "100%"}>
                  {page.map(function (p, i) {
                    return <FigFriendRow key={p.id} first={i === 0}
                      person={{ name: p.name, avatar: p.avatar, level: p.level, lvlPct: p.lvlPct,
                        status: p.teams && p.teams.length ? ("вместе в «" + p.teams[0].name + "»") : null }}
                      onOpen={function () { openPerson(p); }}
                      onChat={function () { if (p.teams && p.teams[0]) navigate("team-detail", { team: p.teams[0], from: "community", tab: "chat", prefill: "@" + (p.name || "").split(" ")[0] + " " }); }} />;
                  })}
                </FigCard>
              );
            })}
          </FigRail>
        </React.Fragment>
      )}

      {/* ПРИГЛАСИТЬ — одна строка-карточка с наградой, как в макете. */}
      <div style={{ padding: "0 16px 10px" }}>
        <FigCard>
          <button onClick={function () { if (typeof ShareAppSheetLive === "function" && openSheet) openSheet(<ShareAppSheetLive dark={isDark} />); else onSeg("people"); }}
            className="tap" style={{ width: "100%", border: 0, background: "transparent", cursor: "pointer", display: "flex",
              alignItems: "center", gap: 12, padding: "0 16px", minHeight: 82, textAlign: "left", color: "var(--text)" }}>
            <span style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, display: "grid", placeItems: "center",
              background: "var(--accent-orange)", color: "#fff" }}><I.Share size={21} strokeWidth={2} /></span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 17, lineHeight: "22px", letterSpacing: "-0.43px" }}>Пригласить друзей</span>
                <FigBadge tone="green" small>+150 XP</FigBadge>
              </span>
              <span style={{ display: "block", fontSize: 15, lineHeight: "20px", letterSpacing: "-0.23px", color: "var(--text-2)" }}>Общайтесь и развивайтесь вместе в Balance</span>
            </span>
            <I.ChevronRight size={17} color="var(--text-3)" style={{ flexShrink: 0 }} />
          </button>
        </FigCard>
      </div>

      {/* ГРУПП НЕТ — честная пустая комната вместо ленты. */}
      {groupRows.length === 0 && (
        <FigEmpty title="Групп пока нет" text="Вступи в группу или собери свою — и она появится здесь."
          action="Каталог групп" onAction={function () { onSeg("circles"); }} />
      )}

      {/* МЕСТА И СОБЫТИЯ — витрина (бэкенда ещё нет). */}
      <FigSectionHead title="Мои места и события" sub="Открой за XP и приходи"
        onPress={function () { onSeg("places"); }} />
      <FigRail>
        {places.slice(0, 6).map(function (p) {
          return <FigPlaceCard key={p.id} item={p}
            onOpen={function () { openShowcase(p, "place"); }}
            onAct={function () { openShowcase(p, "place"); }} />;
        })}
      </FigRail>

      {/* КУРСЫ — витрина без оплаты (решение David 19.08). */}
      <FigSectionHead title="Открытые курсы" sub="Проходите курсы, и они появятся тут"
        onPress={function () { onSeg("courses"); }} />
      <FigRail>
        {courses.slice(0, 6).map(function (c) {
          return <FigCourseCard key={c.id} item={c}
            onOpen={function () { openShowcase(c, "course"); }}
            onAct={function () { openShowcase(c, "course"); }} />;
        })}
      </FigRail>
    </div>
  );
}

/* ── КОМНАТА «ЛЮДИ» (кадр «Люди»): полный список строками + поиск + сортировка. ── */
function FigPeopleRoomLive({ app, navigate, query }) {
  const people = useFigPeople(app);
  const [sort, setSort] = React.useState("level");   // level | name
  const q = ("" + (query || "")).trim().toLowerCase();
  const list = React.useMemo(function () {
    var out = people.filter(function (p) { return !q || ("" + p.name).toLowerCase().indexOf(q) >= 0; });
    out = out.slice().sort(function (a, b) {
      if (sort === "name") return String(a.name).localeCompare(String(b.name), "ru");
      return (b.level || 0) - (a.level || 0) || String(a.name).localeCompare(String(b.name), "ru");
    });
    return out;
  }, [people, q, sort]);
  const openPerson = function (p) { navigate("person-profile", { person: { user_id: p.id, name: p.name, avatar: p.avatar, level: p.level }, from: "community" }); };
  if (!people.length) {
    return <div className="fig-swap"><FigEmpty title="Людей пока нет"
      text="Люди появляются здесь, когда вы оказываетесь в одной группе. Вступи в группу или позови своих." /></div>;
  }
  // Верхняя лента друзей — столбики 90×109 из кадра «Люди»: лицо 44 в кольце + имя.
  const strip = people.slice(0, 8);
  return (
    <div className="fig-swap">
      {strip.length > 0 && !q && (
        <FigRail pad={16} gap={0} style={{ paddingTop: 4 }}>
          {strip.map(function (p) {
            return (
              <button key={"s" + p.id} onClick={function () { openPerson(p); }} className="tap"
                style={{ width: 90, flexShrink: 0, border: 0, background: "transparent", padding: 0, cursor: "pointer",
                  display: "grid", justifyItems: "center", gap: 4 }}>
                <FigAvatarLvl avatar={p.avatar} name={p.name} size={44} level={p.level} pct={p.lvlPct || 0} />
                <FigLvlBadge level={p.level} />
                <span style={{ fontSize: 13, lineHeight: "18px", color: "var(--text)", maxWidth: 84,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(p.name || "").split(" ")[0]}</span>
              </button>
            );
          })}
        </FigRail>
      )}
      <FigSectionHead title="Люди" sub={figPlural(list.length, "человек", "человека", "человек")}
        action={sort === "level" ? "По уровню" : "По имени"} onAction={function () { setSort(sort === "level" ? "name" : "level"); }} />
      <div style={{ padding: "0 16px 10px" }}>
        <FigCard>
          {list.map(function (p, i) {
            return <FigFriendRow key={p.id} first={i === 0}
              person={{ name: p.name, avatar: p.avatar, level: p.level, lvlPct: p.lvlPct,
                status: p.teams && p.teams.length ? ("вместе в «" + p.teams[0].name + "»") : null }}
              onOpen={function () { openPerson(p); }}
              onChat={function () { if (p.teams && p.teams[0]) navigate("team-detail", { team: p.teams[0], from: "community", tab: "chat", prefill: "@" + (p.name || "").split(" ")[0] + " " }); }} />;
          })}
        </FigCard>
      </div>
      {q && !list.length && <FigEmpty title="Ничего не найдено" text="Попробуй другое имя." />}
      {/* Рекомендации по интересам/должности из кадра требуют полей interests/role в
          profiles — их пока нет. Говорим прямо, а не рисуем чужих людей наугад. */}
      {!q && (
        <div style={{ padding: "6px 16px 0" }}>
          <div style={{ borderRadius: 24, background: "var(--surface)", padding: "16px", fontSize: 15, lineHeight: "20px", color: "var(--text-2)" }}>
            Рекомендации по интересам и по должности появятся, когда профили начнут хранить интересы и занятие — тогда здесь будут люди «под твой баланс».
          </div>
        </div>
      )}
    </div>
  );
}

/* ── КОМНАТА «МЕСТА И СОБЫТИЯ» ────────────────────────────────────────────────────── */
function FigPlacesRoomLive({ navigate, query, onAdd }) {
  const { open: openSheet } = (typeof useSheet === "function") ? useSheet() : { open: null };
  const openShowcase = function (item, kind) { if (openSheet) openSheet(<FigShowcaseDetailSheetLive item={item} kind={kind} />); };
  const [tick, setTick] = React.useState(0);
  const all = React.useMemo(function () { return figShowcaseRead("places", FIG_SHOWCASE_PLACES); }, [tick]);
  const q = ("" + (query || "")).trim().toLowerCase();
  const list = all.filter(function (p) { return !q || ("" + p.title).toLowerCase().indexOf(q) >= 0 || ("" + (p.city || "")).toLowerCase().indexOf(q) >= 0; });
  return (
    <div className="fig-swap">
      <FigSectionHead title="Места и события" sub="Открывай за XP и приходи"
        action="Добавить" onAction={function () { onAdd(function () { setTick(function (t) { return t + 1; }); }); }} />
      <div style={{ display: "grid", gap: 10, padding: "0 16px 10px" }}>
        {list.map(function (p) {
          return <FigPlaceCard key={p.id} wide item={p} onOpen={function () { openShowcase(p, "place"); }}
              onAct={function () { openShowcase(p, "place"); }} />;
        })}
      </div>
      {!list.length && <FigEmpty title="Ничего не найдено" text="Попробуй другое слово или добавь своё место." action="Добавить" onAction={function () { onAdd(function () { setTick(function (t) { return t + 1; }); }); }} />}
      <div style={{ padding: "4px 16px 0", fontSize: 13, lineHeight: "18px", color: "var(--text-3)" }}>
        Пока это витрина по макету — настоящие места появятся, когда включим их в бэкенде.
      </div>
    </div>
  );
}

/* ── КОМНАТА «КУРСЫ» — витрина без оплаты ─────────────────────────────────────────── */
function FigCoursesRoomLive({ navigate, query, onAdd }) {
  const { open: openSheet } = (typeof useSheet === "function") ? useSheet() : { open: null };
  const openShowcase = function (item, kind) { if (openSheet) openSheet(<FigShowcaseDetailSheetLive item={item} kind={kind} />); };
  const [tick, setTick] = React.useState(0);
  const all = React.useMemo(function () { return figShowcaseRead("courses", FIG_SHOWCASE_COURSES); }, [tick]);
  const q = ("" + (query || "")).trim().toLowerCase();
  const list = all.filter(function (c) { return !q || ("" + c.title).toLowerCase().indexOf(q) >= 0 || ("" + (c.partner || "")).toLowerCase().indexOf(q) >= 0; });
  return (
    <div className="fig-swap">
      <FigSectionHead title="Курсы" sub="Программы, которые ведут вживую"
        action="Добавить" onAction={function () { onAdd(function () { setTick(function (t) { return t + 1; }); }); }} />
      <div style={{ display: "grid", gap: 10, padding: "0 16px 10px", justifyItems: "stretch" }}>
        {list.map(function (c) {
          return <FigCourseCard key={c.id} item={c} style={{ width: "100%" }}
            onOpen={function () { openShowcase(c, "course"); }}
            onAct={function () { openShowcase(c, "course"); }} />;
        })}
      </div>
      {!list.length && <FigEmpty title="Ничего не найдено" text="Попробуй другое слово или добавь свой курс." action="Добавить" onAction={function () { onAdd(function () { setTick(function (t) { return t + 1; }); }); }} />}
      <div style={{ padding: "4px 16px 0", fontSize: 13, lineHeight: "18px", color: "var(--text-3)" }}>
        Оплаты пока нет — карточка ведёт к описанию курса. Витрина по макету.
      </div>
    </div>
  );
}

/* ── ФОРМА «ДОБАВИТЬ» для витрины: место или курс. Кладём в localStorage рядом с
      примерами; когда появятся таблицы — та же форма поедет в облако. ── */
function FigShowcaseAddSheetLive({ kind, onDone }) {
  const { close } = useSheet();
  const isPlace = kind === "places";
  const [title, setTitle] = React.useState("");
  const [city, setCity] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [partner, setPartner] = React.useState("");
  const [info, setInfo] = React.useState("");
  const [photo, setPhoto] = React.useState("");
  const save = function () {
    var t = title.trim();
    if (!t) return;
    var id = "own-" + Date.now();
    if (isPlace) {
      figShowcaseAdd("places", { id: id, title: t, city: city.trim(), priceXP: Math.max(0, parseInt(price, 10) || 0),
        cta: "Открыть", photos: photo ? [photo] : [], mine: true });
    } else {
      figShowcaseAdd("courses", { id: id, title: t, city: city.trim(), partner: partner.trim(), info: info.trim(),
        price: price.trim(), emoji: "🎓", photo: photo || null, cta: "Подробнее", mine: true });
    }
    if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
    onDone && onDone();
    close();
  };
  const F = { width: "100%", height: 44, borderRadius: 12, border: 0, background: "var(--surface-3)", padding: "0 12px",
    fontSize: 17, color: "var(--text)", outline: "none", boxSizing: "border-box" };
  return (
    <div style={{ padding: "2px 16px 10px", display: "grid", gap: 10, color: "var(--text)" }}>
      <div style={{ fontSize: 19, fontWeight: 700, textAlign: "center" }}>{isPlace ? "Новое место" : "Новый курс"}</div>
      <div style={{ fontSize: 13, color: "var(--text-2)", textAlign: "center", lineHeight: 1.4, marginBottom: 4 }}>
        Пока это витрина: карточка живёт на твоём телефоне. Когда включим таблицы в бэкенде — уедет в облако.
      </div>
      <input value={title} onChange={function (e) { setTitle(e.target.value); }} placeholder={isPlace ? "Название места или события" : "Название курса"} style={F} />
      {!isPlace && <input value={partner} onChange={function (e) { setPartner(e.target.value); }} placeholder="Кто ведёт" style={F} />}
      {!isPlace && <input value={info} onChange={function (e) { setInfo(e.target.value); }} placeholder="Формат · длительность · старт" style={F} />}
      <input value={city} onChange={function (e) { setCity(e.target.value); }} placeholder="Город" style={F} />
      <input value={price} onChange={function (e) { setPrice(e.target.value); }} placeholder={isPlace ? "Цена в XP, например 2500" : "Цена, например 178 400 ₽"} style={F} />
      {typeof BosPhotoPickLive === "function" && (
        <div style={{ padding: "6px 0" }}>
          <BosPhotoPickLive round={false} preview={photo} label={photo ? "Другое фото" : "Добавить фото"}
            sub="Обрежем квадратом по центру" onDone={function (v) { setPhoto(("" + v).slice(4)); }} />
        </div>
      )}
      <button onClick={save} disabled={!title.trim()} className="tap"
        style={{ width: "100%", height: 50, borderRadius: 999, border: 0, cursor: "pointer", background: "var(--cta)",
          color: "var(--cta-ink)", fontSize: 17, fontWeight: 600, opacity: title.trim() ? 1 : 0.5 }}>Сохранить</button>
    </div>
  );
}

/* ── ВИТРИННАЯ КАРТОЧКА ПОДРОБНО. Ни кнопки «купить», ни брони: этих механик в бэкенде
      нет, и делать вид, что они работают, нельзя. Показываем то, что знаем, и честно
      говорим, чего пока нет. ── */
function FigShowcaseDetailSheetLive({ item, kind }) {
  const { close } = useSheet();
  const it = item || {};
  const isPlace = kind === "place";
  const photo = (it.photos && it.photos[0]) || it.photo || null;
  return (
    <div style={{ padding: "2px 0 10px", color: "var(--text)" }}>
      <div style={{ margin: "0 16px", height: 180, borderRadius: 20, overflow: "hidden", display: "grid", placeItems: "center",
        background: photo ? ("url(" + JSON.stringify(photo) + ") center/cover no-repeat") : "var(--surface-3)" }}>
        {!photo && <span style={{ fontSize: 46, lineHeight: 1 }}>{it.emoji || (isPlace ? "📍" : "🎓")}</span>}
      </div>
      <div style={{ padding: "14px 16px 0", display: "grid", gap: 6 }}>
        <div style={{ fontSize: 22, fontWeight: 700, lineHeight: "28px", letterSpacing: "-0.26px" }}>{it.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <FigRating rate={it.rate} count={it.reviews} />
          {it.city && <span style={{ fontSize: 15, color: "var(--text-2)" }}>{(it.rate != null ? "· " : "") + it.city}</span>}
        </div>
        {it.info && <div style={{ fontSize: 15, lineHeight: "20px", color: "var(--text-2)" }}>{it.info}</div>}
        {it.partner && <div style={{ fontSize: 15, lineHeight: "20px", color: "var(--text-2)" }}>{"Ведёт: " + it.partner}</div>}
        {it.about && <div style={{ fontSize: 15, lineHeight: "21px", color: "var(--text)", marginTop: 4 }}>{it.about}</div>}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: 6 }}>
          {it.priceXP != null && <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.26px" }}>{bosNumSpace(it.priceXP) + " XP"}</span>}
          {it.price && <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.26px", color: "var(--accent)" }}>{it.price}</span>}
          {it.oldXP != null && <span style={{ fontSize: 15, color: "var(--text-2)", textDecoration: "line-through" }}>{bosNumSpace(it.oldXP) + " XP"}</span>}
          {it.oldPrice && <span style={{ fontSize: 15, color: "var(--text-2)", textDecoration: "line-through" }}>{it.oldPrice}</span>}
        </div>
        {it.monthly && <div style={{ fontSize: 15, color: "var(--text-2)" }}>{it.monthly}</div>}
        <div style={{ marginTop: 10, padding: "12px 14px", borderRadius: 14, background: "var(--surface-3)",
          fontSize: 13, lineHeight: "18px", color: "var(--text-2)" }}>
          {isPlace
            ? "Витрина по макету. Запись и списание XP включим, когда появятся места в бэкенде."
            : "Витрина по макету. Оплаты пока нет — курс здесь для наглядности."}
        </div>
        <button onClick={close} className="tap" style={{ width: "100%", height: 50, marginTop: 12, borderRadius: 999, border: 0,
          cursor: "pointer", background: "var(--cta)", color: "var(--cta-ink)", fontSize: 17, fontWeight: 600 }}>Понятно</button>
      </div>
    </div>
  );
}

/* Число на колокольчике — РЕАЛЬНЫЕ события того же сборщика, что рисует экран
   «Уведомления»: заявки в твои группы, кто вступил, кого приняли, приглашения, напарники.
   Нет облака — нет числа (а не ноль-заглушка и не выдуманная тройка из макета). */
function useFigNotifCount(app) {
  var [n, setN] = React.useState(0);
  React.useEffect(function () {
    var on = true;
    if (!(window.bosCloud && window.bosCloud.enabled && window.bosCloud.enabled()) || typeof bosNotifCollectLive !== "function") return;
    bosNotifCollectLive(app).then(function (d) {
      if (!on || !d) return;
      var c = (d.requests || []).length + (d.joined || []).length + (d.accepted || []).length
            + (d.invited || []).length + (d.buddies || []).length;
      setN(c);
    }).catch(function () {});
    return function () { on = false; };
  }, []);
  return n;
}

/* ── КОМНАТА «ГРУППЫ» (кадр «Группы» 1062:36319): Мои группы строками + сетка каталога
      «Вам может понравиться» карточками 176×298 r26 (обложка 176, имя/рубрика, «Вступить»). ── */
function FigCatalogGroupCard({ item, joined, requested, onOpen, onJoin }) {
  var g = item || {};
  var a = "" + (g.avatar || "");
  var cover = a.indexOf("url:") === 0
    ? { background: "url(" + JSON.stringify(a.slice(4)) + ") center/cover no-repeat" }
    : (function () { var t = (typeof figGroupTint === "function") ? figGroupTint(g.name) : ["#7FB3F2", "#9BD4A8"]; return { background: "linear-gradient(150deg," + t[0] + "," + t[1] + ")" }; })();
  return (
    <div style={{ borderRadius: 26, background: "var(--surface)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <button onClick={onOpen} style={{ border: 0, padding: 0, cursor: "pointer", height: 150, display: "grid", placeItems: "center", ...cover }}>
        {a.indexOf("url:") !== 0 && <span style={{ fontSize: 56, lineHeight: 1 }}>{a.indexOf("emoji:") === 0 ? a.slice(6) : "👥"}</span>}
      </button>
      <button onClick={onOpen} style={{ border: 0, background: "transparent", textAlign: "left", cursor: "pointer", padding: "8px 10px 4px", display: "grid", color: "var(--text)" }}>
        <span style={{ fontSize: 17, lineHeight: "22px", letterSpacing: "-0.43px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
        <span style={{ fontSize: 15, lineHeight: "20px", letterSpacing: "-0.23px", color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {g.category || (g.membersN ? figPlural(g.membersN, "участник", "участника", "участников") : "Открытая группа")}
        </span>
      </button>
      <div style={{ padding: "0 10px 10px", marginTop: "auto" }}>
        <FigPillButton onClick={joined ? onOpen : onJoin} disabled={requested}>
          {joined ? "Открыть" : requested ? "Заявка отправлена" : "Вступить"}
        </FigPillButton>
      </div>
    </div>
  );
}

/* Шторка «Фильтры» каталога (кадр «Фильтры» 477): сортировка — настоящая, по данным
   каталога; категории и местоположение честно ждут teams.category/city в бэкенде. */
function FigGroupsFilterSheetLive({ sort, onSort }) {
  const { close } = useSheet();
  const Row = function (p) {
    return (
      <button onClick={function () { onSort(p.id); close(); if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } }}
        className="tap" style={{ width: "100%", border: 0, background: "transparent", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10, padding: "0 14px", minHeight: 52, textAlign: "left",
          color: "var(--text)", borderTop: p.first ? 0 : "0.5px solid var(--line-2)" }}>
        <span style={{ flex: 1, fontSize: 17, lineHeight: "22px", letterSpacing: "-0.43px" }}>{p.label}</span>
        {sort === p.id && <I.Check size={17} strokeWidth={2.6} color="var(--accent)" />}
      </button>
    );
  };
  return (
    <div style={{ padding: "6px 16px 12px", color: "var(--text)" }}>
      <div style={{ fontSize: 19, fontWeight: 700, textAlign: "center", marginBottom: 10 }}>Фильтры</div>
      <div style={{ fontSize: 13, fontWeight: 590, color: "var(--text-2)", padding: "0 2px 6px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Сортировка</div>
      <div style={{ borderRadius: 18, background: "var(--surface-2, var(--surface-3))", overflow: "hidden" }}>
        <Row first id="new" label="Сначала новые" />
        <Row id="big" label="Сначала большие" />
        <Row id="name" label="По алфавиту" />
      </div>
      <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 14, background: "var(--surface-3)", fontSize: 13, lineHeight: "18px", color: "var(--text-2)" }}>
        Категории и местоположение появятся, когда группы получат рубрику и город в бэкенде.
      </div>
    </div>
  );
}

function FigGroupsRoomLive({ app, navigate, isDark, query }) {
  const { open: openSheet } = (typeof useSheet === "function") ? useSheet() : { open: null };
  const [sort, setSort] = React.useState("new");
  const teams = (app && app.teams) || [];
  const levels = useFigTeamLevels(teams);
  const [cloudList, setCloudList] = React.useState(null);
  const [asked, setAsked] = React.useState({});
  const _live = !!(window.bosCloud && window.bosCloud.enabled && window.bosCloud.enabled());
  React.useEffect(function () {
    var on = true;
    if (!_live || !window.bosCloud.discoverTeams) { setCloudList([]); return; }
    window.bosCloud.discoverTeams().then(function (r) { if (on) setCloudList(Array.isArray(r) ? r : []); }).catch(function () { if (on) setCloudList([]); });
    return function () { on = false; };
  }, [_live]);

  const q = ("" + (query || "")).trim().toLowerCase();
  const myIds = {}; teams.forEach(function (t) { if (t.cloudId) myIds[t.cloudId] = true; });
  const mine = teams.filter(function (t) { return !q || ("" + t.name).toLowerCase().indexOf(q) >= 0; });
  const others = (cloudList || []).filter(function (t) { return !myIds[t.id] && (!q || ("" + t.name).toLowerCase().indexOf(q) >= 0); })
    .slice().sort(function (a, b) {
      if (sort === "big") return (((b.team_members || [])[0] || {}).count || 0) - (((a.team_members || [])[0] || {}).count || 0);
      if (sort === "name") return String(a.name).localeCompare(String(b.name), "ru");
      return String(b.created_at || "").localeCompare(String(a.created_at || ""));
    });

  const dress = function (t) {
    var L = levels[t.cloudId] || null;
    return { key: t.cloudId || t._id, team: t, name: t.name,
      avatar: (t.emblem && ("" + t.emblem).indexOf("url:") === 0) ? t.emblem : (t.emblem ? "emoji:" + t.emblem : null),
      category: t.category || (t.vis === "public" ? "Открытая группа" : "Приватная группа"),
      level: L ? L.level : null, lvlPct: L ? L.pct : 0 };
  };
  const join = function (t) {
    if (!window.bosCloud.requestJoin) return;
    window.bosCloud.requestJoin(t.id).then(function (res) {
      if (res && res.pending) { setAsked(function (o) { var n = Object.assign({}, o); n[t.id] = true; return n; }); if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} } }
      else if (res) navigate("team-detail", { team: { cloudId: t.id, name: t.name, emblem: t.emblem, vis: t.vis, joined: true, members: [] }, from: "community" });
    }).catch(function () {});
  };

  return (
    <div className="fig-swap">
      {mine.length > 0 && (
        <React.Fragment>
          <FigSectionHead title="Мои группы" sub={figPlural(mine.length, "группа", "группы", "групп")} />
          <div style={{ padding: "0 16px 4px" }}>
            <FigCard>
              {mine.map(function (t, i) {
                var g = dress(t);
                return <FigGroupRow key={g.key} group={g} first={i === 0}
                  onOpen={function () { navigate("team-detail", { team: t, from: "community" }); }}
                  onChat={function () { navigate("team-detail", { team: t, from: "community", tab: "chat" }); }}
                  onMenu={openSheet ? function () { openSheet(<FigGroupMenuSheetLive team={t} />); } : null} />;
              })}
            </FigCard>
          </div>
        </React.Fragment>
      )}
      {mine.length === 0 && !q && (
        <FigEmpty title="Групп пока нет" text="Вступи в группу из каталога ниже или собери свою через «+»." />
      )}

      <FigSectionHead title="Вам может понравиться"
        sub={cloudList === null ? null : (others.length ? figPlural(others.length, "группа", "группы", "групп") : null)}
        action={sort === "new" ? "Новые" : sort === "big" ? "Большие" : "А-Я"}
        onAction={openSheet ? function () { openSheet(<FigGroupsFilterSheetLive sort={sort} onSort={setSort} />); } : null} />
      {cloudList === null ? (
        <div style={{ padding: "0 16px", fontSize: 15, color: "var(--text-2)" }}>Загружаю каталог…</div>
      ) : others.length === 0 ? (
        <div style={{ padding: "0 16px" }}>
          <div style={{ borderRadius: 24, background: "var(--surface)", padding: "18px 16px", fontSize: 15, lineHeight: "20px", color: "var(--text-2)" }}>
            {q ? "По запросу ничего не нашлось." : "Открытых групп пока нет — собери первую."}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 16px" }}>
          {others.map(function (t) {
            return <FigCatalogGroupCard key={t.id}
              item={{ name: t.name, avatar: t.emblem ? ("" + t.emblem).indexOf("url:") === 0 ? t.emblem : "emoji:" + t.emblem : null,
                membersN: (t.team_members && t.team_members[0] && t.team_members[0].count) || null }}
              requested={!!asked[t.id]}
              onOpen={function () { navigate("team-detail", { team: { cloudId: t.id, name: t.name, emblem: t.emblem, vis: t.vis, joined: false, members: [] }, from: "community" }); }}
              onJoin={function () { join(t); }} />;
          })}
        </div>
      )}
    </div>
  );
}

/* ── «ЛЮБИМЫЕ ГРУППЫ» — отдельная страница (кадр 654:17039): Топ-5 по активности лентой
      столбиков 116 + «В избранном» строками. Топ считается по НАСТОЯЩЕЙ активности —
      XP группы (bos_team_xp), а не порядком добавления. ── */
function FigFavoritesRoomLive() {
  const { navigate, back } = useNav();
  const app = (typeof useApp === "function") ? useApp() : null;
  const [sort, setSort] = React.useState("act");   // act = по активности (XP), name = по имени
  const teams = (app && app.teams) || [];
  const levels = useFigTeamLevels(teams);
  const favs = teams.filter(function (t) {
    var k = t.cloudId || t._id || t.id;
    try { return k && localStorage.getItem("bos:favteam:" + k) === "1"; } catch (e) { return false; }
  });
  const dress = function (t) {
    var L = levels[t.cloudId] || null;
    return { key: t.cloudId || t._id, team: t, name: t.name,
      avatar: (t.emblem && ("" + t.emblem).indexOf("url:") === 0) ? t.emblem : (t.emblem ? "emoji:" + t.emblem : null),
      category: t.category || (t.vis === "public" ? "Открытая группа" : "Приватная группа"),
      level: L ? L.level : null, lvlPct: L ? L.pct : 0 };
  };
  // Топ по уровню группы (реальная активность в XP).
  const top = favs.slice().sort(function (a, b) {
    var la = (levels[a.cloudId] || {}).level || 0, lb = (levels[b.cloudId] || {}).level || 0;
    return lb - la;
  }).slice(0, 5);
  const glass = { background: "rgba(153,153,153,0.17)", WebkitBackdropFilter: "blur(30px) saturate(1.8)", backdropFilter: "blur(30px) saturate(1.8)" };
  return (
    <div className="page-in" style={{ padding: "0 0 24px" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "0 16px", height: 44 }}>
        <button onClick={back} className="tap" aria-label="Назад"
          style={{ ...glass, width: 44, height: 44, borderRadius: 999, border: 0, display: "grid", placeItems: "center", cursor: "pointer", color: "var(--text)" }}>
          <I.ChevronRight size={19} strokeWidth={2.6} style={{ transform: "rotate(180deg)" }} />
        </button>
      </div>
      <div style={{ padding: "10px 16px 0" }}>
        <div style={{ fontSize: 34, fontWeight: 700, lineHeight: "41px", letterSpacing: "0.4px", color: "var(--text)" }}>Любимые группы</div>
        <div style={{ fontSize: 15, fontWeight: 590, lineHeight: "20px", color: "#8A8A8A" }}>{figPlural(favs.length, "группа", "группы", "групп")}</div>
      </div>
      {favs.length === 0 ? (
        <div style={{ padding: "16px 16px 0" }}>
          <FigEmpty title="Избранного пока нет" text="Отметь группу звёздочкой в её меню — и она поселится здесь."
            action="К группам" onAction={function () { navigate("community", { from: "favorites" }); }} />
        </div>
      ) : (
        <React.Fragment>
          <FigSectionHead title="Топ 5 по активности" sub={figPlural(top.length, "группа", "группы", "групп")} />
          <FigRail pad={12} gap={0}>
            {top.map(function (t, i) {
              return <FigFavGroup key={t.cloudId || t._id} group={dress(t)} rank={i + 1}
                onOpen={function () { navigate("team-detail", { team: t, from: "favorites" }); }} />;
            })}
          </FigRail>
          <FigSectionHead title="В избранном" sub={figPlural(favs.length, "группа", "группы", "групп")}
            action={sort === "act" ? "По активности" : "По имени"}
            onAction={function () { setSort(sort === "act" ? "name" : "act"); if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } }} />
          <div style={{ padding: "0 16px" }}>
            <FigCard>
              {favs.slice().sort(function (a, b) {
                if (sort === "name") return String(a.name).localeCompare(String(b.name), "ru");
                return (((levels[b.cloudId] || {}).level) || 0) - (((levels[a.cloudId] || {}).level) || 0);
              }).map(function (t, i) {
                return <FigGroupRow key={t.cloudId || t._id} group={dress(t)} first={i === 0}
                  onOpen={function () { navigate("team-detail", { team: t, from: "favorites" }); }}
                  onChat={function () { navigate("team-detail", { team: t, from: "favorites", tab: "chat" }); }} />;
              })}
            </FigCard>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

/* ── РЕЗУЛЬТАТЫ ПОИСКА (кадр «Все / Запрос»): разделы Группы · Люди · Места и события ·
      Курсы теми же атомами, что и комнаты. Группы ищутся в облаке (searchTeams) и среди
      своих; люди — среди людей твоих групп; места/курсы — по витрине. ── */
function FigSearchResultsLive({ app, navigate, isDark, query, seg }) {
  const q = ("" + (query || "")).trim().toLowerCase();
  const people = useFigPeople(app);
  const teams = (app && app.teams) || [];
  const [cloudHits, setCloudHits] = React.useState(null);
  const [asked, setAsked] = React.useState({});
  const { open: openSheet } = (typeof useSheet === "function") ? useSheet() : { open: null };
  React.useEffect(function () {
    var on = true;
    if (!q || !(window.bosCloud && window.bosCloud.enabled && window.bosCloud.enabled() && window.bosCloud.searchTeams)) { setCloudHits([]); return; }
    var t = setTimeout(function () {
      window.bosCloud.searchTeams(q).then(function (r) { if (on) setCloudHits(Array.isArray(r) ? r : []); }).catch(function () { if (on) setCloudHits([]); });
    }, 250);
    return function () { on = false; clearTimeout(t); };
  }, [q]);

  const myIds = {}; teams.forEach(function (t) { if (t.cloudId) myIds[t.cloudId] = true; });
  const gMine = teams.filter(function (t) { return ("" + t.name).toLowerCase().indexOf(q) >= 0; });
  const gCloud = (cloudHits || []).filter(function (t) { return !myIds[t.id]; });
  const pHits = people.filter(function (p) { return ("" + p.name).toLowerCase().indexOf(q) >= 0; });
  const places = figShowcaseRead("places", FIG_SHOWCASE_PLACES).filter(function (x) { return ("" + x.title + (x.city || "")).toLowerCase().indexOf(q) >= 0; });
  const courses = figShowcaseRead("courses", FIG_SHOWCASE_COURSES).filter(function (x) { return ("" + x.title + (x.partner || "")).toLowerCase().indexOf(q) >= 0; });
  const openShowcase = function (item, kind) { if (openSheet) openSheet(<FigShowcaseDetailSheetLive item={item} kind={kind} />); };
  const wantG = seg === "all" || seg === "circles";
  const wantP = seg === "all" || seg === "people";
  const wantPl = seg === "all" || seg === "places";
  const wantC = seg === "all" || seg === "courses";
  const nothing = (!wantG || (!gMine.length && !gCloud.length)) && (!wantP || !pHits.length) && (!wantPl || !places.length) && (!wantC || !courses.length);

  const join = function (t) {
    if (!window.bosCloud.requestJoin) return;
    window.bosCloud.requestJoin(t.id).then(function (res) {
      if (res && res.pending) setAsked(function (o) { var n = Object.assign({}, o); n[t.id] = true; return n; });
      else if (res) navigate("team-detail", { team: { cloudId: t.id, name: t.name, emblem: t.emblem, vis: t.vis, joined: true, members: [] }, from: "community" });
    }).catch(function () {});
  };

  return (
    <div className="fig-swap" style={{ paddingTop: 4 }}>
      {wantG && (gMine.length > 0 || gCloud.length > 0) && (
        <React.Fragment>
          <FigSectionHead title="Группы" sub={figPlural(gMine.length + gCloud.length, "группа", "группы", "групп")} />
          <div style={{ padding: "0 16px 4px" }}>
            <FigCard>
              {gMine.map(function (t, i) {
                return <FigGroupRow key={"m" + (t.cloudId || t._id)} first={i === 0}
                  group={{ name: t.name, avatar: t.emblem ? (("" + t.emblem).indexOf("url:") === 0 ? t.emblem : "emoji:" + t.emblem) : null,
                    category: "Твоя группа" }}
                  onOpen={function () { navigate("team-detail", { team: t, from: "community" }); }} />;
              })}
              {gCloud.map(function (t, i) {
                return (
                  <div key={"c" + t.id} style={{ position: "relative" }}>
                    <FigGroupRow first={gMine.length === 0 && i === 0}
                      group={{ name: t.name, avatar: t.emblem ? (("" + t.emblem).indexOf("url:") === 0 ? t.emblem : "emoji:" + t.emblem) : null,
                        category: "Открытая группа" }}
                      onOpen={function () { navigate("team-detail", { team: { cloudId: t.id, name: t.name, emblem: t.emblem, vis: t.vis, joined: false, members: [] }, from: "community" }); }}
                      onMenu={null} />
                    <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)" }}>
                      <button onClick={function () { join(t); }} disabled={!!asked[t.id]} className="tap"
                        style={{ height: 34, padding: "0 14px", borderRadius: 999, border: 0, cursor: asked[t.id] ? "default" : "pointer",
                          background: "var(--surface-3)", color: "var(--text)", fontSize: 15, opacity: asked[t.id] ? 0.6 : 1 }}>
                        {asked[t.id] ? "Заявка отправлена" : "Вступить"}
                      </button>
                    </span>
                  </div>
                );
              })}
            </FigCard>
          </div>
        </React.Fragment>
      )}
      {wantP && pHits.length > 0 && (
        <React.Fragment>
          <FigSectionHead title="Люди" sub={figPlural(pHits.length, "человек", "человека", "человек")} />
          <div style={{ padding: "0 16px 4px" }}>
            <FigCard>
              {pHits.map(function (p, i) {
                return <FigFriendRow key={p.id} first={i === 0}
                  person={{ name: p.name, avatar: p.avatar, level: p.level, lvlPct: p.lvlPct,
                    status: p.teams && p.teams.length ? ("вместе в «" + p.teams[0].name + "»") : null }}
                  onOpen={function () { navigate("person-profile", { person: { user_id: p.id, name: p.name, avatar: p.avatar, level: p.level }, from: "community" }); }} />;
              })}
            </FigCard>
          </div>
        </React.Fragment>
      )}
      {wantPl && places.length > 0 && (
        <React.Fragment>
          <FigSectionHead title="Места и события" />
          <FigRail>
            {places.map(function (p) {
              return <FigPlaceCard key={p.id} item={p} onOpen={function () { openShowcase(p, "place"); }} onAct={function () { openShowcase(p, "place"); }} />;
            })}
          </FigRail>
        </React.Fragment>
      )}
      {wantC && courses.length > 0 && (
        <React.Fragment>
          <FigSectionHead title="Курсы" />
          <FigRail>
            {courses.map(function (c) {
              return <FigCourseCard key={c.id} item={c} onOpen={function () { openShowcase(c, "course"); }} onAct={function () { openShowcase(c, "course"); }} />;
            })}
          </FigRail>
        </React.Fragment>
      )}
      {nothing && cloudHits !== null && (
        <FigEmpty title="Ничего не найдено" text="Попробуй другое слово — или собери свою группу через «+»." />
      )}
    </div>
  );
}

/* ── «…» У СТРОКИ ГРУППЫ (кадр «Группа Меню» — те же двери, что в комнате): В избранное ·
      Уведомления · Поделиться · Выйти из группы. Переиспользует настоящие шторки комнаты. ── */
function FigGroupMenuSheetLive({ team, onChanged }) {
  const { open: openSheet, close } = useSheet();
  const app = (typeof useApp === "function") ? useApp() : null;
  // Шторка может жить вне NavCtx (стенды) — не падаем, просто без навигации.
  const _nav = (typeof useNav === "function" ? useNav() : null) || {};
  const navigate = _nav.navigate || function () {};
  const k = team.cloudId || team._id || team.id;
  const [fav, setFav] = React.useState(function () { try { return localStorage.getItem("bos:favteam:" + k) === "1"; } catch (e) { return false; } });
  const flipFav = function () {
    var next = !fav; setFav(next);
    try { localStorage.setItem("bos:favteam:" + k, next ? "1" : "0"); } catch (e) {}
    if (window.tgHaptic) { try { window.tgHaptic(next ? "success" : "light"); } catch (e) {} }
    onChanged && onChanged();
  };
  const Row = function (p) {
    return (
      <button onClick={p.go} className="tap" style={{ width: "100%", border: 0, background: "transparent", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 12, padding: "0 14px", minHeight: 52, textAlign: "left",
        color: p.red ? "var(--accent-red)" : "var(--text)", borderTop: p.first ? 0 : "0.5px solid var(--line-2)" }}>
        <span style={{ width: 26, display: "grid", placeItems: "center" }}>{p.icon}</span>
        <span style={{ flex: 1, fontSize: 17, lineHeight: "22px", letterSpacing: "-0.43px" }}>{p.label}</span>
      </button>
    );
  };
  return (
    <div style={{ padding: "6px 16px 12px", color: "var(--text)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 2px 12px" }}>
        {typeof FigGroupFace === "function"
          ? <FigGroupFace avatar={team.emblem && ("" + team.emblem).indexOf("url:") === 0 ? team.emblem : (team.emblem ? "emoji:" + team.emblem : null)} name={team.name} size={40} />
          : null}
        <span style={{ flex: 1, minWidth: 0, fontSize: 17, fontWeight: 590, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{team.name}</span>
      </div>
      <div style={{ borderRadius: 18, background: "var(--surface-2, var(--surface-3))", overflow: "hidden" }}>
        <Row first icon={<I.Star size={19} strokeWidth={2} color={fav ? "var(--accent-orange)" : "currentColor"} />}
          label={fav ? "Убрать из избранного" : "В избранное"} go={flipFav} />
        {typeof CircleNotifySheetLive === "function" && (
          <Row icon={<I.Bell size={19} strokeWidth={2} />} label="Уведомления"
            go={function () { openSheet(<CircleNotifySheetLive team={team} />); }} />
        )}
        {typeof TeamShareSheetLive === "function" && (
          <Row icon={<I.Share size={19} strokeWidth={2} />} label="Поделиться"
            go={function () { openSheet(<TeamShareSheetLive team={team} />); }} />
        )}
      </div>
      <div style={{ borderRadius: 18, background: "var(--surface-2, var(--surface-3))", overflow: "hidden", marginTop: 10 }}>
        {typeof bosExitFlowLive === "function" && (
          <Row first red icon={<I.Logout size={19} strokeWidth={2} />} label="Выйти из группы"
            go={function () { bosExitFlowLive({ app: app, team: team, isOwner: false, navigate: navigate, openSheet: openSheet, returnTo: "community" }); }} />
        )}
      </div>
    </div>
  );
}

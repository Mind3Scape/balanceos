/* HOME — LIVE-only fork of HomeScreen (real Telegram user, app.mode === "live"
   is ALWAYS true here). The demo/fresh branches are stripped: no segmented
   Привычки/Цели toggle, no demo balance-wheel / demo stat strip / demo MoodWidget,
   no fresh «Что дальше?» banner. Everything else reuses the shared core/ toolkit
   (HeroOrbFace, HabitCheck, HabitRing, AvatarStack, bosPill* helpers) + the live
   forks in screens/live/shared_live.jsx (HomeHeroSwipeLive, MoodWidgetLive,
   ShareAppSheetLive, ShareHabitSheetLive) + framework (SwipeRow, BosOrbFace, I,
   hooks, the bos* helpers).

   The home is a CUSTOMIZABLE WIDGET BOARD: every block under the greeting is a widget
   rendered through BosReorderList — long-press → jiggle → drag to reorder (order saved
   in widgets.order, which already syncs to the cloud), a glass «−» badge removes a widget,
   and a «+» tile opens the «available widgets» sheet to add one back. Visibility is a single
   per-id flag (widgets[id] !== false); removing just flips it to false and the widget
   reappears in the «+» sheet — nothing is ever deleted. The ONLY new top-level declaration
   in this file is `function HomeLive`. */
/* Один упавший виджет НЕ роняет всю главную (день наплыва): тихо схлопывается. */
class WidgetBoundaryLive extends React.Component {
  constructor(p) { super(p); this.state = { dead: false }; }
  static getDerivedStateFromError() { return { dead: true }; }
  componentDidCatch(e) { try { console.error("widget crash:", this.props.wid, e); } catch (e2) {} }
  render() { return this.state.dead ? null : this.props.children; }
}

/* «Быстрое добавление» — лента челленджей, ПЕРЕЕХАВШАЯ со страницы «Привычки» (слияние
   с главной): те же чипы CHALLENGE_STARTERS с XP-бонусом, тот же путь согласия
   (ChallengeIntroSheet → bosCommitChallenge). Горизонтальный скролл, уходит за край с
   маской — как жила наверху «Привычек». Виджет w:quick, снимается минусом/в галерее. */
// ОДИН чип челленджа — общий вид для главной И формы создания привычки (David 2026-07-10: «в форме
// челленджи должны быть в ТОМ ЖЕ стиле, что на главной — мы это уже разработали»). Стекло + SVG-глиф
// (bosPillGlyphLive) + матовая золотая XP-пилюля. onTap — свой у каждого места.
function bosQuickChipEl(c, isDark, onTap, i) {
  const chipText = isDark ? "var(--text)" : "var(--text-2)";
  return (
    <button key={c.key || i} type="button" className="tap" data-no-haptic onClick={onTap} style={{
      ...(typeof bosChipGlass === "function" ? bosChipGlass(isDark) : { background: "var(--surface-3)" }), borderRadius: 999, padding: "7px 9px 7px 11px", border: 0, flexShrink: 0,
      display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", cursor: "pointer",
      animation: "briefPop 0.4s cubic-bezier(0.22,0.9,0.3,1.2) both " + ((i || 0) * 0.03) + "s",
    }}>
      <span style={{ display: "inline-flex", flexShrink: 0 }}>{typeof bosPillGlyphLive === "function" ? bosPillGlyphLive(c, { size: 16, color: chipText }) : c.i}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: chipText }}>{c.t}</span>
      {c.kind === "together" && <I.Users size={12} color={chipText} style={{ opacity: 0.55, marginLeft: -2 }} />}
      <span style={{ fontSize: 10.5, fontWeight: 800, color: "#9a6800", background: "rgba(245,180,30,0.18)", borderRadius: 999, padding: "2px 6px", letterSpacing: "-0.2px", lineHeight: 1.3 }}>+{c.bonus} XP</span>
    </button>
  );
}

function HomeQuickStripLive({ isDark }) {
  const { navigate } = useNav();
  const { open: openSheet } = useSheet();
  const app = useApp();
  const list = (typeof CHALLENGE_STARTERS !== "undefined" && Array.isArray(CHALLENGE_STARTERS)) ? CHALLENGE_STARTERS : [];
  if (!list.length) return null;
  const start = (c) => {
    if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} }
    if (typeof ChallengeIntroSheet === "function" && typeof bosCommitChallenge === "function") {
      openSheet(<ChallengeIntroSheet c={c} dark={isDark} onStart={() => bosCommitChallenge(app, c, { navigate, openSheet })} />);
    }
  };
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", touchAction: "pan-x", padding: "2px 1px", margin: "0 -1px",
      WebkitMaskImage: "linear-gradient(90deg, #000 88%, transparent)", maskImage: "linear-gradient(90deg, #000 88%, transparent)" }}>
      {list.map((c, i) => bosQuickChipEl(c, isDark, () => start(c), i))}
    </div>
  );
}

// ── Клавиатура для ИНЛАЙН-поля «Дел» (David: поле в блоке, страница подъезжает к клаве, БЕЗ шторки).
// В этом webview #root {position:fixed} iOS ужимает под клаву → таб-бар (absolute bottom) ВСПЛЫВАЕТ
// над клавой и ПЕРЕКРЫВАЕТ подскролленное поле (David: «меню прилипает к клаве вместо задач»). Поэтому
// на фокусе: (1) ПРЯЧЕМ таб-бар (body.bos-kb-typing → CSS в mobile.css), (2) даём скролл-контейнеру
// запас снизу и двигаем страницу так, чтобы низ поля сел над клавой (высоту берём из visualViewport).
function bosKbFocus(e) {
  const input = e.target;
  document.body.classList.add("bos-kb-typing");
  let sc = input.parentElement;
  while (sc && sc !== document.body) {
    const oy = getComputedStyle(sc).overflowY;
    if (oy === "auto" || oy === "scroll") break;
    sc = sc.parentElement;
  }
  if (!sc || sc === document.body) sc = document.scrollingElement || document.documentElement;
  input._bosSc = sc;
  input._bosPad = sc.style.paddingBottom;
  sc.style.paddingBottom = "55vh"; // запас, чтобы странице было куда подъехать
  const vv = (typeof window !== "undefined") ? window.visualViewport : null;
  const adjust = () => {
    const r = input.getBoundingClientRect();
    const vTop = vv ? vv.offsetTop : 0;
    const vH = vv ? vv.height : window.innerHeight;
    // Цель = САМЫЙ НИЗ видимой зоны (у David resizes-content ужимает viewport до зоны над клавой,
    // значит её нижний край И ЕСТЬ верх клавиатуры). Целить в середину (×0.5) было ошибкой — уезжало
    // слишком высоко. Таб-бар спрятан (bos-kb-typing), так что поле садится ВПРИТЫК над клавой.
    const target = vTop + vH - 26; // −26 (не −12): низ КАРТОЧКИ (поле+паддинги ~13px) даёт зазор ~12px от клавы, как между блоками
    const delta = r.bottom - target;
    if (Math.abs(delta) > 2) sc.scrollTop += delta;
  };
  input._bosAdjust = adjust;
  if (vv) { vv.addEventListener("resize", adjust); vv.addEventListener("scroll", adjust); }
  input._bosTimers = [60, 220, 420, 650].map((ms) => setTimeout(adjust, ms));
}
function bosKbBlur(e) {
  const input = e.target;
  document.body.classList.remove("bos-kb-typing");
  const vv = (typeof window !== "undefined") ? window.visualViewport : null;
  if (vv && input._bosAdjust) { vv.removeEventListener("resize", input._bosAdjust); vv.removeEventListener("scroll", input._bosAdjust); }
  if (input._bosTimers) input._bosTimers.forEach(clearTimeout);
  if (input._bosSc) input._bosSc.style.paddingBottom = input._bosPad || "";
}

// ── Настройки списков «Дел» — iOS-шторка, открывается из «•••». Всё управление вкладками здесь:
// создать, переименовать, цвет, удалить. (David: настройки живут ТОЛЬКО на «•••», а не по тапу на чип.)
// НАДЁЖНОСТЬ: id списков теперь _uuid() (shell.jsx) → правка/удаление всегда бьют РОВНО один список,
// без дублей и без «всё удаляется». Удаление — с мягким подтверждением прямо в строке (без красного).
// Новый список создаётся ОДИН и сразу открывает поле имени для ввода (как «Новый список» в iOS).
function TaskListsSettingsLive({ isDark }) {
  const app = (typeof useApp === "function") ? useApp() : null;
  const lists = (app && Array.isArray(app.taskLists)) ? app.taskLists : [];
  const [colorFor, setColorFor] = React.useState(null);
  const [confirmDel, setConfirmDel] = React.useState(null);
  const [justAdded, setJustAdded] = React.useState(null);
  const nameRefs = React.useRef({});
  const PAL = ["#0a0a0a", "#007AFF", "#34C759", "#FF9500", "#AF52DE", "#FF2D55"];
  const subtle = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const hair = isDark ? "1px solid #2a2a2e" : "1px solid #ededf0";
  const glassEdge = isDark ? "inset 0 0.5px 0 rgba(255,255,255,0.06)" : "inset 0 0.5px 0 rgba(255,255,255,0.7)";

  // Только что созданный список: фокус + выделение имени, чтобы сразу набрать своё (шторка сама
  // поднимается над клавой — она absolute bottom, root ужимается под клавиатуру).
  React.useEffect(() => {
    if (!justAdded) return;
    const el = nameRefs.current[justAdded];
    if (el) { try { el.focus(); el.select(); el.scrollIntoView({ block: "nearest" }); } catch (e) {} }
    setJustAdded(null);
  }, [justAdded]);

  const addOne = () => {
    if (!app || !app.addTaskList) return;
    const nl = app.addTaskList("Новый список", PAL[lists.length % PAL.length]);
    setColorFor(null); setConfirmDel(null); setJustAdded(nl.id);
  };

  return (
    <div className="bos-sheet-scroll" style={{ padding: "2px 16px 8px", color: "var(--text)" }}>
      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px", padding: "2px 2px 3px" }}>Списки</div>
      <div style={{ fontSize: 12.5, color: "var(--text-4)", padding: "0 2px 15px", lineHeight: 1.4 }}>Вкладки над делами — по одной под каждую сторону жизни. Переименуй, поменяй цвет, удали.</div>

      <div style={{ borderRadius: 16, background: subtle, overflow: "hidden", boxShadow: glassEdge }}>
        {lists.map((l, i) => (
          <div key={l.id} style={{ borderTop: i === 0 ? "none" : hair }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px" }}>
              <button className="tap" aria-label="Цвет списка"
                onClick={() => { setConfirmDel(null); setColorFor(colorFor === l.id ? null : l.id); }}
                style={{ width: 25, height: 25, borderRadius: "50%", border: 0, background: l.color, flexShrink: 0, cursor: "pointer", boxShadow: "inset 0 1px 1.5px rgba(255,255,255,0.4), inset 0 0 0 0.5px rgba(0,0,0,0.2)" }} />
              <input ref={(el) => { if (el) nameRefs.current[l.id] = el; }}
                value={l.name} onChange={(e) => app.updateTaskList(l.id, { name: e.target.value })} placeholder="Название"
                onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                style={{ flex: 1, minWidth: 0, border: 0, outline: "none", fontFamily: "inherit", fontSize: 15.5, fontWeight: 600, letterSpacing: "-0.2px", color: "var(--text)", background: "transparent" }} />
              {lists.length > 1 && (
                <button className="tap" aria-label="Удалить список"
                  onClick={() => { setColorFor(null); setConfirmDel(confirmDel === l.id ? null : l.id); }}
                  style={{ border: 0, background: "transparent", color: confirmDel === l.id ? "var(--text-2)" : "var(--text-4)", cursor: "pointer", padding: 4, display: "grid", placeItems: "center", flexShrink: 0 }}><I.Trash size={17} /></button>
              )}
            </div>

            {colorFor === l.id && (
              <div style={{ display: "flex", gap: 12, padding: "1px 13px 13px 50px", flexWrap: "wrap" }}>
                {PAL.map((clr) => (
                  <button key={clr} className="tap" aria-label="Цвет" onClick={() => { app.updateTaskList(l.id, { color: clr }); setColorFor(null); }}
                    style={{ width: 27, height: 27, borderRadius: "50%", border: 0, background: clr, cursor: "pointer", display: "grid", placeItems: "center", boxShadow: "inset 0 1px 1.5px rgba(255,255,255,0.4), inset 0 0 0 0.5px rgba(0,0,0,0.2)" }}>
                    {l.color === clr ? <I.Check size={14} color="#fff" strokeWidth={3} /> : null}
                  </button>
                ))}
              </div>
            )}

            {confirmDel === l.id && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "3px 13px 13px 50px" }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--text-3)", lineHeight: 1.35 }}>
                  Удалить «{l.name.trim() || "список"}» с делами?
                </span>
                <button className="tap" onClick={() => setConfirmDel(null)}
                  style={{ border: 0, background: subtle, color: "var(--text-2)", fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, padding: "7px 13px", borderRadius: 999, cursor: "pointer", flexShrink: 0 }}>Отмена</button>
                <button className="tap" onClick={() => { app.removeTaskList(l.id); setConfirmDel(null); setColorFor(null); }}
                  style={{ border: 0, background: "#FF3B30", color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, padding: "7px 14px", borderRadius: 999, cursor: "pointer", flexShrink: 0 }}>Удалить</button>
              </div>
            )}
          </div>
        ))}
        {!lists.length && (
          <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-4)", padding: "18px 0" }}>Списков ещё нет — создай первый ↓</div>
        )}
      </div>

      <button className="tap" onClick={addOne}
        style={{ width: "100%", marginTop: 12, border: 0, fontFamily: "inherit", fontSize: 15.5, fontWeight: 600, padding: "13px", borderRadius: 16, cursor: "pointer", color: "var(--text)", background: subtle, boxShadow: glassEdge, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <I.Plus size={18} strokeWidth={2.5} /> Новый список
      </button>
    </div>
  );
}

// ── Виджет «Дела»: локальный todo с вкладками-списками. Верхний ряд = чипы-вкладки + «•••»
// (все настройки списков — в шторке TaskListsSettingsLive). Тап по чипу = просто переключить.
// «Добавить дело» — ИНЛАЙН-поле снизу; фокус прячет таб-бар и подвигает страницу к клаве (bosKbFocus). Разовые дела.
function TasksWidgetLive({ isDark, openSheet }) {
  const app = (typeof useApp === "function") ? useApp() : null;
  const lists = (app && Array.isArray(app.taskLists)) ? app.taskLists : [];
  const [activeId, setActiveId] = React.useState(null);
  const [taskText, setTaskText] = React.useState("");
  const PAL = ["#0a0a0a", "#007AFF", "#34C759", "#FF9500", "#AF52DE", "#FF2D55"];
  const L = lists.find((l) => l.id === activeId) || lists[0] || null;
  const tasks = L ? (L.tasks || []) : [];

  const subtle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
  const hair = isDark ? "1px solid #242427" : "1px solid #f2f2f4";
  const ckBorder = isDark ? "#3a3a3e" : "#d7d7db";
  const doneInk = isDark ? "#6a6a6e" : "#b6b6bb";
  const ib = { width: 30, height: 30, borderRadius: "50%", border: 0, background: subtle, color: "var(--text)", display: "grid", placeItems: "center", flexShrink: 0, cursor: "pointer" };
  const chip = { borderRadius: 999, padding: "7px 13px", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0, border: 0, cursor: "pointer", fontFamily: "inherit" };
  const ck = { width: 23, height: 23, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", cursor: "pointer", padding: 0, background: "transparent" };

  const openSettings = () => { if (openSheet) openSheet(<TaskListsSettingsLive isDark={isDark} />); };
  const commitTask = () => { const t = taskText.trim(); if (t && L && app && app.addTask) app.addTask(L.id, t); setTaskText(""); };

  return (
    <div style={{ padding: "12px 14px 10px", color: "var(--text)" }}>
      {/* верхний ряд: чипы-вкладки (слева, скролл) + «•••» настройки (справа) */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", gap: 7, overflowX: "auto", flex: 1, minWidth: 0, padding: "1px 0 3px" }}>
          {lists.length ? lists.map((list) => {
            const on = L && list.id === L.id;
            return (
              <button key={list.id} className="tap" onClick={() => setActiveId(list.id)}
                style={{ ...chip, background: on ? list.color : subtle, color: on ? "#fff" : "var(--text-2)" }}>
                {list.name}
              </button>
            );
          }) : (
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.3px", padding: "6px 2px" }}>Дела</span>
          )}
        </div>
        <button className="tap" aria-label="Настройки списков" onClick={openSettings} style={ib}><I.More size={17} /></button>
      </div>

      {!L ? (
        <div style={{ textAlign: "center", padding: "14px 0 10px" }}>
          <div style={{ fontSize: 13, color: "var(--text-4)", marginBottom: 11 }}>Пока нет списков</div>
          <button className="tap" onClick={() => { if (!app || !app.addTaskList) return; const nl = app.addTaskList("Сегодня", PAL[0]); setActiveId(nl.id); }}
            style={{ border: 0, fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, padding: "9px 16px", borderRadius: 999, cursor: "pointer", color: "#fff", background: "#0a0a0a", display: "inline-flex", alignItems: "center", gap: 7 }}>
            <I.Plus size={15} strokeWidth={2.5} /> Создать список
          </button>
        </div>
      ) : (
        <>
          {tasks.length > 0 && (
            <div style={{ fontSize: 11.5, color: "var(--text-4)", fontWeight: 600, padding: "8px 3px 2px", letterSpacing: "0.2px" }}>
              {tasks.filter((t) => t.done).length} из {tasks.length} · {L.name.toLowerCase()}
            </div>
          )}
          <div>
            {tasks.slice().sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0)).map((t, i) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 2px", borderTop: i === 0 ? "none" : hair }}>
                <button className="tap" aria-label={t.done ? "Снять отметку" : "Отметить"} onClick={() => app.toggleTask(L.id, t.id)}
                  style={{ ...ck, ...(t.done
                    ? { background: BOS_TILE_SHEEN + ", " + bosCanonColor(L.color), boxShadow: bosTileGlass(isDark) }
                    : { background: BOS_TILE_SHEEN + ", " + (isDark ? "rgba(255,255,255,0.08)" : "var(--surface-3)"), boxShadow: bosTileGlass(isDark) }) }}>
                  {t.done ? <I.Check size={13} color={(typeof bosLum === "function" && bosLum(bosCanonColor(L.color)) > 0.62) ? "#141416" : "#fff"} /> : null}
                </button>
                <div style={{ flex: 1, fontSize: 14.5, letterSpacing: "-0.1px", color: t.done ? doneInk : "var(--text)", textDecoration: t.done ? "line-through" : "none" }}>{t.text}</div>
                <button className="tap" aria-label="Убрать дело" onClick={() => app.removeTask(L.id, t.id)}
                  style={{ border: 0, background: "transparent", color: "var(--text-4)", cursor: "pointer", padding: "2px 4px", opacity: 0.5, display: "grid", placeItems: "center" }}><I.X size={14} /></button>
              </div>
            ))}
          </div>
          {/* ИНЛАЙН-поле: фокус прячет таб-бар и подвигает страницу так, чтобы поле село над клавой (David) */}
          <label style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 2px 3px", marginTop: tasks.length ? 0 : 2, borderTop: tasks.length ? hair : "none", cursor: "text" }}>
            <span style={{ ...ck, border: "1.7px dashed " + ckBorder, color: "var(--text-4)" }}><I.Plus size={13} /></span>
            <input value={taskText} onChange={(e) => setTaskText(e.target.value)} onFocus={bosKbFocus}
              onBlur={(e) => { commitTask(); bosKbBlur(e); }}
              onKeyDown={(e) => { if (e.key === "Enter") { commitTask(); var _el = e.target; setTimeout(function () { if (_el._bosAdjust) _el._bosAdjust(); }, 50); } if (e.key === "Escape") { setTaskText(""); e.target.blur(); } }}
              placeholder="Добавить дело…"
              style={{ flex: 1, border: 0, outline: "none", fontFamily: "inherit", fontSize: 14.5, color: "var(--text)", background: "transparent" }} />
          </label>
          {/* Плавающая стеклянная «Готово» у клавиатуры (David: круглая кнопка-галочка справа, прилипшая
              к клаве). Портал в .page-stack (absolute inset:0): в fixed-root webview iOS ужимает root под
              клаву → кружок встаёт НАД клавиатурой, как таб-бар. Виден только пока печатаешь дело
              (body.bos-kb-typing, CSS в mobile.css). Тап → preventDefault держит фокус до нашего blur →
              поле теряет фокус → onBlur коммитит набранное и клава прячется. */}
          {typeof ReactDOM !== "undefined" && ReactDOM.createPortal && ReactDOM.createPortal(
            <button className="bos-kbdone" aria-label="Готово" data-haptic="selection"
              onPointerDown={(e) => { e.preventDefault(); const el = document.activeElement; if (el && typeof el.blur === "function") el.blur(); }}>
              <I.Check size={22} strokeWidth={2.6} />
            </button>,
            (typeof document !== "undefined" && document.querySelector(".page-stack")) || document.body
          )}
        </>
      )}
    </div>
  );
}

/* МЕНЮ ПО ДОЛГОМУ НАЖАТИЮ на карточку доски (David 2026-07-11, «вариант Г» + iOS-референс Notes):
   зажал карточку → фон в тень, карточка приподнимается (превью на её месте), всплывает аккуратное
   меню, а не резкая тряска. «Всё в одном»: действия карточки (Поделиться · Переставить · Убрать) +
   блок «Доска» (Добавить виджет · Оформление). «Переставить» уже запускает тряску (enterReorder).
   Заякорено по rect карточки (приходит из BosReorderGrid.onLongPress). Тема/стекло сюда НЕ входят —
   они уехали в Я → Настройки (§14). Портал, как CreateMenuLive/CardStyleMenuLive. */
function HomeCardMenuLive({ state, onClose, isDark, preview, kind, onShare, onReorder, onRemove, onAddWidget, onStyle }) {
  const menuRef = React.useRef(null);
  const [pos, setPos] = React.useState(null);
  React.useLayoutEffect(() => {
    if (!state || !state.rect) { setPos(null); return; }
    const r = state.rect;
    const vw = window.innerWidth, vh = window.innerHeight, pad = 12, gap = 10, menuW = 246;
    const mh = (menuRef.current && menuRef.current.offsetHeight) || 300;
    let safeB = 0; try { safeB = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--tg-bottom-inset")) || 0; } catch (e) {}
    let previewTop = r.top, menuTop = r.bottom + gap;
    const limit = vh - pad - safeB;
    if (menuTop + mh > limit) {
      const above = r.top - gap - mh;
      if (above >= pad) { menuTop = above; }
      else { const shift = (menuTop + mh) - limit; previewTop = Math.max(pad, r.top - shift); menuTop = Math.min(limit - mh, previewTop + r.height + gap); }
    }
    let menuLeft = r.left;
    if (menuLeft + menuW > vw - pad) menuLeft = vw - pad - menuW;
    if (menuLeft < pad) menuLeft = pad;
    setPos({ previewTop, previewLeft: r.left, previewW: r.width, menuTop, menuLeft });
  }, [state]);
  if (!state) return null;
  const ink = isDark ? "#f2f2f5" : "#0a0a0a";
  const act = (fn) => () => { if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } onClose(); if (fn) setTimeout(fn, 0); };
  const line = "0.5px solid " + (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)");
  const reorderIcon = (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/></svg>);
  const gridIcon = (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><path d="M17.25 14.6v4.8M14.85 17h4.8"/></svg>);
  const slidersIcon = (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2.2" fill={isDark ? "#1e1f24" : "#fbfbfd"}/><circle cx="15" cy="12" r="2.2" fill={isDark ? "#1e1f24" : "#fbfbfd"}/><circle cx="8" cy="18" r="2.2" fill={isDark ? "#1e1f24" : "#fbfbfd"}/></svg>);
  const Row = ({ label, icon, onClick, danger, first }) => (
    <button role="menuitem" data-haptic="selection" onClick={onClick} className="tap" style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "13px 16px", background: "transparent", border: 0, borderTop: first ? 0 : line, cursor: "pointer", fontSize: 16, fontWeight: 500, color: danger ? "#FF3B30" : ink, textAlign: "left" }}>
      <span>{label}</span>
      <span style={{ display: "grid", placeItems: "center", flexShrink: 0, color: danger ? "#FF3B30" : ink }}>{icon}</span>
    </button>
  );
  const frost = isDark ? "rgba(28,29,34,0.95)" : "rgba(252,252,254,0.95)";
  const hardDelete = (kind === "habit" || kind === "goal");
  return ReactDOM.createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 8200, background: "rgba(18,22,38,0.30)", WebkitBackdropFilter: "blur(4px)", backdropFilter: "blur(4px)", animation: "dimIn 0.18s ease both" }}>
      {/* Превью карточки на её месте — iOS «карточка приподнялась» (визуально, без событий). */}
      <div aria-hidden style={{ position: "fixed", left: pos ? pos.previewLeft : state.rect.left, top: pos ? pos.previewTop : state.rect.top, width: pos ? pos.previewW : state.rect.width, pointerEvents: "none", transform: "scale(1.03)", transformOrigin: "center", filter: "drop-shadow(0 20px 44px rgba(20,20,40,0.30))", visibility: pos ? "visible" : "hidden" }}>{preview}</div>
      {/* Само меню */}
      <div ref={menuRef} role="menu" onClick={(e) => e.stopPropagation()} style={{ position: "fixed", left: pos ? pos.menuLeft : state.rect.left, top: pos ? pos.menuTop : (state.rect.bottom + 10), width: 246, visibility: pos ? "visible" : "hidden", background: frost, WebkitBackdropFilter: "blur(34px) saturate(190%)", backdropFilter: "blur(34px) saturate(190%)", borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 50px rgba(20,20,40,0.30), inset 0 0 0 0.5px " + (isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.7)"), transformOrigin: "top left", animation: "bosMenuPop 0.30s cubic-bezier(0.34,1.5,0.4,1) both" }}>
        {onShare && <Row first label="Поделиться" icon={<I.Share size={19} />} onClick={act(onShare)} />}
        <Row first={!onShare} label="Переставить" icon={reorderIcon} onClick={act(onReorder)} />
        <Row label="Убрать" icon={hardDelete ? <I.Trash size={18} /> : <I.Minus size={19} />} danger onClick={act(onRemove)} />
        <div style={{ padding: "9px 16px 3px", fontSize: 10.5, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(10,10,10,0.38)", borderTop: "6px solid " + (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.045)") }}>Доска</div>
        <Row first label="Добавить виджет" icon={gridIcon} onClick={act(onAddWidget)} />
        <Row label="Оформление" icon={slidersIcon} onClick={act(onStyle)} />
      </div>
    </div>,
    document.body
  );
}

function HomeLive() {
  const { navigate } = useNav();
  const { open: openSheet, close: closeSheet } = useSheet();
  const app = useApp();
  // Меню по долгому нажатию на карточку доски: { k, rect, kind } | null (см. HomeCardMenuLive).
  const [cardMenu, setCardMenu] = React.useState(null);
  // Меню «Стиль карточек» — открывается из галереи: шторка закрывается, панель встаёт
  // под «+» в шапке, и смена формы/отметок видна ВЖИВУЮ на карточках доски.
  const [styleOpen, setStyleOpen] = React.useState(false);
  // Открыто из шестерёнки в тряске → меню всплывает по ЦЕНТРУ над «Готово» (placement="bottom"),
  // а не под шапочным «+» вверху (David: «вылазит за кадр наверху; должно из шестерёнки над Готово»).
  const [styleBottom, setStyleBottom] = React.useState(false);
  // Из меню карточки «Оформление» — прижать меню к таб-бару по центру (не 150px в воздухе).
  const [styleLow, setStyleLow] = React.useState(false);
  const widgets = app?.widgets || {};
  const mood = app?.mood;

  // Вечерний авто-опрос состояния (David: «раз в день к вечеру всплывает, спрашивает как ты — человек
  // быстро отмечает»). Условия: НЕ отмечено сегодня + вечер (≥18ч) + сегодня ещё не спрашивали
  // (флаг bos:stateAsk:<день> в localStorage). Мягко, через 1.4с после захода на главную.
  React.useEffect(() => {
    try {
      const tk = (typeof bosTodayKey === "function") ? bosTodayKey() : new Date().toISOString().slice(0, 10);
      const logged = !!(app && app.dayMoods && app.dayMoods[tk] != null);
      const askKey = "bos:stateAsk:" + tk;
      const asked = (typeof localStorage !== "undefined") && localStorage.getItem(askKey);
      if (!logged && !asked && new Date().getHours() >= 18 && typeof StateSheetLive === "function") {
        const id = setTimeout(() => {
          try { localStorage.setItem(askKey, "1"); } catch (e) {}
          openSheet(<StateSheetLive evening={true} />);
        }, 1400);
        return () => clearTimeout(id);
      }
    } catch (e) {}
  }, []);
  const wrapRef = React.useRef(null);
  const isDark = useThemeFlag(wrapRef);
  // Habits + goals come from the shared app store, so a check here shows up
  // on the Habits tab too (and vice versa). Скрытые с личных страниц копии привычек круга
  // (shelved, Г) и «только внутри цели» (goalOnly) на доску и в счёт дня не попадают.
  // Архив (David) — спрятанные привычки/цели не на доске и не в счёте дня. Оверлей localStorage
  // (bos:archived), по умолчанию пуст → для существующих ничего не меняется. useBosArchived →
  // перерисовка при восстановлении/архивации.
  const _arch = useBosArchived();
  const habits = (app?.habits || []).filter((h) => !h.shelved && !h.goalOnly && !bosIsArch(_arch, "h", h));
  const goals = (app?.goals || []).filter((g) => !bosIsArch(_arch, "g", g));
  // Ключ плитки на доске = cloudId (уникальный, вечный), НЕ локальный id: _nid раздаётся заново с 1001
  // каждый старт → две привычки получали один ключ «h:1001» → React-коллизия ключей, новая плитка не
  // рисовалась (David: «в списке нет, на орбитах есть»). teamKey ниже уже так делает. См. habits_live/_kh.
  const _khHome = (h) => "h:" + (h.cloudId || h.id);
  const _kgHome = (g) => "g:" + (g.cloudId || g.id);
  // David: «унифицировать» — виджеты привычек/целей на главной = ТЕ ЖЕ плитки, что на «Привычках», и
  // слушают ТОТ ЖЕ стиль (форма/тоглы из шестерёнки). Хуки → главная перерисовывается при смене стиля.
  const cardStyle = useBosCardStyle();
  const goalStyle = useBosGoalStyle();
  const teams = app?.teams || [];
  // Универсальная кнопка «+» в шапке главной (David: «нужна явная кнопка создать привычку») —
  // открывает то же меню Привычку/Цель/Круг, что и «+» на странице Привычки. Плюс простой
  // СТАРТ для нового юзера ниже (0 привычек/целей/кругов → один понятный шаг).
  const [createOpen, setCreateOpen] = React.useState(false);
  const addBtnRef = React.useRef(null);
  const trulyNew = habits.length === 0 && goals.length === 0 && teams.length === 0;
  const userName = app?.userName ?? "";
  // Greeting follows the user's OWN local clock — real morning for whoever opens
  // it in the morning, evening in the evening. No server sync needed: each device
  // already knows its local time.
  const _hr = new Date().getHours();
  const greeting = _hr < 5 ? "Доброй ночи" : _hr < 12 ? "Доброе утро" : _hr < 18 ? "Добрый день" : _hr < 23 ? "Добрый вечер" : "Доброй ночи";
  // Date line under the greeting — the device's REAL current date in Russian
  // ("Вторник · 28 апреля"). Live always shows the real date.
  let _todayLabel = "Вторник · 28 апреля";
  let _calLabel = "28 апр"; // short form for the Calendar card
  try {
    const _wd = new Intl.DateTimeFormat("ru-RU", { weekday: "long" }).format(new Date());
    const _dm = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(new Date());
    _todayLabel = _wd.charAt(0).toUpperCase() + _wd.slice(1) + " · " + _dm;
    _calLabel = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(new Date()).replace(".", "");
  } catch (e) {}
  // A real Telegram user with no habits yet gets the get-started hero + an engaging
  // level BANNER instead of the dense stat strip.
  const isNewbie = (habits.length === 0);
  const toggle = app?.toggleHabit || (() => {});
  const remove = app?.removeHabit || (() => {});
  const removeGoal = app?.removeGoal || (() => {});
  const doneCount = habits.filter(h => h.done).length;
  const totalCount = habits.length;
  const ringPct = totalCount ? doneCount / totalCount : 0;
  // Daily XP — real and legible: each habit is +10, closing the whole day adds
  // the +30 "ideal day" bonus. Show what's earned vs. what's still on the table.
  const XP_PER_HABIT = 10, XP_IDEAL_DAY = 30;
  const leftCount = Math.max(0, totalCount - doneCount);
  const dayAllDone = totalCount > 0 && leftCount === 0;
  const xpEarnedToday = doneCount * XP_PER_HABIT + (dayAllDone ? XP_IDEAL_DAY : 0);
  const ruHab = (n) => { const m = n % 10, h = n % 100; return (m === 1 && h !== 11) ? "привычку" : (m >= 2 && m <= 4 && (h < 10 || h >= 20)) ? "привычки" : "привычек"; };
  const ruTeam = (n) => { const m = n % 10, h = n % 100; return (m === 1 && h !== 11) ? "цель" : (m >= 2 && m <= 4 && (h < 10 || h >= 20)) ? "цели" : "целей"; };
  // Live profiles get REAL numbers from the date-keyed habit model.
  const _liveXP = bosLiveXPLive(app);
  const _lvl = bosLevelInfoLive(_liveXP);
  const dayStreak = bosMaxStreak(habits);
  // Витрина для «Вселенной»: при каждом заходе на Главную (открывается каждую сессию) пишем свой
  // ПУБЛИЧНЫЙ уровень + ЗНАЧКИ привычек (эмодзи+цвет, БЕЗ названий) → у друзей в их Вселенной
  // светятся твои РЕАЛЬНЫЕ планеты. `people` НЕ шлём — его знает экран «Я» (invitedPeople), а
  // cloud.js мержит с последней витриной, так что оно не затрётся. habits обязан быть МАССИВОМ
  // объектов {e,c}: число (как было) склад молча превращал в пустую орбиту и стирал витрину «Я».
  React.useEffect(() => {
    if (!(window.bosCloud && window.bosCloud.enabled() && window.bosCloud.savePublicStats)) return;
    const t = setTimeout(() => {
      try { window.bosCloud.savePublicStats({ level: _lvl.level, lvlPct: _lvl.pct, habits: habits.map((h) => ({ e: h.emoji, c: h.color })), goals: (app?.goals || []).length }); } catch (e) {}
    }, 1200);
    return () => clearTimeout(t);
  }, [_lvl.level, habits.length, (app?.goals || []).length]);
  // FOMO invite copy — the REAL next reward you're leaving on the table (honest: real XP, real
  // proximity to the next circle milestone; no fake countdowns).
  const _invited = app?.invitedCount || 0;
  const _inviteMiles = [{ n: 3, b: 300 }, { n: 7, b: 700 }, { n: 15, b: 1500 }, { n: 30, b: 3000 }];
  const _nextInviteMile = _inviteMiles.find(m => m.n > _invited);
  const _inviteFomo = _invited === 0
    ? "Первый друг = +150 XP, трое = +300 сверху. Не упусти 🔥"
    : _nextInviteMile
      ? "Ещё " + (_nextInviteMile.n - _invited) + " до +" + _nextInviteMile.b + " XP бонусом 🔥"
      : "+150 XP за каждого нового друга";

  // Bell red dot — REAL events only (секция Б): заявки в мои круги, новые участники,
  // пришедшие по моей ссылке, «тебя приняли», непрочитанные чаты. Один общий сборщик
  // bosNotifHasFreshLive (shared_live, кэш 10 мин); погас/зажёгся — по событию
  // bos:notifSeenChanged из шторки уведомлений. Облако выключено → точки нет.
  const [hasUnread, setHasUnread] = React.useState(false);
  const [notifTick, setNotifTick] = React.useState(0);
  React.useEffect(() => {
    const f = () => setNotifTick((t) => t + 1);
    window.addEventListener("bos:notifSeenChanged", f);
    return () => window.removeEventListener("bos:notifSeenChanged", f);
  }, []);
  React.useEffect(() => {
    if (!(window.bosCloud && window.bosCloud.enabled()) || typeof bosNotifHasFreshLive !== "function") { setHasUnread(false); return; }
    let on = true;
    bosNotifHasFreshLive(app).then((v) => { if (on) setHasUnread(!!v); }).catch(() => { if (on) setHasUnread(false); });
    return () => { on = false; };
  }, [teams, notifTick]);
  // Точка также зажигается, когда пришло время привычки-напоминания, а она ещё не отмечена
  // (локально, мгновенно — не ждёт облако). Гаснет сама, когда отметишь или день кончится.
  const _dueRem = (typeof bosDueRemindersLive === "function") ? bosDueRemindersLive(app?.habits || []).length : 0;
  const showBellDot = hasUnread || _dueRem > 0;

  // Celebration when a habit gets completed: float +XP near the avatar ring,
  // sparkle burst when the whole day closes (doneCount reaches total).
  const [celebrate, setCelebrate] = React.useState(null);
  const prevDoneRef = React.useRef(doneCount);
  React.useEffect(() => {
    if (doneCount > prevDoneRef.current) {
      const full = totalCount > 0 && doneCount === totalCount;
      // Per-habit XP now pops on the checkmark (HabitCheck); the big top-of-screen
      // celebration is reserved for the DAY-CLOSE moment so it never double-pops.
      if (full) {
        setCelebrate({ xp: xpEarnedToday, full: true, key: Date.now() + ":" + doneCount });
        if (window.tgHaptic) { try { window.tgHaptic("heavy"); } catch (e) {} }
        const t = window.setTimeout(() => setCelebrate(null), 2000);
        prevDoneRef.current = doneCount;
        return () => window.clearTimeout(t);
      }
    }
    prevDoneRef.current = doneCount;
  }, [doneCount, totalCount]);

  // Theme tokens
  const cardBg     = isDark ? "rgba(39,39,42,0.55)" : "#fff";
  const cardBorder = "0";
  const chipBg     = isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)";
  const iconBg     = isDark ? "rgba(255,255,255,0.06)" : "var(--surface-3)";
  const bellIcon   = isDark ? "#fff" : "#0a0a0a";
  const dividerLn  = isDark ? "rgba(255,255,255,0.06)" : "var(--line)";
  const moodGrad   = (c) => isDark
    ? `linear-gradient(135deg, ${c}66 0%, ${c}22 60%, rgba(255,255,255,0.02) 100%)`
    : `linear-gradient(135deg, ${c} 0%, ${c}66 60%, var(--card-fade) 100%)`;
  const cardShadow = isDark ? "none" : "0 1px 2px rgba(0,0,0,0.04)";
  const rowBg = isDark ? "#1b1b1e" : "#ffffff"; // opaque so swipe actions stay hidden until revealed

  // ── v528 (секция Д): СВОБОДНАЯ сетка — виджеты и плитки привычек/целей ВПЕРЕМЕШКУ
  // (iOS-паттерн). Раскладка = app.homeLayout { order: ["w:hero","h:<id>","g:<id>",...],
  // hidden: [...] }; видимость решает ПРИСУТСТВИЕ в order (widgets{} больше не источник).
  // Первый вход без раскладки → миграция из старых widgets{} (контейнеры «Привычки»/«Цели»
  // раскрываются в плитки на своих местах).
  const DEFAULT_ORDER = BOS_HOME_WIDGETS.map((w) => w.id);
  const isWidgetOn = (id) => (id === "invite") ? (widgets.invite === true) : (widgets[id] !== false);
  const layoutObj = app?.homeLayout;
  const buildMigratedOrder = () => {
    const out = [];
    const savedW = (Array.isArray(widgets.order) ? widgets.order : []).filter((id) => DEFAULT_ORDER.includes(id) || id === "habits" || id === "goals");
    const wOrder = [...savedW, ...["hero", "week", "habits", "goals", "team", "invite"].filter((id) => !savedW.includes(id))];
    wOrder.forEach((id) => {
      if (id === "habits") { habits.forEach((h) => out.push(_khHome(h))); return; }
      if (id === "goals") { goals.forEach((g) => out.push(_kgHome(g))); return; }
      if (isWidgetOn(id)) out.push("w:" + id);
    });
    return out;
  };
  const teamKey = (t) => (typeof bosTeamKeyLive === "function") ? bosTeamKeyLive(t) : ("t:" + (t.cloudId || t._id || t.id));
  const effLayout = React.useMemo(() => {
    const base = (layoutObj && Array.isArray(layoutObj.order)) ? layoutObj : { order: buildMigratedOrder(), hidden: [] };
    const hidden = Array.isArray(base.hidden) ? base.hidden : [];
    const seen = {};
    const alive = (k) => {
      if (k.startsWith("h:")) return habits.some((h) => _khHome(h) === k);
      if (k.startsWith("g:")) return goals.some((g) => _kgHome(g) === k);
      if (k.startsWith("t:")) return teams.some((t) => teamKey(t) === k);
      if (k.startsWith("w:")) return BOS_HOME_WIDGETS.some((w) => "w:" + w.id === k);
      return false;
    };
    const order = base.order.filter((k) => { if (seen[k] || !alive(k)) return false; seen[k] = 1; return true; });
    // Добор НОВЫХ привычек/целей/кругов: сразу на главную — после последней плитки своего вида.
    const insertAfterLast = (pref, key) => { let at = -1; order.forEach((k, i) => { if (k.indexOf(pref) === 0) at = i; }); if (at >= 0) order.splice(at + 1, 0, key); else order.push(key); };
    habits.forEach((h) => { const k = _khHome(h); if (!seen[k] && hidden.indexOf(k) < 0) { insertAfterLast("h:", k); seen[k] = 1; } });
    goals.forEach((g) => { const k = _kgHome(g); if (!seen[k] && hidden.indexOf(k) < 0) { insertAfterLast("g:", k); seen[k] = 1; } });
    // Совместные цели — тоже ПЛИТКАМИ на доске (David: «захочу цель на главной»); прежний
    // авто-виджет «Вместе» больше не добавляем сами — он остался в галерее как сводка по желанию.
    teams.forEach((t) => { const k = teamKey(t); if (!seen[k] && hidden.indexOf(k) < 0) { insertAfterLast("t:", k); seen[k] = 1; } });
    // «Быстрое добавление» (w:quick) БОЛЬШЕ НЕ добирается само (David 2026-07-10, лента «Открытий»):
    // убрано из дефолта главной — челленджи теперь живут в форме создания привычки и в Сообществе.
    // Остаётся обычным opt-in виджетом: включается из галереи «+» (кто хочет — вернёт), тогда «w:quick»
    // попадает в order и рисуется как виджет (см. nodeOf ниже + HomeGalleryContentLive).
    // «Состояние» (w:mood) снова СКРЫТО до согласованного макета (David: сначала продумать,
    // где живёт и как ведёт себя — в масштабе человека и мультиплеера). Добор убран; кейс
    // nodeOf("mood") жив — вернуть = строка в BOS_HOME_WIDGETS + добор здесь.
    return { order, hidden };
  }, [layoutObj, habits, goals, teams, widgets]);
  const saveLayout = (patch) => { if (app?.setHomeLayout) app.setHomeLayout({ ...effLayout, ...patch }); };
  // Миграция фиксируется ОДИН раз (иначе шторка «+» видела бы пустой layout). Гидрация из
  // облака позже спокойно перекроет это своим сохранённым homeLayout.
  React.useEffect(() => { if (!layoutObj && !trulyNew && app?.setHomeLayout) app.setHomeLayout(effLayout); }, [!!layoutObj, trulyNew]);
  // v674: «Быстрое добавление» (w:quick) убираем из ДЕФОЛТА у ВСЕХ разово (David: «сделай блок
  // скрытым по дефолту, кто захочет — включит из галереи лично»). У существующих юзеров он мог осесть
  // в persisted order (авто-добор до v672) — снимаем ОДИН раз по флагу; дальше обычный opt-in виджет.
  React.useEffect(() => {
    try {
      if (localStorage.getItem("bos:quickOffMigrated")) return;
      if (!layoutObj || !Array.isArray(layoutObj.order)) return; // ждём реальную раскладку
      localStorage.setItem("bos:quickOffMigrated", "1");
      if (layoutObj.order.indexOf("w:quick") >= 0 && app?.setHomeLayout) {
        app.setHomeLayout({ ...layoutObj, order: layoutObj.order.filter((k) => k !== "w:quick") });
      }
    } catch (e) {}
  }, [layoutObj]);
  const hideKey = (k) => saveLayout({ order: effLayout.order.filter((x) => x !== k), hidden: effLayout.hidden.indexOf(k) < 0 ? effLayout.hidden.concat([k]) : effLayout.hidden });

  // Each widget's content. Returns null when a widget is ON but has nothing to show
  // right now (e.g. mood logged today with <2 days of history) — it then drops off the
  // board but stays «on» (not offered in the add sheet). No per-widget marginTop: the
  // board's gap owns the spacing.
  const nodeOf = (id) => {
    if (id === "hero") {
      return (
        <div data-tour="aihints" style={{ position: "relative" }}>
          <HomeHeroSwipeLive navigate={navigate} doneCount={doneCount} totalCount={totalCount} ringPct={ringPct} isDark={isDark} />
          {celebrate && (
            <div key={celebrate.key} aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 6, overflow: "visible" }}>
              <div style={{ position: "absolute", top: 66, right: 16, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 5,
                background: "#0a0a0a", color: "#FEDE34", fontSize: celebrate.full ? 13 : 12, fontWeight: 800,
                padding: celebrate.full ? "7px 12px" : "5px 10px", borderRadius: 999, boxShadow: "0 8px 22px rgba(0,0,0,0.3)",
                animation: "bosXpPop 1.15s cubic-bezier(0.22,1,0.36,1) forwards" }}>
                ✦ +{celebrate.xp} XP{celebrate.full ? " · идеальный день" : ""}
              </div>
              {celebrate.full && [0,1,2,3,4,5,6,7].map(i => {
                const a = (i / 8) * Math.PI * 2;
                return <span key={i} style={{ position: "absolute", top: 52, right: 52, width: 5, height: 5, borderRadius: "50%",
                  background: "#FEDE34", boxShadow: "0 0 6px #FEDE34", animation: "bosSpark 0.9s ease-out forwards",
                  ["--sx"]: Math.cos(a) * 44 + "px", ["--sy"]: Math.sin(a) * 44 + "px" }}/>;
              })}
            </div>
          )}
        </div>
      );
    }

    if (id === "level") {
      // Gold LEVEL banner — turns the bare stat into a hook ("every habit is XP — learn how to grow").
      return (
        <div style={{ borderRadius: 22, overflow: "hidden", transform: "translateZ(0)", boxShadow: "0 10px 26px rgba(239,159,20,0.30)" }}>
          {/* rowBg carries the gradient (not a solid) so the peeling edge has ONE surface. */}
          <SwipeRow rowBg="linear-gradient(135deg,#FEDE34,#EF9F14)" dark={isDark} actions={[
            { key: "hide", tone: "delete", label: "Убрать", icon: I.X, onAction: () => hideKey("w:level") },
          ]}>
            <button onClick={() => navigate("levels")} className="tap" style={{
              width: "100%", border: 0, padding: "15px 17px",
              background: "transparent", color: "#0a0a0a",
              display: "flex", alignItems: "center", gap: 13, textAlign: "left",
            }}>
              <span style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.5)", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 22 }}>🏆</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: "-0.2px" }}>Уровень {_lvl.level}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.55 }}>{_liveXP} XP</span>
                </div>
                <div style={{ fontSize: 12.5, color: "rgba(0,0,0,0.62)", marginTop: 2, lineHeight: 1.35 }}>Каждая привычка — это опыт. Узнай, как расти →</div>
                <span style={{ display: "block", height: 5, borderRadius: 999, background: "rgba(0,0,0,0.14)", overflow: "hidden", marginTop: 8 }}>
                  <span style={{ display: "block", height: "100%", width: _lvl.pct + "%", borderRadius: 999, background: "rgba(0,0,0,0.82)" }}/>
                </span>
              </div>
              <I.ChevronRight size={20} color="rgba(0,0,0,0.45)" />
            </button>
          </SwipeRow>
        </div>
      );
    }

    if (id === "quick") {
      // Лента челленджей (быстрое добавление) — переехала со страницы «Привычки».
      return <HomeQuickStripLive isDark={isDark} />;
    }

    if (id === "week") {
      // «Эта неделя» replaces the old date card (the date already shows in the greeting). A 7-day
      // activity strip; tap → history. Title lives INSIDE the card («всё внутри блоков»).
      const _wk = (typeof bosWeekKeys === "function") ? bosWeekKeys() : [];
      const _active = habits.length ? _wk.filter((k) => habits.some((h) => h.log && h.log[k])).length : 0;
      return (
        <button className="tap" onClick={() => navigate("history")}
          style={{ width: "100%", background: cardBg, border: cardBorder, borderRadius: 22, padding: "14px 15px", textAlign: "left", boxShadow: cardShadow, color: "var(--text)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.2px" }}>Эта неделя</span>
            <span style={{ fontSize: 12, color: "var(--text-4)", fontWeight: 500 }}>{_active} из 7 ›</span>
          </div>
          <HomeWeekStripLive habits={habits} isDark={isDark} />
        </button>
      );
    }

    if (id === "team") {
      // «Вместе» (круги) — its own full-width widget (David picked variant A: circles separate). Glass
      // tile + standard grey glass discs for emblems; tap → community.
      return (
        <button className="tap" onClick={() => navigate("community")}
          style={{ width: "100%", background: cardBg, border: cardBorder, borderRadius: 22, padding: "14px 15px", textAlign: "left", display: "flex", alignItems: "center", gap: 12, boxShadow: cardShadow, color: "var(--text)" }}>
          <span style={{ width: 40, height: 40, borderRadius: 13, background: BOS_TILE_SHEEN + ", " + iconBg, boxShadow: bosTileGlass(isDark), display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>👥</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>Вместе</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 1 }}>{teams.length ? teams.length + " " + ruTeam(teams.length) + " · ведёте вместе" : "Создай первую совместную цель"}</div>
          </div>
          {teams.length > 0 ? (
            <div style={{ display: "flex", flexShrink: 0 }}>
              {teams.slice(0, 4).map((t, i) => (
                <span key={t._id || i} title={t.name} style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(150deg, var(--disc-a, #eef1f6), var(--disc-b, #dadfe7))", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.08), 0 0 0 2px " + (isDark ? "#0a0a0a" : "#fff"), marginLeft: i ? -9 : 0, display: "grid", placeItems: "center", fontSize: 15, lineHeight: 1 }}>{bosIcon(t.emblem || "👥", 15, t.accent)}</span>
              ))}
            </div>
          ) : (
            <span style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--cta, #0a0a0a)", color: "var(--cta-ink, #fff)", display: "grid", placeItems: "center", flexShrink: 0 }}><I.Plus size={16}/></span>
          )}
        </button>
      );
    }

    if (id === "mood") {
      // СОСТОЯНИЕ v2 (редизайн): виджет-орб. Не отмечено сегодня → приглашение (тёмный тлеющий
      // орб «Как ты?»); отмечено → орб в цвете состояния + след недели. Тап → Момент (жест A).
      const _tk = (typeof bosTodayKey === "function") ? bosTodayKey() : "";
      const _loggedToday = !!(app?.dayMoods && app.dayMoods[_tk] != null);
      const _hideAction = [{ key: "hide", tone: "delete", label: "Убрать", icon: I.X, onAction: () => hideKey("w:mood") }];
      return (
        <div style={{ borderRadius: 22, overflow: "hidden", boxShadow: cardShadow, transform: "translateZ(0)" }}>
          <SwipeRow rowBg={rowBg} dark={isDark} actions={_hideAction}>
            {(_loggedToday && mood)
              ? <MoodWidgetLive mood={mood} app={app} isDark={isDark} navigate={navigate} flush={true} />
              : <StateInviteLive app={app} isDark={isDark} navigate={navigate} />}
          </SwipeRow>
        </div>
      );
    }

    if (id === "env") {
      // «Баланс окружения» — мини-светило общего тона своих (env_balance_live). ВЫКЛ по умолчанию.
      const _envHide = [{ key: "hide", tone: "delete", label: "Убрать", icon: I.X, onAction: () => hideKey("w:env") }];
      return (
        <div style={{ borderRadius: 22, overflow: "hidden", boxShadow: cardShadow, transform: "translateZ(0)" }}>
          <SwipeRow rowBg={rowBg} dark={isDark} actions={_envHide}>
            {(typeof EnvPulseWidgetLive === "function") ? <EnvPulseWidgetLive navigate={navigate} isDark={isDark} /> : null}
          </SwipeRow>
        </div>
      );
    }

    if (id === "tasks") {
      // «Дела» — локальный todo-виджет (списки-вкладки, разовые дела). Свайп ряда → «Убрать».
      const _hideTasks = [{ key: "hide", tone: "delete", label: "Убрать", icon: I.X, onAction: () => hideKey("w:tasks") }];
      return (
        <div style={{ borderRadius: 22, overflow: "hidden", boxShadow: cardShadow, transform: "translateZ(0)" }}>
          <SwipeRow rowBg={rowBg} dark={isDark} actions={_hideTasks}>
            <TasksWidgetLive isDark={isDark} openSheet={openSheet} />
          </SwipeRow>
        </div>
      );
    }

    if (id === "invite") {
      // Invite / share — GOLD banner (David: «как баннер уровня»): same reward-gold language as the
      // level banner, dark ink on gold. The «+150 XP» badge flips to a dark pill for contrast on gold.
      return (
        <div style={{ borderRadius: 22, overflow: "hidden", transform: "translateZ(0)", boxShadow: "0 10px 26px rgba(239,159,20,0.30)" }}>
          <SwipeRow rowBg="linear-gradient(135deg,#FEDE34,#EF9F14)" dark={isDark} actions={[
            { key: "hide", tone: "delete", label: "Убрать", icon: I.X, onAction: () => hideKey("w:invite") },
          ]}>
            <button data-tour="share-app" className="tap" onClick={() => openSheet(<ShareAppSheetLive dark={isDark} />)}
              style={{ width: "100%", padding: "15px 17px", border: 0, position: "relative",
                background: "transparent",
                color: "#0a0a0a", display: "flex", alignItems: "center", gap: 13, textAlign: "left" }}>
              <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 86% 8%, rgba(255,255,255,0.4) 0%, transparent 55%)", pointerEvents: "none" }} />
              <span style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.5)", display: "grid", placeItems: "center", flexShrink: 0, color: "#0a0a0a", position: "relative" }}>
                <I.Share size={20} />
              </span>
              <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: "#0a0a0a", letterSpacing: "-0.2px" }}>Позови своих</div>
                  <span style={{ display: "inline-flex", alignItems: "center", fontSize: 10.5, fontWeight: 800, color: "#FEDE34", background: "#0a0a0a", padding: "2px 8px", borderRadius: 999, flexShrink: 0 }}>+150 XP</span>
                </div>
                <div style={{ fontSize: 12.5, color: "rgba(0,0,0,0.62)", marginTop: 3, lineHeight: 1.35, fontWeight: 500 }}>{_inviteFomo}</div>
              </div>
              <div style={{ display: "flex", flexShrink: 0, position: "relative" }}>
                <span style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.55)", border: "2px solid rgba(255,255,255,0.6)", display: "grid", placeItems: "center", color: "#0a0a0a" }}><I.Plus size={16} strokeWidth={2.5} /></span>
              </div>
            </button>
          </SwipeRow>
        </div>
      );
    }

    return null;
  };

  // Виджеты рендерим по layout; упавший/пустой (nodeOf → null, напр. mood без истории) просто
  // не показывается, но МЕСТО в order держит — вернётся сам, когда появится контент.
  const nodes = {};
  effLayout.order.forEach((k) => {
    if (k.indexOf("w:") !== 0) return;
    const id = k.slice(2);
    try { const n = nodeOf(id); if (n != null) nodes[id] = n; } catch (e) {}
  });
  const keyVisible = (k) => (k.indexOf("w:") === 0 ? nodes[k.slice(2)] != null : true);
  const visibleKeys = effLayout.order.filter(keyVisible);
  const onReorderKeys = (newVisible) => {
    let vi = 0;
    const merged = effLayout.order.map((k) => (keyVisible(k) ? newVisible[vi++] : k));
    saveLayout({ order: merged });
  };
  const gridCtl = React.useRef(null);
  const openAddSheet = () => openSheet(<AddWidgetSheetLive defs={BOS_HOME_WIDGETS} dark={isDark}
    onStyle={() => { closeSheet(); setStyleBottom(false); setStyleOpen(true); }} />);
  // Плитка/виджет по ключу. Плитки — ГОЛЫЕ (те же HabitTileLive/GoalTileLive, что на
  // «Привычках»); long-press ловит сетка → меню (Поделиться / Переставить / Убрать с главной).
  const tileFor = (k) => {
    if (k.indexOf("w:") === 0) { const id = k.slice(2); return nodes[id] ? <WidgetBoundaryLive wid={id}>{nodes[id]}</WidgetBoundaryLive> : null; }
    if (k.indexOf("h:") === 0) { const h = habits.find((x) => _khHome(x) === k); return h ? <HabitTileLive habit={h} from="home" /> : null; }
    if (k.indexOf("g:") === 0) { const g = goals.find((x) => _kgHome(x) === k); return g ? <GoalTileLive goal={g} from="home" /> : null; }
    if (k.indexOf("t:") === 0) { const t = teams.find((x) => teamKey(x) === k); return t && typeof TeamTileLive === "function" ? <TeamTileLive team={t} from="home" /> : null; }
    return null;
  };
  // David 2026-07-11 («вариант Г» + iOS-референс): зажал ЛЮБУЮ плитку → всплывает аккуратное меню
  // (HomeCardMenuLive), а не резкая тряска. Тряска запускается ОСОЗНАННО из пункта «Переставить».
  // rect карточки приходит из BosReorderGrid.onLongPress — меню якорится на её место.
  const onCellLongPress = (k, rect) => {
    const kind = k.indexOf("h:") === 0 ? "habit" : k.indexOf("g:") === 0 ? "goal" : k.indexOf("t:") === 0 ? "circle" : "widget";
    setCardMenu({ k, rect: rect || null, kind });
  };
  // Минус в тряске: виджет/круг — просто убрать с доски; привычка/цель — шторка «Архивировать /
  // Удалить» (David: «если не виджет, а привычка или цель — спрашивает удалить/архивировать»).
  const onMinus = (k) => {
    if (k.indexOf("h:") === 0) {
      const h = habits.find((x) => _khHome(x) === k); if (!h) { hideKey(k); return; }
      openSheet(<ArchiveOrDeleteSheetLive name={h.name} emoji={h.emoji} color={h.color} dark={isDark}
        onArchive={() => bosSetArchived(bosArchKey("h", h), true)}
        deleteLabel="Удалить насовсем" deleteHint="Сотрёт привычку и всю историю отметок. Навсегда."
        onDelete={() => bosConfirmDelete(openSheet, { title: "Удалить привычку?", message: "«" + h.name + "» и вся история отметок удалятся навсегда.", confirmLabel: "Удалить", onConfirm: () => (app?.removeHabit || (() => {}))(h.id) })} />);
      return;
    }
    if (k.indexOf("g:") === 0) {
      const g = goals.find((x) => _kgHome(x) === k); if (!g) { hideKey(k); return; }
      openSheet(<ArchiveOrDeleteSheetLive name={g.name} emoji={g.emoji} color={g.color} dark={isDark}
        onArchive={() => bosSetArchived(bosArchKey("g", g), true)}
        deleteLabel="Удалить насовсем" deleteHint="Сотрёт цель и её прогресс. Навсегда."
        onDelete={() => bosConfirmDelete(openSheet, { title: "Удалить цель?", message: "«" + g.name + "» удалится навсегда.", confirmLabel: "Удалить", onConfirm: () => (app?.removeGoal || (() => {}))(g.id) })} />);
      return;
    }
    // виджеты и круги — просто убрать с доски (круг живёт на «Привычках»/в «Сообществе»).
    hideKey(k);
  };

  return (
    <div ref={wrapRef} className="page-in" style={{ padding: "0 12px 24px" }}>
      {/* Top bar — greeting + bell (PINNED, never a widget) */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 4px 12px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "var(--text-4)", letterSpacing: 0.4 }}>{_todayLabel}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.6px", marginTop: 2, fontFamily: "var(--bos-title-font)" }}>{userName ? greeting + ", " + userName : greeting + " 👋"}</div>
        </div>
        {/* «+» — явная кнопка СОЗДАТЬ (привычку/цель/круг), всегда под рукой на главной (David). Тот
            же CreateMenuLive, что на странице Привычки; стеклянный круг, «+» крутится при открытии. */}
        <button ref={addBtnRef} onClick={() => { setCreateOpen(true); if (window.tgHaptic) { try { window.tgHaptic("light"); } catch (e) {} } }} className="tap hit44" aria-label="Создать" aria-haspopup="menu" aria-expanded={createOpen} title="Создать"
          style={{ width: 44, height: 44, borderRadius: 999, ...(typeof bosGlassChrome === "function" ? bosGlassChrome(isDark) : (typeof bosChipGlass === "function" ? bosChipGlass(isDark) : { background: "var(--surface-3)" })), color: isDark ? "#fff" : "var(--text)", border: 0, display: "grid", placeItems: "center", flexShrink: 0, cursor: "pointer" }}>
          <I.Plus size={21} strokeWidth={2.4} style={{ transition: "transform 0.34s cubic-bezier(0.34,1.5,0.4,1)", transform: createOpen ? "rotate(45deg)" : "none" }} />
        </button>
        {/* Notifications — СТЕКЛЯННЫЙ КРУГ, симметрично «+» слева (David: «колокольчик тоже
            в кружочек»). Красная точка едет на верхнем правом крае колокольчика. */}
        <button onClick={() => navigate("notifications", { from: "home" })} className="tap hit44" aria-label="Уведомления"
          style={{ width: 44, height: 44, borderRadius: 999, ...(typeof bosGlassChrome === "function" ? bosGlassChrome(isDark) : (typeof bosChipGlass === "function" ? bosChipGlass(isDark) : { background: "var(--surface-3)" })), border: 0, padding: 0, display: "grid", placeItems: "center", flexShrink: 0, cursor: "pointer" }}>
          <span style={{ position: "relative", display: "grid", placeItems: "center" }}>
            <I.Bell size={21} strokeWidth={2} color={bellIcon}/>
            {showBellDot && (
            <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: "var(--accent-red)", border: "2px solid " + (isDark ? "#0a0a0a" : "#fff") }} />
            )}
          </span>
        </button>
      </div>

      <CreateMenuLive open={createOpen} onClose={() => setCreateOpen(false)} anchorRef={addBtnRef} navigate={navigate} />
      {/* «Стиль карточек» из галереи: панель под «+», доска на глазах меняет формы. */}
      {typeof CardStyleMenuLive === "function" && <CardStyleMenuLive open={styleOpen} onClose={() => setStyleOpen(false)} anchorRef={addBtnRef}
        placement={styleLow ? "bottom-low" : (styleBottom ? "bottom" : undefined)}
        onArchiveList={() => openSheet(<ArchiveSheetLive navigate={navigate} />)} />}

      {/* Меню по долгому нажатию на карточку (Поделиться · Переставить · Убрать + Доска). */}
      {cardMenu && (
        <HomeCardMenuLive
          state={cardMenu}
          onClose={() => setCardMenu(null)}
          isDark={isDark}
          kind={cardMenu.kind}
          preview={tileFor(cardMenu.k)}
          onShare={(() => {
            const k = cardMenu.k;
            if (k.indexOf("h:") === 0) { const h = habits.find((x) => _khHome(x) === k); return (h && typeof ShareHabitSheetLive === "function") ? () => openSheet(<ShareHabitSheetLive habit={h} dark={isDark} />) : null; }
            if (k.indexOf("g:") === 0) { const g = goals.find((x) => _kgHome(x) === k); return (g && typeof ShareGoalSheetLive === "function") ? () => openSheet(<ShareGoalSheetLive goal={g} dark={isDark} />) : null; }
            if (k.indexOf("t:") === 0) { const t = teams.find((x) => teamKey(x) === k); return (t && typeof TeamShareSheetLive === "function") ? () => openSheet(<TeamShareSheetLive team={t} />) : null; }
            return null;
          })()}
          onReorder={() => { if (gridCtl.current && gridCtl.current.enterReorder) gridCtl.current.enterReorder(); }}
          onRemove={() => onMinus(cardMenu.k)}
          onAddWidget={openAddSheet}
          onStyle={() => { setStyleBottom(false); setStyleLow(true); setStyleOpen(true); }}
        />
      )}

      {/* Новому юзеру (0 привычек/целей/кругов) — ПРОСТОЙ старт = ОДИН hero-блок: ИИ-сводка + пилюли
          (там уже есть «➕ Создать привычку» + мягкий ИИ-старт «Рассказать о себе»). Прежнюю большую
          карточку «Создай первую привычку» убрал — она дублировала пилюлю и занимала пол-экрана
          (David: «нету смысла показывать на пол-экрана, в пилюлях уже есть»). Доска — с первой привычкой. */}
      {trulyNew ? (
        <WidgetBoundaryLive wid="hero">{(() => { try { return nodeOf("hero"); } catch (e) { return null; } })()}</WidgetBoundaryLive>
      ) : visibleKeys.length > 0 ? (
        <BosReorderGrid
          ids={visibleKeys}
          cols={2}
          gap={12}
          ctlRef={gridCtl}
          onReorder={onReorderKeys}
          onLongPress={onCellLongPress}
          onAdd={openAddSheet}
          onGear={() => { setStyleLow(false); setStyleBottom(true); setStyleOpen(true); }}
          addLabel="Добавить на главную"
          spanFull={(k) => {
            // Виджеты — во всю ширину; плитки решают сами по своей форме (как на «Привычках»).
            if (!k || k.indexOf("w:") === 0) return true;
            if (k.indexOf("g:") === 0 || k.indexOf("t:") === 0) return goalStyle.form === "banner";
            return cardStyle.form === "rect";
          }}
          renderItem={(k, { mode }) => (
            <div style={{ position: "relative", height: "100%" }}>
              <div style={{ pointerEvents: mode ? "none" : "auto", height: "100%" }}>{tileFor(k)}</div>
              {mode && <WidgetMinusLive onRemove={() => onMinus(k)} />}
            </div>
          )}
        />
      ) : (
        <button onClick={openAddSheet} className="tap" style={{
          marginTop: 40, width: "100%", borderRadius: 22, padding: "28px 16px",
          border: "1.5px dashed var(--line)", background: "transparent", color: "var(--text-3)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>
          <span style={{ width: 46, height: 46, borderRadius: "50%", display: "grid", placeItems: "center",
            background: BOS_TILE_SHEEN + ", var(--surface-3)", boxShadow: bosTileGlass(isDark), color: "var(--text)" }}><I.Plus size={20} strokeWidth={2.5} /></span>
          Добавить виджеты на главную
        </button>
      )}
    </div>
  );
}

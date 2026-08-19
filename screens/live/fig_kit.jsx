/* ═══════════════════════════════════════════════════════════════════════════════════════
   ФИГМА-КИТ — атомы новых макетов, ОДИН экземпляр на всё приложение.

   David 2026-08-19: «макеты — единая инстанция правды, делай пиксель в пиксель».
   Раньше каждый экран рисовал свою строку и свою шапку раздела «примерно так же», и
   разнобой копился. Здесь собраны те самые узлы из Figma — с их числами, а не на глаз:

     Header                 48 (70 с описанием), заголовок 22/700 lh28 ls-0.26
     Grouped Table View     r24, заливка карточки, разделитель слева от текста
     My Group / Friend Row  82 / 68, аватар 44 в кольце уровня + бейдж «Lvl. N»
     Favorit Group          116 шириной, аватар 96 в кольце
     Places Events Card     240×336, фото 160 с точками-страницами
     Course Card            340×308
     Badge Line             чипы 36, r999, зазор 8, боковые 16
     Toolbar - Top          заголовок 34/700 lh41, справа две круглые кнопки 44

   Цвета берём ТОКЕНАМИ (var(--…)), а не значениями из тёмного кадра: слой .fig в
   styles.css держит обе темы, поэтому один и тот же атом честно выглядит и в светлой.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

/* УРОВЕНЬ окрашивает подпись и кольцо. В макете встречаются ровно четыре ступени —
   3 (серый), 6 (сине-голубой), 9 (фиолетово-розовый), 10 (оранжевый). Ровные тройки:
   1–3 · 4–6 · 7–9 · 10+ — единственное правило, которое проходит через все четыре точки. */
const FIG_LVL_TIERS = [
  { max: 3,        a: null,      b: null      },   // серый = вторичный текст темы
  { max: 6,        a: "#6236FF", b: "#35C6FF" },
  { max: 9,        a: "#9A36FF", b: "#CC35FF" },
  { max: Infinity, a: "#FF9736", b: "#FF6435" },
];
function figLvlTier(level) {
  var n = Math.max(0, Math.round(level || 0));
  for (var i = 0; i < FIG_LVL_TIERS.length; i++) if (n <= FIG_LVL_TIERS[i].max) return FIG_LVL_TIERS[i];
  return FIG_LVL_TIERS[FIG_LVL_TIERS.length - 1];
}
/* Заливка текста градиентом: в макете подпись «Lvl. 6» — сам текст залит градиентом,
   а не подложка. В вебе это background-clip:text. Для серой ступени — обычный цвет. */
function figLvlTextStyle(level) {
  var t = figLvlTier(level);
  if (!t.a) return { color: "var(--text-2)" };
  return { backgroundImage: "linear-gradient(90deg," + t.a + "," + t.b + ")", WebkitBackgroundClip: "text",
    backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" };
}
function figLvlStroke(level) {
  var t = figLvlTier(level);
  return t.a ? [t.a, t.b] : ["var(--text-2)", "var(--text-2)"];
}

/* «Lvl. N» — подпись под аватаром. 11/590 ls0.06, значок-ромбик слева (12×12). */
function FigLvlBadge({ level, size = 11 }) {
  if (level == null) return null;
  var t = figLvlTier(level);
  var id = "figlvl" + Math.round(level) + "_" + size;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, lineHeight: 1 }}>
      <svg width={Math.round(size * 1.09)} height={Math.round(size * 1.09)} viewBox="0 0 12 12" aria-hidden>
        {t.a ? <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={t.a} /><stop offset="1" stopColor={t.b} /></linearGradient></defs> : null}
        <circle cx="6" cy="6" r="4.6" fill={t.a ? "url(#" + id + ")" : "var(--text-2)"} />
        <circle cx="6" cy="6" r="2" fill="var(--surface)" />
      </svg>
      <span style={Object.assign({ fontSize: size, fontWeight: 590, letterSpacing: "0.06px", lineHeight: (size + 2) + "px" }, figLvlTextStyle(level))}>
        {"Lvl. " + Math.round(level)}
      </span>
    </span>
  );
}

/* Аватар В КОЛЬЦЕ УРОВНЯ. Кольцо: подложка #787880@0.32 толщиной 3, поверх — дуга прогресса
   цветом ступени. `pct` 0..1 — сколько пройдено до следующего уровня. Точка «в сети» и
   счётчик непрочитанного садятся в правый нижний угол, как в макете. */
/* Цвет обложки группы — стабильно из имени, чтобы значок не «мигал» между сессиями.
   В макете обложка группы — цветной градиент с КРУПНЫМ эмодзи (72 внутри 96), а не
   бледный серый диск: группа должна читаться пятном ещё до чтения имени. */
function figGroupTint(name) {
  var pal = (typeof BOS_TEAM_PALETTE !== "undefined") ? BOS_TEAM_PALETTE : ["#7FB3F2", "#F4A574", "#9BD4A8", "#C9A8E8"];
  var h = 0, s0 = "" + (name || "");
  for (var i = 0; i < s0.length; i++) h = (h * 31 + s0.charCodeAt(i)) >>> 0;
  var a = pal[h % pal.length], b = pal[(h >> 3) % pal.length];
  return [a, b === a ? pal[(h >> 5) % pal.length] : b];
}
function FigGroupFace({ avatar, name, size }) {
  var a = "" + (avatar || "");
  if (a.indexOf("url:") === 0) {
    return <span style={{ width: size, height: size, borderRadius: "50%", display: "block",
      background: "url(" + JSON.stringify(a.slice(4)) + ") center/cover no-repeat" }} />;
  }
  var t = figGroupTint(name);
  var glyph = a.indexOf("emoji:") === 0 ? a.slice(6) : "";
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", display: "grid", placeItems: "center",
      background: "linear-gradient(150deg," + t[0] + "," + t[1] + ")", boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.08)" }}>
      <span style={{ fontSize: Math.round(size * 0.62), lineHeight: 1 }}>{glyph || (("" + (name || "?")).trim().charAt(0).toUpperCase())}</span>
    </span>
  );
}
function FigAvatarLvl({ avatar, name, size = 44, level = null, pct = 0, online = false, unread = 0, square = false, ring = true, group = false }) {
  var gap = size >= 72 ? 5 : 2;
  var box = size + gap * 2 + 3;
  var r = (box - 3) / 2;
  var C = 2 * Math.PI * r;
  var st = figLvlStroke(level);
  var gid = "figring" + size + "_" + Math.round((level || 0) * 10);
  var face = group
    ? <FigGroupFace avatar={avatar} name={name} size={size} />
    : (typeof BuddyFaceLive === "function")
      ? <BuddyFaceLive avatar={avatar} name={name} size={size} />
      : <span style={{ width: size, height: size, borderRadius: "50%", background: "var(--surface-3)", display: "block" }} />;
  return (
    <span style={{ position: "relative", display: "inline-grid", placeItems: "center", width: box, height: box, flexShrink: 0 }}>
      {ring && level != null && (
        <svg width={box} height={box} viewBox={"0 0 " + box + " " + box} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }} aria-hidden>
          <defs><linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={st[0]} /><stop offset="1" stopColor={st[1]} /></linearGradient></defs>
          <circle cx={box / 2} cy={box / 2} r={r} fill="none" stroke="rgba(120,120,128,0.32)" strokeWidth="3" />
          <circle cx={box / 2} cy={box / 2} r={r} fill="none" stroke={"url(#" + gid + ")"} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - Math.max(0, Math.min(1, pct)))}
            style={{ transition: "stroke-dashoffset .6s cubic-bezier(0.22,0.9,0.3,1)" }} />
        </svg>
      )}
      <span style={{ borderRadius: square ? Math.round(size * 0.28) : "50%", overflow: "hidden", lineHeight: 0 }}>{face}</span>
      {unread > 0 ? (
        <span style={{ position: "absolute", right: -1, bottom: -1, minWidth: 20, height: 20, borderRadius: 999, padding: "0 5px",
          background: "var(--text)", color: "var(--bg)", fontSize: 13, fontWeight: 590, display: "grid", placeItems: "center",
          boxShadow: "0 0 0 2px var(--surface)" }}>{unread > 99 ? "99+" : unread}</span>
      ) : online ? (
        <span aria-hidden style={{ position: "absolute", right: 1, bottom: 1, width: 14, height: 14, borderRadius: 999,
          background: "var(--accent)", boxShadow: "0 0 0 2.5px var(--surface)" }} />
      ) : null}
    </span>
  );
}

/* ШАПКА РАЗДЕЛА. Высота 48; с описанием — 70. Заголовок 22/700 lh28 ls-0.26, шеврон 8px
   сразу за ним (если раздел открывается целиком), подпись 15/510, справа действие 15/400. */
function FigSectionHead({ title, sub, action, onAction, onPress, style }) {
  var Tag = onPress ? "button" : "div";
  var head = (
    <Tag onClick={onPress || undefined} className={onPress ? "tap" : undefined} data-haptic={onPress ? "selection" : undefined}
      style={{ border: 0, background: "transparent", padding: 0, textAlign: "left", cursor: onPress ? "pointer" : "default", minWidth: 0, color: "var(--text)" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 700, lineHeight: "28px", letterSpacing: "-0.26px", color: "var(--text)" }}>{title}</span>
        {onPress && <I.ChevronRight size={15} strokeWidth={2.6} color="var(--text-3)" style={{ flexShrink: 0 }} />}
      </span>
      {sub ? <span style={{ display: "block", fontSize: 15, fontWeight: 510, lineHeight: "20px", letterSpacing: "-0.23px", color: "var(--text-2)", marginTop: 2 }}>{sub}</span> : null}
    </Tag>
  );
  return (
    <div style={Object.assign({ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, padding: "10px 16px" }, style || {})}>
      {head}
      {action ? (
        <button onClick={onAction} className="tap" style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer",
          fontSize: 15, lineHeight: "20px", color: "var(--text-2)", flexShrink: 0, whiteSpace: "nowrap" }}>{action}</button>
      ) : null}
    </div>
  );
}

/* ГОРИЗОНТАЛЬНАЯ ЛЕНТА: зазор 10, боковые отступы 16, скрытая полоса прокрутки, «липкие»
   страницы — в макете карточки ровно 340 и следующая выглядывает краем.
   scrollPadding ОБЯЗАТЕЛЕН: без него snap-align:start выравнивает карточку по краю
   скролл-порта, игнорируя padding — лента сама подъезжала на 16px и первая карточка
   прилипала к краю экрана (David: «нет расстояния слева»). */
function FigRail({ children, gap = 10, pad = 16, snap = true, style }) {
  return (
    <div className="fig-rail" style={Object.assign({ display: "flex", gap: gap, overflowX: "auto", padding: "0 " + pad + "px 10px",
      scrollPadding: "0 " + pad + "px", scrollbarWidth: "none", WebkitOverflowScrolling: "touch",
      scrollSnapType: snap ? "x proximity" : "none" }, style || {})}>
      {children}
    </div>
  );
}

/* БЕГУЩАЯ СТРОКА для длинных названий (David: «длинное дело нельзя прочитать —
   ограничить знаки или бегущая строка, не меняя дизайн»). Пока текст помещается —
   обычная строка; если шире поля — медленно едет туда-обратно, чтобы прочлось всё.
   При «уменьшить движение» остаётся срез с многоточием (CSS в styles.css). */
function FigMarquee({ children, style }) {
  const box = React.useRef(null);
  const [shift, setShift] = React.useState(0);
  React.useLayoutEffect(function () {
    const el = box.current; if (!el) return;
    const inner = el.firstElementChild; if (!inner) return;
    const d = inner.scrollWidth - el.clientWidth;
    const next = d > 6 ? d : 0;
    setShift(function (prev) { return prev === next ? prev : next; });
  });
  return (
    <span ref={box} className={"fig-marquee" + (shift ? " run" : "")}
      style={Object.assign({ display: "block", maxWidth: "100%", overflow: "hidden", whiteSpace: "nowrap" },
        shift ? { ["--mq-shift"]: "-" + shift + "px", ["--mq-dur"]: Math.max(4, Math.round(shift / 14)) + "s" } : {}, style || {})}>
      <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>{children}</span>
    </span>
  );
}

/* КАРТОЧКА-ТАБЛИЦА (Grouped Table View): r24, заливка карточки, дети — строки. */
function FigCard({ children, width, style }) {
  return (
    <div style={Object.assign({ width: width || "100%", flexShrink: 0, borderRadius: 24, background: "var(--surface)",
      overflow: "hidden", scrollSnapAlign: width ? "start" : "none" }, style || {})}>{children}</div>
  );
}

/* СТРОКА ГРУППЫ (My Group, 82). Аватар 44 в кольце + «Lvl. N» под ним; заголовок 17/400,
   категория 15/400, строка сведений; справа — чат и «…». Разделитель начинается ПОСЛЕ
   колонки аватара (в макете он привязан к «Contents», а не ко всей строке). */
function FigGroupRow({ group, first, onOpen, onChat, onMenu, badge }) {
  var g = group || {};
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", padding: "0 16px", minHeight: 82 }}>
      {!first && <span aria-hidden style={{ position: "absolute", left: 88, right: 0, top: 0, height: 1, background: "var(--line-2)" }} />}
      <button onClick={onOpen} className="tap" style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8,
        border: 0, background: "transparent", padding: "10px 0", cursor: "pointer", textAlign: "left", color: "var(--text)" }}>
        <span style={{ width: 48, display: "grid", placeItems: "center", gap: 4, flexShrink: 0 }}>
          <FigAvatarLvl avatar={g.avatar} name={g.name} size={44} level={g.level} pct={g.lvlPct || 0} unread={g.unread || 0} group />
          <FigLvlBadge level={g.level} />
        </span>
        <span style={{ flex: 1, minWidth: 0, display: "block" }}>
          <span style={{ display: "block", fontSize: 17, lineHeight: "22px", letterSpacing: "-0.43px", color: "var(--text)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
          {g.category ? <span style={{ display: "block", fontSize: 15, lineHeight: "20px", letterSpacing: "-0.23px", color: "var(--text-2)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.category}</span> : null}
          {badge ? <span style={{ display: "inline-block", marginTop: 2 }}>{badge}</span>
            : g.info ? <span style={{ display: "block", fontSize: 15, lineHeight: "20px", letterSpacing: "-0.23px", color: "var(--text-2)" }}>{g.info}</span> : null}
        </span>
      </button>
      <span style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0, paddingLeft: 8 }}>
        {onChat && <button onClick={onChat} className="tap" aria-label="Чат" style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer", color: "var(--text-2)", display: "grid", placeItems: "center" }}><I.MessageCircle size={21} strokeWidth={1.9} /></button>}
        {onMenu && <button onClick={onMenu} className="tap" aria-label="Ещё" style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer", color: "var(--text-2)", display: "grid", placeItems: "center" }}><I.More size={20} strokeWidth={2.2} /></button>}
      </span>
    </div>
  );
}

/* СТРОКА ЧЕЛОВЕКА (Friend Row, 68): аватар 44 в кольце + «Lvl. N», имя 17/400, статус 15/400. */
function FigFriendRow({ person, first, onOpen, onChat }) {
  var p = person || {};
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", padding: "0 16px", minHeight: 68 }}>
      {!first && <span aria-hidden style={{ position: "absolute", left: 88, right: 0, top: 0, height: 1, background: "var(--line-2)" }} />}
      <button onClick={onOpen} className="tap" style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8,
        border: 0, background: "transparent", padding: "10px 0", cursor: "pointer", textAlign: "left", color: "var(--text)" }}>
        <span style={{ width: 48, display: "grid", placeItems: "center", gap: 4, flexShrink: 0 }}>
          <FigAvatarLvl avatar={p.avatar} name={p.name} size={44} level={p.level} pct={p.lvlPct || 0} online={!!p.online} />
          <FigLvlBadge level={p.level} />
        </span>
        <span style={{ flex: 1, minWidth: 0, display: "block" }}>
          <span style={{ display: "block", fontSize: 17, lineHeight: "22px", letterSpacing: "-0.43px", color: "var(--text)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
          {p.status ? <span style={{ display: "block", fontSize: 15, lineHeight: "20px", letterSpacing: "-0.23px", color: "var(--text-2)" }}>{p.status}</span> : null}
        </span>
      </button>
      {onChat && <button onClick={onChat} className="tap" aria-label="Написать" style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer", color: "var(--text-2)", flexShrink: 0, display: "grid", placeItems: "center" }}><I.MessageCircle size={21} strokeWidth={1.9} /></button>}
    </div>
  );
}

/* ЛЮБИМАЯ ГРУППА: столбик 116 — аватар 96 в кольце, «Lvl. N», имя 13/400, категория 13/400,
   и место в рейтинге (1 с короной, дальше со стрелкой роста/падения). */
function FigFavGroup({ group, rank, trend, onOpen }) {
  var g = group || {};
  return (
    <button onClick={onOpen} className="tap" style={{ width: 116, flexShrink: 0, border: 0, background: "transparent", padding: 0,
      cursor: "pointer", display: "grid", justifyItems: "center", gap: 8, scrollSnapAlign: "start" }}>
      <FigAvatarLvl avatar={g.avatar} name={g.name} size={96} level={g.level} pct={g.lvlPct || 0} unread={g.unread || 0} group />
      <span style={{ display: "grid", justifyItems: "center", gap: 0, width: "100%" }}>
        <FigLvlBadge level={g.level} />
        <span style={{ fontSize: 13, lineHeight: "18px", letterSpacing: "-0.08px", color: "var(--text)", maxWidth: 108,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
        <span style={{ fontSize: 13, lineHeight: "18px", letterSpacing: "-0.08px", color: "var(--text-2)", maxWidth: 108,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.category || ""}</span>
        {rank ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 2, padding: "0 8px", height: 20,
            borderRadius: 999, background: "var(--surface-3)", fontSize: 13, fontWeight: 590, lineHeight: "18px", color: "var(--text)" }}>
            {rank}
            {rank === 1 ? <span aria-hidden style={{ fontSize: 12 }}>👑</span>
              : <I.ChevronRight size={12} strokeWidth={3} color={trend === "down" ? "var(--accent-red)" : "var(--accent)"}
                  style={{ transform: trend === "down" ? "rotate(90deg)" : "rotate(-90deg)" }} />}
          </span>
        ) : null}
      </span>
    </button>
  );
}

/* Значок-плашка (скидка, «цель закрывается»): r8, заливка цветом 10 %, текст 15/400. */
function FigBadge({ tone = "green", children, small }) {
  var map = { green: "var(--accent)", blue: "var(--accent-blue)", orange: "var(--accent-orange)", red: "var(--accent-red)" };
  var c = map[tone] || map.green;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", borderRadius: small ? 6 : 8, padding: small ? "2px 6px" : "4px 8px",
      background: "color-mix(in srgb, " + c + " 10%, transparent)", color: c, fontSize: 15, lineHeight: "20px", letterSpacing: "-0.23px" }}>{children}</span>
  );
}

/* Оценка «★ 5.0 (12)» — звезда 13 оранжевая, число 13/400, отзывы вторичным. */
function FigRating({ rate, count }) {
  if (rate == null) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, lineHeight: "18px", letterSpacing: "-0.08px" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <I.Star size={14} color="var(--accent-orange)" />
        <span style={{ color: "var(--text)" }}>{Number(rate).toFixed(1)}</span>
      </span>
      {count != null && <span style={{ color: "var(--text-2)" }}>{"(" + count + ")"}</span>}
    </span>
  );
}

/* Кнопка-таблетка внутри карточки: 34 высотой, r999, заливка --surface-3, текст 15/400. */
function FigPillButton({ children, onClick, filled, disabled, style }) {
  return (
    <button onClick={onClick} disabled={disabled} className={disabled ? undefined : "tap"}
      style={Object.assign({ width: "100%", height: 34, borderRadius: 999, border: 0, cursor: disabled ? "default" : "pointer",
        background: filled ? "var(--cta)" : "var(--surface-3)", color: filled ? "var(--cta-ink)" : "var(--text)",
        fontSize: 15, lineHeight: "20px", letterSpacing: "-0.23px", opacity: disabled ? 0.5 : 1,
        transition: "transform .18s cubic-bezier(0.34,1.4,0.44,1)" }, style || {})}>{children}</button>
  );
}

/* КАРТОЧКА МЕСТА/СОБЫТИЯ — 240 шириной: фото 160 с точками страниц, заголовок в две строки,
   оценка · город, цена в XP (со старой ценой), кнопка. */
function FigPlaceCard({ item, onOpen, onAct, wide }) {
  var it = item || {};
  var photos = it.photos && it.photos.length ? it.photos : (it.photo ? [it.photo] : []);
  var [pg, setPg] = React.useState(0);
  var railRef = React.useRef(null);
  var onScroll = () => { var el = railRef.current; if (!el) return; setPg(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))); };
  return (
    <div style={{ width: wide ? "100%" : 240, flexShrink: 0, borderRadius: 24, background: "var(--surface)", overflow: "hidden",
      display: "flex", flexDirection: "column", scrollSnapAlign: "start" }}>
      <div style={{ position: "relative", height: wide ? 180 : 160, background: "var(--surface-3)" }}>
        <div ref={railRef} onScroll={onScroll} style={{ display: "flex", height: "100%", overflowX: photos.length > 1 ? "auto" : "hidden",
          scrollSnapType: "x mandatory", scrollbarWidth: "none" }}>
          {(photos.length ? photos : [null]).map((src, i) => (
            <button key={i} onClick={onOpen} style={{ minWidth: "100%", height: "100%", border: 0, padding: 0, cursor: "pointer",
              scrollSnapAlign: "start", display: "grid", placeItems: "center",
              background: src ? ("url(" + JSON.stringify(src) + ") center/cover no-repeat")
                : (it.cover ? ("linear-gradient(150deg," + it.cover[0] + "," + it.cover[1] + ")") : "var(--surface-3)") }}>
              {!src && (it.coverEmoji
                ? <span style={{ fontSize: 54, lineHeight: 1 }}>{it.coverEmoji}</span>
                : <I.MapPin size={30} color="var(--text-3)" strokeWidth={1.6} />)}
            </button>
          ))}
        </div>
        {photos.length > 1 && (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 10, display: "flex", justifyContent: "center" }}>
            <span style={{ display: "inline-flex", gap: 8, alignItems: "center", height: 24, padding: "0 12px", borderRadius: 50,
              background: "rgba(0,0,0,0.28)", WebkitBackdropFilter: "blur(20px)", backdropFilter: "blur(20px)" }}>
              {photos.slice(0, 6).map((_, i) => (
                <span key={i} style={{ width: 8, height: 8, borderRadius: 50, background: i === pg ? "#FFFFFF" : "rgba(255,255,255,0.35)", transition: "background .2s" }} />
              ))}
            </span>
          </div>
        )}
      </div>
      <button onClick={onOpen} style={{ border: 0, background: "transparent", textAlign: "left", cursor: "pointer", padding: "10px 16px", display: "grid", gap: 4 }}>
        <span style={{ fontSize: 17, lineHeight: "22px", letterSpacing: "-0.43px", color: "var(--text)", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 44 }}>{it.title}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
          <FigRating rate={it.rate} count={it.reviews} />
          {it.city ? <React.Fragment><span style={{ fontSize: 15, color: "var(--text-2)" }}>·</span>
            <span style={{ fontSize: 15, lineHeight: "20px", letterSpacing: "-0.23px", color: "var(--text-2)" }}>{it.city}</span></React.Fragment> : null}
        </span>
      </button>
      <div style={{ marginTop: "auto", padding: "0 16px 16px", display: "grid", gap: 4 }}>
        {it.priceXP != null && (
          <span style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <span style={{ fontSize: 17, fontWeight: 590, lineHeight: "22px", letterSpacing: "-0.43px", color: "var(--text)" }}>{bosNumSpace(it.priceXP) + " XP"}</span>
            {it.oldXP != null && <span style={{ fontSize: 13, lineHeight: "18px", color: "var(--text-2)", textDecoration: "line-through" }}>{bosNumSpace(it.oldXP) + " XP"}</span>}
          </span>
        )}
        <FigPillButton onClick={onAct}>{it.cta || "Открыть"}</FigPillButton>
      </div>
    </div>
  );
}

/* КАРТОЧКА КУРСА — 340 шириной: значок 70, заголовок в две строки, строка сведений,
   партнёр с галочкой и оценкой, город, плашки скидок, цена ₽ зелёным + старая, рассрочка,
   кнопка. Оплаты пока НЕТ — кнопка ведёт в описание, а не в кассу (David: «курсы витрина»). */
function FigCourseCard({ item, onOpen, onAct }) {
  var it = item || {};
  return (
    <div style={{ width: 340, flexShrink: 0, borderRadius: 24, background: "var(--surface)", overflow: "hidden",
      display: "flex", flexDirection: "column", padding: "0 16px", scrollSnapAlign: "start" }}>
      <button onClick={onOpen} style={{ border: 0, background: "transparent", textAlign: "left", cursor: "pointer", padding: "16px 0 10px", display: "grid", gap: 8 }}>
        <span style={{ display: "flex", gap: 10 }}>
          <span style={{ width: 70, height: 70, borderRadius: 20, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 34,
            background: it.photo ? ("url(" + JSON.stringify(it.photo) + ") center/cover no-repeat") : (it.accent || "var(--surface-3)") }}>
            {it.photo ? "" : (it.emoji || "🎓")}
          </span>
          <span style={{ flex: 1, minWidth: 0, display: "grid", alignContent: "start" }}>
            <span style={{ fontSize: 17, lineHeight: "22px", letterSpacing: "-0.43px", color: "var(--text)", display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{it.title}</span>
            <span style={{ fontSize: 15, lineHeight: "20px", letterSpacing: "-0.23px", color: "var(--text-2)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.info}</span>
          </span>
        </span>
        {it.partner ? (
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FigAvatarLvl avatar={it.partnerAvatar} name={it.partner} size={28} level={null} ring={false} />
            <span style={{ minWidth: 0, display: "grid" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, lineHeight: "18px", color: "var(--text)" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.partner}</span>
                {it.verified && <I.CheckCircle size={14} color="var(--accent-blue)" filled />}
              </span>
              <FigRating rate={it.rate} count={it.reviews} />
            </span>
          </span>
        ) : null}
        {it.city ? <span style={{ fontSize: 15, lineHeight: "20px", letterSpacing: "-0.23px", color: "var(--text-2)" }}>{it.city}</span> : null}
      </button>
      <div style={{ marginTop: "auto", display: "grid", gap: 4, paddingBottom: 16 }}>
        {(it.discount || it.promo) && (
          <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {it.discount && <FigBadge tone="green">{it.discount}</FigBadge>}
            {it.promo && <FigBadge tone="blue">{it.promo}</FigBadge>}
          </span>
        )}
        {it.price != null && (
          <span style={{ display: "grid" }}>
            <span style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 700, lineHeight: "28px", letterSpacing: "-0.26px", color: "var(--accent)" }}>{it.price}</span>
              {it.oldPrice && <span style={{ fontSize: 15, lineHeight: "20px", color: "var(--text-2)", textDecoration: "line-through" }}>{it.oldPrice}</span>}
            </span>
            {it.monthly && <span style={{ fontSize: 15, lineHeight: "20px", letterSpacing: "-0.23px", color: "var(--text)" }}>{it.monthly}</span>}
          </span>
        )}
        <FigPillButton onClick={onAct} style={{ marginTop: 8 }}>{it.cta || "Подробнее"}</FigPillButton>
      </div>
    </div>
  );
}

/* ЧИПЫ (Badge Line): 36 высотой, r999, зазор 8, боковые 16; активный — светлая таблетка,
   остальные — стеклянные. Лента едет горизонтально: в макете она шире экрана. */
function FigChips({ items, value, onChange, style }) {
  return (
    <div className="fig-rail" style={Object.assign({ display: "flex", gap: 8, overflowX: "auto", padding: "0 16px 10px", scrollbarWidth: "none" }, style || {})}>
      {items.map(function (it) {
        var id = it[0], label = it[1], on = value === id;
        return (
          <button key={id} onClick={function () { onChange(id); }} className="tap" data-haptic="selection"
            style={{ flexShrink: 0, height: 36, borderRadius: 999, padding: "0 12px", border: 0, cursor: "pointer",
              fontSize: 17, lineHeight: "22px", letterSpacing: "-0.43px",
              background: on ? "var(--cta)" : "rgba(153,153,153,0.17)",
              color: on ? "var(--cta-ink)" : "var(--text)",
              WebkitBackdropFilter: "blur(20px)", backdropFilter: "blur(20px)",
              transition: "background .18s, color .18s" }}>{label}</button>
        );
      })}
    </div>
  );
}

/* ШАПКА ЭКРАНА (Toolbar - Top): заголовок 34/700 lh41 ls0.4, подпись 15/510 под ним,
   справа круглые кнопки 44 с зазором 10. */
function FigToolbar({ title, subtitle, right, style }) {
  return (
    <div style={Object.assign({ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, padding: "0 16px 10px" }, style || {})}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 34, fontWeight: 700, lineHeight: "41px", letterSpacing: "0.4px", color: "var(--text)" }}>{title}</div>
        {subtitle ? <div style={{ height: 20, display: "flex", alignItems: "center" }}>{subtitle}</div> : null}
      </div>
      {right ? <div style={{ display: "flex", gap: 10, flexShrink: 0, paddingTop: 0 }}>{right}</div> : null}
    </div>
  );
}

/* Круглая кнопка шапки 44 со стеклом. Счётчик — красная точка с числом, как в макете. */
function FigRoundButton({ icon, onClick, label, badge, style }) {
  return (
    <button onClick={onClick} className="tap" aria-label={label}
      style={Object.assign({ position: "relative", width: 44, height: 44, borderRadius: 999, border: 0, cursor: "pointer",
        display: "grid", placeItems: "center", color: "var(--text)",
        background: "rgba(153,153,153,0.17)", WebkitBackdropFilter: "blur(30px) saturate(1.8)", backdropFilter: "blur(30px) saturate(1.8)" }, style || {})}>
      {icon}
      {badge > 0 && (
        <span style={{ position: "absolute", top: -2, right: -2, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999,
          background: "var(--accent-red)", color: "#fff", fontSize: 12, fontWeight: 700, display: "grid", placeItems: "center",
          boxShadow: "0 0 0 2px var(--bg)" }}>{badge > 99 ? "99+" : badge}</span>
      )}
    </button>
  );
}

/* ПОЛЕ ПОИСКА (Text Field Search): 44 высотой, r26, заливка #767680 (24% в тёмной кадра,
   12% — её светлый двойник), лупа и текст 17/510.
   Справа — кнопка фильтров, если раздел их поддерживает. */
function FigSearchField({ value, onChange, placeholder, onFilter, filterOn, onCancel, autoFocus, style }) {
  var ref = React.useRef(null);
  React.useEffect(function () { if (autoFocus && ref.current) { try { ref.current.focus(); } catch (e) {} } }, [autoFocus]);
  return (
    <div style={Object.assign({ display: "flex", alignItems: "center", gap: 12, padding: "0 16px 10px" }, style || {})}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8, height: 44, borderRadius: 26,
        background: "var(--fig-fill, rgba(118,118,128,0.12))", padding: "0 10px 0 12px" }}>
        <I.Search size={17} strokeWidth={2.2} color="var(--text-2)" style={{ flexShrink: 0 }} />
        <input ref={ref} value={value} onChange={function (e) { onChange(e.target.value); }} placeholder={placeholder || "Поиск"}
          style={{ flex: 1, minWidth: 0, border: 0, outline: "none", background: "transparent", fontSize: 17, fontWeight: 510,
            letterSpacing: "-0.43px", color: "var(--text)" }} />
        {value ? (
          <button onClick={function () { onChange(""); }} className="tap" aria-label="Очистить"
            style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer", color: "var(--text-3)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <I.X size={15} strokeWidth={2.6} />
          </button>
        ) : null}
        {onFilter ? (
          <button onClick={onFilter} className="tap" aria-label="Фильтры"
            style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer", color: filterOn ? "var(--accent)" : "var(--text-2)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <I.Sliders size={20} strokeWidth={2} />
          </button>
        ) : null}
      </div>
      {onCancel ? (
        <button onClick={onCancel} className="tap" style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer",
          fontSize: 17, letterSpacing: "-0.43px", color: "var(--text)", flexShrink: 0 }}>Отмена</button>
      ) : null}
    </div>
  );
}

/* Разделение числа на разряды тонким пробелом — «2 500 XP», как в макете. */
function bosNumSpace(n) {
  var s = "" + Math.round(Number(n) || 0);
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/* Честная пустая комната: заголовок, объяснение, одно действие. Ни одной выдуманной цифры. */
/* Пустое состояние по узлу «Empty States» (кадр «Мои сообщества / Пустое»): НЕ карточка —
   сообщение прямо на фоне (заголовок + описание по центру, поле 32) и стеклянная
   кнопка 50 r1000 #767680 (24% тьма / 12% свет), а не чёрная CTA. */
function FigEmpty({ title, text, action, onAction, icon }) {
  return (
    <div style={{ padding: "48px 32px 40px", display: "grid", justifyItems: "center", gap: 8, textAlign: "center" }}>
      {icon ? <span style={{ marginBottom: 6, color: "var(--text-3)" }}>{icon}</span> : null}
      <div style={{ fontSize: 22, fontWeight: 700, lineHeight: "28px", letterSpacing: "-0.26px", color: "var(--text)" }}>{title}</div>
      {text ? <div style={{ fontSize: 15, lineHeight: "20px", letterSpacing: "-0.23px", color: "var(--text-2)", maxWidth: 300 }}>{text}</div> : null}
      {action ? <button onClick={onAction} className="tap" style={{ marginTop: 16, height: 50, padding: "0 24px", borderRadius: 999, border: 0,
        cursor: "pointer", background: "var(--fig-fill, rgba(118,118,128,0.12))", color: "var(--text)", fontSize: 17, fontWeight: 400, letterSpacing: "-0.43px" }}>{action}</button> : null}
    </div>
  );
}

/* ═══ КАЛЕНДАРЬ МЕСЯЦА — тот самый «другой календарь» из макетов ═══════════════════════
   В кадрах «Обзор группы» (Неделя · Месяц · День · Участники) стоит узел
   «Date and time - Pickers»: блок Date 361×325 + строка Time 361×52 с верхней линией
   #FFFFFF@0.17. Это стандартный встроенный календарь iOS, и раскладка 325 = 44 шапка +
   24 строка дней недели + 6 рядов по ~43. Здесь он собран ровно по этим числам.

   Наш слой поверх Apple: КАЖДЫЙ ДЕНЬ ОКРАШЕН ПРАВДОЙ. Точка под числом — насколько
   день закрыт: зелёная (все отметки), оранжевая (часть), красная (день был по плану и
   пропущен), пусто (нечего было делать). Ровно та же грамматика, что в неделе группы —
   человек не учит два языка.

   value  — выбранный день «YYYY-MM-DD»
   marks  — { "YYYY-MM-DD": "full" | "part" | "miss" }
   onPick — тап по дню (будущее не отдаём: отмечать вперёд нельзя)
   ═════════════════════════════════════════════════════════════════════════════════════ */
const FIG_MONTHS_RU = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
/* Неделя начинается с ВОСКРЕСЕНЬЯ — так в макете (кадр «Сегодня» группы: ВС ПН ВТ …),
   и так же устроена недельная лента в комнате. Два разных начала недели на одном экране
   были бы прямой ошибкой чтения. Подписи 13/590 вторичным цветом — из того же узла. */
const FIG_DOW_RU = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];
function figDayKey(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function FigMonthCalendar({ value, marks, onPick, minKey, footer }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayKey = figDayKey(today);
  const sel = value || todayKey;
  const selD = (function () { var p = ("" + sel).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); })();
  const [cursor, setCursor] = React.useState(function () { return new Date(selD.getFullYear(), selD.getMonth(), 1); });
  const [slide, setSlide] = React.useState(0);   // −1 назад · +1 вперёд — для въезда сетки
  React.useEffect(function () { setCursor(new Date(selD.getFullYear(), selD.getMonth(), 1)); }, [sel.slice(0, 7)]);

  const go = function (delta) {
    setSlide(delta);
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
    if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} }
  };
  // Сетка 6×7 от понедельника: в России неделя начинается с понедельника.
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const shift = first.getDay();
  const start = new Date(first); start.setDate(first.getDate() - shift);
  const cells = [];
  for (var i = 0; i < 42; i++) { var d = new Date(start); d.setDate(start.getDate() + i); cells.push(d); }
  const nextMonthStart = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  const canNext = nextMonthStart <= today;
  const canPrev = !minKey || figDayKey(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)) >= ("" + minKey).slice(0, 7) + "-01";
  const dotColor = { full: "var(--accent)", part: "var(--accent-orange)", miss: "var(--accent-red)" };

  return (
    <div style={{ width: "100%" }}>
      {/* ШАПКА 44: месяц и год слева, стрелки справа — как в системном календаре. */}
      <div style={{ display: "flex", alignItems: "center", height: 44 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 17, fontWeight: 590, letterSpacing: "-0.43px", color: "var(--text)" }}>
          {FIG_MONTHS_RU[cursor.getMonth()] + " " + cursor.getFullYear()}
        </span>
        <button onClick={function () { if (canPrev) go(-1); }} disabled={!canPrev} className={canPrev ? "tap" : undefined} aria-label="Прошлый месяц"
          style={{ width: 40, height: 44, border: 0, background: "transparent", cursor: canPrev ? "pointer" : "default", display: "grid", placeItems: "center", opacity: canPrev ? 1 : 0.3 }}>
          <I.ChevronRight size={18} strokeWidth={2.6} color="var(--text)" style={{ transform: "rotate(180deg)" }} />
        </button>
        <button onClick={function () { if (canNext) go(1); }} disabled={!canNext} className={canNext ? "tap" : undefined} aria-label="Следующий месяц"
          style={{ width: 40, height: 44, border: 0, background: "transparent", cursor: canNext ? "pointer" : "default", display: "grid", placeItems: "center", opacity: canNext ? 1 : 0.3 }}>
          <I.ChevronRight size={18} strokeWidth={2.6} color="var(--text)" />
        </button>
      </div>
      {/* СТРОКА ДНЕЙ НЕДЕЛИ 24 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", height: 24, alignItems: "center" }}>
        {FIG_DOW_RU.map(function (n) {
          return <span key={n} style={{ textAlign: "center", fontSize: 13, fontWeight: 590, lineHeight: "18px", color: "var(--text-3)" }}>{n}</span>;
        })}
      </div>
      {/* СЕТКА 6×7. Месяц въезжает с той стороны, откуда его позвали. */}
      <div key={cursor.getFullYear() + "-" + cursor.getMonth()} className="fig-month"
        style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: 43,
          animation: "figMonth" + (slide < 0 ? "Prev" : "Next") + " .26s cubic-bezier(0.22,0.9,0.3,1) both" }}>
        {cells.map(function (d, i) {
          var k = figDayKey(d);
          var out = d.getMonth() !== cursor.getMonth();
          var future = d > today;
          var isSel = k === sel;
          var isToday = k === todayKey;
          var mk = marks && marks[k];
          return (
            <button key={i} onClick={function () { if (!future && onPick) { onPick(k); if (window.tgHaptic) { try { window.tgHaptic("selection"); } catch (e) {} } } }}
              disabled={future} className={future ? undefined : "tap"} data-no-haptic
              style={{ border: 0, background: "transparent", padding: 0, cursor: future ? "default" : "pointer",
                display: "grid", placeItems: "center", position: "relative" }}>
              <span style={{ width: 36, height: 36, borderRadius: "50%", display: "grid", placeItems: "center",
                fontSize: 20, lineHeight: "24px", fontWeight: isToday ? 700 : 400, letterSpacing: "-0.45px",
                background: isSel ? "var(--cta)" : "transparent",
                color: isSel ? "var(--cta-ink)" : (future || out) ? "var(--text-3)" : (isToday ? "var(--accent)" : "var(--text)"),
                transition: "background .2s, color .2s" }}>{d.getDate()}</span>
              {mk && !isSel && <span aria-hidden style={{ position: "absolute", bottom: 3, width: 5, height: 5, borderRadius: "50%", background: dotColor[mk] || "var(--text-3)" }} />}
            </button>
          );
        })}
      </div>
      {/* СТРОКА ПОД КАЛЕНДАРЁМ 52 с верхней линией — в макете это блок «Time». */}
      {footer ? (
        <div style={{ minHeight: 52, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 5,
          borderTop: "1px solid var(--line-2)", marginTop: 4 }}>{footer}</div>
      ) : null}
    </div>
  );
}

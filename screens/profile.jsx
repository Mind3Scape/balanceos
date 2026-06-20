/* PROFILE / SETTINGS + sub-screens: Notifications, Support, Settings, Login/SignUp, Onboarding, AI/Insights.
   All system screens use semantic classes (.bos-sys-*) so they look right in BOTH light and dark themes. */
const { useState: useP } = React;

/* Theme-aware helpers used across system screens.
   In the dark theme the .bos-sys-card class flips its own bg & text. */
function SysCard({ children, style, className = "", ...rest }) {
  return <div className={"bos-sys-card " + className} style={style} {...rest}>{children}</div>;
}
function SysBtn({ children, style, className = "", ...rest }) {
  return <button className={"bos-sys-card tap " + className} style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px", textAlign: "left", width: "100%", cursor: "pointer", borderRadius: 22, ...style }} {...rest}>{children}</button>;
}

/* Sheet palette + a few small sheets used across the system screens (opened via useSheet). */
const sheetColors = (d) => d
  ? { text: "#fff", sub: "rgba(255,255,255,0.55)", line: "rgba(255,255,255,0.1)", btn: "#fff", btnFg: "#0a0a0a", field: "rgba(255,255,255,0.06)" }
  : { text: "#0a0a0a", sub: "rgba(0,0,0,0.5)", line: "rgba(0,0,0,0.08)", btn: "#0a0a0a", btnFg: "#fff", field: "#f5f5f7" };

function SheetDone({ C, label }) {
  return (
    <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.btn, color: C.btnFg, display: "grid", placeItems: "center", margin: "0 auto", fontSize: 24 }}>✓</div>
      <div style={{ fontSize: 15, fontWeight: 600, marginTop: 10 }}>{label}</div>
    </div>
  );
}

function InfoSheet({ title, body, cta = "Готово", dark = false }) {
  const { close } = useSheet();
  const C = sheetColors(dark);
  const [done, setDone] = useP(false);
  const act = () => { if (cta === "Готово") return close(); setDone(true); window.setTimeout(close, 1000); };
  return (
    <div style={{ padding: "2px 20px 6px", color: C.text }}>
      <div style={{ fontSize: 19, fontWeight: 700, textAlign: "center" }}>{title}</div>
      {done ? <SheetDone C={C} label="Готово"/> : (
        <>
          {body && <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.55, marginTop: 12 }}>{body}</div>}
          <button onClick={act} className="tap" style={{ width: "100%", marginTop: 16, background: C.btn, color: C.btnFg, border: 0, borderRadius: 999, padding: 13, fontSize: 15, fontWeight: 600 }}>{cta}</button>
        </>
      )}
    </div>
  );
}

function EditProfileSheet({ dark = false }) {
  const { close } = useSheet();
  const C = sheetColors(dark);
  const [name, setName] = useP("Павел");
  const [saved, setSaved] = useP(false);
  const save = () => { setSaved(true); window.setTimeout(close, 900); };
  return (
    <div style={{ padding: "2px 20px 6px", color: C.text }}>
      <div style={{ fontSize: 19, fontWeight: 700, textAlign: "center" }}>Профиль</div>
      {saved ? <SheetDone C={C} label="Сохранено"/> : (
        <>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
            <div style={{ width: 70, height: 70, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #ffd97a, #d97757)" }}/>
          </div>
          <div style={{ fontSize: 12, color: C.sub, margin: "16px 0 6px" }}>Имя</div>
          <input value={name} onChange={e => setName(e.target.value)} style={{ width: "100%", background: C.field, border: "1px solid " + C.line, borderRadius: 14, padding: 12, fontSize: 15, color: C.text, outline: "none", boxSizing: "border-box" }}/>
          <button onClick={save} className="tap" style={{ width: "100%", marginTop: 16, background: C.btn, color: C.btnFg, border: 0, borderRadius: 999, padding: 13, fontSize: 15, fontWeight: 600 }}>Сохранить</button>
        </>
      )}
    </div>
  );
}

function FeedbackSheet({ title = "Написать в поддержку", dark = false }) {
  const { close } = useSheet();
  const C = sheetColors(dark);
  const [txt, setTxt] = useP("");
  const [sent, setSent] = useP(false);
  const send = () => { setSent(true); window.setTimeout(close, 1000); };
  return (
    <div style={{ padding: "2px 20px 6px", color: C.text }}>
      {sent ? <SheetDone C={C} label="Отправлено"/> : (
        <>
          <div style={{ fontSize: 19, fontWeight: 700, textAlign: "center" }}>{title}</div>
          <textarea value={txt} onChange={e => setTxt(e.target.value)} placeholder="Опиши вопрос…" rows={4} style={{ width: "100%", marginTop: 14, background: C.field, border: "1px solid " + C.line, borderRadius: 14, padding: 12, fontSize: 14, color: C.text, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box" }}/>
          <button onClick={send} className="tap" style={{ width: "100%", marginTop: 12, background: C.btn, color: C.btnFg, border: 0, borderRadius: 999, padding: 13, fontSize: 15, fontWeight: 600 }}>Отправить</button>
        </>
      )}
    </div>
  );
}

function ProfileScreen() {
  const { navigate } = useNav();
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader onBack={() => navigate("home")} title="" right={
        <button onClick={() => navigate("settings")} className="icon-btn tap"
          aria-label="Настройки">
          <I.Settings size={18}/>
        </button>
      }/>

      <div style={{ textAlign: "center", marginTop: 4 }}>
        <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto" }}>
          {/* Level / energy progress ring — same language as the home avatar */}
          <svg width="140" height="140" viewBox="0 0 140 140" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="70" cy="70" r="65" stroke="var(--card-2)" strokeWidth="4" fill="none" />
            <circle cx="70" cy="70" r="65" stroke="#FEDE34" strokeWidth="4" fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 65}
              strokeDashoffset={2 * Math.PI * 65 * (1 - 0.72)} />
          </svg>
          <div style={{ position: "absolute", inset: 11, borderRadius: "50%", background: "url(./assets/sphere.png) center/cover no-repeat" }} />
          {/* Level badge */}
          <div style={{ position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)", background: "#0a0a0a", color: "#FEDE34", fontSize: 12, fontWeight: 700, letterSpacing: 0.3, padding: "4px 12px", borderRadius: 999, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5 }}>
            <I.Sparkles size={11} /> Уровень 7
          </div>
        </div>
        <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif", fontWeight: 700, fontSize: 28, marginTop: 20 }}>Павел Хиллсон</div>
        <div className="bos-sys-text-2" style={{ fontSize: 14 }}>tomhill@mail.com</div>
        {/* Quick stats — level energy + credits */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14 }}>
          {[
            { l: "Уровень", v: "7" },
            { l: "До 8 ур.", v: "72%" },
            { l: "Опыт", v: "1 240" },
          ].map((s, i) => (
            <div key={i} className="bos-sys-card" style={{ padding: "8px 16px", borderRadius: 16, minWidth: 72 }}>
              <div className="bos-sys-text-3" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>{s.l}</div>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.4px", marginTop: 1 }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <SysCard className="tap" onClick={() => navigate("achievements", { from: "profile" })} style={{ marginTop: 22, padding: 14, display: "flex", alignItems: "center", gap: 13, cursor: "pointer" }}>
        <span style={{ width: 42, height: 42, borderRadius: 13, background: "rgba(254,222,52,0.16)", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>🏅</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Достижения</div>
          <div className="bos-sys-text-3" style={{ fontSize: 12.5, marginTop: 2 }}>4 из 8 · открыли 3 круга контактов</div>
        </div>
        <div style={{ display: "flex", marginRight: 4 }}>
          {["⚡","🧘","🤝"].map((e, i) => <span key={i} style={{ width: 26, height: 26, borderRadius: 8, background: "var(--card-2)", display: "grid", placeItems: "center", fontSize: 13, marginLeft: i ? -7 : 0, border: "1.5px solid var(--card)" }}>{e}</span>)}
        </div>
        <I.ChevronRight size={18} className="bos-sys-text-2"/>
      </SysCard>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        {[
          { id: "settings", icon: I.Settings, label: "Настройки" },
          { id: "notifications", icon: I.Bell, label: "Уведомления" },
          { id: "history", icon: I.Clock, label: "История" },
          { id: "ai", icon: I.Sparkles, label: "ИИ-инсайты" },
          { id: "support", icon: I.Help, label: "Поддержка и помощь" },
        ].map(r => (
          <SysBtn key={r.id} onClick={() => navigate(r.id, { from: "profile" })}>
            <span className="bos-sys-chip-bg" style={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0 }}>
              {React.createElement(r.icon, { size: 16 })}
            </span>
            <span style={{ flex: 1, fontSize: 16, fontWeight: 500 }}>{r.label}</span>
            <I.ChevronRight size={18} className="bos-sys-text-2" />
          </SysBtn>
        ))}
        <SysBtn onClick={() => navigate("onboarding", { from: "profile" })} style={{ color: "#ef4444" }}>
          <span style={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0, background: "rgba(239,68,68,0.12)" }}>
            <I.Logout size={16} />
          </span>
          <span style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>Выйти</span>
        </SysBtn>
      </div>
    </div>
  );
}

function SettingsScreen() {
  const { navigate } = useNav();
  const app = useApp();
  const { open: openSheet } = useSheet();
  const routeDark = app?.themeOverride !== "light"; // settings is a dark route unless globally forced light
  const [push, setPush] = useP(true);
  const [sound, setSound] = useP(true);
  const isDark = app?.themeOverride === "dark";
  const setDark = (on) => app?.setThemeOverride(on ? "dark" : "light");
  const wheel = app?.wheelSpheres || (window.DEFAULT_SPHERES || []);
  const setWheel = (arr) => app?.setWheelSpheres && app.setWheelSpheres(arr);
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Настройки" onBack={() => navigate("profile")} />

      <div className="section-label">Аккаунт</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {[
          { label: "Редактировать профиль", icon: I.Pencil, on: () => openSheet(<EditProfileSheet dark={routeDark}/>) },
          { label: "Пароль", icon: I.Lock, on: () => openSheet(<InfoSheet title="Сменить пароль" body="Пришлём ссылку для смены пароля на твою почту — открой её на этом устройстве." cta="Отправить ссылку" dark={routeDark}/>) },
          { label: "Привязанные аккаунты", icon: I.Globe, on: () => openSheet(<InfoSheet title="Привязанные аккаунты" body="Google — подключён. Apple — не подключён. Через них можно входить без пароля." cta="Готово" dark={routeDark}/>) },
        ].map((r, i) => (
          <SysBtn key={i} onClick={r.on} style={{ padding: 14 }}>
            <span className="bos-sys-chip-bg" style={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0 }}>{React.createElement(r.icon, { size: 16 })}</span>
            <span style={{ flex: 1, fontSize: 15 }}>{r.label}</span>
            <I.ChevronRight size={16} className="bos-sys-text-2" />
          </SysBtn>
        ))}
      </div>

      <div className="section-label" style={{ marginTop: 22 }}>Предпочтения</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {[
          { label: "Push-уведомления", icon: I.Bell, val: push, set: setPush },
          { label: "Звук", icon: I.Volume, val: sound, set: setSound },
          { label: "Тёмная тема", icon: I.Eye, val: isDark, set: setDark },
        ].map((r, i) => (
          <div key={i} className="bos-sys-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: 14 }}>
            <span className="bos-sys-chip-bg" style={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0 }}>{React.createElement(r.icon, { size: 16 })}</span>
            <span style={{ flex: 1, fontSize: 15 }}>{r.label}</span>
            <Switch on={r.val} onChange={r.set} dark={isDark} />
          </div>
        ))}
      </div>

      <div className="section-label" style={{ marginTop: 22 }}>Главный экран</div>
      <div style={{ marginTop: 8 }}>
        <SysBtn onClick={() => navigate("home-customize")} style={{ padding: 14 }}>
          <span className="bos-sys-chip-bg" style={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0 }}><I.Home size={16} /></span>
          <span style={{ flex: 1, fontSize: 15 }}>Виджеты на главном</span>
          <I.ChevronRight size={16} className="bos-sys-text-2" />
        </SysBtn>
      </div>

      <div className="section-label" style={{ marginTop: 22 }}>Колесо баланса</div>
      <SysCard style={{ padding: 14, marginTop: 8 }}>
        <div className="bos-sys-text-2" style={{ fontSize: 12.5, lineHeight: 1.45, marginBottom: 12 }}>Выбери сферы, которые хочешь видеть в колесе на главной.</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(window.ALL_SPHERES || []).map((s) => {
            const sel = wheel.includes(s.id);
            const toggle = () => {
              if (sel) { if (wheel.length > 3) setWheel(wheel.filter(x => x !== s.id)); }
              else setWheel([...wheel, s.id]);
            };
            return (
              <button key={s.id} onClick={toggle} className="tap" style={{
                display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 13px", borderRadius: 999,
                fontSize: 13.5, fontWeight: 500, cursor: "pointer",
                background: sel ? "#FEDE34" : "var(--surface-3)",
                color: sel ? "#0a0a0a" : "var(--text-2)",
                border: 0, fontWeight: sel ? 600 : 500,
              }}>
                <span style={{ fontSize: 15 }}>{s.e}</span>{s.l}
              </button>
            );
          })}
        </div>
      </SysCard>

      <div className="section-label" style={{ marginTop: 22 }}>О приложении</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        <SysBtn onClick={() => navigate("manifest", { from: "settings" })} style={{ padding: 14 }}>
          <span className="bos-sys-chip-bg" style={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0 }}><I.Sparkles size={16} /></span>
          <span style={{ flex: 1, fontSize: 15 }}>Манифест</span>
          <I.ChevronRight size={16} className="bos-sys-text-2" />
        </SysBtn>
        {["Политика конфиденциальности", "Условия использования", "Версия 2.4.1"].map((l, i, a) => (
          i < a.length - 1 ? (
            <SysBtn key={i} onClick={() => openSheet(<InfoSheet title={l} body="Это демо-макет BalanceOS. Полный текст документа появится в релизной версии приложения." cta="Готово" dark={routeDark}/>)} style={{ padding: 14 }}>
              <span style={{ flex: 1, fontSize: 15 }}>{l}</span>
              <I.ChevronRight size={16} className="bos-sys-text-2" />
            </SysBtn>
          ) : (
            <div key={i} className="bos-sys-card" style={{ padding: 14, fontSize: 15 }} >
              <span className="bos-sys-text-2">{l}</span>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

function NotificationsScreen() {
  const { navigate, params } = useNav();
  const [items, setItems] = useP([
    { i: "🔥", t: "7 дней подряд!", b: "Ты в огне — продолжай завтра.", w: "Только что", new: true },
    { i: "👥", t: "Ник пригласил тебя в «Команду креаторов»", b: "Нажми, чтобы принять и присоединиться к цели.", w: "2 ч", new: true, go: "community" },
    { i: "🧘🏼‍♀️", t: "Напоминание о медитации", b: "Твоя сегодняшняя сессия в 09:30.", w: "5 ч" },
    { i: "✨", t: "Готов новый ИИ-инсайт", b: "Вечером у тебя самая высокая энергия.", w: "1 д", go: "ai" },
    { i: "📚", t: "Новый курс: Основы привычек", b: "2 минуты — начни когда угодно.", w: "2 д", go: "community" },
  ]);
  const tap = (n, idx) => {
    setItems(list => list.map((x, j) => j === idx ? { ...x, new: false } : x));
    if (n.go) navigate(n.go);
  };
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Уведомления" onBack={() => navigate(params?.from || "profile")} right={
        items.length > 0 ? <button onClick={() => setItems([])} className="tap bos-sys-text-2" style={{ background: "transparent", border: 0, fontSize: 13 }}>Очистить</button> : null
      }/>
      {items.length === 0 ? (
        <div className="bos-sys-text-3" style={{ textAlign: "center", padding: "60px 20px", fontSize: 14 }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>🔔</div>
          Новых уведомлений нет
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((n, i) => (
            <SysCard key={i} onClick={() => tap(n, i)} style={{ padding: 14, display: "flex", gap: 12, cursor: "pointer" }}>
              <span style={{ fontSize: 26 }}>{n.i}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{n.t}</span>
                  {n.new && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FEDE34" }} />}
                </div>
                <div className="bos-sys-text-2" style={{ fontSize: 13, marginTop: 2 }}>{n.b}</div>
                <div className="bos-sys-text-3" style={{ fontSize: 11, marginTop: 6 }}>{n.w}</div>
              </div>
              {n.go && <I.ChevronRight size={16} className="bos-sys-text-3" style={{ alignSelf: "center" }} />}
            </SysCard>
          ))}
        </div>
      )}
    </div>
  );
}

/* One calendar day-ring: faint track + progress arc (shared #calRing gradient).
   pct 0..1; `glow` lights a full ring up for a perfect day. */
function DayRing({ pct, track, sw = 3, glow }) {
  const r = 16, C = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 40 40" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
      <circle cx="20" cy="20" r={r} fill="none" stroke={track} strokeWidth={sw} />
      {pct > 0 && <circle cx="20" cy="20" r={r} fill="none" stroke="url(#calRing)" strokeWidth={sw} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={glow ? { filter: "drop-shadow(0 0 1.5px rgba(239,159,20,0.75))" } : undefined} />}
    </svg>
  );
}

function HistoryScreen() {
  const { navigate } = useNav();
  const app = useApp();

  // Detect theme from wrapper class so all calendar visuals stay coherent.
  const wrapRef = React.useRef(null);
  const [isDark, setIsDark] = useP(false);
  React.useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    let n = el.parentElement;
    while (n && !n.classList.contains("theme-light") && !n.classList.contains("theme-dark")) n = n.parentElement;
    setIsDark(!!(n && n.classList.contains("theme-dark")));
  }, []);

  // Theme tokens shared across the page
  const TH = isDark ? {
    cellEmpty: "rgba(255,255,255,0.05)",
    cellIdle:  "rgba(255,255,255,0.10)",
    ringTrack: "rgba(255,255,255,0.13)",
    cellSelBg: "rgba(255,255,255,0.16)",
    todayBg: "#ffffff", todayFg: "#0a0a0a",
    cellBorder:"rgba(255,255,255,0.10)",
    cellText:  "#fff",
    cellMuted: "rgba(255,255,255,0.45)",
    yellowFill:"linear-gradient(160deg, #FEDE34, #EF9F14)",
    yellow:    "#FEDE34",
    chipBg:    "rgba(255,255,255,0.06)",
    progressBg:"rgba(255,255,255,0.08)",
    iconBg:    "rgba(255,255,255,0.06)",
    outlineSel:"#fff",
    outlineToday:"rgba(255,255,255,0.45)",
    moodText:  "rgba(0,0,0,0.75)", // emoji bg is colored so dark text reads
  } : {
    cellEmpty: "transparent",
    cellIdle:  "#f5f5f5",
    ringTrack: "rgba(0,0,0,0.09)",
    cellSelBg: "rgba(0,0,0,0.07)",
    todayBg: "#0a0a0a", todayFg: "#ffffff",
    cellBorder:"rgba(0,0,0,0.06)",
    cellText:  "var(--text)",
    cellMuted: "var(--text-4)",
    yellowFill:"linear-gradient(160deg, #FEDE34, #EF9F14)",
    yellow:    "#FEDE34",
    chipBg:    "var(--surface-3)",
    progressBg:"var(--surface-3)",
    iconBg:    "var(--surface-3)",
    outlineSel:"#0a0a0a",
    outlineToday:"rgba(0,0,0,0.35)",
    moodText:  "rgba(0,0,0,0.75)",
  };

  const MONTHS = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  const DIM = [31,28,31,30,31,30,31,31,30,31,30,31];
  const CUR_M = 3; // April is "this month" in the demo
  const today = 28;
  const year = 2026;
  const [mIdx, setMIdx] = useP(CUR_M);
  const monthName = MONTHS[mIdx];
  const daysInMonth = DIM[mIdx];
  const startWeekday = (mIdx * 3 + 3) % 7; // synthetic but stable per month
  const isCurMonth = mIdx === CUR_M;
  const isFuture = mIdx > CUR_M;
  const lastLogged = isCurMonth ? today : daysInMonth; // past months fully logged; this one up to today

  const completion = (d) => {
    if (isFuture || d > lastLogged) return null;
    const v = (Math.sin((d + mIdx * 7) * 13.37) + 1) / 2;
    return Math.round(v * 6) / 6;
  };

  const [selDay, setSelDay] = useP(today);

  const cellStyle = (pct) => {
    if (pct == null) return { background: TH.cellEmpty, border: "1px dashed " + TH.cellBorder, color: TH.cellMuted };
    if (pct === 0)   return { background: TH.cellIdle, color: TH.cellMuted };
    if (pct < 1) {
      const h = Math.round(pct * 100);
      // Fill rises from the bottom (amber → yellow) with a crisp level line on
      // top — reads instantly as "how full the day is", no diagonal.
      return {
        background: `linear-gradient(to top, #EF9F14 0%, #FEDE34 ${h}%, ${TH.cellIdle} ${h}%)`,
        color: TH.cellText,
      };
    }
    return { background: "linear-gradient(to top, #EF9F14, #FEDE34)", color: "#0a0a0a" };
  };

  const blanks = Array.from({ length: startWeekday }, (_, i) => ({ blank: true, key: "b" + i }));
  const days = Array.from({ length: daysInMonth }, (_, i) => ({ d: i + 1, key: "d" + (i + 1) }));
  const cells = [...blanks, ...days];
  const weekday = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];

  const dayHabits = [
    { e: "🙏", n: "Помогать другим", on: true },
    { e: "🧘🏼‍♀️", n: "Медитация", on: true },
    { e: "🏃🏼‍♀️", n: "Утренняя пробежка", on: true },
    { e: "📚", n: "Читать книгу", on: false },
    { e: "✍🏼", n: "Бумажный дневник", on: false },
    { e: "🥊", n: "Бокс", on: true },
  ];
  const selPct = completion(selDay);

  const totalDone = days.reduce((s, d) => s + (completion(d.d) || 0) * dayHabits.length, 0);
  const perfectDays = days.filter(d => completion(d.d) === 1).length;
  const bestStreak = 21;

  return (
    <div ref={wrapRef} className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="История" onBack={() => navigate("home")} />

      {/* Stat strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {[
          { l: "Лучшая серия", v: bestStreak + "д" },
          { l: "Идеальных дней", v: perfectDays },
          { l: "Всего привычек", v: Math.round(totalDone) },
        ].map((s, i) => (
          <SysCard key={i} style={{ padding: "12px 14px" }}>
            <div className="bos-sys-text-3" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{s.l}</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2, letterSpacing: "-0.4px" }}>{s.v}</div>
          </SysCard>
        ))}
      </div>

      {/* Month calendar */}
      <SysCard style={{ padding: 16, marginTop: 12, borderRadius: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => setMIdx(m => Math.max(0, m - 1))} className="tap" style={{ background: TH.chipBg, border: 0, borderRadius: 999, width: 32, height: 32, display: "grid", placeItems: "center", color: "inherit", opacity: mIdx === 0 ? 0.35 : 1 }}>
            <I.ChevronLeft size={16}/>
          </button>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.3px" }}>{monthName} {year}</div>
          <button onClick={() => setMIdx(m => Math.min(11, m + 1))} className="tap" style={{ background: TH.chipBg, border: 0, borderRadius: 999, width: 32, height: 32, display: "grid", placeItems: "center", color: "inherit", opacity: mIdx === 11 ? 0.35 : 1 }}>
            <I.ChevronRight size={16}/>
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginTop: 14 }}>
          {weekday.map((w, i) => (
            <div key={i} className="bos-sys-text-3" style={{ textAlign: "center", fontSize: 10.5, fontWeight: 600, letterSpacing: 0.6 }}>{w}</div>
          ))}
        </div>

        {/* Shared gradient for every day-ring */}
        <svg width="0" height="0" aria-hidden style={{ position: "absolute" }}>
          <defs>
            <linearGradient id="calRing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FFD93B" /><stop offset="1" stopColor="#FFC400" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginTop: 6 }}>
          {cells.map(c => {
            if (c.blank) return <span key={c.key} aria-hidden style={{ aspectRatio: "1/1" }}/>;
            const pct = completion(c.d);
            const future = pct == null;
            const isSelected = selDay === c.d;
            const isToday = isCurMonth && c.d === today;
            return (
              <button key={c.key} onClick={() => setSelDay(c.d)} className="tap"
                style={{
                  aspectRatio: "1/1", border: 0, borderRadius: "50%", padding: 0,
                  display: "grid", placeItems: "center", position: "relative",
                  fontSize: 13, fontWeight: isToday ? 700 : 500, cursor: "pointer",
                  background: "transparent",
                  color: future ? TH.cellMuted : (isToday ? TH.todayFg : TH.cellText),
                }}>
                {isToday
                  ? <span aria-hidden style={{ position: "absolute", width: "62%", aspectRatio: "1/1", borderRadius: "50%", background: TH.todayBg }}/>
                  : isSelected && <span aria-hidden style={{ position: "absolute", width: "64%", aspectRatio: "1/1", borderRadius: "50%", background: TH.cellSelBg }}/>}
                {future
                  ? <span aria-hidden style={{ position: "absolute", inset: "17%", borderRadius: "50%", border: "1px dashed " + TH.cellBorder }}/>
                  : <DayRing pct={pct} track={TH.ringTrack} glow={pct === 1} />}
                <span style={{ position: "relative", zIndex: 1 }}>{c.d}</span>
                {isCurMonth && app?.dayMoods?.[c.d] != null && pct != null && (
                  <span aria-hidden style={{ position: "absolute", top: 0, right: 0, lineHeight: 0 }}>
                    <StaticOrb size={10} tint={tintFromMood(MOOD_OPTIONS[app.dayMoods[c.d]].c)} seed={1.2} intensity={0.55} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
          <span className="bos-sys-text-3" style={{ fontSize: 11 }}>Меньше</span>
          <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
            {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
              <span key={i} style={{ position: "relative", width: 16, height: 16, display: "inline-block" }}>
                <DayRing pct={p} track={TH.ringTrack} sw={3.4} glow={p === 1} />
              </span>
            ))}
          </div>
          <span className="bos-sys-text-3" style={{ fontSize: 11 }}>Больше</span>
        </div>
      </SysCard>

      {/* Day detail */}
      <div className="section-label" style={{ marginTop: 22, padding: "0 4px" }}>
        {monthName} {selDay} · {selPct == null ? "Будущее" : selPct === 1 ? "Идеальный день ✨" : selPct === 0 ? "Пропущен" : `${Math.round(selPct * 100)}%`}
      </div>
      <SysCard style={{ marginTop: 8, borderRadius: 22, overflow: "hidden", padding: 0 }}>
        {selPct == null ? (
          <div className="bos-sys-text-3" style={{ padding: 24, textAlign: "center", fontSize: 14 }}>Этот день ещё не наступил.</div>
        ) : (
          <>
            <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--line)" }}>
              <div style={{ flex: 1 }}>
                <div className="bos-sys-text-2" style={{ fontSize: 13 }}>{Math.round(selPct * dayHabits.length)} из {dayHabits.length} привычек</div>
                <div style={{ marginTop: 6, height: 8, background: TH.progressBg, borderRadius: 999, overflow: "hidden" }}>
                  <span style={{ display: "block", height: "100%", width: (selPct * 100) + "%", background: TH.yellowFill, borderRadius: 999 }}/>
                </div>
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px" }}>{Math.round(selPct * 100)}%</span>
            </div>
            {app?.dayMoods?.[selDay] != null && (() => {
              const dm = MOOD_OPTIONS[app.dayMoods[selDay]];
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
                  <span style={{ width: 36, height: 36, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <StaticOrb size={34} tint={tintFromMood(dm.c)} seed={1.2} intensity={0.7} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div className="bos-sys-text-3" style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Состояние</div>
                    <div style={{ fontSize: 15, fontWeight: 500, marginTop: 2 }}>{dm.t}</div>
                  </div>
                </div>
              );
            })()}
            {app?.dayNotes?.[selDay] && ((app.dayNotes[selDay].tags && app.dayNotes[selDay].tags.length) || app.dayNotes[selDay].note) && (
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
                <div className="bos-sys-text-3" style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Журнал</div>
                {app.dayNotes[selDay].tags && app.dayNotes[selDay].tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {app.dayNotes[selDay].tags.map((tg, k) => (
                      <span key={k} style={{ fontSize: 12.5, padding: "5px 10px", borderRadius: 999, background: TH.iconBg }}>#{tg}</span>
                    ))}
                  </div>
                )}
                {app.dayNotes[selDay].note && (
                  <div className="bos-sys-text-2" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.45 }}>{app.dayNotes[selDay].note}</div>
                )}
              </div>
            )}
            {dayHabits.map((h, i) => {
              const done = i < Math.round(selPct * dayHabits.length);
              return (
                <div key={i}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
                    <span style={{ width: 36, height: 36, borderRadius: 11, background: TH.iconBg, display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0 }}>{h.e}</span>
                    <span style={{ flex: 1, fontSize: 15, letterSpacing: "-0.2px" }}>{h.n}</span>
                    <span style={{
                      width: 26, height: 26, borderRadius: "50%",
                      background: done ? "var(--check-color, var(--accent))" : "transparent",
                      border: done ? 0 : "2px solid " + (isDark ? "rgba(255,255,255,0.35)" : "var(--text-5)"),
                      display: "grid", placeItems: "center",
                    }}>
                      {done && <I.Check size={14} strokeWidth={2.5} color="#fff"/>}
                    </span>
                  </div>
                  {i < dayHabits.length - 1 && <div className="divider"/>}
                </div>
              );
            })}
          </>
        )}
      </SysCard>
    </div>
  );
}

function SupportScreen() {
  const { navigate } = useNav();
  const app = useApp();
  const { open: openSheet } = useSheet();
  const routeDark = app?.themeOverride !== "light";
  const [q, setQ] = useP("");
  const [openFaq, setOpenFaq] = useP(null);
  const FAQ = [
    { q: "Как работают серии", a: "Серия растёт на 1 за каждый день, когда выполнена хотя бы одна привычка. Пропустишь день — серия обнуляется, но история сохраняется." },
    { q: "Приглашение команды", a: "Открой команду → шестерёнка → раздел «Участники» → выбери друга из подсказок. Он получит уведомление и сможет присоединиться к общей цели." },
    { q: "Конфиденциальность и данные", a: "Твои данные о привычках видны только тебе. В команде друзья видят лишь отметки по общим привычкам — не личные." },
    { q: "Подключение Apple Health", a: "Настройки → Привязанные аккаунты. После подключения шаги и тренировки будут автоматически отмечать связанные привычки." },
    { q: "Отмена подписки", a: "Подписка управляется в App Store: Настройки телефона → Apple ID → Подписки → BalanceOS → Отменить." },
  ].filter(f => !q || f.q.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Поддержка и помощь" onBack={() => navigate("profile")} />
      <SysCard style={{ padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <I.Search size={18} className="bos-sys-text-2"/>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск по статьям" className="bos-sys-text-2"
          style={{ flex: 1, border: 0, outline: 0, background: "transparent", fontSize: 15, color: "inherit" }}/>
      </SysCard>
      <div className="section-label" style={{ marginTop: 22 }}>Популярные темы</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {FAQ.map((f,i)=>(
          <div key={i}>
            <SysBtn onClick={() => setOpenFaq(o => o === f.q ? null : f.q)} style={{ padding: 14 }}>
              <span style={{ flex: 1, fontSize: 15 }}>{f.q}</span>
              <I.ChevronRight size={16} className="bos-sys-text-2" style={{ transform: openFaq === f.q ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}/>
            </SysBtn>
            {openFaq === f.q && (
              <div className="bos-sys-text-2" style={{ fontSize: 13.5, lineHeight: 1.55, padding: "10px 16px 2px" }}>{f.a}</div>
            )}
          </div>
        ))}
        {FAQ.length === 0 && <div className="bos-sys-text-3" style={{ fontSize: 14, padding: "8px 4px" }}>Ничего не найдено. Напиши нам ниже.</div>}
      </div>
      <div className="section-label" style={{ marginTop: 22 }}>Свяжитесь с нами</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
        <SysCard onClick={() => openSheet(<FeedbackSheet title="Написать нам" dark={routeDark}/>)} style={{ padding: 18, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6, cursor: "pointer" }}>
          <I.Mail size={20}/>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Написать нам</span>
          <span className="bos-sys-text-2" style={{ fontSize: 12 }}>support@balanceos.app</span>
        </SysCard>
        <SysCard onClick={() => openSheet(<FeedbackSheet title="Чат поддержки" dark={routeDark}/>)} style={{ padding: 18, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6, cursor: "pointer" }}>
          <I.MessageCircle size={20}/>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Чат поддержки</span>
          <span className="bos-sys-text-2" style={{ fontSize: 12 }}>Ответ в среднем 5 мин</span>
        </SysCard>
      </div>
    </div>
  );
}

function AIScreen() {
  const { navigate } = useNav();
  const app = useApp();
  const t = useAIT();
  const [ask, setAsk] = useP("");
  // Interactivity: which insight/pattern is expanded, which insights were accepted,
  // and whether the hero's "why" reasoning panel is open. Makes the screen feel live.
  const [openInsight, setOpenInsight] = useP(null);
  const [accepted, setAccepted] = useP({});
  const [openPattern, setOpenPattern] = useP(null);
  const [showWhy, setShowWhy] = useP(false);
  const [health, setHealth] = useP(false); // Apple Health mock-connect (fresh user)
  // Same orb DNA as intro — pulled into the AI hub
  const orbTint = ["#cfe1ff", "#7aa4d0", "#1a2c48"];

  // ── New user: near-empty AI — calm intro + connect Apple Health, no fake data ──
  if (app?.mode === "fresh") {
    return (
      <div className="page-in" style={{ padding: "0 12px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 4px 14px" }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-4)", letterSpacing: 0.4 }}>Твой помощник</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.5px", marginTop: 2 }}>Balance AI</div>
          </div>
        </div>

        {/* Calm empty hero — orb + honest "I don't know you yet" */}
        <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(160deg, #0e1a2e 0%, #0a1424 100%)", borderRadius: 28, padding: "26px 22px 28px", color: "#fff", textAlign: "center" }}>
          <div aria-hidden style={{ position: "absolute", inset: 0, background:
            "radial-gradient(circle at 80% 20%, rgba(180,210,255,0.18) 0%, transparent 40%), radial-gradient(circle at 10% 90%, rgba(120,160,210,0.15) 0%, transparent 40%)" }} />
          <div style={{ position: "relative", display: "grid", placeItems: "center" }}>
            <svg viewBox="-80 -80 160 160" width="112" height="112" style={{ overflow: "visible" }}>
              <SiriOrb r={42} tint={orbTint} t={t} intensity={1}/>
            </svg>
            <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 21, lineHeight: 1.25, marginTop: 4, letterSpacing: "-0.3px" }}>Привет! Я твой ИИ-помощник.</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 8, lineHeight: 1.5, maxWidth: 270 }}>Пока я почти ничего о тебе не знаю. Дай немного данных — и я начну подсказывать точно под тебя.</div>
          </div>
        </div>

        {/* Apple Health — the key offer for a newcomer */}
        <div style={{ background: "var(--card)", borderRadius: 22, padding: 16, marginTop: 12, boxShadow: "var(--card-shadow)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: "linear-gradient(135deg,#ff5a6e,#ff2d55)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <I.Heart size={24} color="#fff" fill="#fff"/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600, color: "var(--text)" }}>Связать Apple Здоровье</div>
              <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 2, lineHeight: 1.45 }}>Подтяну сон, движение и состояние — советы станут точными с первого дня.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 13, flexWrap: "wrap" }}>
            {[["😴","Сон"],["🚶","Движение"],["❤️","Пульс"],["🧠","Состояние"]].map((s,i)=>(
              <span key={i} style={{ fontSize: 12, fontWeight: 500, color: "var(--text-2)", background: "var(--surface-3)", borderRadius: 999, padding: "5px 11px", display: "inline-flex", alignItems: "center", gap: 6 }}><span>{s[0]}</span>{s[1]}</span>
            ))}
          </div>
          {health ? (
            <div className="bos-acc-in" style={{ marginTop: 13, fontSize: 12.5, color: "#1e6b3a", background: "#e5f5ea", borderRadius: 14, padding: "11px 13px", display: "flex", alignItems: "center", gap: 9, lineHeight: 1.4 }}>
              <I.Check size={16} strokeWidth={2.5}/> Доступ запросим при установке на iPhone — тогда синхронизация включится.
            </div>
          ) : (
            <button onClick={() => { setHealth(true); if (window.tgHaptic) tgHaptic("light"); }} className="tap"
              style={{ width: "100%", marginTop: 13, background: "#0a0a0a", color: "#fff", border: 0, borderRadius: 999, padding: 13, fontSize: 14.5, fontWeight: 600 }}>Подключить</button>
          )}
        </div>

        {/* Tell about yourself → chat */}
        <button onClick={() => navigate("ai-chat", { prompt: "Расскажу немного о себе и своих целях" })} className="tap"
          style={{ width: "100%", marginTop: 10, background: "var(--card)", border: 0, borderRadius: 22, padding: 16, boxShadow: "var(--card-shadow)", display: "flex", alignItems: "center", gap: 13, textAlign: "left", color: "var(--text)" }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, background: "var(--surface-3)", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>💬</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 600 }}>Рассказать о себе</div>
            <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 2, lineHeight: 1.45 }}>Пара минут — и ИИ узнает твои цели и ритм дня.</div>
          </div>
          <I.ChevronRight size={18} color="var(--text-4)"/>
        </button>

        <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-4)", marginTop: 18, padding: "0 24px", lineHeight: 1.5 }}>
          Инсайты и закономерности появятся здесь, когда наберётся немного данных.
        </div>
      </div>
    );
  }

  const insights = [
    { i: "🌅", t: "Перенеси «Чтение» на вечер", b: "Твоя вероятность выполнения в 21:00 в 2,1× выше, чем в 7:00.", lift: "+38%",
      why: "За 14 дней утренние попытки закрываются на 31%, а вечерние (после 21:00) — на 66%. Вечер для тебя стабильнее.",
      stats: [["📊", "14 дней"], ["🌙", "×2,1 вечером"]], action: "Перенести на 21:00", doneText: "Перенесено на вечер" },
    { i: "🤝", t: "Опирайся на Лену", b: "Привычки с Леной держат серию 91%. Сегодня она онлайн.", lift: "+24%",
      why: "Парные привычки с Леной держатся на 91% против 64%, когда ты один. Совместный день почти не пропускается.",
      stats: [["🤝", "91% вместе"], ["🟢", "онлайн"]], action: "Позвать Лену", doneText: "Лена приглашена" },
    { i: "🧘", t: "Двухминутная перезагрузка", b: "По понедельникам падение 60%. Начни с 2-минутной медитации перед первой задачей.", lift: "+19%",
      why: "Понедельник — твой самый слабый день (−60%). Короткий старт на 2 минуты поднимает выполнение всего дня на 19%.",
      stats: [["📉", "Пн −60%"], ["⏱", "2 мин"]], action: "Поставить на завтра", doneText: "Добавлено на завтра" },
  ];

  const patterns = [
    { t: "Спокойные дни = глубокое чтение", b: "В состоянии «Спокойствие» ты читаешь в 2,3× больше страниц.", c: "#cfe1ff",
      d: "За месяц: 7 спокойных дней → в среднем 23 страницы за сессию. В тревожные дни — 9. Состояние сильно влияет на чтение." },
    { t: "Кардио после 17:00", b: "Тренировки после 17:00 завершаются в 84% случаев.", c: "#9bbfe8",
      d: "Из 12 вечерних тренировок завершены 10. Утренних — только 5 из 11. Твоё тело явно «вечернее» для нагрузки." },
    { t: "Групповые дни сильнее", b: "Когда команда отмечается, +1,4× к выполнению.", c: "#7aa4d0",
      d: "В дни, когда команда активна до полудня, твой день закрывается в 1,4× чаще. Чужой ритм незаметно держит тебя." },
  ];

  // Tiny 7-day completion sparkline
  const week = [0.4, 0.65, 0.55, 0.8, 0.72, 0.9, 0.78];
  const days = ["П","В","С","Ч","П","С","В"];

  const quickPrompts = [
    "Спланируй мою идеальную среду",
    "Почему я пропустил пробежки на этой неделе?",
    "Предложи план сна на 2 недели",
    "Какой мой следующий рубеж?",
  ];

  return (
    <div className="page-in" style={{ padding: "0 12px 24px" }}>
      {/* Header — tab-style, no back button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 4px 14px" }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-4)", letterSpacing: 0.4 }}>Персонально · для Павла</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.5px", marginTop: 2 }}>Balance AI</div>
        </div>
        <button onClick={() => navigate("ai-chat")} className="tap"
          style={{ height: 36, padding: "0 14px", borderRadius: 999, background: "#0a0a0a", color: "#fff", border: 0, fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <I.MessageCircle size={14}/> Чат
        </button>
      </div>

      {/* Hero — orb + headline insight */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(160deg, #0e1a2e 0%, #0a1424 100%)",
        borderRadius: 28, padding: "22px 22px 24px", color: "#fff",
      }}>
        {/* Background stars (subtle) */}
        <div aria-hidden style={{ position: "absolute", inset: 0, background:
          "radial-gradient(circle at 80% 20%, rgba(180,210,255,0.18) 0%, transparent 40%), radial-gradient(circle at 10% 90%, rgba(120,160,210,0.15) 0%, transparent 40%)" }} />

        <div style={{ display: "flex", gap: 16, alignItems: "center", position: "relative" }}>
          {/* Mini Siri orb — using same component as intro */}
          <div style={{ flexShrink: 0, width: 120, height: 120, display: "grid", placeItems: "center" }}>
            <svg viewBox="-80 -80 160 160" width="120" height="120" style={{ overflow: "visible" }}>
              <SiriOrb r={42} tint={orbTint} t={t} intensity={1}/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "rgba(180,210,255,0.85)", fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase" }}>Чтение дня</div>
            <div style={{ fontFamily: "var(--bos-title-font)", fontSize: 22, lineHeight: 1.2, marginTop: 6, letterSpacing: "-0.3px" }}>
              Ты спокойнее<br/>после прогулок.
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)", marginTop: 8, lineHeight: 1.5 }}>
              По средам ты гуляешь и медитируешь. Настроение растёт на 41%.
            </div>
          </div>
        </div>

        {/* CTA row */}
        <div style={{ display: "flex", gap: 8, marginTop: 16, position: "relative" }}>
          <button onClick={() => navigate("ai-chat")} className="tap"
            style={{ flex: 1, background: "var(--card)", color: "#0a1424", border: 0, borderRadius: 999, padding: "11px 14px", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <I.Sparkles size={14}/> Спланировать день
          </button>
          <button onClick={() => setShowWhy(v => !v)} className="tap"
            style={{ background: showWhy ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 999, padding: "11px 14px", fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 5 }}>
            Почему? <I.ChevronRight size={13} style={{ transform: showWhy ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}/>
          </button>
        </div>

        {/* Reasoning panel — the AI shows its work behind the headline insight */}
        {showWhy && (
          <div className="bos-acc-in" style={{ marginTop: 12, padding: "12px 14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, position: "relative" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "rgba(180,210,255,0.85)" }}>Как я это вижу</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.82)", marginTop: 6, lineHeight: 1.5 }}>
              Смотрю на 14 дней твоих отметок и состояния. После прогулок настроение растёт на 41%, а сон — на 0,6 ч. Связь устойчивая — поэтому прогулки сейчас в приоритете.
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              {[["🚶","14 прогулок"],["😌","+41% настроение"],["😴","+0,6 ч сон"]].map((s,i)=>(
                <span key={i} style={{ fontSize: 11.5, fontWeight: 600, color: "#fff", background: "rgba(255,255,255,0.12)", borderRadius: 999, padding: "4px 9px", display: "inline-flex", alignItems: "center", gap: 5 }}><span>{s[0]}</span>{s[1]}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sparkline — completion last 7 days */}
      <div style={{ background: "var(--card)", borderRadius: 22, padding: "14px 16px 12px", marginTop: 12, boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>За 7 дней</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, letterSpacing: "-0.3px" }}>
              Выполнение +12% <span style={{ color: "#3b9c5a", fontSize: 13, fontWeight: 600 }}>↑</span>
            </div>
          </div>
          <button onClick={() => navigate("history")} className="tap"
            style={{ background: "transparent", border: 0, color: "var(--text-3)", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
            История <I.ChevronRight size={14}/>
          </button>
        </div>
        {/* Sparkline */}
        <svg viewBox="0 0 320 70" width="100%" height="70" style={{ display: "block", marginTop: 8 }}>
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7aa4d0" stopOpacity="0.35"/>
              <stop offset="100%" stopColor="#7aa4d0" stopOpacity="0"/>
            </linearGradient>
          </defs>
          {(() => {
            const W = 320, H = 60, pad = 18;
            const xs = week.map((_, i) => pad + (i * (W - pad*2) / (week.length - 1)));
            const ys = week.map(v => H - v * (H - 8) - 4);
            const path = xs.map((x, i) => (i ? "L" : "M") + x.toFixed(1) + " " + ys[i].toFixed(1)).join(" ");
            const fill = `M ${xs[0]} ${H} L ` + xs.map((x,i)=>x.toFixed(1)+" "+ys[i].toFixed(1)).join(" L ") + ` L ${xs[xs.length-1]} ${H} Z`;
            return (
              <g>
                <path d={fill} fill="url(#sparkFill)"/>
                <path d={path} fill="none" stroke="#3a6ba0" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
                {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r={i === xs.length-1 ? 3.5 : 2} fill={i === xs.length-1 ? "#0a1424" : "#7aa4d0"}/>)}
                {xs.map((x, i) => <text key={"l"+i} x={x} y={68} fontSize="9" fill="rgba(0,0,0,0.45)" textAnchor="middle">{days[i]}</text>)}
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Insights — actionable, expandable recommendations */}
      <div className="section-label" style={{ marginTop: 18, color: "var(--text-3)", padding: "0 4px" }}>Для тебя сегодня</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {insights.map((p, i) => {
          const isOpen = openInsight === i;
          const isDone = !!accepted[i];
          return (
          <div key={i} style={{ background: "var(--card)", borderRadius: 20, boxShadow: "var(--card-shadow)", overflow: "hidden" }}>
            <button onClick={() => setOpenInsight(isOpen ? null : i)} className="tap"
              style={{ width: "100%", background: "transparent", border: 0, padding: 14, display: "flex", alignItems: "center", gap: 12, textAlign: "left", color: "var(--text)" }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: isDone ? "linear-gradient(135deg,#d6f3df,#bfe9cd)" : "linear-gradient(135deg, #e9f1ff, #cfe1ff)", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>
                {isDone ? <I.Check size={20} color="#1e6b3a" strokeWidth={3}/> : p.i}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)" }}>{p.t}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#1e6b3a", background: "#e5f5ea", padding: "2px 7px", borderRadius: 999 }}>{isDone ? "Принято" : p.lift}</span>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-4)", marginTop: 3, lineHeight: 1.45 }}>{isDone ? p.doneText : p.b}</div>
              </div>
              <I.ChevronRight size={18} color="var(--text-4)" style={{ flexShrink: 0, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}/>
            </button>
            {isOpen && (
              <div className="bos-acc-in" style={{ padding: "0 14px 14px 70px" }}>
                <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.5 }}>{p.why}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                  {p.stats.map((s, si) => (
                    <span key={si} style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-2)", background: "var(--surface-3)", borderRadius: 999, padding: "4px 9px", display: "inline-flex", alignItems: "center", gap: 5 }}><span>{s[0]}</span>{s[1]}</span>
                  ))}
                </div>
                {!isDone && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button onClick={() => { setAccepted(a => ({ ...a, [i]: true })); if (window.tgHaptic) tgHaptic("light"); }} className="tap"
                      style={{ flex: 1, background: "#0a0a0a", color: "#fff", border: 0, borderRadius: 999, padding: "10px 14px", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <I.Check size={14} strokeWidth={2.5}/> {p.action}
                    </button>
                    <button onClick={() => navigate("ai-chat", { prompt: p.t })} className="tap"
                      style={{ background: "var(--surface-3)", color: "var(--text-2)", border: 0, borderRadius: 999, padding: "10px 14px", fontSize: 13, fontWeight: 500 }}>
                      Обсудить
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          );
        })}
      </div>

      {/* Patterns — passive observations */}
      <div className="section-label" style={{ marginTop: 18, color: "var(--text-3)", padding: "0 4px" }}>Закономерности</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
        {patterns.map((p, i) => {
          const isOpen = openPattern === i;
          return (
          <button key={i} onClick={() => setOpenPattern(isOpen ? null : i)} className="tap" style={{
            background: "var(--card)", borderRadius: 18, padding: 14, border: 0, textAlign: "left",
            boxShadow: "var(--card-shadow)",
            position: "relative", overflow: "hidden",
            gridColumn: (i === 2 || isOpen) ? "span 2" : "auto",
          }}>
            <div style={{ position: "absolute", top: -10, right: -10, width: 60, height: 60, borderRadius: "50%", background: p.c, opacity: 0.35, filter: "blur(8px)" }}/>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", position: "relative" }}>{p.t}</div>
            <div style={{ fontSize: 12, color: "var(--text-4)", marginTop: 4, lineHeight: 1.45, position: "relative" }}>{p.b}</div>
            {isOpen && <div className="bos-acc-in" style={{ fontSize: 12, color: "var(--text-3)", marginTop: 9, paddingTop: 9, borderTop: "1px solid var(--line)", lineHeight: 1.5, position: "relative" }}>{p.d}</div>}
          </button>
          );
        })}
      </div>

      {/* Ask AI */}
      <div className="section-label" style={{ marginTop: 18, color: "var(--text-3)", padding: "0 4px" }}>Спроси что угодно</div>
      <div style={{
        background: "var(--card)", borderRadius: 22, padding: 14, marginTop: 8,
        boxShadow: "var(--card-shadow)",
      }}>
        {/* Quick prompt chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {quickPrompts.map((q, i) => (
            <button key={i} onClick={() => navigate("ai-chat", { prompt: q })} className="tap"
              style={{ fontSize: 12, padding: "7px 12px", borderRadius: 999,
                       background: "var(--surface-3)", border: 0, color: "var(--text-2)", letterSpacing: "-0.1px" }}>
              {q}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 6px 0", borderTop: "1px solid var(--line)" }}>
          <input value={ask} onChange={e => setAsk(e.target.value)} placeholder="Спросить Balance AI…"
            onKeyDown={e => e.key === "Enter" && navigate("ai-chat", ask.trim() ? { prompt: ask } : {})}
            style={{ flex: 1, border: 0, outline: 0, background: "transparent", color: "var(--text)", fontSize: 14, padding: "10px 6px" }}/>
          <button onClick={() => navigate("ai-chat", ask.trim() ? { prompt: ask } : {})} className="tap"
            style={{ width: 36, height: 36, borderRadius: "50%", background: "#0a0a0a", border: 0, color: "#fff", display: "grid", placeItems: "center" }}>
            <I.Send size={14}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// Local time hook for the orb animation on the AI screen
function useAIT() {
  const [t, setT] = React.useState(0);
  React.useEffect(() => {
    let raf, s = performance.now();
    const tick = (now) => { setT((now - s) / 1000); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return t;
}

/* Onboarding intro flow (5 dark slides) + sign up */
function OnboardingScreen() {
  const { navigate } = useNav();
  const [step, setStep] = useP(0);
  const slides = [
    { t: "Цельные люди — в своём ядре", s: "Начни с внутреннего состояния — каждая привычка следует из него." },
    { t: "Твоё состояние решает", s: "Всё, что ты делаешь, исходит из того, как ты себя чувствуешь. Сначала настройся." },
    { t: "Добавь то, на что есть силы сегодня", s: "Мы будем держать малый шаг. Постепенность лучше выгорания." },
    { t: "Овладей своим состоянием — открой свою жизнь.", s: "" },
  ];
  if (step >= slides.length) {
    return (
      <div className="page-in" style={{ padding: "100px 24px 24px", color: "#fff", height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ textAlign: "center", marginTop: 60 }}>
          <div style={{ width: 130, height: 130, borderRadius: "50%", background: "url(./assets/sphere.png) center/cover no-repeat", margin: "0 auto", boxShadow: "0 0 60px rgba(255,222,52,0.3)" }}/>
          <div style={{ fontSize: 22, fontWeight: 600, marginTop: 24 }}>Какое у тебя сейчас состояние?</div>
          <div style={{ fontSize: 14, color: "#9f9fa9", marginTop: 6 }}>Выбери одно, чтобы начать. Можно всегда поменять.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginTop: 30 }}>
          {[{i:"😌",t:"Спокойствие"},{i:"⚡️",t:"Энергия"},{i:"😔",t:"Упадок"},{i:"😤",t:"Стресс"},{i:"🙂",t:"Ровно"},{i:"🔥",t:"В огне"}].map((s,i)=>(
            <button key={i} onClick={() => navigate("signup")} className="tap" style={{ background: "rgba(39,39,42,0.55)", border: "1px solid rgba(63,63,70,0.4)", borderRadius: 18, padding: 16, color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 30 }}>{s.i}</span>
              <span style={{ fontSize: 14 }}>{s.t}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="page-in" style={{ height: "100%", display: "flex", flexDirection: "column", color: "#fff", padding: 24 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "0 8px" }}>
        <div style={{ width: 110, height: 110, borderRadius: "50%", background: "url(./assets/sphere.png) center/cover no-repeat", boxShadow: "0 0 80px rgba(255,222,52,0.25)" }}/>
        <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif", fontSize: 22, fontWeight: 500, marginTop: 60, lineHeight: 1.3, maxWidth: 280 }}>{slides[step].t}</div>
        {slides[step].s && <div style={{ fontSize: 14, color: "#9f9fa9", marginTop: 14, maxWidth: 280, lineHeight: 1.5 }}>{slides[step].s}</div>}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
        {slides.map((_, i) => (
          <span key={i} style={{ width: i === step ? 22 : 6, height: 6, borderRadius: 999, background: i === step ? "#fff" : "rgba(255,255,255,0.25)", transition: "all 0.2s" }}/>
        ))}
      </div>
      <button onClick={() => setStep(step + 1)} className="tap" style={{ background: "var(--card)", color: "#000", border: 0, borderRadius: 999, padding: "16px 24px", fontSize: 16, fontWeight: 500 }}>
        {step === slides.length - 1 ? "Начать" : "Далее"}
      </button>
      <button onClick={() => navigate("signup")} className="tap" style={{ background: "transparent", color: "#9f9fa9", border: 0, padding: 12, fontSize: 13, marginTop: 6 }}>
        Пропустить
      </button>
    </div>
  );
}

function SignUpScreen() {
  const { navigate } = useNav();
  const [name, setName] = useP("");
  const [email, setEmail] = useP("");
  const [pwd, setPwd] = useP("");
  const wrapRef = React.useRef(null);
  const [dark, setDark] = useP(true);
  React.useEffect(() => {
    let n = wrapRef.current;
    while (n && !(n.classList && (n.classList.contains("theme-light") || n.classList.contains("theme-dark")))) n = n.parentElement;
    if (n && n.classList.contains("theme-light")) setDark(false);
  }, []);
  const pal = dark ? {
    bg: "#0a0a0e",
    text: "#fff", sub: "#9f9fa9",
    sheet: "rgba(14,14,14,0.94)", sheetBorder: "1px solid rgba(255,255,255,0.06)",
    inputBg: "rgba(255,255,255,0.06)", inputBorder: "1px solid rgba(255,255,255,0.1)", inputText: "#fff",
    btnBg: "#f1f1f1", btnFg: "#0a0a0a", line: "rgba(255,255,255,0.12)",
    socialBg: "rgba(255,255,255,0.06)", socialBorder: "1px solid rgba(255,255,255,0.1)", socialText: "#fff",
    glow: "0 0 60px rgba(255,222,52,0.2)",
  } : {
    bg: "linear-gradient(180deg,#f5f6f8 0%,#eceef2 100%)",
    text: "#15233c", sub: "rgba(21,35,60,0.6)",
    sheet: "#ffffff", sheetBorder: "1px solid rgba(0,0,0,0.05)",
    inputBg: "#f2f5fa", inputBorder: "1px solid rgba(0,0,0,0.08)", inputText: "#15233c",
    btnBg: "#0f1b2e", btnFg: "#fff", line: "rgba(0,0,0,0.1)",
    socialBg: "#f2f5fa", socialBorder: "1px solid rgba(0,0,0,0.08)", socialText: "#15233c",
    glow: "0 10px 40px rgba(120,150,200,0.25)",
  };
  const inp = { background: pal.inputBg, border: pal.inputBorder, borderRadius: 14, padding: "14px 16px", color: pal.inputText, fontSize: 15, outline: 0 };
  const app = useApp ? useApp() : null;
  const goDemo = () => { app?.enterDemo?.(); app?.startTour?.(); navigate("home"); };
  const goFresh = () => { app?.enterFresh?.(name); app?.startTour?.("fresh"); navigate("home"); };
  return (
    <div ref={wrapRef} className="page-in" style={{ height: "100%", color: pal.text, display: "flex", flexDirection: "column", background: pal.bg, position: "relative", overflow: "hidden" }}>
      <div style={{ flex: 1, padding: "max(64px, calc(var(--tg-top-inset, 0px) + 22px)) 24px 12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {/* Your memoji INSIDE the same glass orb from onboarding — it blooms in
            (the orb arrives, then your face appears in it) rather than from nowhere. */}
        <div style={{ position: "relative", width: 118, height: 118, display: "grid", placeItems: "center", animation: "suOrbIn 0.9s cubic-bezier(0.34,1.4,0.5,1) both" }}>
          <div aria-hidden style={{ position: "absolute", width: 158, height: 158, borderRadius: "50%", background: dark ? "radial-gradient(circle, rgba(150,185,240,0.45), transparent 64%)" : "radial-gradient(circle, rgba(120,160,225,0.42), transparent 66%)", filter: "blur(8px)" }}/>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: dark ? "linear-gradient(160deg,#4a5b82,#222d45)" : "linear-gradient(160deg,#bcd2f1,#7ea5d8)", boxShadow: dark ? "inset 0 3px 10px rgba(255,255,255,0.18), inset 0 -10px 20px rgba(0,0,0,0.3), 0 16px 40px rgba(0,0,0,0.4)" : "inset 0 3px 10px rgba(255,255,255,0.85), inset 0 -12px 22px rgba(40,80,140,0.28), 0 16px 38px rgba(90,130,195,0.4)" }}/>
          <div style={{ position: "absolute", inset: 9, borderRadius: "50%", background: "url(./assets/sphere.png) center/cover no-repeat", animation: "suFaceIn 0.6s 0.4s ease both" }}/>
          <div aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "50%", boxShadow: dark ? "inset 0 0 0 1px rgba(255,255,255,0.12)" : "inset 0 0 0 1px rgba(255,255,255,0.55)", background: "radial-gradient(circle at 33% 24%, rgba(255,255,255,0.6), transparent 40%)" }}/>
          <style>{`@keyframes suOrbIn{0%{opacity:0;transform:scale(0.5)}60%{opacity:1;transform:scale(1.06)}100%{opacity:1;transform:scale(1)}}@keyframes suFaceIn{from{opacity:0;transform:scale(0.82)}to{opacity:1;transform:scale(1)}}`}</style>
        </div>
        <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif", fontSize: 27, fontWeight: 700, letterSpacing: "-0.6px", marginTop: 24, textAlign: "center" }}>С чего начнём?</div>
        <div style={{ fontSize: 14, color: pal.sub, marginTop: 8, textAlign: "center", maxWidth: 286, lineHeight: 1.5 }}>
          Загляни в готовый пример — или начни свой путь с чистого листа.
        </div>
      </div>
      <div style={{ background: pal.sheet, borderTop: pal.sheetBorder, borderRadius: "33px 33px 0 0", padding: "24px 22px calc(26px + var(--tg-bottom-inset, 0px))" }}>
        {/* Door 1 — Demo (where a shared link should land) */}
        <button onClick={goDemo} className="tap" style={{
          width: "100%", display: "flex", alignItems: "center", gap: 13, textAlign: "left",
          background: "linear-gradient(135deg, #FEDE34 0%, #FFC400 100%)", color: "#0a0a0a",
          border: 0, borderRadius: 20, padding: "15px 16px", boxShadow: "0 12px 30px rgba(254,222,52,0.32)",
        }}>
          <span style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.55)", display: "grid", placeItems: "center", flexShrink: 0 }}><I.Sparkles size={23} color="#0a0a0a"/></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.3px" }}>Посмотреть демо</div>
            <div style={{ fontSize: 12.5, color: "rgba(0,0,0,0.6)", marginTop: 2, lineHeight: 1.35 }}>Всё уже настроено — лучший способ понять, как это работает</div>
          </div>
          <I.ChevronRight size={20} color="rgba(0,0,0,0.5)" />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 16px" }}>
          <span style={{ flex: 1, height: 1, background: pal.line }}/>
          <span style={{ fontSize: 12, color: pal.sub }}>или создай свой аккаунт</span>
          <span style={{ flex: 1, height: 1, background: pal.line }}/>
        </div>

        {/* Door 2 — Real registration (clean slate) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Имя" style={inp}/>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="E-mail или номер телефона" style={inp}/>
          <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Пароль" style={inp}/>
        </div>
        <button onClick={goFresh} className="tap" style={{ width: "100%", marginTop: 16, background: pal.btnBg, color: pal.btnFg, border: 0, borderRadius: 999, padding: 16, fontSize: 16, fontWeight: 600 }}>
          Начать с чистого листа
        </button>
        <div style={{ textAlign: "center", fontSize: 12, color: pal.sub, marginTop: 9 }}>Пустое приложение — первую привычку создашь сам.</div>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={goFresh} className="tap" style={{ flex: 1, background: pal.socialBg, border: pal.socialBorder, borderRadius: 999, padding: 13, color: pal.socialText, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>G</span> Google
          </button>
          <button onClick={goFresh} className="tap" style={{ flex: 1, background: pal.socialBg, border: pal.socialBorder, borderRadius: 999, padding: 13, color: pal.socialText, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}></span> Apple
          </button>
        </div>
      </div>
    </div>
  );
}

function IconPickerScreen() {
  const { navigate, params } = useNav();
  const list = ["☀️","🤸🏼‍♀️","📖","🙏","🧭","⌨️","🦶","🚭","🌚","👟","🧁","📞","🥊","🧘🏼‍♀️","🏃🏼‍♀️","📚","✍🏼","🥗","💧","🧊","🔥","🎯","🎨","🎵","🌱","☕"];
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Выбери иконку" onBack={() => navigate("habit-settings", params)} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
        {list.map((e, i) => (
          <button key={i} className="tap" onClick={() => navigate("habit-settings", { ...params, picked: e })}
            style={{ aspectRatio: "1/1", background: "var(--card)", border: 0, borderRadius: 16, fontSize: 28, boxShadow: "var(--card-shadow)" }}>
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── ACHIEVEMENTS — ачивки как ключи: курс / уровень / доброе дело → значок →
   открывает новый круг контактов. Витрина «ощущения» экосистемы. ─── */
const ACHIEVEMENTS = [
  { i: "⚡", t: "Перегрузка пройдена", d: "Курс «Перегрузка» · 3 дня",     earned: true,  opens: "наставники по фокусу",   date: "16 мар", accent: "#FEDE34" },
  { i: "🧘", t: "Голос медитации",     d: "Провёл 10 групповых сессий",    earned: true,  opens: "практики медитации",    date: "2 апр",  accent: "#5BC57E" },
  { i: "🤝", t: "Капитан команды",     d: "Довёл команду до общей цели",   earned: true,  opens: "лидеры команд",         date: "21 мар", accent: "#5FA8FF" },
  { i: "🔥", t: "Месяц без пропусков",  d: "Серия привычек 30 дней",        earned: true,  opens: "+1 уровень доступа",    date: "12 апр", accent: "#FF8A5B" },
  { i: "🚀", t: "Прорыв",              d: "Пройди курс «Прорыв» · 7 дней", earned: false, opens: "продвинутые наставники", req: "курс «Прорыв»",  accent: "#9bd0ff" },
  { i: "🏃", t: "Марафонец",           d: "Заверши «Марафон» · 21 день",   earned: false, opens: "тренеры по привычкам",  req: "курс «Марафон»", accent: "#85e3a8" },
  { i: "💼", t: "Профи-консультант",    d: "Достигни 10 уровня",            earned: false, opens: "профи-консультанты",    req: "ещё 3 уровня",   accent: "#c9b8ff" },
  { i: "🌍", t: "Хранитель ретрита",    d: "Достигни 20 уровня",            earned: false, opens: "организаторы ретритов",  req: "уровень 20",     accent: "#a8e8e0" },
];

function AchievementsScreen() {
  const { navigate, params } = useNav();
  const back = params?.from || "profile";
  const earned = ACHIEVEMENTS.filter(a => a.earned);
  const locked = ACHIEVEMENTS.filter(a => !a.earned);
  const circles = earned.filter(a => !a.opens.startsWith("+")).length;
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Достижения" onBack={() => navigate(back)} />

      {/* Hero — ties achievements to circles of contacts they opened */}
      <SysCard style={{ padding: 18, borderRadius: 24 }}>
        <div className="bos-sys-text-3" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700 }}>Твои ачивки</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
          <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.6px" }}>{earned.length}</span>
          <span className="bos-sys-text-2" style={{ fontSize: 14 }}>из {ACHIEVEMENTS.length} открыто</span>
        </div>
        <div className="bos-sys-text-2" style={{ fontSize: 13, lineHeight: 1.5, marginTop: 6 }}>
          Ачивки — это ключи: за курсы, уровни и добрые дела. Уже открыли <b>{circles} круга контактов</b>.
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          {earned.map((a, i) => (
            <span key={i} style={{ width: 34, height: 34, borderRadius: 11, background: a.accent + "26", display: "grid", placeItems: "center", fontSize: 18 }}>{a.i}</span>
          ))}
        </div>
      </SysCard>

      {/* Earned */}
      <div className="section-label" style={{ marginTop: 22, padding: "0 4px" }}>Открыто</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {earned.map((a, i) => (
          <SysCard key={i} className="tap" onClick={() => navigate("community")} style={{ padding: 14, display: "flex", alignItems: "center", gap: 13, cursor: "pointer" }}>
            <span style={{ width: 46, height: 46, borderRadius: 14, background: a.accent + "26", display: "grid", placeItems: "center", fontSize: 24, flexShrink: 0 }}>{a.i}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: "-0.2px" }}>{a.t}</div>
              <div className="bos-sys-text-3" style={{ fontSize: 12, marginTop: 2 }}>{a.d}</div>
              <div className="bos-sys-text-2" style={{ fontSize: 12, marginTop: 5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <I.Sparkles size={11} color={a.accent}/> открыл: {a.opens}
              </div>
            </div>
            <span className="bos-sys-text-3" style={{ fontSize: 11, flexShrink: 0 }}>{a.date}</span>
          </SysCard>
        ))}
      </div>

      {/* Locked — shows the path: how to earn + what it will open */}
      <div className="section-label" style={{ marginTop: 22, padding: "0 4px" }}>В пути</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {locked.map((a, i) => (
          <SysCard key={i} className="tap" onClick={() => navigate("community")} style={{ padding: 14, display: "flex", alignItems: "center", gap: 13, cursor: "pointer" }}>
            <span style={{ width: 46, height: 46, borderRadius: 14, background: "var(--card-2)", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0, filter: "grayscale(1)", opacity: 0.45 }}>{a.i}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: "-0.2px", display: "inline-flex", alignItems: "center", gap: 6 }}>{a.t} <span style={{ fontSize: 11 }}>🔒</span></div>
              <div className="bos-sys-text-3" style={{ fontSize: 12, marginTop: 2 }}>Как открыть: {a.req}</div>
              <div className="bos-sys-text-2" style={{ fontSize: 12, marginTop: 5, fontWeight: 500 }}>→ откроет: {a.opens}</div>
            </div>
            <I.ChevronRight size={16} className="bos-sys-text-3" style={{ flexShrink: 0 }}/>
          </SysCard>
        ))}
      </div>
    </div>
  );
}

// Manifesto — the full philosophical text behind the onboarding, for those who
// want to read it whole. Reached from Settings → «О приложении».
function ManifestScreen() {
  const { navigate, params } = useNav();
  const Orb = window.StateOrb;
  const stanzas = [
    ["Ты — точка.", "Точка внимания внутри бесконечного количества возможных вариантов жизни."],
    ["Ты не видишь мир таким, какой он есть.", "Ты видишь его таким, в каком состоянии находишься."],
    [null, "Большинство людей не выбирают своё состояние. Они позволяют новостям, обстоятельствам, страхам и чужому мнению выбирать его за них."],
    [null, "Тебе кажется, что твоей жизнью управляют обстоятельства. Но обстоятельства не определяют твои решения — их определяет твоё состояние."],
    [null, "В одном состоянии всё кажется невозможным. В другом — ты видишь решения, которые были рядом всё это время."],
    ["Это пространство — для одного.", "Научиться управлять своим состоянием. Расширять восприятие. Видеть больше возможностей. И осознанно выбирать направление движения."],
    [null, "Твоя жизнь не определяется тем, что происходит вокруг. Она определяется тем, из какого состояния ты встречаешь происходящее."],
    ["Путешествие начинается внутри.", "Это пространство учит главному: управлять не обстоятельствами, а собой."],
  ];
  return (
    <div className="page-in" style={{ padding: "0 22px 44px" }}>
      <PageHeader title="Манифест" onBack={() => navigate(params?.from || "settings")} />
      <div style={{ display: "grid", placeItems: "center", margin: "6px 0 22px" }}>
        {Orb ? <Orb size={94} tint={["#cfe1ff", "#7aa4d0", "#1a2c48"]} intensity={1} /> : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        {stanzas.map((s, i) => (
          <div key={i}>
            {s[0] && <div style={{ fontSize: 20.5, fontWeight: 600, letterSpacing: "-0.4px", lineHeight: 1.26, color: "var(--text)" }}>{s[0]}</div>}
            {s[1] && <div className="bos-sys-text-2" style={{ fontSize: 15.5, lineHeight: 1.62, marginTop: s[0] ? 8 : 0 }}>{s[1]}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { ProfileScreen, SettingsScreen, NotificationsScreen, HistoryScreen, SupportScreen, AIScreen, OnboardingScreen, SignUpScreen, IconPickerScreen, AchievementsScreen, ACHIEVEMENTS, ManifestScreen });

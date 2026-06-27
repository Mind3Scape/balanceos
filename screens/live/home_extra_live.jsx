/* HOME CUSTOMIZE — LIVE-only fork of HomeCustomizeScreen (real Telegram user,
   app.mode === "live" is ALWAYS true here). The screen is mode-agnostic — it only
   reads app.widgets / app.themeOverride and writes via app.setWidgets — so this is
   a faithful copy that the live app owns, with the iOS-Headline typography polish
   (the option title is now fontWeight 600 + var(--text) instead of the thin 500).
   Everything reuses the shared globals: useNav, useApp, PageHeader, Switch. The ONLY
   new top-level declaration in this file is `function HomeCustomizeLive`. */
function HomeCustomizeLive() {
  const { navigate } = useNav();
  const app = useApp();
  const widgets = app?.widgets || {};
  const isDark = app?.themeOverride === "dark";
  const setOne = (id, v) => app?.setWidgets({ ...widgets, [id]: v });
  // ONE source of truth with the home board (BOS_HOME_WIDGETS) so this screen and the
  // long-press «+»/«−» board never drift apart. Every switch maps to widgets[id].
  const opts = (typeof BOS_HOME_WIDGETS !== "undefined" ? BOS_HOME_WIDGETS : []).map((w) => ({ id: w.id, i: w.emoji, t: w.t, d: w.d }));
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Виджеты главного" onBack={() => navigate("settings")} />
      <div className="bos-sys-text-3" style={{ fontSize: 13, marginBottom: 14, lineHeight: 1.5, padding: "0 2px" }}>
        Включай и выключай виджеты главной. А ещё — зажми любой виджет на главной, чтобы перетащить, убрать или добавить.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {opts.map(o => (
          <div key={o.id} className="bos-sys-card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <span className="bos-sys-chip-bg" style={{ width: 38, height: 38, borderRadius: 14, display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0 }}>{o.i}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{o.t}</div>
              <div className="bos-sys-text-3" style={{ fontSize: 12 }}>{o.d}</div>
            </div>
            <Switch on={widgets[o.id] !== false} onChange={(v) => setOne(o.id, v)} dark={isDark} />
          </div>
        ))}
      </div>
    </div>
  );
}

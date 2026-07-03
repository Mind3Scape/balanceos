/* HOME CUSTOMIZE — LIVE-only fork of HomeCustomizeScreen (real Telegram user,
   app.mode === "live" is ALWAYS true here).
   v528 (секция Д): главная стала СВОБОДНОЙ сеткой — видимость виджета решает
   app.homeLayout (присутствие "w:<id>" в order), а не widgets{}. Этот экран —
   те же тумблеры, что в шторке «+» на доске (одна логика, никакого дрейфа).
   Everything reuses the shared globals: useNav, useApp, PageHeader, Switch. The ONLY
   new top-level declaration in this file is `function HomeCustomizeLive`. */
function HomeCustomizeLive() {
  const { navigate } = useNav();
  const app = useApp();
  const isDark = app?.themeOverride === "dark";
  const layout = (app && app.homeLayout && Array.isArray(app.homeLayout.order)) ? app.homeLayout : { order: [], hidden: [] };
  const hidden = Array.isArray(layout.hidden) ? layout.hidden : [];
  const inOrder = (k) => layout.order.indexOf(k) >= 0;
  const toggleWidget = (id, v) => {
    const k = "w:" + id;
    if (!app?.setHomeLayout) return;
    if (v && !inOrder(k)) app.setHomeLayout({ order: layout.order.concat([k]), hidden: hidden.filter((x) => x !== k) });
    if (!v && inOrder(k)) app.setHomeLayout({ order: layout.order.filter((x) => x !== k), hidden: hidden.indexOf(k) < 0 ? hidden.concat([k]) : hidden });
  };
  const opts = (typeof BOS_HOME_WIDGETS !== "undefined" ? BOS_HOME_WIDGETS : []).map((w) => ({ id: w.id, i: w.emoji, t: w.t, d: w.d }));
  return (
    <div className="page-in" style={{ padding: "0 16px 24px" }}>
      <PageHeader title="Виджеты главного" onBack={() => navigate("settings")} />
      <div className="bos-sys-text-3" style={{ fontSize: 13, marginBottom: 14, lineHeight: 1.5, padding: "0 2px" }}>
        Включай и выключай виджеты главной. А ещё — зажми что угодно на главной: всё можно перетащить, убрать или добавить.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {opts.map(o => (
          <div key={o.id} className="bos-sys-card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <span className="bos-sys-chip-bg" style={{ width: 38, height: 38, borderRadius: 14, display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0 }}>{o.i}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{o.t}</div>
              <div className="bos-sys-text-3" style={{ fontSize: 12 }}>{o.d}</div>
            </div>
            <Switch on={inOrder("w:" + o.id)} onChange={(v) => toggleWidget(o.id, v)} dark={isDark} />
          </div>
        ))}
      </div>
    </div>
  );
}

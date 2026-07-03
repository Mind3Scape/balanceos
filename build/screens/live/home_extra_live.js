/* HOME CUSTOMIZE — LIVE-only fork of HomeCustomizeScreen (real Telegram user,
   app.mode === "live" is ALWAYS true here).
   v528 (секция Д): главная стала СВОБОДНОЙ сеткой — видимость виджета решает
   app.homeLayout (присутствие "w:<id>" в order), а не widgets{}. Этот экран —
   те же тумблеры, что в шторке «+» на доске (одна логика, никакого дрейфа).
   Everything reuses the shared globals: useNav, useApp, PageHeader, Switch. The ONLY
   new top-level declaration in this file is `function HomeCustomizeLive`. */
function HomeCustomizeLive() {
  var {
    navigate
  } = useNav();
  var app = useApp();
  var isDark = app?.themeOverride === "dark";
  var layout = app && app.homeLayout && Array.isArray(app.homeLayout.order) ? app.homeLayout : {
    order: [],
    hidden: []
  };
  var hidden = Array.isArray(layout.hidden) ? layout.hidden : [];
  var inOrder = k => layout.order.indexOf(k) >= 0;
  var toggleWidget = (id, v) => {
    var k = "w:" + id;
    if (!app?.setHomeLayout) return;
    if (v && !inOrder(k)) app.setHomeLayout({
      order: layout.order.concat([k]),
      hidden: hidden.filter(x => x !== k)
    });
    if (!v && inOrder(k)) app.setHomeLayout({
      order: layout.order.filter(x => x !== k),
      hidden: hidden.indexOf(k) < 0 ? hidden.concat([k]) : hidden
    });
  };
  var opts = (typeof BOS_HOME_WIDGETS !== "undefined" ? BOS_HOME_WIDGETS : []).map(w => ({
    id: w.id,
    i: w.emoji,
    t: w.t,
    d: w.d
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u0412\u0438\u0434\u0436\u0435\u0442\u044B \u0433\u043B\u0430\u0432\u043D\u043E\u0433\u043E",
    onBack: () => navigate("settings")
  }), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 13,
      marginBottom: 14,
      lineHeight: 1.5,
      padding: "0 2px"
    }
  }, "\u0412\u043A\u043B\u044E\u0447\u0430\u0439 \u0438 \u0432\u044B\u043A\u043B\u044E\u0447\u0430\u0439 \u0432\u0438\u0434\u0436\u0435\u0442\u044B \u0433\u043B\u0430\u0432\u043D\u043E\u0439. \u0410 \u0435\u0449\u0451 \u2014 \u0437\u0430\u0436\u043C\u0438 \u0447\u0442\u043E \u0443\u0433\u043E\u0434\u043D\u043E \u043D\u0430 \u0433\u043B\u0430\u0432\u043D\u043E\u0439: \u0432\u0441\u0451 \u043C\u043E\u0436\u043D\u043E \u043F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u044C, \u0443\u0431\u0440\u0430\u0442\u044C \u0438\u043B\u0438 \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, opts.map(o => /*#__PURE__*/React.createElement("div", {
    key: o.id,
    className: "bos-sys-card",
    style: {
      padding: 14,
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bos-sys-chip-bg",
    style: {
      width: 38,
      height: 38,
      borderRadius: 14,
      display: "grid",
      placeItems: "center",
      fontSize: 18,
      flexShrink: 0
    }
  }, o.i), /*#__PURE__*/React.createElement("div", {
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
  }, o.t), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 12
    }
  }, o.d)), /*#__PURE__*/React.createElement(Switch, {
    on: inOrder("w:" + o.id),
    onChange: v => toggleWidget(o.id, v),
    dark: isDark
  })))));
}

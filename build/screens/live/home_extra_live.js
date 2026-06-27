/* HOME CUSTOMIZE — LIVE-only fork of HomeCustomizeScreen (real Telegram user,
   app.mode === "live" is ALWAYS true here). The screen is mode-agnostic — it only
   reads app.widgets / app.themeOverride and writes via app.setWidgets — so this is
   a faithful copy that the live app owns, with the iOS-Headline typography polish
   (the option title is now fontWeight 600 + var(--text) instead of the thin 500).
   Everything reuses the shared globals: useNav, useApp, PageHeader, Switch. The ONLY
   new top-level declaration in this file is `function HomeCustomizeLive`. */
function HomeCustomizeLive() {
  var {
    navigate
  } = useNav();
  var app = useApp();
  var widgets = app?.widgets || {};
  var isDark = app?.themeOverride === "dark";
  var setOne = (id, v) => app?.setWidgets({
    ...widgets,
    [id]: v
  });
  // ONE source of truth with the home board (BOS_HOME_WIDGETS) so this screen and the
  // long-press «+»/«−» board never drift apart. Every switch maps to widgets[id].
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
  }, "\u0412\u043A\u043B\u044E\u0447\u0430\u0439 \u0438 \u0432\u044B\u043A\u043B\u044E\u0447\u0430\u0439 \u0432\u0438\u0434\u0436\u0435\u0442\u044B \u0433\u043B\u0430\u0432\u043D\u043E\u0439. \u0410 \u0435\u0449\u0451 \u2014 \u0437\u0430\u0436\u043C\u0438 \u043B\u044E\u0431\u043E\u0439 \u0432\u0438\u0434\u0436\u0435\u0442 \u043D\u0430 \u0433\u043B\u0430\u0432\u043D\u043E\u0439, \u0447\u0442\u043E\u0431\u044B \u043F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u044C, \u0443\u0431\u0440\u0430\u0442\u044C \u0438\u043B\u0438 \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C."), /*#__PURE__*/React.createElement("div", {
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
    on: widgets[o.id] !== false,
    onChange: v => setOne(o.id, v),
    dark: isDark
  })))));
}

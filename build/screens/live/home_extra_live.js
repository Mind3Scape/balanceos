/* HOME CUSTOMIZE — LIVE-only fork of HomeCustomizeScreen (real Telegram user,
   app.mode === "live" is ALWAYS true here).
   v529: страница = та же ЕДИНАЯ галерея главного экрана, что и шторка «+» на доске
   (HomeGalleryContentLive в shared_live): виджеты + привычки + цели + совместные,
   одна логика вкл/выкл (order/hidden в app.homeLayout), никакого дрейфа.
   The ONLY new top-level declaration in this file is `function HomeCustomizeLive`. */
function HomeCustomizeLive() {
  var {
    navigate
  } = useNav();
  var app = useApp();
  var isDark = app?.themeOverride === "dark";
  return /*#__PURE__*/React.createElement("div", {
    className: "page-in",
    style: {
      padding: "0 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    title: "\u0413\u043B\u0430\u0432\u043D\u044B\u0439 \u044D\u043A\u0440\u0430\u043D",
    onBack: () => navigate("settings")
  }), /*#__PURE__*/React.createElement("div", {
    className: "bos-sys-text-3",
    style: {
      fontSize: 13,
      marginBottom: 6,
      lineHeight: 1.5,
      padding: "0 2px"
    }
  }, "\u0427\u0442\u043E \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u043D\u0430 \u0433\u043B\u0430\u0432\u043D\u043E\u0439. \u0410 \u0435\u0449\u0451 \u2014 \u0437\u0430\u0436\u043C\u0438 \u0447\u0442\u043E \u0443\u0433\u043E\u0434\u043D\u043E \u043F\u0440\u044F\u043C\u043E \u043D\u0430 \u0433\u043B\u0430\u0432\u043D\u043E\u0439: \u0432\u0441\u0451 \u043C\u043E\u0436\u043D\u043E \u043F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u044C, \u0443\u0431\u0440\u0430\u0442\u044C \u0438\u043B\u0438 \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C."), typeof HomeGalleryContentLive === "function" && /*#__PURE__*/React.createElement(HomeGalleryContentLive, {
    dark: isDark
  }));
}

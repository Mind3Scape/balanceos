/* Telegram Mini App glue.

   Loads harmlessly everywhere: in a normal browser window.Telegram is undefined,
   so every hook below becomes a no-op and the app behaves exactly as the PWA.

   Inside Telegram (the bot opens our existing GitHub-Pages URL in Telegram's
   in-app browser) it lights up the native chrome:
     - expand to full height, lock vertical swipes so a scroll can't close it;
     - REAL native haptics on every tap (the iOS web-overlay tick doesn't fire
       inside Telegram's webview);
     - window.tgBackButton(show, onClick) lets app.jsx drive Telegram's native
       Back button straight from its navigation stack;
     - window.tgHeader(hex) keeps Telegram's header/background matched to the
       current screen.

   __tgInit is exposed so it can be re-run against a mock for testing. */
(function () {
  function __tgInit() {
    var raw = (window.Telegram && window.Telegram.WebApp) || null;
    // telegram-web-app.js defines WebApp even outside Telegram (platform "unknown").
    // Only treat it as live when we're genuinely inside a Telegram client, so a
    // normal browser stays a true no-op (no stray Telegram warnings).
    var tg = (raw && raw.platform && raw.platform !== "unknown") ? raw : null;
    window.__TG = tg;

    // One share entry point for the whole app. Inside Telegram it opens the native
    // "forward to a contact" picker (openTelegramLink → t.me/share/url) so a friend is
    // one tap away; outside Telegram it falls back to the Web Share sheet, then clipboard.
    // Returns true if a share UI opened (caller can skip its own "copied" toast).
    window.bosShare = function (url, text) {
      if (tg && tg.openTelegramLink) {
        try { tg.openTelegramLink("https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(text || "")); return true; } catch (e) {}
      }
      try { if (navigator.share) { navigator.share({ title: "BalanceOS", text: text || "", url: url }); return true; } } catch (e) {}
      try { navigator.clipboard.writeText(url); } catch (e) {}
      return false;
    };

    if (!tg) {
      // Not in Telegram → safe stubs so callers never crash.
      window.tgBackButton = window.tgBackButton || function () {};
      window.tgHaptic = window.tgHaptic || function () {};
      window.tgHeader = window.tgHeader || function () {};
      return;
    }

    try {
      tg.ready();
      tg.expand();
      if (tg.disableVerticalSwipes) tg.disableVerticalSwipes(); // a scroll shouldn't close the app
      if (tg.requestFullscreen) tg.requestFullscreen();         // edge-to-edge: drops Telegram's header bar
    } catch (e) {}

    // Publish Telegram's safe-area insets as CSS vars so our top/bottom spacing
    // clears the notch and Telegram's floating fullscreen buttons.
    function applyInsets() {
      var sa = tg.safeAreaInset || {}, ca = tg.contentSafeAreaInset || {};
      var r = document.documentElement.style;
      r.setProperty("--tg-top-inset", ((sa.top || 0) + (ca.top || 0)) + "px");
      r.setProperty("--tg-bottom-inset", ((sa.bottom || 0) + (ca.bottom || 0)) + "px");
    }
    try {
      applyInsets();
      if (tg.onEvent) {
        tg.onEvent("safeAreaChanged", applyInsets);
        tg.onEvent("contentSafeAreaChanged", applyInsets);
        tg.onEvent("fullscreenChanged", applyInsets);
      }
    } catch (e) {}

    // Real native haptic on every tap. Bound once. A scroll-drag never fires a
    // click, so this does not interfere with the horizontal chip rows.
    if (!window.__tgHapticBound) {
      document.addEventListener("click", function (e) {
        var t = e.target && e.target.closest && e.target.closest(".tap, button, [role=button]");
        if (!t) return;
        try { tg.HapticFeedback.impactOccurred("light"); } catch (e2) {}
      }, true);
      window.__tgHapticBound = true;
    }

    window.tgHaptic = function (kind) {
      try {
        if (kind === "success" || kind === "error" || kind === "warning") {
          tg.HapticFeedback.notificationOccurred(kind);
        } else {
          tg.HapticFeedback.impactOccurred(kind || "light");
        }
      } catch (e) {}
    };

    // Drive Telegram's native Back button from the app's navigation stack.
    window.tgBackButton = function (show, onClick) {
      if (!tg.BackButton) return;
      try {
        if (window.__tgBackHandler) tg.BackButton.offClick(window.__tgBackHandler);
        window.__tgBackHandler = onClick || null;
        if (onClick) tg.BackButton.onClick(onClick);
        if (show) tg.BackButton.show(); else tg.BackButton.hide();
      } catch (e) {}
    };

    window.tgHeader = function (hex) {
      try {
        if (tg.setHeaderColor) tg.setHeaderColor(hex);
        if (tg.setBackgroundColor) tg.setBackgroundColor(hex);
      } catch (e) {}
    };
  }

  window.__tgInit = __tgInit;
  __tgInit();
})();

/* BalanceOS — native iOS haptics for the installed web app.
   iOS 17.4+ plays a subtle Taptic "tick" when a native <input switch> toggles
   from a user gesture. We keep ONE such switch — kept RENDERED but invisible
   (some iOS builds won't fire the tick for a display:none control) — and click
   it on the touch-down of any interactive control, so the whole mockup buzzes
   under the finger like a real iOS app.
   NOTE: iOS silences these haptics in Low Power Mode and when Settings →
   Sounds & Haptics → System Haptics is off. No-op (silent, never throws)
   wherever unsupported. */
(function () {
  "use strict";
  var label, ready = false, busy = false;

  function ensure() {
    if (ready) return;
    label = document.createElement("label");
    label.setAttribute("aria-hidden", "true");
    // Rendered but invisible & non-interactive (NOT display:none).
    label.style.cssText =
      "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;" +
      "pointer-events:none;overflow:hidden;z-index:-1;";
    var input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", ""); // the iOS-only attribute that taps
    label.appendChild(input);
    (document.body || document.documentElement).appendChild(label);
    ready = true;
  }

  function tap() {
    if (busy) return;          // guard against re-entry from our own click
    busy = true;
    try { ensure(); label.click(); } catch (e) {}
    busy = false;
  }

  // Public: call haptic() anywhere to fire a single tick.
  window.haptic = tap;

  // Auto-fire on the touch-down of real controls → "buzz on press" like iOS.
  var SELECTOR = "button, [role='button'], a[href], .bos-tab, [data-haptic]";
  document.addEventListener("pointerdown", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest("[data-no-haptic]")) return;
    if (t.closest(SELECTOR)) tap();
  }, { capture: true, passive: true });
})();

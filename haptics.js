/* BalanceOS — native iOS haptics for the installed web app.
   iOS 17.4+ plays a subtle Taptic "tick" whenever a native <input switch>
   toggles from a real user gesture. We keep ONE hidden switch and click it on
   the touch-down of any interactive control, so the whole mockup buzzes under
   the finger exactly like a real iOS app. No-op on devices without a Taptic
   Engine (desktop, older iOS) — silent, never throws. */
(function () {
  "use strict";
  var label, ready = false;

  function ensure() {
    if (ready) return;
    label = document.createElement("label");
    label.setAttribute("aria-hidden", "true");
    label.style.display = "none";
    var input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", ""); // the iOS-only attribute that taps
    label.appendChild(input);
    (document.body || document.documentElement).appendChild(label);
    ready = true;
  }

  function tap() {
    try { ensure(); label.click(); } catch (e) {}
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

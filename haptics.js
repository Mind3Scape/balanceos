/* BalanceOS — native iOS haptics for the installed web app.

   Established on-device (iPhone, iOS 17.4+): the Taptic tick fires ONLY for a
   real finger touch on a native <input switch>; a programmatic .click() does
   nothing. So to make any control buzz on tap, we overlay an invisible,
   full-size real switch on top of each LEAF control — the finger lands on the
   switch (→ tick) and the click bubbles through to the control (→ its own
   action still runs). A MutationObserver keeps freshly-rendered controls
   covered as the React app navigates / re-renders.

   iOS still mutes these haptics in Low Power Mode and when Settings → Sounds &
   Haptics → System Haptics is off. Silent no-op wherever unsupported. */
(function () {
  "use strict";
  var SEL = "button, [role='button'], a[href], .tap";
  // A control is a "leaf" only if it holds no other tappable inside it.
  var INTERACTIVE = "button, a[href], input, select, textarea, [role='button'], .tap";
  var FLAG = "data-haptic-on";

  function enhance(host) {
    if (!host || host.nodeType !== 1) return;
    if (host.hasAttribute(FLAG)) return;
    if (host.closest("[data-no-haptic]")) return;
    // Never cover a control that contains other controls (e.g. a row holding a
    // check button) — that would swallow their taps. Enhance the leaves instead.
    if (host.querySelector(INTERACTIVE)) return;
    host.setAttribute(FLAG, "1");
    if (window.getComputedStyle(host).position === "static") host.style.position = "relative";
    var lab = document.createElement("label");
    lab.className = "bos-haptic-overlay";
    lab.setAttribute("aria-hidden", "true");
    lab.setAttribute("data-no-haptic", "");
    lab.style.cssText =
      "position:absolute;inset:0;margin:0;padding:0;border:0;opacity:0;" +
      "display:block;pointer-events:auto;z-index:4;";
    var sw = document.createElement("input");
    sw.type = "checkbox";
    sw.setAttribute("switch", "");          // the iOS-only attribute that taps
    sw.setAttribute("aria-hidden", "true");
    sw.tabIndex = -1;
    sw.style.cssText = "width:100%;height:100%;margin:0;";
    lab.appendChild(sw);
    host.appendChild(lab);
  }

  function scan() {
    var list;
    try { list = document.querySelectorAll(SEL); } catch (e) { return; }
    for (var i = 0; i < list.length; i++) enhance(list[i]);
  }

  // Kept as a no-op: programmatic haptics don't fire on iOS, so there's nothing
  // to do — but any leftover caller won't throw.
  window.haptic = function () {};

  function start() {
    scan();
    var queued = false;
    var mo = new MutationObserver(function () {
      if (queued) return;
      queued = true;
      // setTimeout (not rAF) so it still fires while the tab/PWA is backgrounded.
      setTimeout(function () { queued = false; scan(); }, 50);
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) start();
  else window.addEventListener("DOMContentLoaded", start);
})();

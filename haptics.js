/* BalanceOS — native iOS haptics for the installed web app.

   Established on-device (iPhone, iOS 17.4+): the Taptic tick fires ONLY for a
   real finger touch on a native <input switch>; a programmatic .click() does
   nothing. So to make any control buzz on tap, we overlay an invisible,
   full-size real switch on top of each LEAF control — the finger lands on the
   switch (→ tick) and the click bubbles through to the control (→ its own
   action still runs).

   SELF-HEALING: React can wipe an injected overlay when it updates a control's
   text (a single-text-child update sets textContent, which removes our child —
   this happened on the onboarding's reused "Далее" button). So we never mark a
   control "done"; we re-add the overlay whenever it's missing, driven by a
   MutationObserver plus a low-frequency interval.

   iOS still mutes these haptics in Low Power Mode and when System Haptics is
   off. Silent no-op wherever unsupported. */
(function () {
  "use strict";
  var SEL = "button, [role='button'], a[href], .tap";
  var INTERACTIVE = "button, a[href], input, select, textarea, [role='button'], .tap";

  function hasOverlay(host) {
    for (var i = 0; i < host.children.length; i++) {
      if (host.children[i].className === "bos-haptic-overlay") return true;
    }
    return false;
  }

  // A "leaf" holds no other tappable (ignoring our own overlay), so covering it
  // won't swallow a nested control's taps.
  function isLeaf(host) {
    var found = host.querySelectorAll(INTERACTIVE);
    for (var i = 0; i < found.length; i++) {
      if (!found[i].closest(".bos-haptic-overlay")) return false;
    }
    return true;
  }

  function removeOverlay(host) {
    for (var i = host.children.length - 1; i >= 0; i--) {
      if (host.children[i].className === "bos-haptic-overlay") host.removeChild(host.children[i]);
    }
  }

  function enhance(host) {
    if (!host || host.nodeType !== 1) return;
    if (host.closest("[data-no-haptic]")) return;
    // Don't cover tall in-page blocks (cards): a full-size switch overlay would
    // swallow a page scroll started over them. A plain card scrolls fine and
    // still opens on a clean tap — it just won't buzz. The floating tab bar
    // (outside .bos-page) is exempt, so tabs keep their haptic.
    if (host.closest(".bos-page") && host.offsetHeight > 56) { if (hasOverlay(host)) removeOverlay(host); return; }
    if (hasOverlay(host)) return;   // already covered (re-checks every scan → self-heals)
    if (!isLeaf(host)) return;      // contains a real nested control → enhance its leaves
    if (window.getComputedStyle(host).position === "static") host.style.position = "relative";
    var lab = document.createElement("label");
    lab.className = "bos-haptic-overlay";
    lab.setAttribute("aria-hidden", "true");
    lab.setAttribute("data-no-haptic", "");
    lab.style.cssText =
      "position:absolute;inset:0;margin:0;padding:0;border:0;opacity:0;" +
      "display:block;pointer-events:auto;z-index:4;touch-action:manipulation;";
    var sw = document.createElement("input");
    sw.type = "checkbox";
    sw.setAttribute("switch", "");          // the iOS-only attribute that taps
    sw.setAttribute("aria-hidden", "true");
    sw.tabIndex = -1;
    // touch-action:manipulation → a drag over the control scrolls the page
    // instead of the switch swallowing it; only a real tap toggles it (haptic).
    sw.style.cssText = "width:100%;height:100%;margin:0;touch-action:manipulation;";
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
      setTimeout(function () { queued = false; scan(); }, 80);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    // Safety net: re-heal overlays a re-render may have wiped between mutations
    // (e.g. the 60fps onboarding updating a reused button's text).
    setInterval(scan, 1000);
  }

  if (document.body) start();
  else window.addEventListener("DOMContentLoaded", start);
})();

/* TEMP haptics diagnostic panel — round 2.
   Established: only a REAL finger touch on a native <input switch> fires the
   Taptic tick; programmatic .click() does NOT (on this iOS). Remaining question
   for "buzz on any button": does a real touch on an INVISIBLE switch hidden
   under a normal button still fire it? Tests:
     1) real visible switch, finger toggle (ground-truth re-check)
     2) a normal button with a fully transparent (opacity:0) switch overlay
     3) same, but the switch is barely-there (opacity:0.02) in case 0 suppresses it
   If 2 or 3 buzz AND show "нажалось", we can roll the overlay onto real controls.
   Remove this file + its <script> once the method is settled. */
(function () {
  "use strict";
  function E(tag, css, txt) {
    var e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (txt != null) e.textContent = txt;
    e.setAttribute("data-no-haptic", "");
    return e;
  }
  function mkSwitch(extra) {
    var s = document.createElement("input");
    s.type = "checkbox";
    s.setAttribute("switch", "");
    s.setAttribute("data-no-haptic", "");
    if (extra) s.style.cssText = extra;
    return s;
  }
  function btn(label, bg) {
    return E("button",
      "position:relative;overflow:hidden;display:block;width:100%;padding:14px;margin:6px 0;" +
      "background:" + (bg || "#2b6fe0") + ";border:0;border-radius:12px;color:#fff;font:inherit;", label);
  }
  // A normal-looking button with a transparent REAL switch overlay filling it.
  // Real touch lands on the switch (→ haptic?), the click bubbles to the button
  // (→ its action still runs, shown as "нажалось ✓").
  function overlayButton(label, opacity) {
    var b = btn(label);
    var ov = E("label", "position:absolute;inset:0;margin:0;display:flex;opacity:" + opacity + ";");
    ov.appendChild(mkSwitch("width:100%;height:100%;margin:0;"));
    b.appendChild(ov);
    var fired = false;
    b.addEventListener("click", function () {
      if (fired) return; fired = true;
      b.firstChild.nodeValue = label + "  ✓ нажалось";
    });
    return b;
  }

  function build() {
    if (document.getElementById("haptic-test")) return;
    var P = E("div",
      "position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:2147483647;" +
      "width:330px;max-width:92vw;background:rgba(18,18,22,0.95);color:#fff;" +
      "border:1px solid rgba(255,255,255,0.16);border-radius:18px;padding:14px;" +
      "font:600 13px/1.3 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;" +
      "box-shadow:0 16px 50px rgba(0,0,0,0.55);-webkit-backdrop-filter:blur(22px);" +
      "backdrop-filter:blur(22px);text-align:center;");
    P.id = "haptic-test";
    P.appendChild(E("div", "opacity:0.65;font-size:11px;margin-bottom:8px;letter-spacing:0.3px;",
      "ТЕСТ ВИБРО 2 — какие № чувствуешь?"));

    // 1 — ground truth
    var r1 = E("label",
      "display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.08);" +
      "border-radius:12px;padding:10px 12px;margin:6px 0;");
    r1.appendChild(E("span", null, "1 · крути пальцем"));
    r1.appendChild(mkSwitch("transform:scale(1.1)"));
    P.appendChild(r1);

    // 2 & 3 — normal buttons with hidden switch overlay
    P.appendChild(overlayButton("2 · кнопка (свитч невидимый)", "0"));
    P.appendChild(overlayButton("3 · кнопка (свитч чуть-чуть)", "0.02"));

    var hide = E("button",
      "display:block;width:100%;padding:8px;margin-top:6px;background:transparent;border:0;" +
      "color:rgba(255,255,255,0.55);font:inherit;", "скрыть");
    hide.addEventListener("click", function () { P.remove(); });
    P.appendChild(hide);

    document.body.appendChild(P);
  }

  if (document.body) build();
  else window.addEventListener("DOMContentLoaded", build);
})();

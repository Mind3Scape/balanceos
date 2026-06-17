/* TEMP haptics diagnostic panel — remove once we know which method fires.
   Shows 4 techniques so the user can feel each and report which buzz:
     1) a REAL native <input switch> toggled by finger  → ground truth: does iOS
        play ANY web haptic here at all (Low Power Mode off, System Haptics on)?
     2) programmatic .click() on a HIDDEN switch (our window.haptic)
     3) programmatic .click() on a VISIBLE switch (does visibility matter?)
     4) navigator.vibrate() (expected no-op on iOS — baseline)
   All controls carry data-no-haptic so the app's global listener stays out of
   the way and results aren't conflated. */
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
      "display:block;width:100%;padding:12px;margin:6px 0;background:" + (bg || "#2b6fe0") +
      ";border:0;border-radius:12px;color:#fff;font:inherit;", label);
  }

  function build() {
    if (document.getElementById("haptic-test")) return;
    var P = E("div",
      "position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:2147483647;" +
      "width:320px;max-width:92vw;background:rgba(18,18,22,0.95);color:#fff;" +
      "border:1px solid rgba(255,255,255,0.16);border-radius:18px;padding:14px;" +
      "font:600 13px/1.3 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;" +
      "box-shadow:0 16px 50px rgba(0,0,0,0.55);-webkit-backdrop-filter:blur(22px);" +
      "backdrop-filter:blur(22px);text-align:center;");
    P.id = "haptic-test";
    P.appendChild(E("div", "opacity:0.65;font-size:11px;margin-bottom:8px;letter-spacing:0.3px;",
      "ТЕСТ ВИБРО — какие № ты чувствуешь?"));

    // 1 — real switch, finger toggle (ground truth)
    var r1 = E("label",
      "display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.08);" +
      "border-radius:12px;padding:10px 12px;margin:6px 0;");
    r1.appendChild(E("span", null, "1 · крути пальцем"));
    r1.appendChild(mkSwitch("transform:scale(1.1)"));
    P.appendChild(r1);

    // 2 — programmatic click on HIDDEN switch (window.haptic from haptics.js)
    var b2 = btn("2 · клик по скрытому свитчу");
    b2.addEventListener("click", function () { if (window.haptic) window.haptic(); });
    P.appendChild(b2);

    // 3 — programmatic click on a VISIBLE switch
    var sw3 = mkSwitch("transform:scale(1.1);pointer-events:none;margin:4px 0 8px;");
    var b3 = btn("3 · клик по видимому свитчу");
    b3.addEventListener("click", function () { sw3.click(); });
    P.appendChild(b3);
    P.appendChild(sw3);

    // 4 — Vibration API (baseline; expected silent on iOS)
    var b4 = btn("4 · vibrate() API", "#3a3a40");
    b4.addEventListener("click", function () { try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) {} });
    P.appendChild(b4);

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

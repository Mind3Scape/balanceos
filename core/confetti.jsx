/* Конфетти — ОДИН движок на все праздники приложения (закрытие дня, новый уровень).

   Почему канвас, а не DOM: 30-60 летящих кусочков DOM-нодами заставляют браузер пересчитывать
   вёрстку каждый кадр — на слабом телефоне в Telegram это заметная дрожь. Канвас рисует их за
   один проход, ничего не пересчитывая.

   Живёт вне React намеренно: это не часть экрана, а вспышка поверх него. Любой код в любом
   месте может позвать window.bosConfetti() — не нужно ни портала, ни состояния, ни размонтирования.
   Канвас создаётся при первом залпе и сам себя убирает, когда последняя ленточка улетела.

   Палитра — только белый/чёрный/золото (правило хрома). Контрастный цвет переворачивается по теме:
   на светлом фоне белая ленточка невидима, на тёмном — невидима чёрная.  */

(function () {
  var GOLD = "#FEDE34";      // основное золото
  var GOLD_DEEP = "#EF9F14"; // тёплое золото — глубина, чтобы масса не читалась плоским пятном
  var INK = "#0a0a0a";
  var WHITE = "#ffffff";

  var canvas = null, ctx = null, pieces = [], raf = 0, prevTs = 0, dpr = 1;

  function reducedMotion() {
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  }
  function isDarkNow() {
    try { return !!document.querySelector(".bos-page.theme-dark"); } catch (e) { return false; }
  }

  function ensureCanvas() {
    if (canvas) return canvas;
    canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    // z-index выше шторок (300) и XP-всплывашки (9000): праздник поверх ВСЕГО, но кликам не мешает.
    canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9600;";
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
    return canvas;
  }
  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2); // >2 не даёт видимой чёткости, но жрёт заливку
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function teardown() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    window.removeEventListener("resize", resize);
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    canvas = null; ctx = null; pieces = []; prevTs = 0;
  }

  /* Центр телефонной «страницы» — якорь по умолчанию. Внутри рамки, а не всего окна:
     на десктопе-макете окно шире телефона, и салют из центра экрана бил бы мимо. */
  function defaultOrigin() {
    var r = null;
    try { var el = document.querySelector(".bos-page"); if (el) r = el.getBoundingClientRect(); } catch (e) {}
    if (!r || !r.width) return { x: window.innerWidth / 2, y: window.innerHeight * 0.42 };
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.42 };
  }

  function palette(dark) {
    // Два золота несут праздник, контрастный — ритм. Золота вдвое больше: это цвет награды,
    // а чёрный/белый только оттеняет, иначе получается ёлочная мишура вместо сдержанного салюта.
    var contrast = dark ? WHITE : INK;
    return [GOLD, GOLD, GOLD_DEEP, GOLD_DEEP, GOLD, contrast];
  }

  function spawn(o) {
    var dark = o.dark != null ? !!o.dark : isDarkNow();
    var colors = palette(dark);
    var count = o.count | 0 || 26;
    var power = o.power || 12;
    var spread = o.spread || 2.1;           // радиан, вилка вокруг «вверх»
    var base = o.angle != null ? o.angle : -Math.PI / 2;
    for (var i = 0; i < count; i++) {
      var a = base + (Math.random() - 0.5) * spread;
      var sp = power * (0.5 + Math.random() * 0.6);
      var ribbon = Math.random() > 0.28;    // ~1 из 4 — точка: она даёт «пыль» между ленточками
      pieces.push({
        x: o.x, y: o.y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        w: ribbon ? 2.4 + Math.random() * 1.4 : 0,
        h: ribbon ? 6 + Math.random() * 4 : 0,
        r: ribbon ? 0 : 1.5 + Math.random() * 1.3,
        color: colors[(Math.random() * colors.length) | 0],
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.34,
        flip: Math.random() * Math.PI * 2,
        vf: 0.1 + Math.random() * 0.16,     // кувырок «на ребро» — от него ленточка мерцает
        drift: (Math.random() - 0.5) * 0.055,
        age: 0,
        ttl: (o.ttl || 1500) + Math.random() * 500,
      });
    }
  }

  function frame(ts) {
    raf = 0;
    if (!ctx) return;
    var dt = prevTs ? Math.min((ts - prevTs) / 16.667, 3) : 1; // в «кадрах по 60fps»; клампим прыжки
    prevTs = ts;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    var alive = 0, H = window.innerHeight;
    for (var i = 0; i < pieces.length; i++) {
      var p = pieces[i];
      if (p.dead) continue;
      p.age += dt * 16.667;
      // Гравитация 0.22, а не 0.3 (David: «взрываются с хорошей скоростью, а падают пусть на
      // 20-30% помедленнее»). Трогаем ТОЛЬКО падение: начальная скорость залпа (power) прежняя,
      // поэтому «хлопок» такой же резкий, а кусочки после него висят в воздухе дольше.
      p.vy += 0.22 * dt;
      p.vx = (p.vx + p.drift * dt) * Math.pow(0.988, dt); // снос вбок + сопротивление воздуха
      p.vy *= Math.pow(0.992, dt);
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.rot += p.vr * dt; p.flip += p.vf * dt;
      if (p.age > p.ttl || p.y > H + 30) { p.dead = true; continue; }
      alive++;
      var fade = p.ttl - p.age;
      var alpha = fade < 420 ? Math.max(0, fade / 420) : 1;
      var tilt = Math.cos(p.flip);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      // Кувырок: ленточка сплющивается по высоте и тускнеет, когда встаёт к нам ребром.
      // Это тот самый живой блик, который отличает конфетти от летящих прямоугольников.
      ctx.globalAlpha = alpha * (p.h ? 0.5 + 0.5 * Math.abs(tilt) : 1);
      ctx.fillStyle = p.color;
      if (p.h) { ctx.scale(1, Math.max(0.08, Math.abs(tilt))); ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
      else { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    if (!alive) { teardown(); return; }
    if (pieces.length > 400) pieces = pieces.filter(function (p) { return !p.dead; });
    raf = requestAnimationFrame(frame);
  }

  /* Один залп. {x,y} — откуда; count/power/spread/angle/ttl/dark — необязательные. */
  function bosConfetti(opts) {
    opts = opts || {};
    if (reducedMotion()) return;
    var o = defaultOrigin();
    if (opts.x != null) o.x = opts.x;
    if (opts.y != null) o.y = opts.y;
    ensureCanvas();
    spawn({
      x: o.x, y: o.y, count: opts.count, power: opts.power, spread: opts.spread,
      angle: opts.angle, ttl: opts.ttl, dark: opts.dark,
    });
    if (!raf) { prevTs = 0; raf = requestAnimationFrame(frame); }
  }

  /* Залп из центра элемента — когда праздник должен вырасти из конкретной вещи на экране. */
  function bosConfettiFrom(el, opts) {
    var o = opts || {};
    try {
      var r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
      if (r && r.width) { o = Object.assign({}, o, { x: r.left + r.width / 2, y: r.top + r.height / 2 }); }
    } catch (e) {}
    bosConfetti(o);
  }

  /* ЗАКРЫТ ДЕНЬ ПРИВЫЧЕК — сдержанно: один залп вверх из центра телефона.
     Это ежедневное событие, поэтому оно НЕ должно ощущаться как фейерверк — иначе на третий
     день начнёт раздражать. Короткая вспышка, полторы секунды, и экран снова чистый. */
  function bosCelebrateDay(anchor) {
    if (reducedMotion()) return;
    // Отдачу в палец НЕ трогаем: ровно в этот момент AppProvider начисляет «+30 идеальный день»
    // и уже делает tgHaptic("success"). Свой буз здесь дал бы двойной толчок подряд.
    // ttl вырос вместе с замедлением падения: на прежних 1500мс кусочки таяли ещё в воздухе,
    // не долетев, — и вместо «упало» получалось «исчезло».
    var base = { count: 26, power: 12, spread: 1.9, ttl: 1900 };
    if (anchor) bosConfettiFrom(anchor, base); else bosConfetti(base);
  }

  /* Один общий, ПРИТОРМОЖЕННЫЙ толчок в палец. Праздники умеют совпадать: последняя галочка может
     закрыть разом и круг, и весь день — а два «успеха» подряд читаются пальцем как заикание, а не
     как двойная радость. Все празднования зовут только его. */
  var lastBuzz = 0;
  function bosCelebrateBuzz() {
    var now = Date.now();
    if (now - lastBuzz < 900) return;
    lastBuzz = now;
    if (window.tgHaptic) { try { window.tgHaptic("success"); } catch (e) {} }
  }

  /* Праздник, привязанный к ОТДЕЛЬНОЙ доске — цели или кругу.
     Зачем отдельно от «дня целиком»: привычка «вести только внутри цели» намеренно не попадает ни
     на главную доску, ни в счёт дня. Значит, у человека, который ведёт привычки только в целях,
     общий салют не случится НИКОГДА — закрытие цели обязано быть своим событием.
     Свой ключ на день → салют один раз; снял и вернул галочку — он не повторится. */
  function bosCelebrateScope(scopeKey, anchor) {
    if (!scopeKey) return false;
    var day = (typeof bosTodayKey === "function") ? bosTodayKey() : "";
    var k = "bos:dayfull:" + scopeKey + ":" + day;
    var seen = false;
    try { seen = localStorage.getItem(k) === "1"; } catch (e) {}
    if (seen) return false;
    try { localStorage.setItem(k, "1"); } catch (e2) {}
    bosCelebrateBuzz();
    bosCelebrateDay(anchor);
    return true;
  }

  /* НОВЫЙ УРОВЕНЬ — редкое событие, ему можно громче: две боковые «пушки» снизу вверх плюс
     догоняющая волна из центра. Задержки делают из трёх залпов одну нарастающую сцену. */
  function bosCelebrateLevel() {
    if (reducedMotion()) return;
    var r = null;
    try { var el = document.querySelector(".bos-page"); if (el) r = el.getBoundingClientRect(); } catch (e) {}
    var L = r && r.width ? r.left : window.innerWidth / 2 - 190;
    var W = r && r.width ? r.width : 380;
    var B = r && r.height ? r.top + r.height : window.innerHeight;
    bosConfetti({ x: L + W * 0.08, y: B - 20, angle: -Math.PI / 2.45, spread: 0.75, count: 24, power: 19, ttl: 2650 });
    bosConfetti({ x: L + W * 0.92, y: B - 20, angle: -Math.PI / 1.72, spread: 0.75, count: 24, power: 19, ttl: 2650 });
    window.setTimeout(function () { bosConfetti({ y: (r ? r.top + r.height * 0.36 : window.innerHeight * 0.36), count: 22, power: 11, spread: 2.4, ttl: 2150 }); }, 260);
  }

  window.bosConfetti = bosConfetti;
  window.bosConfettiFrom = bosConfettiFrom;
  window.bosCelebrateDay = bosCelebrateDay;
  window.bosCelebrateScope = bosCelebrateScope;
  window.bosCelebrateBuzz = bosCelebrateBuzz;
  window.bosCelebrateLevel = bosCelebrateLevel;
})();

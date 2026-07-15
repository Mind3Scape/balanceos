/* АРХИВ. Вырезано из screens/live/shared_live.jsx (David 2026-07-15).
   Резолвер вида карточки цели/круга: форма (баннер/квадрат), орбиты, прогресс, название.
   Читал localStorage bos:goalStyle, менялся вкладкой «Цели» в CardStyleMenuLive. */

var BOS_GOAL_STYLE_DEFAULT = { form: "banner", name: true, orbits: false, progress: true };
function bosLoadGoalStyle() { try { var s = JSON.parse(localStorage.getItem("bos:goalStyle") || "null"); if (s && typeof s === "object") return Object.assign({}, BOS_GOAL_STYLE_DEFAULT, s); } catch (e) {} return Object.assign({}, BOS_GOAL_STYLE_DEFAULT); }
function bosSaveGoalStyle(s) { try { localStorage.setItem("bos:goalStyle", JSON.stringify(s)); } catch (e) {} try { window.dispatchEvent(new Event("bos:cardStyleChanged")); } catch (e) {} }

// ─── ОБЩИЕ ПЛИТКИ привычки/цели (David: «унифицировать») ──────────────────────────────────────────
// Плитки вынесены СЮДА из HabitsLive и стали самодостаточными (тема/стиль/хендлеры через хуки), чтобы
// и страница «Привычки», и виджеты ГЛАВНОЙ рисовали ОДНО И ТО ЖЕ и слушали ОДИН стиль. Настройки в
// шестерёнке теперь влияют на оба экрана. `from` = откуда открыт detail (habits/home). ctx.mode —
// режим перестановки сетки (на «Привычках»); на главной всегда false.
function useBosCardStyle() {
  var st = React.useState(bosLoadCardStyle), s = st[0], setS = st[1];
  React.useEffect(function () { var h = function () { setS(bosLoadCardStyle()); }; window.addEventListener("bos:cardStyleChanged", h); return function () { window.removeEventListener("bos:cardStyleChanged", h); }; }, []);
  return s;
}
function useBosGoalStyle() {
  var st = React.useState(bosLoadGoalStyle), s = st[0], setS = st[1];
  React.useEffect(function () { var h = function () { setS(bosLoadGoalStyle()); }; window.addEventListener("bos:cardStyleChanged", h); return function () { window.removeEventListener("bos:cardStyleChanged", h); }; }, []);
  return s;
}

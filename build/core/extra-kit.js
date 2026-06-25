/* core/extra-kit.jsx — NEUTRAL shared toolkit extracted from screens/extra.jsx (v196 live/demo/core split).
   No product (demo/live) branching — one copy, used by BOTH demos and the live app.
   Moved bricks: AI_LIVE_FALLBACK, MOOD_TAGS, MiniBars, StateChatOrb, bosAid, bosParseAction, buildQuickPrompts, journalDateLabel */
var MOOD_TAGS = {
  "Энергия": ["выспался", "спорт", "продуктивно", "вдохновение", "цель", "музыка", "свежесть", "кофе"],
  "Радость": ["встреча_с_друзьями", "успех", "благодарность", "природа", "любовь", "смех", "забота", "хорошая_новость"],
  "Спокойствие": ["медитация", "тишина", "прогулка", "баланс", "выспался", "чтение", "дыхание", "природа"],
  "Тревога": ["дедлайн", "неопределённость", "недосып", "перегруз", "ожидание", "новости", "конфликт", "здоровье"],
  "Упадок": ["усталость", "одиночество", "переутомление", "неудача", "пасмурно", "рутина", "недосып", "сомнения"],
  "Усталость": ["недосып", "перегруз", "много_задач", "дорога", "экраны", "стресс", "нет_отдыха", "мало_движения"]
};
function journalDateLabel(key) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec("" + key);
  if (!m) return "" + key;
  return parseInt(m[3], 10) + " " + (JOURNAL_MONTHS[parseInt(m[2], 10) - 1] || "");
}
function StateChatOrb({
  size = 28,
  tint
}) {
  // The mentor's orb = the user's CURRENT-STATE orb — the same glass mood sphere as the
  // home state widget / week-trail (mood-tinted, glossy), NOT a flat dot and NOT the avatar face.
  var c = tint && tint.length === 3 ? tint : ["#cfe1ff", "#7aa4d0", "#2c4d76"];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: "50%",
      display: "block",
      boxShadow: "0 2px 6px rgba(0,0,0,0.16)"
    }
  }, /*#__PURE__*/React.createElement(StaticOrb, {
    size: size,
    tint: c,
    seed: 1.2,
    intensity: 0.3
  }));
}

/* Context-aware quick prompts (the pills under the chat). A blank-slate user gets
   newcomer-friendly openers; once habits/mood/goals exist, the chips turn personal —
   protect the strongest live streak, match low energy, break a goal down. */
function buildQuickPrompts(app) {
  try {
    var habits = app && app.habits || [];
    var goals = app && app.goals || [];
    var moodT = app && app.mood && app.mood.t || "";
    if (!habits.length) {
      return [{
        i: "🌱",
        t: "С чего мне начать?"
      }, {
        i: "✨",
        t: "Предложи первую привычку"
      }, {
        i: "🌊",
        t: "Хочу меньше тревоги"
      }, {
        i: "🧭",
        t: "Помоги навести порядок в дне"
      }];
    }
    var chips = [];
    var atRisk = habits.filter(h => !h.done && (h.streak || 0) > 0).sort((a, b) => (b.streak || 0) - (a.streak || 0))[0];
    if (atRisk) chips.push({
      i: "🔥",
      t: "Не сорвать «" + (atRisk.name || "привычку") + "»"
    });
    var low = /устал|упад|трев|стресс|тяж|нет сил/i.test(moodT);
    chips.push(low ? {
      i: "💤",
      t: "Сегодня мало сил"
    } : {
      i: "🌙",
      t: "Спланируй вечер"
    });
    if (goals.length) chips.push({
      i: "🎯",
      t: "Разбей цель на шаги"
    });
    chips.push({
      i: "🤝",
      t: "Позвать друга в привычку"
    });
    chips.push({
      i: "🧭",
      t: "Что сейчас важнее всего?"
    });
    return chips.slice(0, 4);
  } catch (e) {
    return [{
      i: "🌙",
      t: "Спланируй вечер"
    }, {
      i: "✨",
      t: "Предложи привычку"
    }, {
      i: "🌊",
      t: "Хочу меньше тревоги"
    }, {
      i: "🧭",
      t: "С чего начать?"
    }];
  }
}

/* Bar chart used inside an AI insight bubble */
function MiniBars({
  data,
  color = "#0a0a0a",
  height = 60,
  textMuted = "rgba(0,0,0,0.5)",
  barIdle = "rgba(0,0,0,0.12)"
}) {
  var max = Math.max(...data.map(d => d.v));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 6,
      height,
      marginTop: 10
    }
  }, data.map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      borderRadius: 4,
      height: d.v / max * (height - 16),
      background: d.h ? color : barIdle,
      transition: "height 0.4s"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: textMuted,
      letterSpacing: 0.5
    }
  }, d.l))));
}

/* ── Live AI via OpenRouter (PROXY-ONLY) ────────────────────────────────────
   All AI goes through the Edge Function proxy (ai-chat), which holds the key as a
   SERVER secret and picks the model via the OPENROUTER_MODEL secret. The client
   never holds the key. No proxy / empty reply → graceful heuristic + honest fallback. */

// ⚙️ ЕДИНАЯ МОДЕЛЬ ИИ — меняется ОДНОЙ этой строкой, потом обычный git push (НЕ Supabase).
// Живёт в коде приложения; прокси просто передаёт её дальше, ключ остаётся секретом на сервере.
// Любой id с https://openrouter.ai/models (например "deepseek/deepseek-v4-flash").
var AI_LIVE_FALLBACK = "Связь с ИИ сейчас нестабильна — попробуй ещё раз через минуту 🙏";
// fetch with an abort timeout so a slow/stuck model never hangs the chat or brief.
function bosParseAction(raw) {
  var text = "" + (raw || "");
  var action = null;
  try {
    var m = text.match(/@@ACTION\s*(\{[\s\S]*\})\s*$/);
    if (m) {
      action = bosSanitizeAction(JSON.parse(m[1]));
      text = text.slice(0, m.index).trim();
    }
  } catch (e) {
    action = null;
  }
  // Even if the JSON was malformed, never let a raw @@ACTION marker reach the user.
  if (!action) text = text.replace(/@@ACTION[\s\S]*$/, "").trim();
  return {
    text: text,
    action: action
  };
}
function bosAid() {
  _bosAidN += 1;
  return "a" + Date.now() + "_" + _bosAidN;
}

/* ── L1 · LOGIN BRIEF ────────────────────────────────────────────────────────
   Once at login the mentor reads the user's real context and returns a compact
   JSON "brief": a personal summary for the home banner, 3–4 tappable suggestion
   pills, a one-line greeting and a small next-step hint. We NEVER hard-depend on
   the model — a heuristic brief is always computed first, and the AI just refines
   it. So live users always get something personal, even offline. */

// BalanceOS — AI proxy (Supabase Edge Function).
//
// WHY: the OpenRouter key must NOT ship in the public site. This function holds the key
// as a SERVER secret and proxies chat requests, so the live app's AI works for ALL users
// while the key stays hidden.
//
// THE MODEL IS PINNED HERE (deepseek/deepseek-v4-flash). We deliberately NO LONGER read an
// OPENROUTER_MODEL secret: a leftover secret silently OVERRODE the code and routed some
// traffic through a different, rate-limited model — which is exactly what broke the chat.
// One model, one place. Чтобы сменить модель — поменяй строку MODEL ниже и передеплой.
//
// DEPLOY (Дэвид, один раз после ЛЮБОЙ правки этого файла):
//   1) Supabase Dashboard → Edge Functions → ai-chat → Deploy (вставь весь этот файл)
//      (или через CLI:  supabase functions deploy ai-chat)
//   2) Project Settings → Edge Functions → Secrets → проверь, что задан ОДИН секрет:
//        OPENROUTER_KEY = sk-or-...      (рабочий ключ; на сервере он безопасен)
//      OPENROUTER_MODEL больше НЕ нужен — можешь удалить, код его игнорирует.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// The single model the whole app speaks through. Pinned on purpose (see header).
const MODEL = "deepseek/deepseek-v4-flash";

// One call to OpenRouter. Returns the text + (if it failed) the REAL upstream reason,
// so we never again hide an error behind a silent empty reply.
async function askOpenRouter(key: string, messages: unknown) {
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + key,
      "HTTP-Referer": "https://mind3scape.github.io/balanceos",
      "X-Title": "BalanceOS",
    },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: 500, temperature: 0.7 }),
  });
  let data: any = null;
  try { data = await r.json(); } catch (_e) { data = null; }
  const reply = ((data && data.choices && data.choices[0] && data.choices[0].message
    && data.choices[0].message.content) || "").trim();
  const upstreamErr = data && data.error ? (data.error.message || data.error) : null;
  return { status: r.status, reply, upstreamErr };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { ...CORS, "Content-Type": "application/json" } });
  try {
    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const key = Deno.env.get("OPENROUTER_KEY");
    if (!key) return json({ reply: "", error: "OPENROUTER_KEY secret is not set" });

    // First try. If the model hiccups and returns an empty body, retry ONCE on the
    // SAME model — a transient empty shouldn't surface to the user as "AI unavailable".
    let res = await askOpenRouter(key, messages);
    if (!res.reply) {
      await new Promise((s) => setTimeout(s, 500));
      res = await askOpenRouter(key, messages);
    }
    if (res.reply) return json({ reply: res.reply });

    // Still nothing — surface the real reason (function logs + response body) instead of
    // pretending it's fine. The client keeps showing its graceful fallback line.
    console.error("ai-chat empty reply", res.status, res.upstreamErr);
    return json({ reply: "", error: res.upstreamErr || ("no content (status " + res.status + ")"), status: res.status });
  } catch (e) {
    console.error("ai-chat exception", String(e));
    return json({ reply: "", error: String(e) });
  }
});

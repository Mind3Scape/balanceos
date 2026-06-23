// BalanceOS — AI proxy (Supabase Edge Function).
//
// WHY: the OpenRouter key must NOT ship in the public site. This function holds the key
// as a SERVER secret and proxies chat requests, so the live app's AI works for ALL users
// while the key stays hidden.
//
// DEPLOY (Дэвид, один раз):
//   1) Supabase Dashboard → Edge Functions → Deploy a new function → name it  ai-chat
//      → вставь весь этот файл → Deploy.
//      (или через CLI:  supabase functions deploy ai-chat)
//   2) Project Settings → Edge Functions → Secrets → добавь:
//        OPENROUTER_KEY = твой ключ sk-or-...        (тут он безопасен, на сервере)
//      (опционально OPENROUTER_MODEL = deepseek/deepseek-v4-flash  — иначе берётся по умолчанию)
//   Всё. Приложение само начнёт ходить сюда, ИИ заработает у всех. Ключ нигде не виден.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const key = Deno.env.get("OPENROUTER_KEY");
    const model = Deno.env.get("OPENROUTER_MODEL") || "deepseek/deepseek-v4-flash";
    if (!key) {
      return new Response(JSON.stringify({ error: "OPENROUTER_KEY secret is not set" }),
        { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
    }
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + key,
        "HTTP-Referer": "https://mind3scape.github.io/balanceos",
        "X-Title": "BalanceOS",
      },
      body: JSON.stringify({ model, messages, max_tokens: 500, temperature: 0.7 }),
    });
    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ reply }),
      { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});

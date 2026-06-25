// BalanceOS — AI proxy (Supabase Edge Function).
//
// WHY: only the OpenRouter KEY is secret, so only it lives here (server-side). The MODEL
// is NOT secret — it travels in each request FROM THE APP (client). That means David
// changes the model in the app's code (one line: BOS_AI_MODEL) and ships it with a normal
// web deploy (git push → GitHub Pages). He never edits anything about the model in Supabase.
//
// DEPLOY (Дэвид — ОДИН раз, и больше сюда не возвращаешься ради модели):
//   1) Supabase Dashboard → Edge Functions → ai-chat → Deploy (вставь весь этот файл)
//      (или CLI:  supabase functions deploy ai-chat)
//   2) Project Settings → Edge Functions → Secrets → один секрет:
//        OPENROUTER_KEY = sk-or-...      (рабочий ключ; здесь он безопасен)
//      OPENROUTER_MODEL НЕ нужен — модель приходит из приложения. Можешь удалить.
//   Дальше менять модель = я правлю BOS_AI_MODEL в коде приложения + git push. Supabase не трогаем.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Used only if an old client doesn't send a model. The app normally always sends one.
const DEFAULT_MODEL = "deepseek/deepseek-v4-flash";

// One call to OpenRouter. Returns the text + (if it failed) the REAL upstream reason, so
// we never again hide an error behind a silent empty reply.
async function askOpenRouter(key: string, model: string, messages: unknown) {
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
    // Model comes from the app (client). Fall back only if it's missing/garbage.
    const model = (typeof body?.model === "string" && body.model.trim()) ? body.model.trim() : DEFAULT_MODEL;
    const key = Deno.env.get("OPENROUTER_KEY");
    if (!key) return json({ reply: "", error: "OPENROUTER_KEY secret is not set" });

    // First try. If the model hiccups and returns an empty body, retry ONCE on the SAME
    // model — a transient empty shouldn't surface to the user as "AI unavailable".
    let res = await askOpenRouter(key, model, messages);
    if (!res.reply) {
      await new Promise((s) => setTimeout(s, 500));
      res = await askOpenRouter(key, model, messages);
    }
    if (res.reply) return json({ reply: res.reply });

    // Still nothing — surface the real reason (function logs + response body) instead of
    // pretending it's fine. The client keeps showing its graceful fallback line.
    console.error("ai-chat empty reply", model, res.status, res.upstreamErr);
    return json({ reply: "", error: res.upstreamErr || ("no content (status " + res.status + ")"), status: res.status });
  } catch (e) {
    console.error("ai-chat exception", String(e));
    return json({ reply: "", error: String(e) });
  }
});

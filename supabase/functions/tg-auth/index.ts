// BalanceOS — вход через Telegram (Supabase Edge Function).
//
// Что делает: приложение, открытое ВНУТРИ Telegram, получает подписанные данные
// (initData). Эта функция проверяет подпись ботом (секрет BOT_TOKEN), находит/создаёт
// пользователя Supabase для этого Telegram-аккаунта и возвращает одноразовый код (otp),
// которым приложение получает сессию. Так каждый юзер = реальный аккаунт, и RLS работает.
//
// DEPLOY (Дэвид, один раз — как ai-chat):
//   1) Supabase → Edge Functions → Deploy a new function → Via Editor → имя: tg-auth
//      → вставь весь этот файл → Deploy.
//   2) Project Settings → Edge Functions → Secrets → добавь:
//        BOT_TOKEN = токен твоего бота из @BotFather   (тут он безопасен, на сервере)
//   (SUPABASE_URL / SERVICE_ROLE_KEY Supabase подставляет в функции сам — их добавлять НЕ нужно.)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// Проверка подписи Telegram WebApp initData (HMAC-SHA256).
async function validateInitData(initData: string, botToken: string) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash") || "";
  params.delete("hash");
  const pairs: string[] = [];
  for (const [k, v] of params) pairs.push(`${k}=${v}`);
  pairs.sort();
  const dataCheckString = pairs.join("\n");

  const enc = new TextEncoder();
  const hmac = async (keyBytes: ArrayBuffer | Uint8Array, msg: string) => {
    const key = await crypto.subtle.importKey("raw", keyBytes as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(msg)));
  };
  const secretKey = await hmac(enc.encode("WebAppData"), botToken);
  const computed = await hmac(secretKey, dataCheckString);
  const hex = Array.from(computed).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex !== hash) return null;

  // не старше 24ч
  const authDate = Number(params.get("auth_date") || "0");
  if (authDate && Date.now() / 1000 - authDate > 86400) return null;

  try { return JSON.parse(params.get("user") || "null"); } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { initData, referredBy } = await req.json();
    const botToken = Deno.env.get("BOT_TOKEN");
    if (!botToken) return json({ error: "BOT_TOKEN secret is not set" }, 500);
    if (!initData) return json({ error: "no initData" }, 400);

    const tgUser = await validateInitData(initData, botToken);
    if (!tgUser || !tgUser.id) return json({ error: "invalid initData signature" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    const tgId = String(tgUser.id);
    const email = `tg_${tgId}@balanceos.app`;
    const username = tgUser.first_name || tgUser.username || "";

    // referredBy может быть сырым UUID профиля (старые ссылки) ИЛИ коротким ref_code
    // (красивые ссылки). Превращаем в UUID пригласившего — profiles.referred_by это uuid FK.
    let referredById: string | null = null;
    if (referredBy) {
      const rb = String(referredBy);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rb);
      if (isUuid) {
        referredById = rb;
      } else {
        const { data: ref } = await admin.from("profiles").select("id").eq("ref_code", rb).maybeSingle();
        referredById = ref ? ref.id : null;
      }
    }

    // создаём пользователя при первом входе (метаданные → триггер создаст профиль)
    await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { tg_id: tgId, username, referred_by: referredById },
    }).catch(() => { /* уже существует — норм */ });

    // одноразовый код для получения сессии на клиенте
    const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (error || !data) return json({ error: "session link failed: " + (error?.message || "") }, 500);
    const otp = (data.properties as any)?.email_otp;
    if (!otp) return json({ error: "no otp" }, 500);

    return json({ email, otp, tgId, username });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

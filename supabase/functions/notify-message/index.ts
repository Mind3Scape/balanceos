// BalanceOS — Telegram push when a new team-chat message arrives.
//
// WHAT: every time someone posts in a team chat, this pings the OTHER team members
// in Telegram (via the bot), so people come back. The in-app bell already shows the
// same thing live; this is the push half.
//
// SETUP (Дэвид, один раз):
//   1) Supabase → Edge Functions → Deploy a new function → name it  notify-message
//      → вставь весь этот файл → Deploy.   (или CLI: supabase functions deploy notify-message)
//   2) Секрет BOT_TOKEN уже стоит — больше ключей не нужно. (SUPABASE_URL и
//      SUPABASE_SERVICE_ROLE_KEY Supabase подставляет сам.)
//   3) Database → Webhooks → Create a new hook:
//        Table: public.messages · Events: Insert · Type: Supabase Edge Function
//        → выбери notify-message.  RUN.
//   Всё. Работает только для тех, кто вошёл через Telegram (у них есть tg_id);
//   веб-гости (anon) пуш не получают — это нормально.
//
// БЕЗОПАСНО: ключей в коде нет. Функция читает БД сервис-ролью только чтобы взять
// tg_id участников; наружу уходит лишь короткий текст уведомления.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    // Database Webhook delivers the new row in `record`.
    const msg = (body && (body.record || body.message)) || null;
    if (!msg || !msg.team_id) return new Response("no message", { status: 200 });

    const botToken = Deno.env.get("BOT_TOKEN");
    if (!botToken) return new Response("BOT_TOKEN secret not set", { status: 200 });

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Team name (for a nice notification) + members with their Telegram ids.
    const { data: team } = await supa.from("teams").select("name").eq("id", msg.team_id).maybeSingle();
    const { data: members } = await supa
      .from("team_members")
      .select("user_id, profiles(tg_id, username)")
      .eq("team_id", msg.team_id);

    const author = (members || []).find((m: any) => m.user_id === msg.user_id);
    const authorName = (author && author.profiles && author.profiles.username) || "Кто-то";
    const teamName = (team && team.name) || "команде";
    const preview = msg.text ? String(msg.text).slice(0, 160) : "📷 Фото";
    const text = "💬 " + authorName + " в «" + teamName + "»:\n" + preview;

    const recipients = (members || []).filter(
      (m: any) => m.user_id !== msg.user_id && m.profiles && m.profiles.tg_id,
    );

    await Promise.all(
      recipients.map((m: any) =>
        fetch("https://api.telegram.org/bot" + botToken + "/sendMessage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: m.profiles.tg_id, text, disable_notification: false }),
        }).catch(() => {}),
      ),
    );

    return new Response(JSON.stringify({ ok: true, sent: recipients.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response("err: " + String(e), { status: 200 });
  }
});

// BalanceOS — напоминания привычек: пуш в Телеграм в заданное пользователем время.
//
// WHAT: раз в несколько минут проходит по таблице habit_reminders и тем, у кого сейчас
// наступило локальное время напоминания (и сегодня активный день, и ещё не слали сегодня),
// шлёт сообщение ботом. Половина «в приложении» (шторка + точка) работает и без этого;
// это — пуш, когда приложение ЗАКРЫТО.
//
// SETUP (Дэвид, один раз):
//   1) Прогони SQL:  supabase/patch_habit_reminders.sql  (создаёт таблицу).
//   2) Supabase → Edge Functions → Deploy a new function → имя  remind  → вставь весь
//      этот файл → Deploy.   (или CLI: supabase functions deploy remind)
//      Секрет BOT_TOKEN уже стоит (тот же, что у notify-message) — больше ключей не надо.
//   3) Дай функции РАСПИСАНИЕ (чтобы срабатывала сама):
//      Supabase → Edge Functions → remind → вкладка Schedules → New schedule →
//      Cron:  */5 * * * *  (каждые 5 минут) → Save.
//      (Альтернатива — pg_cron + net.http_post каждые 5 минут на URL функции.)
//   Всё. Пуши приходят только тем, кто вошёл через Telegram (есть tg_id); веб-гости — нет.
//
// БЕЗОПАСНО: ключей в коде нет. Сервис-ролью читаем только расписание + tg_id; наружу
// уходит короткий текст. Каждое напоминание уходит НЕ чаще раза в день (last_sent_day),
// так что повторный вызов функции не спамит.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GRACE_MIN = 120; // шлём в течение 2 часов после времени (переживает редкий/сбойный крон), но раз в день

Deno.serve(async () => {
  try {
    const botToken = Deno.env.get("BOT_TOKEN");
    if (!botToken) return new Response("BOT_TOKEN secret not set", { status: 200 });

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: rows } = await supa.from("habit_reminders").select("*").eq("active", true);
    if (!rows || !rows.length) {
      return new Response(JSON.stringify({ ok: true, due: 0 }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    const nowUtc = new Date();
    const utcMin = nowUtc.getUTCHours() * 60 + nowUtc.getUTCMinutes();

    const due: any[] = [];
    for (const r of rows) {
      const off = Number(r.tz_offset || 0);                       // минуты от UTC
      const localDate = new Date(nowUtc.getTime() + off * 60000); // «сдвинутый» момент = локальное время
      let localMin = utcMin + off;
      while (localMin < 0) localMin += 1440;
      while (localMin >= 1440) localMin -= 1440;
      const localDayStr = localDate.toISOString().slice(0, 10);   // 'YYYY-MM-DD' локального дня
      const localDow = (localDate.getUTCDay() + 6) % 7;           // Пн=0 … Вс=6 (как в приложении)

      const parts = String(r.time || "09:00").split(":");
      const remMin = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);

      if (Array.isArray(r.days) && r.days.length === 7 && !r.days[localDow]) continue; // не сегодня
      const diff = localMin - remMin;
      if (diff < 0 || diff >= GRACE_MIN) continue;                // ещё не время / уже поздно
      if (r.last_sent_day === localDayStr) continue;             // уже слали сегодня
      due.push({ r, localDayStr });
    }

    if (!due.length) {
      return new Response(JSON.stringify({ ok: true, due: 0 }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // tg_id получателей одним запросом
    const userIds = [...new Set(due.map((d) => d.r.user_id))];
    const { data: profs } = await supa.from("profiles").select("id, tg_id").in("id", userIds);
    const tgById: Record<string, any> = {};
    (profs || []).forEach((p: any) => { if (p.tg_id) tgById[p.id] = p.tg_id; });

    let sent = 0;
    await Promise.all(due.map(async ({ r, localDayStr }) => {
      // Метим «отправлено сегодня» СРАЗУ — чтобы повторный запуск крона не дублировал пуш.
      await supa.from("habit_reminders").update({ last_sent_day: localDayStr }).eq("id", r.id);
      const chat = tgById[r.user_id];
      if (!chat) return;
      const text = "⏰ Пора: " + (r.emoji ? r.emoji + " " : "") + (r.name || "привычка") + "\nОтметь в BalanceOS 💚";
      await fetch("https://api.telegram.org/bot" + botToken + "/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chat, text, disable_notification: false }),
      }).catch(() => {});
      sent++;
    }));

    return new Response(JSON.stringify({ ok: true, due: due.length, sent }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response("err: " + String(e), { status: 200 });
  }
});

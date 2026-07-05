// BalanceOS — БЕРЕЖНЫЙ вечерний чек-ин в Телеграм: «как ты себя чувствуешь».
//
// ФИЛОСОФИЯ (David): личный ТГ человека — святое. НЕ спамим. Максимум — один тёплый
// чек-ин РАЗ В НЕДЕЛЮ, вечером (~20:00 по времени человека). Всё остальное, что летит
// в личку — только напоминания, которые человек сам себе поставил (функция remind).
//
// ЧТО: раз в ~30 минут проходит по профилям с tg_id и тем, у кого сейчас локальный вечер
// (20:00–21:00), согласие включено (checkin_on) и с прошлого чек-ина прошло ≥ 7 дней,
// шлёт одно доброе сообщение и метит дату. Часовой пояс — из profiles.tz_offset (если
// неизвестен — считаем по Москве, +180, чтобы тест сработал).
//
// SETUP (Дэвид, один раз):
//   1) Прогони SQL:  supabase/patch_profiles_checkin.sql
//   2) Edge Functions → Deploy a new function → имя  checkin  → вставь весь этот файл → Deploy.
//   3) Дай расписание: Edge Functions → checkin → Schedules → New → Cron:  */30 * * * *  → Save.
//   ── ТЕСТ ТОЛЬКО НА СЕБЕ (чтобы не задеть других, пока не доволен текстом): ──
//   4) Узнай свой Telegram id (напиши боту @userinfobot — он пришлёт число).
//   5) Edge Functions → checkin → Secrets → добавь  CHECKIN_TEST_TG = <твой id>.
//      Тогда чек-ин уйдёт ТОЛЬКО тебе. Первый прилетит СЕГОДНЯ около 20:00 (ты ещё не
//      получал → подходишь под правило «раз в неделю»).
//   6) Понравился текст → удали секрет CHECKIN_TEST_TG → со следующего вечера чек-ин
//      идёт всем (каждому — в его локальные ~20:00, не чаще раза в неделю).
//
// БЕЗОПАСНО: ключей в коде нет. Дедуп по checkin_last → повторный запуск не спамит.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EVE_START = 20 * 60;   // 20:00 локального времени
const EVE_END   = 21 * 60;   // до 21:00 (окно, чтобы поймать при 30-мин кроне)
const MIN_DAYS  = 7;         // не чаще раза в неделю
const DEFAULT_TZ = 180;      // Москва — если пояс ещё не известен

const MESSAGE = "💚 Как ты на этой неделе? Удели себе минутку — загляни в BalanceOS и отметь, как ты себя чувствуешь.";

Deno.serve(async () => {
  try {
    const botToken = Deno.env.get("BOT_TOKEN");
    if (!botToken) return new Response("BOT_TOKEN secret not set", { status: 200 });
    const testTg = Deno.env.get("CHECKIN_TEST_TG"); // если задан — шлём ТОЛЬКО этому id

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: users } = await supa
      .from("profiles")
      .select("id, tg_id, tz_offset, checkin_on, checkin_last")
      .not("tg_id", "is", null);
    if (!users || !users.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    const nowUtc = new Date();
    const utcMin = nowUtc.getUTCHours() * 60 + nowUtc.getUTCMinutes();

    const due: any[] = [];
    for (const u of users) {
      if (!u.tg_id) continue;
      if (u.checkin_on === false) continue;
      if (testTg && String(u.tg_id) !== String(testTg)) continue; // тест-режим: только я

      const off = (u.tz_offset == null) ? DEFAULT_TZ : Number(u.tz_offset);
      let localMin = utcMin + off;
      while (localMin < 0) localMin += 1440;
      while (localMin >= 1440) localMin -= 1440;
      if (localMin < EVE_START || localMin >= EVE_END) continue; // не вечер у него

      const localDate = new Date(nowUtc.getTime() + off * 60000);
      const localDay = localDate.toISOString().slice(0, 10);
      if (u.checkin_last) {
        const days = Math.floor((Date.parse(localDay) - Date.parse(u.checkin_last)) / 86400000);
        if (days < MIN_DAYS) continue; // ещё неделя не прошла
      }
      due.push({ u, localDay });
    }

    if (!due.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    let sent = 0;
    await Promise.all(due.map(async ({ u, localDay }) => {
      // Метим СРАЗУ — чтобы повторный запуск крона в том же окне не задвоил.
      await supa.from("profiles").update({ checkin_last: localDay }).eq("id", u.id);
      await fetch("https://api.telegram.org/bot" + botToken + "/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: u.tg_id, text: MESSAGE, disable_notification: false }),
      }).catch(() => {});
      sent++;
    }));

    return new Response(JSON.stringify({ ok: true, sent }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response("err: " + String(e), { status: 200 });
  }
});

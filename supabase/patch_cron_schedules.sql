-- ════════════════════════════════════════════════════════════════════════════
--  BalanceOS — РАСПИСАНИЕ пушей: чтобы функции remind и checkin запускались САМИ.
--  Прогнать ОДИН раз: Supabase → SQL Editor → New query → вставь ВЕСЬ файл → RUN.
--
--  ЗАЧЕМ: развернуть функцию — мало; ей нужен «будильник». Этот файл заводит на сервере
--  два расписания (pg_cron): каждые 5 минут дёргает НАПОМИНАНИЯ (remind), каждые 30 минут —
--  ВЕЧЕРНИЙ ЧЕК-ИН (checkin). Без этого функции просто лежат и ничего не шлют.
--
--  Ключ ниже — ПУБЛИЧНЫЙ anon (тот же, что в supabase.js, шлётся в каждый браузер). Не секрет.
--  Безопасно и идемпотентно: повторный запуск просто перезапишет те же два задания.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- НАПОМИНАНИЯ привычек — каждые 5 минут
select cron.schedule(
  'bos-remind',
  '*/5 * * * *',
  $$ select net.http_post(
       url := 'https://vnkjsqvtgybqlfnhdijf.supabase.co/functions/v1/remind',
       headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZua2pzcXZ0Z3licWxmbmhkaWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMDkyMTcsImV4cCI6MjA5Nzc4NTIxN30.kd2g44Gchb10Pw4OrDjx1mCsO9pjVK6Qaf1p22d47k4"}'::jsonb
     ); $$
);

-- ВЕЧЕРНИЙ ЧЕК-ИН — каждые 30 минут (функция сама решает, у кого сейчас локальные ~20:00
-- и прошла ли неделя; кому не время — тихо пропускает)
select cron.schedule(
  'bos-checkin',
  '*/30 * * * *',
  $$ select net.http_post(
       url := 'https://vnkjsqvtgybqlfnhdijf.supabase.co/functions/v1/checkin',
       headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZua2pzcXZ0Z3licWxmbmhkaWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMDkyMTcsImV4cCI6MjA5Nzc4NTIxN30.kd2g44Gchb10Pw4OrDjx1mCsO9pjVK6Qaf1p22d47k4"}'::jsonb
     ); $$
);

-- Проверить, что оба задания встали:
--   select jobname, schedule, active from cron.job order by jobname;
-- Готово. С этого момента напоминания и вечерний чек-ин срабатывают сами.

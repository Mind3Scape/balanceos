-- ════════════════════════════════════════════════════════════════════════════
--  BalanceOS — таблица напоминаний привычек (для пуша ботом в заданное время).
--  Прогнать ОДИН раз: Supabase → SQL Editor → New query → вставь ВЕСЬ файл → RUN.
--  Безопасно: только создаёт таблицу + политику. Данные не трогает.
--  ПОСЛЕ этого разверни функцию remind (supabase/functions/remind) и повесь ей
--  расписание — см. инструкцию в шапке того файла.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

create table if not exists public.habit_reminders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  hkey        text not null,                    -- стабильный ключ привычки (cloudId)
  name        text not null default 'Привычка',
  emoji       text,
  "time"      text not null default '09:00',    -- ЛОКАЛЬНОЕ «ЧЧ:ММ» пользователя
  days        int[],                            -- [Пн..Вс] 1/0; null = каждый день
  tz_offset   int  not null default 0,          -- минуты от UTC (Москва = +180)
  active      boolean not null default true,
  last_sent_day text,                           -- 'YYYY-MM-DD' в локальном дне юзера (дедуп)
  updated_at  timestamptz not null default now(),
  unique (user_id, hkey)
);

alter table public.habit_reminders enable row level security;

-- Владелец читает/пишет только СВОИ напоминания. Планировщик (edge-функция) ходит
-- сервис-ролью и RLS обходит — читает все активные и метит last_sent_day.
drop policy if exists hr_own on public.habit_reminders;
create policy hr_own on public.habit_reminders for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists habit_reminders_active_idx
  on public.habit_reminders (active) where active;

-- Готово. Приложение уже публикует сюда расписание (при сохранении привычки и разово
-- при старте). Дальше — разверни функцию remind и дай ей расписание (каждые ~5 минут).

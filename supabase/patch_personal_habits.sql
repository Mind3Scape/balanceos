-- ════════════════════════════════════════════════════════════════════════════
--  BalanceOS — личные привычки/цели как РЕАЛЬНЫЕ СТРОКИ (отметки вынесены из блоба).
--  Прогони ОДИН раз: Supabase → SQL Editor → New query → вставь ВЕСЬ файл → RUN.
--
--  ВАЖНО: старые таблицы habits/habit_logs/goals уже существовали (из первой схемы),
--  ПУСТЫЕ и неиспользуемые, но с другими колонками. Пересоздаём их в правильной форме —
--  данные не теряются (там 0 строк). user_state (дневник) и команды НЕ трогаются.
--
--  Модель: приложение остаётся local-first (данные живут на телефоне). Облако — приватное
--  зеркало: метаданные привычки в habits.data (jsonb), а растущие отметки по датам — строки
--  в habit_logs (по одной на день). id привычки — стабильный клиентский ключ (text).
-- ════════════════════════════════════════════════════════════════════════════

drop table if exists public.habit_logs cascade;
drop table if exists public.habits     cascade;
drop table if exists public.goals      cascade;

create table public.habits (
  id         text primary key,                  -- стабильный облачный id (клиент генерит)
  user_id    uuid not null references public.profiles(id) on delete cascade,
  data       jsonb not null default '{}',       -- name/emoji/color/days/reminder/... (без log/done/streak)
  sort       int default 0,
  created_at timestamptz not null default now()
);
create table public.habit_logs (
  habit_id text not null references public.habits(id) on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  day      date not null,
  primary key (habit_id, day)
);
create table public.goals (
  id         text primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  data       jsonb not null default '{}',
  sort       int default 0,
  created_at timestamptz not null default now()
);

create index if not exists habits_user_idx     on public.habits (user_id);
create index if not exists goals_user_idx       on public.goals (user_id);
create index if not exists habit_logs_user_idx  on public.habit_logs (user_id);

alter table public.habits     enable row level security;
alter table public.habit_logs enable row level security;
alter table public.goals      enable row level security;

create policy habits_own on public.habits for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy habit_logs_own on public.habit_logs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy goals_own on public.goals for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

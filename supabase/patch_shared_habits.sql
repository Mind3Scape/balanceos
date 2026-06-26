-- ════════════════════════════════════════════════════════════════════════════
--  BalanceOS — ОБЩИЕ ПРИВЫЧКИ (habit buddy). Запусти ОДИН раз:
--    Supabase → SQL Editor → New query → вставь ВЕСЬ файл → RUN. Безопасно повторно.
--
--  Идея (David): «свою привычку сделать общей с другом — оба ведём, видим прогресс
--  друг друга на календарике». БЕЗ команды и чата. Три маленькие таблицы:
--    shared_habits        — личность общей привычки (имя/эмодзи/цвет) + короткий code для ссылки
--    shared_habit_members — кто участвует (для взаимной видимости)
--    shared_habit_logs    — отметки каждого участника по датам (это и рисует общий календарь)
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.shared_habits (
  code       text primary key,                  -- короткий код в ссылке t.me/<bot>?startapp=hb_<code>
  name       text not null,
  emoji      text default '✨',
  color      text,
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.shared_habit_members (
  code      text not null references public.shared_habits(code) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (code, user_id)
);
create table if not exists public.shared_habit_logs (
  code     text not null references public.shared_habits(code) on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  log_date date not null,
  primary key (code, user_id, log_date)         -- идемпотентно: один день — одна отметка
);
create index if not exists shared_habit_logs_code_idx on public.shared_habit_logs (code);

alter table public.shared_habits        enable row level security;
alter table public.shared_habit_members enable row level security;
alter table public.shared_habit_logs    enable row level security;

-- «Я участник этой общей привычки?» — SECURITY DEFINER, чтобы политики не зациклились на
-- самоссылку (та же ловушка, что и is_member для команд в schema.sql).
create or replace function public.is_shared_member(c text, u uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.shared_habit_members m where m.code = c and m.user_id = u);
$$;

-- shared_habits: личность читаема любому вошедшему (код = «ключ»: чтобы вступить, надо знать
-- имя/эмодзи; профили тоже world-readable). Создаёт/меняет владелец.
drop policy if exists shared_habits_read on public.shared_habits;
create policy shared_habits_read on public.shared_habits for select to authenticated using (true);
drop policy if exists shared_habits_insert on public.shared_habits;
create policy shared_habits_insert on public.shared_habits for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists shared_habits_update on public.shared_habits;
create policy shared_habits_update on public.shared_habits for update to authenticated using (owner_id = auth.uid());

-- участники: видно тем, кто сам в этой привычке; вступаешь/выходишь — только за себя.
drop policy if exists shared_members_read on public.shared_habit_members;
create policy shared_members_read on public.shared_habit_members for select to authenticated using (
  user_id = auth.uid() or public.is_shared_member(code, auth.uid())
);
drop policy if exists shared_members_join on public.shared_habit_members;
create policy shared_members_join on public.shared_habit_members for insert to authenticated with check (user_id = auth.uid());
drop policy if exists shared_members_leave on public.shared_habit_members;
create policy shared_members_leave on public.shared_habit_members for delete to authenticated using (user_id = auth.uid());

-- отметки: читают ВСЕ участники общей привычки (это и есть общий календарь); пишет — свои.
drop policy if exists shared_logs_read on public.shared_habit_logs;
create policy shared_logs_read on public.shared_habit_logs for select to authenticated using (
  public.is_shared_member(code, auth.uid())
);
drop policy if exists shared_logs_write on public.shared_habit_logs;
create policy shared_logs_write on public.shared_habit_logs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- живой календарь: отметка друга прилетает сразу (re-run safe — игнорируем «уже добавлено»).
do $$ begin alter publication supabase_realtime add table public.shared_habit_logs;    exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.shared_habit_members; exception when duplicate_object then null; end $$;

-- Готово. Клиент: создатель пишет shared_habits + себя в members; друг по ссылке hb_<code>
-- читает shared_habits и добавляет себя в members; обе стороны пишут свои shared_habit_logs
-- и читают все логи кода → общий календарь.

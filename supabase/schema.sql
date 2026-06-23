-- ════════════════════════════════════════════════════════════════════════════
--  BalanceOS — облачная схема (T1).  Запусти ОДИН раз:
--    Supabase → SQL Editor → New query → вставь ВЕСЬ этот файл → RUN.
--  Создаёт таблицы, права (RLS), хранилище фото и realtime для чата.
--  Безопасно прогонять повторно (всё через IF NOT EXISTS / создаётся заново).
-- ════════════════════════════════════════════════════════════════════════════

-- ── ПРОФИЛИ ───────────────────────────────────────────────────────────────────
-- Один профиль на пользователя Telegram. id = тот же uuid, что и в авторизации
-- Supabase (auth.uid()). referred_by = кто пригласил (для орбиты «приглашённые»).
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  tg_id       text unique,
  username    text default '',
  avatar      text,                         -- "default" | "m5" | "emoji:🦊"
  referred_by uuid references public.profiles(id) on delete set null,
  snapshot    jsonb,                        -- D2: вся жизнь юзера (привычки/цели/команды/настроение) — кросс-девайс
  created_at  timestamptz not null default now()
);
-- Если таблица уже создана (Дэвид прогнал schema.sql раньше) — добавить колонку:
alter table public.profiles add column if not exists snapshot jsonb;

-- ── ПРИВЫЧКИ + ОТМЕТКИ ПО ДАТАМ (модель T0.2 в облаке) ─────────────────────────
create table if not exists public.habits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  emoji      text default '✨',
  name       text not null,
  duration   int,
  created_at timestamptz not null default now()
);
create table if not exists public.habit_logs (
  id        uuid primary key default gen_random_uuid(),
  habit_id  uuid not null references public.habits(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  log_date  date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, log_date)              -- идемпотентность: один день — одна отметка
);

-- ── ЦЕЛИ ──────────────────────────────────────────────────────────────────────
create table if not exists public.goals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  target     int,
  current    int default 0,
  created_at timestamptz not null default now()
);

-- ── КОМАНДЫ + УЧАСТНИКИ ───────────────────────────────────────────────────────
create table if not exists public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  emblem      text default '✨',
  vis         text not null default 'private',   -- 'public' | 'private'
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  goal_kind   text,
  goal_target int,
  created_at  timestamptz not null default now()
);
create table if not exists public.team_members (
  team_id   uuid not null references public.teams(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

-- ── ЧАТ КОМАНДЫ (сообщения + фото) ────────────────────────────────────────────
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  text       text,
  image_url  text,
  created_at timestamptz not null default now()
);
create index if not exists messages_team_idx on public.messages (team_id, created_at);

-- ── НОВЫЙ ПОЛЬЗОВАТЕЛЬ → АВТО-ПРОФИЛЬ ─────────────────────────────────────────
-- Когда вход через Telegram создаёт auth-пользователя, профиль появляется сам
-- (имя/tg_id/кто пригласил берём из метаданных, которые кладёт функция входа).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, tg_id, username, referred_by)
  values (
    new.id,
    new.raw_user_meta_data->>'tg_id',
    coalesce(new.raw_user_meta_data->>'username', ''),
    (new.raw_user_meta_data->>'referred_by')::uuid
  )
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── ПРАВА ДОСТУПА (RLS) ───────────────────────────────────────────────────────
alter table public.profiles     enable row level security;
alter table public.habits       enable row level security;
alter table public.habit_logs   enable row level security;
alter table public.goals        enable row level security;
alter table public.teams        enable row level security;
alter table public.team_members enable row level security;
alter table public.messages     enable row level security;

-- профили: видны всем вошедшим (для орбит/команд/нетворка); менять — только свой
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (true);
drop policy if exists profiles_write on public.profiles;
create policy profiles_write on public.profiles for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- привычки/отметки/цели: только свои
drop policy if exists habits_own on public.habits;
create policy habits_own on public.habits for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists habit_logs_own on public.habit_logs;
create policy habit_logs_own on public.habit_logs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists goals_own on public.goals;
create policy goals_own on public.goals for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ВАЖНО: проверку «я участник команды» выносим в SECURITY DEFINER-функцию. Внутри
-- неё RLS НЕ применяется, поэтому политики team_members/teams/messages могут её звать
-- без бесконечной рекурсии (классическая ловушка Postgres RLS на самоссылку).
create or replace function public.is_member(t uuid, u uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.team_members m where m.team_id = t and m.user_id = u);
$$;

-- команды: видны если публичные ИЛИ ты участник; создаёт любой (он же владелец);
-- меняет/удаляет владелец
drop policy if exists teams_read on public.teams;
create policy teams_read on public.teams for select to authenticated using (
  vis = 'public'
  or owner_id = auth.uid()
  or public.is_member(id, auth.uid())
);
drop policy if exists teams_insert on public.teams;
create policy teams_insert on public.teams for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists teams_update on public.teams;
create policy teams_update on public.teams for update to authenticated using (owner_id = auth.uid());
drop policy if exists teams_delete on public.teams;
create policy teams_delete on public.teams for delete to authenticated using (owner_id = auth.uid());

-- участники: видно членам команды; вступить/выйти — самому себя
drop policy if exists members_read on public.team_members;
create policy members_read on public.team_members for select to authenticated using (
  user_id = auth.uid()
  or public.is_member(team_id, auth.uid())
  or exists (select 1 from public.teams t where t.id = team_members.team_id and (t.vis = 'public' or t.owner_id = auth.uid()))
);
drop policy if exists members_join on public.team_members;
create policy members_join on public.team_members for insert to authenticated with check (user_id = auth.uid());
drop policy if exists members_leave on public.team_members;
create policy members_leave on public.team_members for delete to authenticated using (user_id = auth.uid());

-- сообщения: читают участники команды; писать — свои сообщения в свою команду
drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages for select to authenticated using (
  public.is_member(team_id, auth.uid())
);
drop policy if exists messages_send on public.messages;
create policy messages_send on public.messages for insert to authenticated with check (
  user_id = auth.uid() and public.is_member(team_id, auth.uid())
);

-- ── REALTIME (живой чат) ──────────────────────────────────────────────────────
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.team_members;

-- ── ХРАНИЛИЩЕ ФОТО ЧАТА ───────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('chat-photos', 'chat-photos', true)
  on conflict (id) do nothing;
drop policy if exists chat_photos_read on storage.objects;
create policy chat_photos_read on storage.objects for select using (bucket_id = 'chat-photos');
drop policy if exists chat_photos_upload on storage.objects;
create policy chat_photos_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-photos');

-- Готово. Дальше — функция входа через Telegram (tg-auth) и синхронизация в приложении.

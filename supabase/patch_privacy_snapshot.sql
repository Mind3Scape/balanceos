-- ════════════════════════════════════════════════════════════════════════════
--  BalanceOS — приватность дневника: переносим личные данные в «личный сейф».
--  Прогони ОДИН раз: Supabase → SQL Editor → New query → вставь ВЕСЬ файл → RUN.
--  Идемпотентно и без потери данных (сначала переносим, потом убираем дырку).
--
--  ПОЧЕМУ: раньше вся жизнь юзера (привычки, ДНЕВНИК, состояния) лежала в колонке
--  profiles.snapshot, а правило profiles_read = using(true) разрешало ЛЮБОМУ вошедшему
--  читать чужие профили целиком → чужой дневник был виден всем. Приложение остаётся
--  local-first (данные живут на телефоне); здесь мы лишь делаем облачную КОПИЮ-зеркало
--  приватной — её видит только владелец.
-- ════════════════════════════════════════════════════════════════════════════

-- 1) Личный сейф — облачная копия состояния, RLS «только владелец»
create table if not exists public.user_state (
  id         uuid primary key references public.profiles(id) on delete cascade,
  snapshot   jsonb,                         -- та же форма { savedAt, data }, что и раньше
  updated_at timestamptz not null default now()
);
alter table public.user_state enable row level security;
drop policy if exists user_state_own on public.user_state;
create policy user_state_own on public.user_state for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- 2) Переносим существующие копии (никто не теряет данные)
insert into public.user_state (id, snapshot)
  select id, snapshot from public.profiles where snapshot is not null
  on conflict (id) do update set snapshot = excluded.snapshot, updated_at = now();

-- 3) Закрываем утечку: убираем колонку из мир-читаемой таблицы profiles
alter table public.profiles drop column if exists snapshot;

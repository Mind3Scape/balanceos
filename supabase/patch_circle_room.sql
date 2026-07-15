-- «ПОДБОДРИТЬ» 🔥 — комната круга v2 (макет И, 2026-07-16).
--
-- Один маленький жест поддержки: участник шлёт огонёк другому участнику СВОЕГО круга.
-- Получателю в «Пульсе дня» загорается золотая строка «Тебя подбодрили N человек».
--
-- ПОЧЕМУ ТАБЛИЦА, А НЕ СООБЩЕНИЕ В ЧАТ: огоньки должны складываться («подбодрили 5»),
-- не засоряя ленту пятью отдельными сообщениями; и по ним нужен «кто?» — список лиц.
--
-- ЧЕСТНОСТЬ В ДАННЫХ, НЕ В КЛИЕНТЕ:
--   • один огонёк человеку в день — UNIQUE (team_id, from_user, to_user, day):
--     даблтап и обход клиента упираются в базу, а не в if;
--   • слать можно только ОТ СЕБЯ (from_user = auth.uid()), только участнику ТОГО ЖЕ
--     круга и не самому себе — всё в policy;
--   • видят огоньки только участники круга (public.is_member — как у team_tasks).
--
-- День пишет КЛИЕНТ своей локальной датой (default current_date — лишь запасной):
-- тот же приём, что в bos_circle_pulse, иначе ночью огонёк уехал бы «во вчера».

create table if not exists public.team_cheers (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  from_user  uuid not null references auth.users(id) on delete cascade,
  to_user    uuid not null references auth.users(id) on delete cascade,
  day        date not null default current_date,
  created_at timestamptz not null default now(),
  unique (team_id, from_user, to_user, day)
);

alter table public.team_cheers enable row level security;

drop policy if exists team_cheers_read on public.team_cheers;
create policy team_cheers_read on public.team_cheers for select to authenticated
  using (public.is_member(team_id, auth.uid()));

drop policy if exists team_cheers_send on public.team_cheers;
create policy team_cheers_send on public.team_cheers for insert to authenticated
  with check (
    from_user = auth.uid()
    and from_user <> to_user
    and public.is_member(team_id, auth.uid())
    and public.is_member(team_id, to_user)
  );

-- Отзывать огоньки не дано никому (нет update/delete-политик): жест — как рукопожатие.

create index if not exists team_cheers_team_day_idx on public.team_cheers (team_id, day);

notify pgrst, 'reload schema';

-- ПРОВЕРКА: участник шлёт огонёк соседу по кругу — строка появляется; самому себе или
-- в чужой круг — отказ; второй огонёк тому же человеку в тот же день — конфликт UNIQUE
-- (клиент шлёт upsert c ignoreDuplicates — для него это тихий no-op).

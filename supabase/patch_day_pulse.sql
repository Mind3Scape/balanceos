-- «Пульс дня» — общий баланс окружения (David 2026-07-09, гибрид A+B).
-- Каждый отметивший состояние вливает ОДНУ цифру-тон (0..6) в день. Приватность в ДАННЫХ:
--   • таблицу не может читать НИКТО (RLS без select-политики, grant только insert/update своих);
--   • наружу тон отдаёт только серверный агрегат bos_env_pulse — и только когда влились ≥3
--     (нельзя вычислить тон одного человека);
--   • show_face = «показывать меня в круге»: виден только ФАКТ вливания (точка у лица),
--     сам тон не раскрывается никогда;
--   • агрегат считается только по людям, реально связанным с вызывающим (referred_by в обе
--     стороны) — чужой список uid подсунуть нельзя.
-- День передаёт клиент (его локальная дата) — сервер по UTC мог бы ошибиться на сутки.

create table if not exists public.day_pulse (
  uid        uuid not null references public.profiles(id) on delete cascade,
  day        date not null,
  bucket     smallint not null check (bucket between 0 and 6),
  show_face  boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (uid, day)
);

alter table public.day_pulse enable row level security;

drop policy if exists day_pulse_insert_own on public.day_pulse;
create policy day_pulse_insert_own on public.day_pulse
  for insert to authenticated with check (auth.uid() = uid);

drop policy if exists day_pulse_update_own on public.day_pulse;
create policy day_pulse_update_own on public.day_pulse
  for update to authenticated using (auth.uid() = uid) with check (auth.uid() = uid);

-- Владелец может читать ТОЛЬКО свою строку (нужно для upsert: ON CONFLICT DO UPDATE в
-- Postgres требует права SELECT). Чужие строки закрыты RLS — приватность не страдает.
drop policy if exists day_pulse_select_own on public.day_pulse;
create policy day_pulse_select_own on public.day_pulse
  for select to authenticated using (auth.uid() = uid);

revoke all on public.day_pulse from anon, authenticated;
grant select, insert, update on public.day_pulse to authenticated;

-- Чистый SQL без временных таблиц: в базе включена защита «DELETE без WHERE запрещён»,
-- и plpgsql-вариант с temp-таблицей падал на её очистке (код 21000).
create or replace function public.bos_env_pulse(p_uids uuid[], p_day date)
returns jsonb
language sql security definer set search_path = public as $$
  with allowed as (
    select distinct u as uid
    from unnest(coalesce(p_uids, '{}'::uuid[])) as u
    where coalesce(array_length(p_uids, 1), 0) between 1 and 60
      and (u = auth.uid()
           or exists (select 1 from public.profiles pr where pr.id = u and pr.referred_by = auth.uid())
           or exists (select 1 from public.profiles me where me.id = auth.uid() and me.referred_by = u))
  ),
  hits as (
    select dp.uid, dp.bucket, dp.show_face
    from public.day_pulse dp
    join allowed a on a.uid = dp.uid
    where dp.day = p_day
  )
  select case
    when (select count(*) from hits) >= 3 then
      jsonb_build_object(
        'marked', (select count(*) from hits),
        'avg',    round((select avg(bucket) from hits), 2),
        'faces',  coalesce((select jsonb_agg(uid) from hits where show_face), '[]'::jsonb))
    else
      jsonb_build_object(
        'marked', coalesce((select count(*) from hits), 0),
        'faces',  coalesce((select jsonb_agg(uid) from hits where show_face), '[]'::jsonb))
  end;
$$;

revoke all on function public.bos_env_pulse(uuid[], date) from public, anon;
grant execute on function public.bos_env_pulse(uuid[], date) to authenticated;

-- ЗАОДНО: дыра из аудита 2026-07-09 — колонки offer и last_active добавлены патчами ПОЗЖЕ
-- privacy-патча и не вошли в колоночный grant → «🤝 чем полезен» и «🌙 давно тихо» в проде
-- могли молчать. Дописываем grant (no-op, если privacy-патч не применялся).
grant select (id, username, avatar, pub_orbit, referred_by, ref_code, tz_offset, checkin_on, checkin_last, created_at, offer, last_active)
  on public.profiles to authenticated;

notify pgrst, 'reload schema';

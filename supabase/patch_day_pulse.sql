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

-- select-политики НЕТ намеренно: читать строки не может никто, даже владелец.
revoke all on public.day_pulse from anon, authenticated;
grant insert, update on public.day_pulse to authenticated;

create or replace function public.bos_env_pulse(p_uids uuid[], p_day date)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  k int; s numeric; faces jsonb;
begin
  if p_uids is null or coalesce(array_length(p_uids, 1), 0) = 0 or array_length(p_uids, 1) > 60 or p_day is null then
    return jsonb_build_object('marked', 0, 'faces', '[]'::jsonb);
  end if;

  -- только реально связанные с вызывающим: я сам / мои приглашённые / мой пригласивший
  create temp table if not exists _pulse_allowed (uid uuid primary key) on commit drop;
  delete from _pulse_allowed;
  insert into _pulse_allowed
    select distinct u from unnest(p_uids) as u
    where u = auth.uid()
       or exists (select 1 from public.profiles pr where pr.id = u and pr.referred_by = auth.uid())
       or exists (select 1 from public.profiles me where me.id = auth.uid() and me.referred_by = u)
    on conflict do nothing;

  select count(*), avg(dp.bucket) into k, s
    from public.day_pulse dp join _pulse_allowed a on a.uid = dp.uid
   where dp.day = p_day;

  select coalesce(jsonb_agg(dp.uid), '[]'::jsonb) into faces
    from public.day_pulse dp join _pulse_allowed a on a.uid = dp.uid
   where dp.day = p_day and dp.show_face;

  if k >= 3 then
    return jsonb_build_object('marked', k, 'avg', round(s, 2), 'faces', faces);
  end if;
  return jsonb_build_object('marked', k, 'faces', faces);
end $$;

revoke all on function public.bos_env_pulse(uuid[], date) from public, anon;
grant execute on function public.bos_env_pulse(uuid[], date) to authenticated;

-- ЗАОДНО: дыра из аудита 2026-07-09 — колонки offer и last_active добавлены патчами ПОЗЖЕ
-- privacy-патча и не вошли в колоночный grant → «🤝 чем полезен» и «🌙 давно тихо» в проде
-- могли молчать. Дописываем grant (no-op, если privacy-патч не применялся).
grant select (id, username, avatar, pub_orbit, referred_by, ref_code, tz_offset, checkin_on, checkin_last, created_at, offer, last_active)
  on public.profiles to authenticated;

notify pgrst, 'reload schema';

-- ФИКС к patch_day_pulse.sql (для базы, где основной патч УЖЕ прогнан).
-- Две находки живой проверки 2026-07-09:
--   1) upsert пульса получал 403: ON CONFLICT DO UPDATE в Postgres требует права SELECT.
--      Даём владельцу читать ТОЛЬКО свою строку (чужие закрыты RLS — приватность цела).
--   2) bos_env_pulse падал с «DELETE requires a WHERE clause» (в базе включена защита) —
--      функция переписана чистым SQL без временных таблиц.

drop policy if exists day_pulse_select_own on public.day_pulse;
create policy day_pulse_select_own on public.day_pulse
  for select to authenticated using (auth.uid() = uid);

grant select on public.day_pulse to authenticated;

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

notify pgrst, 'reload schema';

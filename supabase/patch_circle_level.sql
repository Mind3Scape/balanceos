-- УРОВЕНЬ КРУГА · Э1 (2026-07-16). XP круга копят закрытые дни людей:
-- день человека (≥1 отметка в круге) = +10 XP кругу; день «в ритме» (активны ≥80%
-- нынешнего состава) = ×2 — живой маленький круг растёт быстрее мёртвой толпы.
-- Считает сервер по ВСЕЙ истории отметок; наружу отдаётся только число XP.
-- Доступ: открытые круги — всем, закрытые — только участникам (is_member).
-- До патча клиент честно прячет уровень (паттерн team_cheers/circle_pulse).

create or replace function public.bos_team_xp(p_teams uuid[])
returns table(team_id uuid, xp bigint)
language sql
security definer
set search_path = public
stable
as $$
  with allowed as (
    select t.id
    from public.teams t
    where t.id = any(p_teams)
      and (t.vis = 'public' or public.is_member(t.id, auth.uid()))
  ),
  mc as (
    select tm.team_id, count(*)::int as members
    from public.team_members tm
    where tm.team_id in (select id from allowed)
    group by tm.team_id
  ),
  days as (
    select th.team_id, l.day, count(distinct l.user_id)::int as n
    from public.team_habit_logs l
    join public.team_habits th on th.id = l.team_habit_id
    where th.team_id in (select id from allowed)
    group by th.team_id, l.day
  )
  select d.team_id,
         coalesce(sum(d.n * 10 * case when m.members > 0 and d.n >= ceil(m.members * 0.8) then 2 else 1 end), 0)::bigint as xp
  from days d
  join mc m on m.team_id = d.team_id
  group by d.team_id
$$;

grant execute on function public.bos_team_xp(uuid[]) to anon, authenticated;

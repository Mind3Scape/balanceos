-- ЧЕСТНЫЙ РАЗМЕР ОТКРЫТЫХ КРУГОВ (2026-07-16).
-- Зачем: витрина «Общие цели» ранжируется «больше людей — выше», но RLS на team_members
-- не пускает чужих, и embed-счётчик team_members(count) для чужих кругов возвращал 0 —
-- ранжирование было мёртвым. Эта функция отдаёт ТОЛЬКО счёт участников и ТОЛЬКО по
-- публичным кругам (никаких имён/составов наружу).

create or replace function public.bos_team_sizes(p_teams uuid[])
returns table(team_id uuid, members bigint)
language sql
security definer
set search_path = public
stable
as $$
  select tm.team_id, count(*)::bigint as members
  from public.team_members tm
  join public.teams t on t.id = tm.team_id
  where tm.team_id = any(p_teams) and t.vis = 'public'
  group by tm.team_id
$$;

grant execute on function public.bos_team_sizes(uuid[]) to anon, authenticated;

-- ── УБОРКА ФЕЙКОВЫХ/МЁРТВЫХ ОТКРЫТЫХ КРУГОВ (по желанию, руками) ──────────────
-- Шаг 1: посмотреть глазами все публичные круги с числом людей и последней активностью:
--
-- select t.id, t.name, t.created_at::date as created,
--        count(distinct tm.user_id) as members,
--        (select max(l.day) from team_habit_logs l
--          join team_habits th on th.id = l.team_habit_id
--          where th.team_id = t.id) as last_activity
-- from teams t
-- left join team_members tm on tm.team_id = t.id
-- where t.vis = 'public'
-- group by t.id
-- order by members desc, created;
--
-- Шаг 2: удалить конкретные (подставить id из шага 1; каскад удалит участников/привычки/логи,
-- если внешние ключи с on delete cascade — иначе удалить их явно перед teams):
--
-- delete from teams where id in ('<id1>', '<id2>');

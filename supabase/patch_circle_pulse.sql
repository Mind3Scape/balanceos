-- «Пульс круга» — живое на ВНЕШНЕЙ карточке круга (David 2026-07-15: «не понимаю, что круги
-- живые, что там люди и они что-то ведут»).
--
-- ЗАЧЕМ ВООБЩЕ СЕРВЕРНАЯ ФУНКЦИЯ. Отметки круга (team_habit_logs) читает ТОЛЬКО участник —
-- политика team_habit_logs_read (patch_team_approvals.sql). Значит в каталоге «Открытые круги»
-- клиент чужого круга получает 0 строк — причём МОЛЧА, без ошибки (грабли RLS). Живой круг на
-- 120 человек выглядел бы мёртвым. Поэтому наружу отдаём агрегат, и только агрегат.
--
-- ПРИВАТНОСТЬ — в данных, а не в клиенте:
--   • функция НЕ отдаёт user_id, имён, аватарок и что именно человек делал — только «сколько»
--     и «в какую минуту суток». По такому ответу нельзя узнать, кто ходит в круг;
--   • отвечает ТОЛЬКО про ОТКРЫТЫЕ круги (vis='public') — приватный круг снаружи невидим,
--     как и был. Для своих кругов участник и так читает отметки напрямую, лица берутся оттуда;
--   • ПОРОГ АНОНИМНОСТИ: если сегодня в деле был РОВНО ОДИН человек, поминутная раскладка не
--     отдаётся (иначе «в 7:02 кто-то один отметился» + список участников = деанон одного).
--     Число (todayN) при этом отдаётся честно — оно само по себе никого не выдаёт.
--
-- ДЕНЬ ПРИХОДИТ ОТ КЛИЕНТА (его локальная дата) — по UTC сервер ошибся бы на сутки; тот же
-- приём, что в bos_env_pulse. Минуты отдаются в UTC, клиент сам сдвигает в свой часовой пояс.

create or replace function public.bos_circle_pulse(p_team uuid, p_day date)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vis    text;
  v_today  int;
  v_mins   json;
  v_peak   int;
begin
  if p_team is null then return null; end if;

  select vis into v_vis from public.teams where id = p_team;
  if v_vis is distinct from 'public' then
    return null;                     -- приватный круг снаружи не комментируем вообще
  end if;

  -- Сколько РАЗНЫХ людей были в деле в этот день.
  select count(distinct l.user_id) into v_today
  from public.team_habit_logs l
  join public.team_habits h on h.id = l.team_habit_id
  where h.team_id = p_team and l.day = coalesce(p_day, current_date);

  -- Поминутная раскладка дня (для волны). Порог анонимности: при 0-1 участнике — пусто.
  if v_today >= 2 then
    select coalesce(json_agg(m order by m), '[]'::json) into v_mins
    from (
      select (extract(epoch from (l.created_at - date_trunc('day', l.created_at))) / 60)::int as m
      from public.team_habit_logs l
      join public.team_habits h on h.id = l.team_habit_id
      where h.team_id = p_team and l.day = coalesce(p_day, current_date)
    ) t;
  else
    v_mins := '[]'::json;
  end if;

  -- ЧАС ПИК — «во сколько тут обычно собираются». Считаем по 30 дням, а не по сегодня: ритуал
  -- круга — это привычка недель, а не одного утра. Мода по получасам → минута середины окна.
  select (b * 30 + 15) into v_peak
  from (
    select ((extract(epoch from (l.created_at - date_trunc('day', l.created_at))) / 1800)::int) as b,
           count(*) as n
    from public.team_habit_logs l
    join public.team_habits h on h.id = l.team_habit_id
    where h.team_id = p_team
      and l.day > coalesce(p_day, current_date) - 30
    group by 1
    order by n desc, 1
    limit 1
  ) x;

  return json_build_object('todayN', coalesce(v_today, 0), 'mins', coalesce(v_mins, '[]'::json), 'peak', v_peak);
end $$;

revoke all on function public.bos_circle_pulse(uuid, date) from public;
grant execute on function public.bos_circle_pulse(uuid, date) to authenticated;

-- Индекс под оба запроса (team → day). Без него 30-дневная выборка на большом круге поедет.
create index if not exists team_habit_logs_habit_day_idx on public.team_habit_logs (team_habit_id, day);
create index if not exists team_habits_team_idx on public.team_habits (team_id);

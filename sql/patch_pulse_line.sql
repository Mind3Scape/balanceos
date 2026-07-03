-- ─────────────────────────────────────────────────────────────────────────────
-- «Сейчас N человек держат практики» — живая строка на странице «Сообщество»
-- (VISION · «Гигиена роста»: живая строка вместо ленты).
--
-- Что делает: одна маленькая функция bos_active_today() — считает, СКОЛЬКО РАЗНЫХ
-- людей поставили хоть одну отметку сегодня (личные привычки + командные + общие).
-- security definer: журналы чужих людей закрыты правилами доступа (и это правильно),
-- функция отдаёт только ЧИСЛО, никаких данных о конкретных людях.
--
-- day >= current_date (а не =): клиент пишет локальную дату телефона — вечером по
-- Москве в UTC ещё «вчера», поэтому берём сегодняшнюю и более позднюю.
--
-- Применять в Supabase SQL Editor. Клиент v522 уже готов: до патча строка просто
-- скрыта, после — оживает сама. Повторный прогон безопасен (create or replace).
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.bos_active_today()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct u)::int from (
    select user_id as u from public.habit_logs        where day >= current_date
    union
    select user_id      from public.team_habit_logs   where day >= current_date
    union
    select user_id      from public.shared_habit_logs where day >= current_date
  ) t;
$$;

revoke all on function public.bos_active_today() from public;
grant execute on function public.bos_active_today() to authenticated;

-- Проверка: select public.bos_active_today();

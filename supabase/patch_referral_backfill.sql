-- ═══════════════════════════════════════════════════════════════════════════════
-- ВОССТАНОВЛЕНИЕ ДРУЗЕЙ, ПОТЕРЯННЫХ ИЗ-ЗА БАГА РЕФЕРАЛА (до v556). Запустить ОДИН раз
-- в Supabase → SQL Editor. Полностью безопасно и идемпотентно (можно прогнать повторно).
--
-- Баг (починен в v556): у УЖЕ залогиненного человека, открывшего ссылку друга, referred_by
-- не проставлялся — signIn выходил рано и не звал tg-auth. Тех, кто РЕАЛЬНО вступил в чужую
-- общую привычку или приватный круг, можно восстановить: привязываем их к владельцу (тому,
-- кто позвал), чтобы они появились у него в друзьях / на орбите.
--
-- ЧТО НЕ восстанавливается этим скриптом: чистые «позови в приложение» ссылки (ref_<uid>),
-- по которым человек просто открыл приложение, но никуда не вступил — от них не осталось
-- следа на сервере. Для таких: пусть друг ОДИН раз откроет твою ссылку заново (v556 тихо
-- привяжет, без повторного онбординга).
--
-- Правила: пишем ТОЛЬКО где referred_by пуст (никогда не перетираем существующего
-- пригласившего); НЕ сам-на-себя; при нескольких вступлениях берём САМОЕ РАННЕЕ (кто привёл
-- первым). Круги — только ПРИВАТНЫЕ (позвали лично); открытые из поиска дружбой не считаем.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1) Общие привычки (habit buddy): участник → владелец привычки.
update public.profiles p
set referred_by = sub.owner_id
from (
  select distinct on (m.user_id) m.user_id, sh.owner_id
  from public.shared_habit_members m
  join public.shared_habits sh on sh.code = m.code
  where sh.owner_id is not null and sh.owner_id <> m.user_id
  order by m.user_id, m.joined_at asc
) sub
where p.id = sub.user_id and p.referred_by is null;

-- 2) Приватные круги/команды: участник → владелец круга.
update public.profiles p
set referred_by = sub.owner_id
from (
  select distinct on (m.user_id) m.user_id, t.owner_id
  from public.team_members m
  join public.teams t on t.id = m.team_id
  where t.owner_id is not null and t.owner_id <> m.user_id
    and m.role <> 'pending'
    and coalesce(t.vis, 'private') = 'private'
  order by m.user_id, m.joined_at asc
) sub
where p.id = sub.user_id and p.referred_by is null;

-- Необязательная проверка — сколько людей теперь с пригласившим:
-- select count(*) as with_inviter from public.profiles where referred_by is not null;

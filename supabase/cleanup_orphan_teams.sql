-- ═══════════════════════════════════════════════════════════════════════════════
-- BalanceOS · ЧИСТКА КРУГОВ-СИРОТ (старые «удалённые», но оставшиеся в облаке)
-- ═══════════════════════════════════════════════════════════════════════════════
-- ПОЧЕМУ: раньше удаление круга было ЛОКАЛЬНЫМ (removeTeam) — облачная строка teams
-- НЕ удалялась. Теперь удаление владельцем делает hard-delete (deleteTeam/delete_team),
-- но СТАРЫЕ «удалённые» круги остались публичными в облаке и всплыли в «Открытых кругах».
-- Клиент уже НЕ показывает тебе твои же круги в витрине (owner_id-фильтр в discoverTeams),
-- но чтобы их не видели ДРУГИЕ — почисти строки в БД этим скриптом.
--
-- Запускать в Supabase → SQL Editor. ШАГ 1 — посмотреть, ШАГ 2 — удалить лишние по id.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── ШАГ 1. Посмотреть ВСЕ свои публичные круги (замени username на свой в Telegram) ──
-- Колонка members помогает узнать сироту: у настоящего круга есть люди, у тест-сироты
-- обычно только ты (1) или никого (0).
select t.id,
       t.name,
       t.emblem,
       t.created_at,
       (select count(*) from public.team_members m where m.team_id = t.id) as members,
       (t.goal is not null)                                                as has_goal
from public.teams t
where t.vis = 'public'
  and t.owner_id = (select id from public.profiles where username = 'ЗАМЕНИ_НА_СВОЙ_USERNAME' limit 1)
order by t.created_at desc;

-- ── ШАГ 2. Удалить круги-сироты ПО ID (впиши id из шага 1, КРОМЕ настоящего круга) ──
-- Каскад снесёт участников/привычки/логи/сообщения этих кругов. НАСТОЯЩИЙ круг НЕ вписывай.
-- delete from public.teams
--  where id in (
--    'сюда-uuid-сироты-1',
--    'сюда-uuid-сироты-2'
--    -- ...
--  );

-- ── (ОПЦИЯ) Автоматический вариант: удалить свои публичные круги, где нет НИКОГО кроме
-- тебя И нет ни одной отметки (типичная тест-сирота). Настоящий круг с людьми не тронет.
-- Раскомментируй, только если уверен. Замени username.
-- delete from public.teams t
--  where t.vis = 'public'
--    and t.owner_id = (select id from public.profiles where username = 'ЗАМЕНИ_НА_СВОЙ_USERNAME' limit 1)
--    and (select count(*) from public.team_members m where m.team_id = t.id) <= 1
--    and not exists (
--      select 1 from public.team_habits h
--       join public.team_habit_logs l on l.team_habit_id = h.id
--      where h.team_id = t.id
--    );

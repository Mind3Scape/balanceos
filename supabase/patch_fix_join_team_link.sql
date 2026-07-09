-- patch_fix_join_team_link.sql  (тот же класс, что фикс v658, но для КРУГОВ/совместных целей)
--
-- Баг «своя ссылка на свой круг»: join_team_link (мгновенное вступление по инвайт-ссылке)
-- делал  ON CONFLICT (team_id,user_id) DO UPDATE SET role='member'.  Если ВЛАДЕЛЕЦ открывал
-- ссылку на СВОЙ круг, конфликт срабатывал на его строке role='owner' и ПОНИЖАЛ его до
-- 'member' на собственном круге (терял корону/владение в ростере, круг выглядел как чужой,
-- в который он «вступил»). Остальные пути (joinTeam / request_join / create_team) используют
-- DO NOTHING и не задеты — дыра была ТОЛЬКО в invite-link-пути, ровно в сценарии «открыл сам».
--
-- Фикс: ссылка ПОВЫШАЕТ роль только если человек был 'pending' (заявку по ссылке — сразу в
-- участники). Существующих owner/admin/member ссылка больше НЕ трогает (никогда не понижает).

create or replace function public.join_team_link(t uuid)
returns public.teams language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); row public.teams;
begin
  if me is null then raise exception 'not authenticated'; end if;
  insert into public.team_members (team_id, user_id, role) values (t, me, 'member')
    on conflict (team_id, user_id) do update set role = 'member'
      where team_members.role = 'pending';   -- только повысить заявку; НИКОГДА не понижать owner/admin/member
  select * into row from public.teams where id = t;
  return row;
end; $$;

grant execute on function public.join_team_link(uuid) to authenticated;

-- Починка уже пострадавших: вернуть role='owner' всем, кто ЯВЛЯЕТСЯ owner_id своего круга,
-- но был понижен ссылкой до member/admin. Идемпотентно.
update public.team_members tm
set role = 'owner'
from public.teams t
where tm.team_id = t.id
  and tm.user_id = t.owner_id
  and tm.role <> 'owner';

-- Проверка — должно стать 0 (ни одного «владелец не owner в собственном ростере»):
select count(*) as demoted_owners
from public.team_members tm
join public.teams t on t.id = tm.team_id
where tm.user_id = t.owner_id and tm.role <> 'owner';

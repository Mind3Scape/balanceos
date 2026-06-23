-- ════════════════════════════════════════════════════════════════════════════
--  BalanceOS — E: вступление в команды с одобрением.
--  «По ссылке — сразу. Из поиска — по заявке → создатель одобряет.»
--
--  Прогнать ОДИН раз: Supabase → SQL Editor → New query → вставь ВЕСЬ файл → RUN.
--  Безопасно: пересоздаёт одну политику + добавляет функции; данные не трогает.
--  До запуска приложение работает по-старому (вступление сразу); после — с заявками.
-- ════════════════════════════════════════════════════════════════════════════

-- 1) Заявки (role='pending') НЕ считаются членством: пока не одобрили — нет доступа
--    к команде и чату. is_member зовут политики чтения/чата, поэтому правим её.
create or replace function public.is_member(t uuid, u uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.team_members m
                 where m.team_id = t and m.user_id = u and m.role <> 'pending');
$$;

-- 2) Самому себя в команду можно добавить ТОЛЬКО как заявку ('pending').
--    Реальное членство выдают функции ниже (через SECURITY DEFINER, в обход политики).
drop policy if exists members_join on public.team_members;
create policy members_join on public.team_members for insert to authenticated
  with check (user_id = auth.uid() and role = 'pending');

-- 3) Создать команду: владелец + первый участник одним вызовом.
create or replace function public.create_team(p_name text, p_emblem text, p_vis text, p_goal_kind text, p_goal_target numeric)
returns public.teams language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); row public.teams;
begin
  if me is null then raise exception 'not authenticated'; end if;
  insert into public.teams (name, emblem, vis, owner_id, goal_kind, goal_target)
    values (coalesce(p_name,'Команда'), coalesce(p_emblem,'✨'), coalesce(p_vis,'private'), me, p_goal_kind, p_goal_target)
    returning * into row;
  insert into public.team_members (team_id, user_id, role) values (row.id, me, 'owner')
    on conflict (team_id, user_id) do nothing;
  return row;
end; $$;

-- 4) Вступление по ссылке — СРАЗУ участник (и заявку, если была, повышаем до участника).
create or replace function public.join_team_link(t uuid)
returns public.teams language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); row public.teams;
begin
  if me is null then raise exception 'not authenticated'; end if;
  insert into public.team_members (team_id, user_id, role) values (t, me, 'member')
    on conflict (team_id, user_id) do update set role = 'member';
  select * into row from public.teams where id = t;
  return row;
end; $$;

-- 5) Заявка из поиска — кладём 'pending' (ждёт одобрения создателя).
create or replace function public.request_join(t uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not authenticated'; end if;
  insert into public.team_members (team_id, user_id, role) values (t, me, 'pending')
    on conflict (team_id, user_id) do nothing;
end; $$;

-- 6) Одобрить заявку (ТОЛЬКО создатель команды).
create or replace function public.approve_member(t uuid, u uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.teams where id = t and owner_id = auth.uid())
    then raise exception 'only the owner can approve'; end if;
  update public.team_members set role = 'member' where team_id = t and user_id = u and role = 'pending';
end; $$;

-- 7) Отклонить заявку (ТОЛЬКО создатель).
create or replace function public.reject_member(t uuid, u uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.teams where id = t and owner_id = auth.uid())
    then raise exception 'only the owner can reject'; end if;
  delete from public.team_members where team_id = t and user_id = u and role = 'pending';
end; $$;

-- Доступ на выполнение функций для вошедших пользователей.
grant execute on function public.create_team(text, text, text, text, numeric) to authenticated;
grant execute on function public.join_team_link(uuid)  to authenticated;
grant execute on function public.request_join(uuid)    to authenticated;
grant execute on function public.approve_member(uuid, uuid) to authenticated;
grant execute on function public.reject_member(uuid, uuid)  to authenticated;

-- Готово. По ссылке — сразу; из поиска — заявка → создатель одобряет в настройках команды.

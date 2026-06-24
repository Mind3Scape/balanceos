-- BalanceOS — leave / delete team (Block 3.2)
-- SECURITY DEFINER so the action bypasses RLS but enforces its own ownership check.
-- Idempotent: safe to run more than once. Run in Supabase → SQL Editor.

create or replace function public.leave_team(t uuid)
returns void language sql security definer set search_path = public as $$
  delete from public.team_members where team_id = t and user_id = auth.uid();
$$;

create or replace function public.delete_team(t uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  -- only the real owner may delete
  if not exists (select 1 from public.teams where id = t and owner_id = auth.uid()) then
    return;
  end if;
  delete from public.team_habit_logs where team_habit_id in (select id from public.team_habits where team_id = t);
  delete from public.team_habits where team_id = t;
  delete from public.messages where team_id = t;
  delete from public.team_members where team_id = t;
  delete from public.teams where id = t;
end;
$$;

grant execute on function public.leave_team(uuid)  to anon, authenticated;
grant execute on function public.delete_team(uuid) to anon, authenticated;

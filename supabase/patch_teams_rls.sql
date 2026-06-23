-- ════════════════════════════════════════════════════════════════════════════
--  BalanceOS — ФИКС рекурсии RLS у команд (нужно для D3/D4: команды + живой чат).
--  Прогнать ОДИН раз: Supabase → SQL Editor → New query → вставь ВЕСЬ файл → RUN.
--  Безопасно: только пересоздаёт политики (drop+create), данные не трогает.
-- ════════════════════════════════════════════════════════════════════════════

-- Проверку «состою ли я в команде» выносим в SECURITY DEFINER-функцию. Внутри неё
-- RLS не применяется, поэтому политики могут её звать без бесконечной рекурсии.
create or replace function public.is_member(t uuid, u uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.team_members m where m.team_id = t and m.user_id = u);
$$;

-- команды: видны если публичные, или твои, или ты участник (через функцию → без рекурсии)
drop policy if exists teams_read on public.teams;
create policy teams_read on public.teams for select to authenticated using (
  vis = 'public' or owner_id = auth.uid() or public.is_member(id, auth.uid())
);

-- участники: видно себе, участникам той же команды, и всем для публичной/своей команды
drop policy if exists members_read on public.team_members;
create policy members_read on public.team_members for select to authenticated using (
  user_id = auth.uid()
  or public.is_member(team_id, auth.uid())
  or exists (select 1 from public.teams t where t.id = team_members.team_id and (t.vis = 'public' or t.owner_id = auth.uid()))
);

-- сообщения: читают/пишут только участники команды (через функцию)
drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages for select to authenticated using (
  public.is_member(team_id, auth.uid())
);
drop policy if exists messages_send on public.messages;
create policy messages_send on public.messages for insert to authenticated with check (
  user_id = auth.uid() and public.is_member(team_id, auth.uid())
);

-- Готово. После этого: создание команды в облаке, поиск открытых команд, вступление
-- и живой чат начинают работать. (D3 + D4.)

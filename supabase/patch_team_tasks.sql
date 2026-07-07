-- ─────────────────────────────────────────────────────────────────────────────
-- «ДЕЛА» СОВМЕСТНОЙ ЦЕЛИ (David 2026-07-07): автор (владелец цели) ставит ЗАДАНИЯ,
-- каждый участник отмечает СВОЁ выполнение и видит, «кто уже сделал».
--
-- Зеркалит модель общих привычек (team_habits + team_habit_logs):
--   • team_tasks       — сами задания. Создаёт/правит/удаляет ТОЛЬКО владелец цели.
--   • team_task_done   — отметка «я выполнил» (по участнику, presence-строка). Видят все
--                        участники; ставит/снимает КАЖДЫЙ только свою.
--
-- До этого патча клиент прячет раздел «Дела» (bosCloud.teamTasks вернёт null при отсутствии
-- таблиц) — живое приложение не ломается. После прогона — раздел оживает.
-- Зависит от public.is_member(team_id, uid) (уже есть, patch_team_approvals.sql / schema.sql).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.team_tasks (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  text text not null,
  sort int default 0,
  created_at timestamptz default now()
);
create table if not exists public.team_task_done (
  task_id uuid not null references public.team_tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (task_id, user_id)
);
alter table public.team_tasks enable row level security;
alter table public.team_task_done enable row level security;

-- задания видны участникам; создаёт / правит / удаляет ТОЛЬКО владелец цели
drop policy if exists team_tasks_read on public.team_tasks;
create policy team_tasks_read on public.team_tasks for select to authenticated
  using (public.is_member(team_id, auth.uid()));
drop policy if exists team_tasks_add on public.team_tasks;
create policy team_tasks_add on public.team_tasks for insert to authenticated
  with check (exists (select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()));
drop policy if exists team_tasks_upd on public.team_tasks;
create policy team_tasks_upd on public.team_tasks for update to authenticated
  using (exists (select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()))
  with check (exists (select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()));
drop policy if exists team_tasks_del on public.team_tasks;
create policy team_tasks_del on public.team_tasks for delete to authenticated
  using (exists (select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()));

-- отметки выполнения: участник видит отметки своей цели; ставит/снимает ТОЛЬКО свою
drop policy if exists team_task_done_read on public.team_task_done;
create policy team_task_done_read on public.team_task_done for select to authenticated
  using (exists (select 1 from public.team_tasks k where k.id = task_id and public.is_member(k.team_id, auth.uid())));
drop policy if exists team_task_done_write on public.team_task_done;
create policy team_task_done_write on public.team_task_done for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.team_tasks k where k.id = task_id and public.is_member(k.team_id, auth.uid())));
drop policy if exists team_task_done_unwrite on public.team_task_done;
create policy team_task_done_unwrite on public.team_task_done for delete to authenticated
  using (user_id = auth.uid());

notify pgrst, 'reload schema';

-- ПРОВЕРКА: под владельцем insert в team_tasks проходит; под участником-НЕ-владельцем отклоняется.
-- Любой участник ставит/снимает свою строку в team_task_done; чужую — нет.

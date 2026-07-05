-- ─────────────────────────────────────────────────────────────────────────────
-- ПРАВА: создавать ОБЩИЕ привычки в цели/круге может ТОЛЬКО владелец.
--
-- ПРОБЛЕМА (David): любой участник общей цели мог создать общую привычку «для всех».
-- Причина: team_habits_add (patch_team_approvals.sql) = with check (is_member(...)) —
-- разрешал ЛЮБОМУ участнику. А удаление (team_habits_del) уже только владельцу — несогласованно.
--
-- РЕШЕНИЕ: INSERT общей привычки — только владелец цели (как DELETE). Участники по-прежнему
-- ВИДЯТ общие привычки и «ведут у себя» (личная копия + свои отметки в team_habit_logs — те
-- политики не трогаем), но НЕ создают привычки для всех. UI уже закрыт (кнопка «Привычка для
-- этой цели» под _isOwner) — это дублирующая защита, чтобы обход UI/прямой вызов API не прошёл.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists team_habits_add on public.team_habits;
create policy team_habits_add on public.team_habits for insert to authenticated
  with check (exists (select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()));

-- Правка определения общей привычки (UPDATE) — тоже только владелец (UI: кнопка-карандаш под
-- _isOwner). Если политики UPDATE на team_habits ещё нет — создаём владельцу.
drop policy if exists team_habits_upd on public.team_habits;
create policy team_habits_upd on public.team_habits for update to authenticated
  using (exists (select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()))
  with check (exists (select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()));

notify pgrst, 'reload schema';

-- ПРОВЕРКА: под участником-НЕ-владельцем insert в team_habits должен отклоняться (RLS), под
-- владельцем — проходить. Отметки (team_habit_logs) у всех участников работают как раньше.

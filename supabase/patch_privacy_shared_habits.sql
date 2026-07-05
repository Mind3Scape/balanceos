-- ─────────────────────────────────────────────────────────────────────────────
-- ПРИВАТНОСТЬ «ОБЩИХ ПРИВЫЧЕК» (buddy-привычки «вести вместе»).
--
-- ПРОБЛЕМА (аудит 2026-07-05): shared_habits_read = to authenticated USING (true) делает КОД
-- каждой общей привычки перечислимым (select code, owner_id from shared_habits → все коды).
-- А вступить можно, зная лишь код (shared_members_join with check user_id = auth.uid()). Значит
-- посторонний перечисляет все коды, вписывает себя в любую пару и читает ОБЕ истории отметок
-- (shared_logs_read = is_shared_member). Код задумывался как секрет-приглашение, но торчал списком.
--
-- РЕШЕНИЕ: код становится ЗНАНИЕМ-приглашением. Читать привычку может только владелец или уже
-- вступивший участник. Вступление по ссылке hb_<code> — через SECURITY DEFINER функцию join_shared:
-- знаешь код (=получил ссылку) → функция впишет тебя и вернёт привычку (в обход RLS, но только эту
-- одну по коду). Перечислить чужие коды больше нельзя.
--
-- Требует существующей функции public.is_shared_member(text, uuid) — она создаётся в
-- patch_shared_habits.sql (строка ~40); этот патч накатывается ПОСЛЕ него.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Читать общую привычку — только владелец или участник (перечисление кодов закрыто).
drop policy if exists shared_habits_read on public.shared_habits;
create policy shared_habits_read on public.shared_habits for select to authenticated
  using (owner_id = auth.uid() or public.is_shared_member(code, auth.uid()));

-- 2) Вступление по коду-ссылке через SECURITY DEFINER: код = приглашение.
create or replace function public.join_shared(c text)
returns public.shared_habits
language plpgsql security definer set search_path = public as $$
declare row public.shared_habits;
begin
  if auth.uid() is null then raise exception 'auth required'; end if;
  insert into public.shared_habit_members(code, user_id)
    values (c, auth.uid())
    on conflict (code, user_id) do nothing;
  select * into row from public.shared_habits where code = c;   -- definer видит строку → вернём её только что вступившему
  return row;
end; $$;

grant execute on function public.join_shared(text) to authenticated;

notify pgrst, 'reload schema';

-- ─── ПРОВЕРКА: cloud.js joinSharedHabit теперь зовёт rpc('join_shared') первым (с graceful
--   фолбэком на прямой upsert+select, чтобы работать и ДО прогона этого патча). После патча прямой
--   select чужой привычки по коду у не-участника вернёт пусто — вступление идёт только через rpc.

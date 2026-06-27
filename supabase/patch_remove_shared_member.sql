-- ════════════════════════════════════════════════════════════════════════════
--  BalanceOS — ИСКЛЮЧЕНИЕ УЧАСТНИКА из общей привычки. Запусти ОДИН раз:
--    Supabase → SQL Editor → New query → вставь ВЕСЬ файл → RUN. Безопасно повторно.
--
--  Идея (David): «свайп влево на человеке в блоке „Вместе“ → убрать его из привычки».
--  Сейчас политика на удаление в shared_habit_members разрешает удалить ТОЛЬКО себя
--  (выйти). Этот патч добавляет: ВЛАДЕЛЕЦ привычки может убрать любого участника.
--  (Требует уже применённый patch_shared_habits.sql — три таблицы общих привычек.)
-- ════════════════════════════════════════════════════════════════════════════

-- delete: каждый может выйти сам (user_id = я) ИЛИ владелец привычки убирает кого угодно.
drop policy if exists shared_members_leave on public.shared_habit_members;
create policy shared_members_leave on public.shared_habit_members for delete to authenticated using (
  user_id = auth.uid()
  or exists (
    select 1 from public.shared_habits h
    where h.code = shared_habit_members.code and h.owner_id = auth.uid()
  )
);

-- Готово. Клиент: removeSharedHabitMember(code, userId) делает DELETE с .select() — если
-- политика отказала (не владелец), удалятся 0 строк и клиент откатит оптимистичное скрытие.
-- Отметки ушедшего (shared_habit_logs) остаются в БД, но в UI не показываются (его больше нет
-- в members). Если он вернётся по ссылке — его история снова появится.

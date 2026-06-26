-- ════════════════════════════════════════════════════════════════════════════
--  BalanceOS — СТАВКА XP на КОМАНДНУЮ ЦЕЛЬ. Запусти ОДИН раз:
--    Supabase → SQL Editor → New query → вставь ВЕСЬ файл → RUN. Безопасно повторно.
--
--  Идея (David): команда может НЕОБЯЗАТЕЛЬНО поставить XP на свою цель. Дошли до цели —
--  банк выплачивается: кооперативные режимы (общий счёт / серия) → КАЖДЫЙ получает свою
--  ставку бонусом; гонка → ЛИДЕР забирает весь банк. По умолчанию «разблокировка»:
--  ставка НЕ списывается заранее, никакого минуса — это бонус, который ты ОТКРЫВАЕШЬ
--  победой (мягко и просто). Не дошли — банк просто не открылся (ничего не сгорает).
--
--  Размер ставки живёт в teams.goal.stake (уже есть jsonb из patch_team_goal.sql — НОВОЙ
--  колонки НЕ нужно). Здесь только ОДНА маленькая «ведомость» выплат:
--    team_goal_settlements — кто выиграл, сколько XP, когда. Идемпотентно по (team_id,user_id).
--  Прогресс по-прежнему СЧИТАЕТСЯ из отметок (teamGoalProgress) — таблица лишь фиксирует
--  ВЫПЛАТУ, чтобы XP сохранялся и поднимал уровень. Награду пишет КАЖДЫЙ за СЕБЯ (own-write):
--  клиент вычисляет достижение цели по общим данным и вставляет свою строку — RLS не даёт
--  писать чужую. Поэтому SECURITY DEFINER не нужен — граница = own-write + чтение для команды.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.team_goal_settlements (
  team_id    uuid not null references public.teams(id)    on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  xp         int  not null default 0,                     -- выплата этому участнику
  won        boolean not null default true,               -- co-op: все true; гонка: только лидер
  settled_at timestamptz not null default now(),
  primary key (team_id, user_id)                          -- одна выплата на участника на цель
);
create index if not exists team_goal_settlements_user_idx on public.team_goal_settlements (user_id);

alter table public.team_goal_settlements enable row level security;

-- читают: свои строки ИЛИ любые выплаты команды, где ты участник (для карточки «кто сколько
-- получил»). is_member — уже есть (schema.sql / patch_team_approvals.sql), SECURITY DEFINER.
drop policy if exists tgs_read on public.team_goal_settlements;
create policy tgs_read on public.team_goal_settlements for select to authenticated using (
  user_id = auth.uid() or public.is_member(team_id, auth.uid())
);
-- пишет КАЖДЫЙ только СВОЮ выплату (own-write). Клиент считает достижение цели из общих
-- отметок и открывает свою ставку; чужую строку RLS не пропустит.
drop policy if exists tgs_award on public.team_goal_settlements;
create policy tgs_award on public.team_goal_settlements for insert to authenticated with check (
  user_id = auth.uid()
);

-- Готово. Клиент: teamGoalProgress отдаёт stake/bank/done; settleTeamGoal вставляет твою
-- строку при current >= target (co-op: +ставка; гонка: лидер +банк), идемпотентно;
-- myTeamGoalXP суммирует твои выплаты в показываемый уровень.

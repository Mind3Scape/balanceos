-- ════════════════════════════════════════════════════════════════════════════
--  BalanceOS — СТРАХОВКА ОТ ПРОПАЖ: ежедневный бэкап облачного снимка (v594).
--  Прогнать ОДИН раз: Supabase → SQL Editor → New query → вставь ВЕСЬ файл → RUN.
--  Безопасно: только добавляет таблицу и триггер, существующие данные не трогает.
-- ════════════════════════════════════════════════════════════════════════════
--
--  ЗАЧЕМ (история с «Крипто монстрами»): снимок юзера в user_state перезаписывается
--  «последний победил» — если какой-то девайс однажды записал битое/пустое, старой
--  версии больше нет и откатиться некуда. Этот патч делает «машину времени»:
--  ПЕРВАЯ перезапись снимка за день откладывает ВЧЕРАШНЮЮ версию в snapshot_backups.
--  Храним 14 дней на юзера, старое чистится само. Теперь любое «у меня пропало»
--  чинится: смотрим бэкап за нужный день и возвращаем.
--
--  Восстановление (пример): select snapshot from snapshot_backups
--    where user_id = '<uuid>' order by day desc;  → взять нужный день,
--    update user_state set snapshot = '<тот jsonb>' where id = '<uuid>';

create table if not exists public.snapshot_backups (
  user_id  uuid not null references auth.users(id) on delete cascade,
  day      date not null,
  snapshot jsonb not null,
  saved_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.snapshot_backups enable row level security;

-- Читать может только сам владелец (для будущего UI «восстановить из бэкапа»).
-- Писать никто напрямую не может — пишет ТОЛЬКО триггер (security definer).
drop policy if exists snapshot_backups_read on public.snapshot_backups;
create policy snapshot_backups_read on public.snapshot_backups
  for select to authenticated using (user_id = auth.uid());

create or replace function public.bos_backup_snapshot()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Первая перезапись за день = сохранить то, что БЫЛО (состояние «на утро»).
  if OLD.snapshot is not null then
    insert into public.snapshot_backups(user_id, day, snapshot)
      values (OLD.id, current_date, OLD.snapshot)
      on conflict (user_id, day) do nothing;
    delete from public.snapshot_backups
      where user_id = OLD.id and day < current_date - 14;
  end if;
  return NEW;
end; $$;

drop trigger if exists trg_bos_backup_snapshot on public.user_state;
create trigger trg_bos_backup_snapshot
  before update of snapshot on public.user_state
  for each row execute function public.bos_backup_snapshot();

notify pgrst, 'reload schema';

-- ПРОВЕРКА: после прогона зайди в приложение (оно перепишет снимок) и выполни
--   select user_id, day, saved_at from snapshot_backups limit 5;
-- — должны появиться первые строки-бэкапы.

-- ═══════════════════════════════════════════════════════════════════════════════
-- BalanceOS · «Сообщество v2» — Э2 «Стать помощником» (валидация окружением)
-- Дельта к схеме (community-architecture-v2.md §6, правки 1-2):
--   1) network_offers += visibility ('circles'|'all') + status ('draft'|'confirmed')
--   2) новая таблица role_confirmations (кто подтвердил роль автора вклада)
-- Безопасно повторно запускать (if not exists / or replace). Прогнать в Supabase SQL editor.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1) видимость и статус вклада ------------------------------------------------
-- Черновик виден ближнему кругу; после 2 подтверждений открывается по visibility.
alter table public.network_offers
  add column if not exists visibility text not null default 'circles';   -- 'circles' | 'all'
alter table public.network_offers
  add column if not exists status text not null default 'draft';         -- 'draft' | 'confirmed'

-- 2) подтверждения роли окружением --------------------------------------------
create table if not exists public.role_confirmations (
  id           uuid primary key default gen_random_uuid(),
  offer_id     uuid not null references public.network_offers(id) on delete cascade,
  confirmer_id uuid not null references public.profiles(id)        on delete cascade,
  created_at   timestamptz not null default now(),
  unique (offer_id, confirmer_id)   -- один человек подтверждает формат один раз
);
create index if not exists role_conf_offer on public.role_confirmations(offer_id);

alter table public.role_confirmations enable row level security;

-- читают все (счётчик ✓ виден на карточке вклада)
drop policy if exists role_conf_read on public.role_confirmations;
create policy role_conf_read on public.role_confirmations
  for select using (true);

-- подтверждать может ТОЛЬКО тот, кто состоит в общем круге с автором вклада, и только за себя
drop policy if exists role_conf_ins on public.role_confirmations;
create policy role_conf_ins on public.role_confirmations
  for insert with check (
    auth.uid() = confirmer_id
    and exists (
      select 1
        from public.network_offers o
        join public.team_members tm_author on tm_author.user_id = o.owner_id
        join public.team_members tm_me     on tm_me.team_id = tm_author.team_id
                                          and tm_me.user_id = auth.uid()
       where o.id = offer_id
         and o.owner_id <> auth.uid()
    )
  );

-- отозвать своё подтверждение можно
drop policy if exists role_conf_del on public.role_confirmations;
create policy role_conf_del on public.role_confirmations
  for delete using (auth.uid() = confirmer_id);

-- 3) авто-подтверждение вклада после 2 голосов --------------------------------
create or replace function public.bos_bump_offer_status()
returns trigger language plpgsql security definer as $$
begin
  update public.network_offers o
     set status = 'confirmed'
   where o.id = new.offer_id
     and o.status <> 'confirmed'
     and (select count(*) from public.role_confirmations rc where rc.offer_id = new.offer_id) >= 2;
  return new;
end $$;

drop trigger if exists trg_offer_confirm on public.role_confirmations;
create trigger trg_offer_confirm
  after insert on public.role_confirmations
  for each row execute function public.bos_bump_offer_status();

-- 4) Э3 · просьба = дело круга, на которое откликаются --------------------------
-- Требует, чтобы уже был прогнан patch_team_tasks.sql (таблица team_tasks + public.is_member).
alter table public.team_tasks
  add column if not exists kind text not null default 'task';                              -- 'task' | 'request'
alter table public.team_tasks
  add column if not exists volunteer_id uuid references public.profiles(id) on delete set null;  -- кто откликнулся

-- участник круга может СОЗДАТЬ просьбу (обычные задания остаются за владельцем — политика из patch_team_tasks)
drop policy if exists team_tasks_ins_request on public.team_tasks;
create policy team_tasks_ins_request on public.team_tasks
  for insert with check ( kind = 'request' and public.is_member(team_id, auth.uid()) );

-- участник круга может откликнуться / снять отклик (менять volunteer_id на просьбе)
drop policy if exists team_tasks_claim on public.team_tasks;
create policy team_tasks_claim on public.team_tasks
  for update using ( public.is_member(team_id, auth.uid()) )
  with check ( public.is_member(team_id, auth.uid()) );

-- 5) Э4 · след пользы = «спасибо»-свет (thanks), заменяет звёзды-рейтинги -----
create table if not exists public.thanks (
  id         uuid primary key default gen_random_uuid(),
  offer_id   uuid not null references public.network_offers(id) on delete cascade,
  from_id    uuid not null references public.profiles(id)        on delete cascade,   -- кто благодарит
  to_id      uuid not null references public.profiles(id)        on delete cascade,   -- автор вклада (чья звезда ярче)
  week       text not null,
  note       text,                                                                    -- одна строка «что изменилось» (необязательно)
  created_at timestamptz not null default now(),
  unique (offer_id, from_id, week)   -- одно спасибо на бронь (offer+неделя)
);
create index if not exists thanks_offer on public.thanks(offer_id);
create index if not exists thanks_to    on public.thanks(to_id);

alter table public.thanks enable row level security;

-- счётчик следов виден всем (свет на карточке вклада и в профиле)
drop policy if exists thanks_read on public.thanks;
create policy thanks_read on public.thanks for select using (true);

-- благодарить можно ТОЛЬКО за реально забронированный вклад, за себя, автору (не себе)
drop policy if exists thanks_ins on public.thanks;
create policy thanks_ins on public.thanks
  for insert with check (
    auth.uid() = from_id
    and from_id <> to_id
    and exists (
      select 1 from public.network_bookings b
       where b.offer_id = thanks.offer_id and b.booker_id = auth.uid()
    )
  );

notify pgrst, 'reload schema';

-- ═══════════════════════════════════════════════════════════════════════════
-- BalanceOS · НЕТВОРК · предложения пользы + бронь за XP с ЖЁСТКИМ лимитом слотов
-- Применять: Supabase → SQL Editor → вставить целиком → Run. Идемпотентно (повтор ок).
--
-- Что даёт:
--   • network_offers  — что человек готов делать для окружения (цена XP, когда, сколько слотов/нед).
--   • network_bookings — кто записался на предложение и на какую неделю.
--   • bos_book_offer(...) — ЕДИНСТВЕННАЯ дверь брони: атомарно проверяет свободный слот,
--     берёт плату XP (в тот же журнал xp_ledger, что у партнёров) и создаёт запись.
--   • bos_offer_taken(...) — сколько слотов занято на неделю (для витрины «свободно/занято»).
--
-- Открывается с 10 уровня (гейт — на клиенте). Плата XP СГОРАЕТ (как у партнёров);
-- автор получает «вклад»/статус, а не XP. Требует xp_ledger из patch_xp_wallet.sql —
-- если ещё не прогонял его, прогони и он (рядом), иначе платные брони не спишутся.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) ПРЕДЛОЖЕНИЯ ─────────────────────────────────────────────────────────────
create table if not exists public.network_offers (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  emoji       text,
  title       text not null,
  descr       text,
  price_xp    int  not null default 0,       -- сколько XP платит тот, кто бронирует
  min_level   int  not null default 10,      -- с какого уровня можно записаться
  slots_week  int  not null default 1,       -- записей в неделю (ЖЁСТКИЙ лимит — та самая блокировка)
  when_text   text,                          -- когда готов, напр. «Воскресенье 18:00»
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists network_offers_owner  on public.network_offers (owner_id);
create index if not exists network_offers_active on public.network_offers (active) where active;

alter table public.network_offers enable row level security;
-- Читают все авторизованные (витрина нетворка). Пишет/меняет ТОЛЬКО владелец.
drop policy if exists net_offers_read on public.network_offers;
create policy net_offers_read  on public.network_offers for select using (true);
drop policy if exists net_offers_write on public.network_offers;
create policy net_offers_write on public.network_offers for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- 2) БРОНИ ───────────────────────────────────────────────────────────────────
create table if not exists public.network_bookings (
  id          uuid primary key default gen_random_uuid(),
  offer_id    uuid not null references public.network_offers(id) on delete cascade,
  owner_id    uuid not null references public.profiles(id) on delete cascade,   -- автор предложения
  booker_id   uuid not null references public.profiles(id) on delete cascade,   -- кто записался
  week        text not null,                 -- ISO-неделя, напр. '2026-W28'
  price_xp    int  not null default 0,
  created_at  timestamptz not null default now()
);
-- один человек не бронирует одно и то же предложение дважды в одну неделю
create unique index if not exists net_book_once
  on public.network_bookings (offer_id, booker_id, week);
create index if not exists net_book_offer_week on public.network_bookings (offer_id, week);
create index if not exists net_book_owner      on public.network_bookings (owner_id);

alter table public.network_bookings enable row level security;
-- Видишь СВОЮ бронь и брони на СВОИ предложения (автор видит «кто записался»).
drop policy if exists net_book_read on public.network_bookings;
create policy net_book_read on public.network_bookings for select
  using (auth.uid() = booker_id or auth.uid() = owner_id);
-- Прямой записи нет ни у кого — только через RPC ниже (атомарная проверка слотов + плата).

-- 3) БРОНЬ (единственная дверь) ───────────────────────────────────────────────
create or replace function public.bos_book_offer(
  p_offer  uuid,
  p_week   text,
  p_earned int default null      -- заработано XP (по мнению клиента) → защита от ухода в минус
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_o     public.network_offers%rowtype;
  v_taken int;
  v_spent int;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;

  -- Берём предложение и ЛОЧИМ строку на время транзакции: брони одного предложения
  -- выстраиваются в очередь → счётчик слотов честный даже при одновременных тапах.
  select * into v_o from network_offers where id = p_offer and active for update;
  if not found then return jsonb_build_object('ok', false, 'err', 'gone'); end if;
  if v_o.owner_id = v_uid then return jsonb_build_object('ok', false, 'err', 'self'); end if;

  -- уже записан на эту неделю?
  if exists (select 1 from network_bookings where offer_id = p_offer and booker_id = v_uid and week = p_week) then
    return jsonb_build_object('ok', true, 'dup', true);
  end if;

  -- слоты на неделю заняты? (вот та самая жёсткая блокировка)
  select count(*) into v_taken from network_bookings where offer_id = p_offer and week = p_week;
  if v_taken >= v_o.slots_week then
    return jsonb_build_object('ok', false, 'err', 'full');
  end if;

  -- плата XP: тот же журнал, что у партнёров (ref = идемпотентность). Плата СГОРАЕТ.
  if v_o.price_xp > 0 then
    if p_earned is not null then
      select coalesce(-sum(amount), 0) into v_spent from xp_ledger where user_id = v_uid and amount < 0;
      if (p_earned - v_spent - v_o.price_xp) < 0 then
        return jsonb_build_object('ok', false, 'err', 'insufficient');
      end if;
    end if;
    begin
      insert into xp_ledger (user_id, kind, amount, ref, meta)
      values (v_uid, 'spend_network', -v_o.price_xp, 'netbook:' || p_offer::text || ':' || p_week,
              jsonb_build_object('offer', p_offer, 'week', p_week));
    exception when unique_violation then null;   -- повтор той же оплаты — уже сделано
    end;
  end if;

  -- сама бронь (займёт слот)
  begin
    insert into network_bookings (offer_id, owner_id, booker_id, week, price_xp)
    values (p_offer, v_o.owner_id, v_uid, p_week, v_o.price_xp);
  exception when unique_violation then
    return jsonb_build_object('ok', true, 'dup', true);
  end;

  return jsonb_build_object('ok', true, 'taken', v_taken + 1, 'slots', v_o.slots_week);
end $$;

revoke all on function public.bos_book_offer(uuid, text, int) from public;
grant execute on function public.bos_book_offer(uuid, text, int) to authenticated;

-- 4) Витрина: сколько слотов занято на неделю (брони чужих не видны по RLS → считаем тут).
create or replace function public.bos_offer_taken(p_offer uuid, p_week text)
returns int language sql security definer set search_path = public as $$
  select count(*)::int from network_bookings where offer_id = p_offer and week = p_week;
$$;
revoke all on function public.bos_offer_taken(uuid, text) from public;
grant execute on function public.bos_offer_taken(uuid, text) to authenticated;

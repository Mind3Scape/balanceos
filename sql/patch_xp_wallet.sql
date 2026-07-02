-- ═══════════════════════════════════════════════════════════════════════════
-- BalanceOS · Этап 1 «Серверная правда» · XP-КОШЕЛЁК (журнал операций)
-- Применять: Supabase Dashboard → SQL Editor → вставить целиком → Run.
-- Патч идемпотентный: повторный запуск ничего не ломает.
--
-- Что даёт:
--   • xp_ledger — серверный ЖУРНАЛ операций с XP (списания у партнёров, ставки,
--     начисления-бонусы). Каждая строка = одна операция, ничего не перезаписывается.
--   • bos_spend_xp(...) — единственная дверь для списаний: атомарно, с защитой от
--     двойного списания (ref) и (опционально) от ухода в минус.
--   • bos_wallet() — сводка «сколько списано / сколько начислено» для клиента.
--
-- Клиент v497+ пишет сюда КАЖДУЮ трату через надёжную очередь (offline-safe).
-- Пока патч не применён — приложение работает по-старому (фолбэк), ничего не падает.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.xp_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null default 'spend',        -- 'spend_partner' | 'stake' | 'credit' | ...
  amount     int  not null,                        -- ОТРИЦАТЕЛЬНОЕ = списание, ПОЛОЖИТЕЛЬНОЕ = начисление
  ref        text,                                 -- ключ идемпотентности, напр. 'partner:medit'
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Один и тот же ref у пользователя не спишется дважды (двойной тап / повтор очереди).
create unique index if not exists xp_ledger_user_ref
  on public.xp_ledger (user_id, ref) where ref is not null;
create index if not exists xp_ledger_user_created
  on public.xp_ledger (user_id, created_at desc);

alter table public.xp_ledger enable row level security;

-- Читать можно только СВОЙ журнал. Прямой записи нет ни у кого:
-- все изменения — только через RPC ниже (security definer).
drop policy if exists "xp_ledger_read_own" on public.xp_ledger;
create policy "xp_ledger_read_own" on public.xp_ledger
  for select using (auth.uid() = user_id);

-- ── Списание ────────────────────────────────────────────────────────────────
-- p_amount  — сколько списать (положительное число).
-- p_ref     — ключ идемпотентности ('partner:medit'): повтор с тем же ref = ok, без второго списания.
-- p_kind    — тип операции для аналитики.
-- p_earned  — сколько всего заработано (по мнению клиента). Если передан — сервер не даст
--             уйти в минус. Этап A: клиент передаёт null (журналирование без проверки);
--             Этап B: earned начнёт считать сам сервер — параметр отпадёт.
-- p_meta    — произвольные детали ({"name":"Открытая медитация"}).
create or replace function public.bos_spend_xp(
  p_amount int,
  p_ref    text default null,
  p_kind   text default 'spend_partner',
  p_earned int default null,
  p_meta   jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_spent int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'err', 'auth');
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > 1000000 then
    return jsonb_build_object('ok', false, 'err', 'amount');
  end if;

  -- Повтор той же операции (очередь могла отправить дважды) → уже сделано, это успех.
  if p_ref is not null and exists (
    select 1 from xp_ledger where user_id = v_uid and ref = p_ref
  ) then
    select coalesce(-sum(amount), 0) into v_spent from xp_ledger where user_id = v_uid and amount < 0;
    return jsonb_build_object('ok', true, 'dup', true, 'spent', v_spent);
  end if;

  -- Защита от минуса — только если клиент сообщил earned (Этап A: мягкий режим).
  if p_earned is not null then
    select coalesce(-sum(amount), 0) into v_spent from xp_ledger where user_id = v_uid and amount < 0;
    if (p_earned - v_spent - p_amount) < 0 then
      return jsonb_build_object('ok', false, 'err', 'insufficient', 'spent', v_spent);
    end if;
  end if;

  begin
    insert into xp_ledger (user_id, kind, amount, ref, meta)
    values (v_uid, coalesce(p_kind, 'spend'), -p_amount, p_ref, coalesce(p_meta, '{}'::jsonb));
  exception when unique_violation then
    -- гонка двух повторов — считаем успехом (операция уже в журнале)
    null;
  end;

  select coalesce(-sum(amount), 0) into v_spent from xp_ledger where user_id = v_uid and amount < 0;
  return jsonb_build_object('ok', true, 'spent', v_spent);
end $$;

revoke all on function public.bos_spend_xp(int, text, text, int, jsonb) from public;
grant execute on function public.bos_spend_xp(int, text, text, int, jsonb) to authenticated;

-- ── Сводка кошелька ─────────────────────────────────────────────────────────
create or replace function public.bos_wallet()
returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'spent',    coalesce(-sum(amount) filter (where amount < 0), 0),
    'credited', coalesce( sum(amount) filter (where amount > 0), 0),
    'ops',      count(*)
  ) from xp_ledger where user_id = auth.uid();
$$;

revoke all on function public.bos_wallet() from public;
grant execute on function public.bos_wallet() to authenticated;

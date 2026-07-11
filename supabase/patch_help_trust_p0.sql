-- ═══════════════════════════════════════════════════════════════════════════════
-- BalanceOS · ДОВЕРИЕ И ПРИВАТНОСТЬ ПОМОЩИ — P0 (brief «Социальная помощь…» 2026-07-11)
-- Прогнать ОДИН раз: Supabase → SQL Editor → вставить ВЕСЬ файл → Run.
-- Идемпотентно (безопасно повторять). Требует ранее прогнанных schema.sql,
-- patch_team_tasks.sql, patch_network_offers.sql; блок 0 сам добавит колонки
-- status/visibility, если patch_community_v2.sql ещё не прогнан.
--
-- Что закрывает (все пункты подтверждены в коде перед патчем):
--   1. Черновики и circle-only вклады читались ВСЕМИ (net_offers_read using(true)).
--   2. Любой участник круга мог переписать ЛЮБОЕ поле любой просьбы, а отклик
--      «последний перезаписывает первого» (team_tasks_claim for update).
--   3. «Спасибо» доверяло получателя клиенту (to_id не проверялся против владельца).
--   4. Подтверждение роли мог дать pending-участник (ещё не принятый в круг).
--   5. Клиент мог переписать свои tg_id / referred_by / ref_code (profiles_write = вся строка).
--   6. Превью круга по инвайт-ссылке: приватный круг не читается до вступления —
--      нужна безопасная серверная карточка (имя+эмблема+размер, БЕЗ списка людей).
-- ═══════════════════════════════════════════════════════════════════════════════

-- 0) СТРАХОВКА: колонки видимости/статуса вклада (no-op, если community_v2 уже прогнан)
alter table public.network_offers
  add column if not exists visibility text not null default 'circles';   -- 'circles' | 'all'
alter table public.network_offers
  add column if not exists status text not null default 'draft';         -- 'draft' | 'confirmed'

-- 1) ОБЩИЙ КРУГ БЕЗ PENDING ───────────────────────────────────────────────────
-- «Мы в одном круге» = оба ПРИНЯТЫ (заявки role='pending' не считаются). SECURITY
-- DEFINER — чтобы политики могли звать без рекурсии RLS (как public.is_member).
create or replace function public.bos_shares_circle(a uuid, b uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.team_members m1
    join public.team_members m2 on m2.team_id = m1.team_id
    where m1.user_id = a and m1.role <> 'pending'
      and m2.user_id = b and m2.role <> 'pending'
  );
$$;

-- 2) ВИДИМОСТЬ ВКЛАДОВ ПО-НАСТОЯЩЕМУ ─────────────────────────────────────────
-- Владелец видит свои всегда. Чужие: подтверждённые и открытые «всем» — всем;
-- черновики/circle-only — ТОЛЬКО общему кругу (там их и подтверждают).
drop policy if exists net_offers_read on public.network_offers;
create policy net_offers_read on public.network_offers for select to authenticated using (
  owner_id = auth.uid()
  or (active and status = 'confirmed' and visibility = 'all')
  or (active and public.bos_shares_circle(owner_id, auth.uid()))
);

-- 3) ОТКЛИК НА ПРОСЬБУ — АТОМАРНО, БЕЗ ПЕРЕЗАПИСИ ────────────────────────────
-- Широкая политика «участник может update всю строку» УБИРАЕТСЯ: текст просьбы
-- меняет только владелец задания (политика team_tasks_upd из patch_team_tasks),
-- а отклик идёт через ЕДИНСТВЕННУЮ дверь bos_claim_request: взять можно только
-- СВОБОДНУЮ просьбу (второй тап не затирает первого), снять — только СВОЙ отклик.
drop policy if exists team_tasks_claim on public.team_tasks;

create or replace function public.bos_claim_request(p_task uuid, p_on boolean default true)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_t   public.team_tasks%rowtype;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  -- лочим строку: одновременные тапы выстраиваются в очередь, счёт честный
  select * into v_t from team_tasks where id = p_task for update;
  if not found then return jsonb_build_object('ok', false, 'err', 'gone'); end if;
  if coalesce(v_t.kind, 'task') <> 'request' then return jsonb_build_object('ok', false, 'err', 'not_request'); end if;
  if not public.is_member(v_t.team_id, v_uid) then return jsonb_build_object('ok', false, 'err', 'not_member'); end if;

  if p_on then
    if v_t.volunteer_id is not null and v_t.volunteer_id <> v_uid then
      return jsonb_build_object('ok', false, 'err', 'taken');     -- уже взял другой — честно говорим
    end if;
    update team_tasks set volunteer_id = v_uid where id = p_task;
    return jsonb_build_object('ok', true);
  else
    if v_t.volunteer_id is distinct from v_uid then
      return jsonb_build_object('ok', false, 'err', 'not_mine');  -- чужой отклик не снимаем
    end if;
    update team_tasks set volunteer_id = null where id = p_task;
    return jsonb_build_object('ok', true);
  end if;
end $$;
revoke all on function public.bos_claim_request(uuid, boolean) from public;
grant execute on function public.bos_claim_request(uuid, boolean) to authenticated;

-- 4) «СПАСИБО» — ПОЛУЧАТЕЛЬ ВЫЧИСЛЯЕТСЯ, А НЕ ПРИСЫЛАЕТСЯ ────────────────────
-- Благодарить можно только за СВОЮ реальную бронь, и только ВЛАДЕЛЬЦУ вклада:
-- to_id обязан совпадать с network_offers.owner_id (раньше клиент мог прислать любого).
drop policy if exists thanks_ins on public.thanks;
create policy thanks_ins on public.thanks
  for insert with check (
    auth.uid() = from_id
    and from_id <> to_id
    and exists (
      select 1 from public.network_offers o
      join public.network_bookings b on b.offer_id = o.id
      where o.id = thanks.offer_id
        and o.owner_id = thanks.to_id            -- получатель = автор вклада, точка
        and b.booker_id = auth.uid()
    )
  );

-- 5) ПОДТВЕРЖДЕНИЕ РОЛИ — ТОЛЬКО ПРИНЯТЫЕ УЧАСТНИКИ ОБЩЕГО КРУГА ─────────────
-- Прежняя политика join'ила team_members напрямую и пропускала pending-заявки.
drop policy if exists role_conf_ins on public.role_confirmations;
create policy role_conf_ins on public.role_confirmations
  for insert with check (
    auth.uid() = confirmer_id
    and exists (
      select 1 from public.network_offers o
      where o.id = offer_id
        and o.owner_id <> auth.uid()
        and public.bos_shares_circle(o.owner_id, auth.uid())
    )
  );

-- 6) ПРОФИЛЬ: ЧУВСТВИТЕЛЬНЫЕ ПОЛЯ БОЛЬШЕ НЕ ПИШУТСЯ КЛИЕНТОМ ─────────────────
-- Политика profiles_write оставляла клиенту ВСЮ строку — значит свой tg_id (адрес
-- пушей), referred_by (реферальный граф) и ref_code можно было переписать из консоли.
-- Режем колонками: что клиент реально пишет — оставляем, остальное — только сервер
-- (service_role грантами не ограничен: tg-auth/checkin продолжат работать).
revoke update on public.profiles from authenticated;
do $$
declare col text;
begin
  foreach col in array array['username','avatar','snapshot','offer','tz_offset','pub_orbit','last_active','checkin_on']
  loop
    begin
      execute format('grant update (%I) on public.profiles to authenticated', col);
    exception when undefined_column then
      raise notice 'profiles.%: колонки нет (патч этой фичи не прогнан) — пропускаю', col;
    end;
  end loop;
end $$;

-- 7) ПРЕВЬЮ КРУГА ДЛЯ ИНВАЙТ-ССЫЛКИ ──────────────────────────────────────────
-- Приложение больше НЕ вступает молча: показывает карточку «Тебя зовут в круг» и ждёт
-- явного «Вступить». Для приватного круга (RLS не даёт читать teams до членства)
-- отдаём безопасный минимум: имя, эмблема, размер. НИКАКИХ списков людей/привычек/чата.
create or replace function public.bos_team_preview(t uuid)
returns jsonb language sql security definer stable set search_path = public as $$
  select case when tm.id is null then null else jsonb_build_object(
    'name',      tm.name,
    'emblem',    tm.emblem,
    'vis',       tm.vis,
    'members_n', (select count(*) from public.team_members m where m.team_id = tm.id and m.role <> 'pending')
  ) end
  from public.teams tm where tm.id = t;
$$;
revoke all on function public.bos_team_preview(uuid) from public;
grant execute on function public.bos_team_preview(uuid) to authenticated;

-- PostgREST кэширует схему — перечитать сразу.
notify pgrst, 'reload schema';

-- ── ПРОВЕРКА ПОСЛЕ ПРОГОНА ───────────────────────────────────────────────────
-- 1. Под обычным юзером: select * from network_offers → чужие черновики исчезли.
-- 2. Два юзера тапают «Откликнуться» на одну просьбу → второй получает {ok:false,err:'taken'}.
-- 3. insert в thanks с to_id ≠ владелец оффера → отказ RLS.
-- 4. update profiles set referred_by=... под юзером → permission denied for column.
-- 5. select bos_team_preview('<uuid приватного круга>') → имя+размер, без участников.

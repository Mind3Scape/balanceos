-- ═══════════════════════════════════════════════════════════════════════════════
-- BalanceOS · ДОВЕРИЕ И ПРИВАТНОСТЬ ПОМОЩИ — P0 (brief «Социальная помощь…» 2026-07-11)
-- Прогнать ОДИН раз: Supabase → SQL Editor → вставить ВЕСЬ файл → Run.
-- Идемпотентно (безопасно повторять). Требует ранее прогнанных schema.sql,
-- patch_team_tasks.sql, patch_network_offers.sql И patch_community_v2.sql.
-- Применяется целиком одной транзакцией: если зависимость отсутствует, ничего
-- не останется в частично обновлённом состоянии.
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

begin;

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
  select auth.uid() is not null
    and (a = auth.uid() or b = auth.uid())
    and exists (
    select 1 from public.team_members m1
    join public.team_members m2 on m2.team_id = m1.team_id
    where m1.user_id = a and m1.role <> 'pending'
      and m2.user_id = b and m2.role <> 'pending'
  );
$$;
revoke all on function public.bos_shares_circle(uuid, uuid) from public;
grant execute on function public.bos_shares_circle(uuid, uuid) to authenticated;

-- 2) ВИДИМОСТЬ ВКЛАДОВ ПО-НАСТОЯЩЕМУ ─────────────────────────────────────────
-- Владелец видит свои всегда. Чужие: подтверждённые и открытые «всем» — всем;
-- черновики/circle-only — ТОЛЬКО общему кругу (там их и подтверждают).
drop policy if exists net_offers_read on public.network_offers;
create policy net_offers_read on public.network_offers for select to authenticated using (
  owner_id = auth.uid()
  or (active and status = 'confirmed' and visibility = 'all')
  or (active and public.bos_shares_circle(owner_id, auth.uid()))
);

-- Бронь — только текущая ISO-неделя, только подтверждённый видимый формат.
-- Пока на сервере нет авторитетного кошелька/уровня, платные и level-gated записи
-- закрываются честно: клиентские p_earned/level нельзя считать доказательством.
create or replace function public.bos_book_offer(
  p_offer  uuid,
  p_week   text,
  p_earned int default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_o     public.network_offers%rowtype;
  v_taken int;
  v_week  text := to_char(current_date, 'IYYY-"W"IW');
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  if p_week is distinct from v_week then return jsonb_build_object('ok', false, 'err', 'week'); end if;

  select * into v_o from public.network_offers where id = p_offer and active for update;
  if not found then return jsonb_build_object('ok', false, 'err', 'gone'); end if;
  if v_o.owner_id = v_uid then return jsonb_build_object('ok', false, 'err', 'self'); end if;
  if v_o.status <> 'confirmed' then return jsonb_build_object('ok', false, 'err', 'unconfirmed'); end if;
  if not (v_o.visibility = 'all' or public.bos_shares_circle(v_o.owner_id, v_uid)) then
    return jsonb_build_object('ok', false, 'err', 'private');
  end if;
  if v_o.min_level > 1 then return jsonb_build_object('ok', false, 'err', 'level_unverified'); end if;
  if v_o.price_xp > 0 then return jsonb_build_object('ok', false, 'err', 'xp_unverified'); end if;

  if exists (
    select 1 from public.network_bookings
     where offer_id = p_offer and booker_id = v_uid and week = v_week
  ) then return jsonb_build_object('ok', true, 'dup', true); end if;

  select count(*) into v_taken from public.network_bookings
   where offer_id = p_offer and week = v_week;
  if v_taken >= v_o.slots_week then
    return jsonb_build_object('ok', false, 'err', 'full');
  end if;

  begin
    insert into public.network_bookings (offer_id, owner_id, booker_id, week, price_xp)
    values (p_offer, v_o.owner_id, v_uid, v_week, 0);
  exception when unique_violation then
    return jsonb_build_object('ok', true, 'dup', true);
  end;
  return jsonb_build_object('ok', true, 'taken', v_taken + 1, 'slots', v_o.slots_week);
end $$;
revoke all on function public.bos_book_offer(uuid, text, int) from public;
grant execute on function public.bos_book_offer(uuid, text, int) to authenticated;

-- И счётчик слотов не превращаем в способ перебирать чужую историю по неделям.
create or replace function public.bos_offer_taken(p_offer uuid, p_week text)
returns int language plpgsql security definer stable set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_o public.network_offers%rowtype;
  v_week text := to_char(current_date, 'IYYY-"W"IW');
  v_n int := 0;
begin
  if v_uid is null or p_week is distinct from v_week then return 0; end if;
  select * into v_o from public.network_offers where id = p_offer and active;
  if not found or v_o.status <> 'confirmed' then return 0; end if;
  if not (v_o.owner_id = v_uid or v_o.visibility = 'all' or public.bos_shares_circle(v_o.owner_id, v_uid)) then return 0; end if;
  select count(*) into v_n from public.network_bookings where offer_id = p_offer and week = v_week;
  return v_n;
end $$;
revoke all on function public.bos_offer_taken(uuid, text) from public;
grant execute on function public.bos_offer_taken(uuid, text) to authenticated;

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
        and b.week = thanks.week                  -- одна реальная бронь не кормит другие недели
    )
    and char_length(coalesce(note, '')) <= 140
  );

-- Сырые строки «спасибо» содержат социальный граф и свободный текст. Их читают
-- только участники события; публичным остаётся безопасный агрегат через RPC ниже.
drop policy if exists thanks_read on public.thanks;
create policy thanks_read on public.thanks for select to authenticated using (
  from_id = auth.uid() or to_id = auth.uid()
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

-- Имена подтвердивших видят автор, сам подтвердивший и люди из общего круга.
-- Публичная карточка получает лишь количество через агрегат, без графа связей.
drop policy if exists role_conf_read on public.role_confirmations;
create policy role_conf_read on public.role_confirmations for select to authenticated using (
  confirmer_id = auth.uid()
  or exists (
    select 1 from public.network_offers o
     where o.id = role_confirmations.offer_id
       and (o.owner_id = auth.uid() or public.bos_shares_circle(o.owner_id, auth.uid()))
  )
);

create or replace function public.bos_role_confirmation_summary(p_offer uuid)
returns jsonb language plpgsql security definer stable set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_o public.network_offers%rowtype;
  v_n int := 0;
  v_mine boolean := false;
  v_ids jsonb := '[]'::jsonb;
  v_visible boolean := false;
  v_names boolean := false;
begin
  if v_uid is null then return jsonb_build_object('n', 0, 'mine', false, 'ids', v_ids); end if;
  select * into v_o from public.network_offers where id = p_offer;
  if not found then return jsonb_build_object('n', 0, 'mine', false, 'ids', v_ids); end if;
  v_visible := v_o.owner_id = v_uid
    or (v_o.active and v_o.status = 'confirmed' and v_o.visibility = 'all')
    or (v_o.active and public.bos_shares_circle(v_o.owner_id, v_uid));
  if not v_visible then return jsonb_build_object('n', 0, 'mine', false, 'ids', v_ids); end if;

  select count(*), coalesce(bool_or(confirmer_id = v_uid), false)
    into v_n, v_mine from public.role_confirmations where offer_id = p_offer;
  v_names := v_o.owner_id = v_uid or public.bos_shares_circle(v_o.owner_id, v_uid);
  if v_names then
    select coalesce(jsonb_agg(confirmer_id order by created_at), '[]'::jsonb)
      into v_ids from public.role_confirmations where offer_id = p_offer;
  end if;
  return jsonb_build_object('n', v_n, 'mine', v_mine, 'ids', v_ids);
end $$;
revoke all on function public.bos_role_confirmation_summary(uuid) from public;
grant execute on function public.bos_role_confirmation_summary(uuid) to authenticated;

create or replace function public.bos_offer_thanks_summary(p_offer uuid)
returns jsonb language plpgsql security definer stable set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_o public.network_offers%rowtype;
  v_n int := 0;
  v_mine boolean := false;
  v_notes jsonb := '[]'::jsonb;
  v_visible boolean := false;
begin
  if v_uid is null then return jsonb_build_object('n', 0, 'mine', false, 'notes', v_notes); end if;
  select * into v_o from public.network_offers where id = p_offer;
  if not found then return jsonb_build_object('n', 0, 'mine', false, 'notes', v_notes); end if;
  v_visible := v_o.owner_id = v_uid
    or (v_o.active and v_o.status = 'confirmed' and v_o.visibility = 'all')
    or (v_o.active and public.bos_shares_circle(v_o.owner_id, v_uid));
  if not v_visible then return jsonb_build_object('n', 0, 'mine', false, 'notes', v_notes); end if;

  select count(*), coalesce(bool_or(from_id = v_uid), false)
    into v_n, v_mine from public.thanks where offer_id = p_offer;
  -- Текст видит получатель; автор благодарности видит только свой текст.
  select coalesce(jsonb_agg(note order by created_at) filter (where note is not null and note <> ''), '[]'::jsonb)
    into v_notes from public.thanks
   where offer_id = p_offer and (v_o.owner_id = v_uid or from_id = v_uid);
  return jsonb_build_object('n', v_n, 'mine', v_mine, 'notes', v_notes);
end $$;
revoke all on function public.bos_offer_thanks_summary(uuid) from public;
grant execute on function public.bos_offer_thanks_summary(uuid) to authenticated;

create or replace function public.bos_user_thanks_count(p_user uuid)
returns int language sql security definer stable set search_path = public as $$
  select case when auth.uid() is null then 0 else count(*)::int end
    from public.thanks where to_id = p_user;
$$;
revoke all on function public.bos_user_thanks_count(uuid) from public;
grant execute on function public.bos_user_thanks_count(uuid) to authenticated;

-- 5.1) Статус — производная от ТЕКУЩИХ подтверждений, а не вечный флаг.
-- Отозвали голос и осталось <2 → формат снова draft. Владелец не может сам
-- присвоить confirmed: это делает только этот trigger.
create or replace function public.bos_recompute_offer_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_offer uuid;
  v_n int;
begin
  v_offer := case when tg_op = 'DELETE' then old.offer_id else new.offer_id end;
  select count(*) into v_n from public.role_confirmations where offer_id = v_offer;
  update public.network_offers
     set status = case when v_n >= 2 then 'confirmed' else 'draft' end
   where id = v_offer;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

drop trigger if exists trg_offer_confirm on public.role_confirmations;
drop trigger if exists trg_offer_recompute on public.role_confirmations;
create trigger trg_offer_recompute
  after insert or delete on public.role_confirmations
  for each row execute function public.bos_recompute_offer_status();

-- Старый policy пропускал pending-участников. Исторически отличить pending от
-- давно вышедшего принятого участника уже нельзя, поэтому миграция fail-closed:
-- сохраняет лишь подтверждения от людей, которые ПРЯМО СЕЙЧАС состоят с автором
-- в хотя бы одном принятом общем круге. Дальнейший выход не отзывает прошлый факт.
delete from public.role_confirmations rc
using public.network_offers o
where o.id = rc.offer_id
  and (
    o.owner_id = rc.confirmer_id
    or not exists (
      select 1 from public.team_members ma
      join public.team_members mc on mc.team_id = ma.team_id
       where ma.user_id = o.owner_id and ma.role <> 'pending'
         and mc.user_id = rc.confirmer_id and mc.role <> 'pending'
    )
  );

-- Старый вечный confirmed тоже приводим к фактам: два текущих голоса или draft.
update public.network_offers o
   set status = case when (
     select count(*) from public.role_confirmations rc where rc.offer_id = o.id
   ) >= 2 then 'confirmed' else 'draft' end;

-- 5.2) Клиент владельца задаёт только безопасный draft из каталога. Нельзя
-- подменить роль под уже собранными голосами или отправить status=confirmed вручную.
create or replace function public.bos_guard_help_offer()
returns trigger language plpgsql set search_path = public as $$
declare
  v_votes int := 0;
  v_expected_emoji text;
begin
  if auth.uid() = new.owner_id then
    if tg_op = 'INSERT' then
      if new.status <> 'draft' or new.visibility <> 'circles' then
        raise exception 'help_offer_must_start_as_circle_draft';
      end if;
      if new.title not in (
        'Поддержать привычку', 'Позвать на прогулку', 'Помочь вернуться в ритм',
        'Провести первую тренировку', 'Провести дыхание или медитацию',
        'Разобрать неделю', 'Собрать маленькую встречу',
        'Показать навык на практике', 'Провести совместный фокус-час',
        'Разобрать конкретную задачу'
      ) then raise exception 'help_offer_not_in_catalog'; end if;
    else
      if new.owner_id <> old.owner_id or new.status <> old.status or new.visibility <> old.visibility then
        raise exception 'help_offer_trust_fields_are_server_owned';
      end if;
      select count(*) into v_votes from public.role_confirmations where offer_id = old.id;
      if v_votes > 0 and (new.title <> old.title or new.emoji is distinct from old.emoji or new.descr is distinct from old.descr) then
        raise exception 'help_offer_role_has_confirmations';
      end if;
      if new.title is distinct from old.title and new.title not in (
        'Поддержать привычку', 'Позвать на прогулку', 'Помочь вернуться в ритм',
        'Провести первую тренировку', 'Провести дыхание или медитацию',
        'Разобрать неделю', 'Собрать маленькую встречу',
        'Показать навык на практике', 'Провести совместный фокус-час',
        'Разобрать конкретную задачу'
      ) then raise exception 'help_offer_not_in_catalog'; end if;
    end if;
    if new.title = 'Показать навык на практике' then
      if new.descr is null or new.descr not in (
        'Навык · Медитация', 'Навык · Бег', 'Навык · Силовые тренировки',
        'Навык · Планирование', 'Навык · Фокус и работа',
        'Навык · Публичные выступления', 'Навык · Дизайн',
        'Навык · Языковая практика'
      ) then raise exception 'help_skill_not_in_catalog'; end if;
    elsif coalesce(new.descr, '') <> '' then
      raise exception 'help_offer_free_text_not_allowed';
    end if;
    if exists (
      select 1 from public.network_offers o
       where o.owner_id = new.owner_id and o.id <> new.id and o.active
         and o.title = new.title and coalesce(o.descr, '') = coalesce(new.descr, '')
    ) then
      raise exception 'help_offer_duplicate_role';
    end if;
    v_expected_emoji := case new.title
      when 'Поддержать привычку' then '🌱' when 'Позвать на прогулку' then '🚶'
      when 'Помочь вернуться в ритм' then '🔄' when 'Провести первую тренировку' then '🏃'
      when 'Провести дыхание или медитацию' then '🧘' when 'Разобрать неделю' then '🗓️'
      when 'Собрать маленькую встречу' then '🤝' when 'Показать навык на практике' then '💡'
      when 'Провести совместный фокус-час' then '⏱️' when 'Разобрать конкретную задачу' then '🎯'
      else null end;
    if v_expected_emoji is not null and new.emoji is distinct from v_expected_emoji then
      raise exception 'help_offer_icon_not_in_catalog';
    end if;
    if coalesce(new.when_text, '') !~ '^(15|20|30) мин · (онлайн|рядом)$'
       or new.slots_week not between 1 and 3
       or new.price_xp <> 0 or new.min_level <> 1 then
      raise exception 'help_offer_boundaries_invalid';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_help_offer on public.network_offers;
create trigger trg_guard_help_offer
  before insert or update on public.network_offers
  for each row execute function public.bos_guard_help_offer();

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

commit;

-- ── ПРОВЕРКА ПОСЛЕ ПРОГОНА ───────────────────────────────────────────────────
-- 1. Под обычным юзером: select * from network_offers → чужие черновики исчезли.
-- 2. Два юзера тапают «Откликнуться» на одну просьбу → второй получает {ok:false,err:'taken'}.
-- 3. insert в thanks с to_id ≠ владелец оффера → отказ RLS.
-- 4. update profiles set referred_by=... под юзером → permission denied for column.
-- 5. select bos_team_preview('<uuid приватного круга>') → имя+размер, без участников.

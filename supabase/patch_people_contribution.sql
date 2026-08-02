-- ═══════════════════════════════════════════════════════════════════════════════
-- BalanceOS · «ЛЮДИ» С НУЛЯ · «Твой вклад в окружение» (v868)
-- Применять: Supabase → SQL Editor → вставить ЦЕЛИКОМ → Run. Идемпотентно (повтор ок).
-- Требует уже прогнанных: patch_network_offers.sql, patch_community_v2.sql,
--                         patch_help_trust_p0.sql, patch_skill_network_v1.sql,
--                         sql/patch_xp_wallet.sql.
--
-- ЧТО МЕНЯЕТ ПО СУЩЕСТВУ (бриф David 2026-08-02):
--   1) СБРОС ДЛЯ ВСЕХ. Тестовые люди и незавершённые пробы стираются: вклады,
--      заявки, дела, впечатления, подтверждения роли, заявленные навыки.
--   2) ВКЛАД, А НЕ ЛЕСЕНКА. Раньше вклад доходил до людей только после
--      2 подтверждений из круга + 2 состоявшихся дел (state='trusted').
--      Теперь вклад виден сразу; доверие набирается ПОСЛЕ — делами.
--   3) ЦЕНА В XP. Раньше сервер жёстко держал price_xp = 0. Теперь автор сам
--      ставит цену 0…1000 XP.
--   4) НЕ БОЛЬШЕ ДВУХ. У человека максимум два активных вклада («для начала
--      1–2 вещи»), лимит держит сервер, а не только интерфейс.
--   5) ВЕРИФИЦИРУЮТ ЛЮДИ, НЕ КРУГ. role_confirmations больше не влияет ни на
--      статус вклада, ни на его видимость. Подтверждение = состоявшееся дело
--      (обе стороны отметили) + ВПЕЧАТЛЕНИЕ от заказчика.
--   6) XP СПИСЫВАЮТСЯ ЗА СОСТОЯВШЕЕСЯ ДЕЛО, не за обещание: плата уходит в тот
--      же журнал xp_ledger в момент, когда заказчик подтверждает «состоялось».
--      Возвратов не бывает по построению — платить не за что, пока дела нет.
--      Плата СГОРАЕТ (как у партнёров): помощь остаётся даром, а не подработкой.
--   7) ПАРТНЁРЫ ЧЕРЕЗ ПОРУЧИТЕЛЬСТВО. Заявка от любого → её видят люди уровня
--      ≥10 → три независимых поручительства → место публикуется. Без админа.
--
-- ⚠️ ПОРЯДОК: этот патч ставится ПОСЛЕ patch_skill_network_v1.sql. Если когда-нибудь
--    придётся прогнать v1 заново, сразу за ним прогони и этот — иначе вернутся
--    старые правила (лестница доверия, price_xp=0) и появится вторая версия
--    bos_skill_mark_done с двумя аргументами.
--
-- ⚠️ ЧЕСТНО ПРО ГРАНИЦЫ. Уровень человека сервер не считает: он читает его из
--    profiles.pub_orbit — витрины, которую публикует сам телефон и которую тот же
--    телефон имеет право переписать. Поэтому «уровень ≥10» у поручительства — это
--    заслон от случайного человека, а не от целенаправленной накрутки. Настоящую
--    защиту тут дают две величины, которые клиент подделать не может: возраст
--    аккаунта (profiles.created_at) и общий круг с автором заявки — обе проверяются
--    в bos_vouch_partner. Полноценный серверный подсчёт XP — отдельная работа.
-- ═══════════════════════════════════════════════════════════════════════════════

begin;

-- ── ПРОВЕРКА ПЕРЕД СТАРТОМ ───────────────────────────────────────────────────
-- Патч опирается на чужие таблицы и функции. Если чего-то нет, лучше упасть здесь
-- с человеческим текстом, чем установиться и сломаться потом в руках у людей.
do $$
declare v_missing text := '';
begin
  if to_regclass('public.network_offers')   is null then v_missing := v_missing || E'\n  • network_offers  → прогони supabase/patch_network_offers.sql'; end if;
  if to_regclass('public.thanks')           is null then v_missing := v_missing || E'\n  • thanks          → прогони supabase/patch_community_v2.sql'; end if;
  if to_regclass('public.user_skills')      is null then v_missing := v_missing || E'\n  • user_skills     → прогони supabase/patch_skill_network_v1.sql'; end if;
  if to_regclass('public.skill_catalog')    is null then v_missing := v_missing || E'\n  • skill_catalog   → прогони supabase/patch_skill_network_v1.sql'; end if;
  if to_regclass('public.xp_ledger')        is null then v_missing := v_missing || E'\n  • xp_ledger       → прогони sql/patch_xp_wallet.sql (без него платные вклады не спишутся)'; end if;
  if to_regproc('public.bos_shares_circle') is null then v_missing := v_missing || E'\n  • bos_shares_circle → прогони supabase/patch_help_trust_p0.sql'; end if;
  if v_missing <> '' then
    raise exception E'Не хватает предыдущих патчей:%\n\nПрогони их и запусти этот файл заново. Ничего не изменено.', v_missing;
  end if;
end $$;

-- ── 0) СБРОС ДЛЯ ВСЕХ ────────────────────────────────────────────────────────
-- David: «сбрось эту вкладку для всех, там остались тестовые люди и мои
-- незавершённые пробы». Кошелёк, круги, привычки и профили НЕ ТРОГАЕМ —
-- сброс касается только вкладки «Люди».
--
-- ПОЧЕМУ ЭТО ПЕРВЫМ И С ВЫКЛЮЧЕННЫМИ ТРИГГЕРАМИ. На старой схеме удаление тянет
-- за собой каскад: снятие role_confirmations пересчитывает статус вклада,
-- удаление вклада обнуляет источник навыка, а тот в ответ правит вклад обратно —
-- то есть во время DELETE по таблицам идут UPDATE. Если бы новые правила уже
-- стояли, эти UPDATE упирались бы в новый сторож («вклад обязан быть публичным»)
-- и валили бы весь патч. Поэтому сначала гасим взаимные триггеры, стираем, и
-- только потом меняем правила.
do $$
declare
  v_pairs text[][] := array[
    ['user_skills', 'trg_skill_source_changed'],
    ['user_skills', 'trg_skill_state_pause'],
    ['role_confirmations', 'trg_offer_recompute'],
    ['role_confirmations', 'trg_offer_confirm'],
    ['network_offers', 'trg_sync_skill_source']
  ];
  i int;
begin
  for i in 1 .. array_length(v_pairs, 1) loop
    if exists (
      select 1 from pg_trigger t
        join pg_class c on c.oid = t.tgrelid
        join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relname = v_pairs[i][1] and t.tgname = v_pairs[i][2]
    ) then
      execute format('alter table public.%I disable trigger %I', v_pairs[i][1], v_pairs[i][2]);
    end if;
  end loop;

  delete from public.thanks;
  delete from public.role_confirmations;
  delete from public.network_bookings;
  delete from public.network_offers;
  delete from public.user_skills;

  for i in 1 .. array_length(v_pairs, 1) loop
    if exists (
      select 1 from pg_trigger t
        join pg_class c on c.oid = t.tgrelid
        join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relname = v_pairs[i][1] and t.tgname = v_pairs[i][2]
    ) then
      execute format('alter table public.%I enable trigger %I', v_pairs[i][1], v_pairs[i][2]);
    end if;
  end loop;
end $$;
-- Следы прежних оплат брони в журнале XP оставляем: журнал — история, а не состояние.

-- ── 1) ВКЛАД ВИДЕН СРАЗУ ─────────────────────────────────────────────────────
-- Публичная ветка чтения требовала state='trusted' + eligible. Теперь публичность
-- вклада — решение автора, а не награда за лестницу. Приостановленный модерацией
-- навык по-прежнему скрыт полностью.
create or replace function public.bos_skill_link_allowed(
  p_skill uuid,
  p_owner uuid,
  p_skill_key text,
  p_require_trusted boolean
) returns boolean
language sql security definer stable set search_path = public as $$
  select auth.uid() is not null and exists (
    select 1 from public.user_skills s
     where s.id = p_skill and s.owner_id = p_owner and s.skill_key = p_skill_key
       and s.state <> 'suspended'
       and (
         coalesce(p_require_trusted, false)          -- публичная витрина: открыта всем
         or public.bos_shares_circle(p_owner, auth.uid())  -- круговая: только своим
       )
  );
$$;
revoke all on function public.bos_skill_link_allowed(uuid, uuid, text, boolean) from public;
grant execute on function public.bos_skill_link_allowed(uuid, uuid, text, boolean) to authenticated;

-- Состояние навыка больше не демотирует опубликованный вклад: 'claimed' — это
-- нормальное состояние живого вклада, а не «недоделанный». Прячет только
-- модерационное 'suspended'.
create or replace function public.bos_pause_offers_after_skill_state()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.state = 'suspended' then
    update public.network_offers
       set active = false
     where kind = 'skill_offer' and skill_id = new.id;
  end if;
  return new;
end $$;

-- Подтверждения роли больше не двигают статус вклада (David: «утверждает не
-- круг, утверждают другие люди»). Таблица остаётся — на неё смотрит история,
-- но на видимость вклада она не влияет.
create or replace function public.bos_recompute_offer_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

-- ── 2) ГРАНИЦЫ ВКЛАДА: ЦЕНА, ЛИМИТ ДВА, ПУБЛИКАЦИЯ СРАЗУ ─────────────────────
-- Переписан только skill_offer-рукав сторожа. circle_support-рукав живёт своей
-- прежней жизнью, поэтому вызываем прежнюю функцию как есть для чужого вида.
create or replace function public.bos_contribution_price_ok(p_price int)
returns boolean language sql immutable set search_path = public as $$
  select p_price is not null and p_price between 0 and 1000 and p_price % 10 = 0;
$$;
revoke all on function public.bos_contribution_price_ok(int) from public;

create or replace function public.bos_guard_help_offer()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_skill public.user_skills%rowtype;
  v_cat   public.skill_catalog%rowtype;
  v_other int;
  v_bookings int;
begin
  if new.owner_id is null then raise exception 'help_offer_owner_required'; end if;

  if new.kind = 'circle_support' then
    -- Прежние правила круговой помощи не меняем.
    if coalesce(btrim(new.title), '') = '' then raise exception 'help_offer_title_required'; end if;
    if new.price_xp <> 0 or new.min_level <> 1 then raise exception 'help_offer_boundaries_invalid'; end if;
    if tg_op = 'INSERT' and exists (
      select 1 from public.network_offers o
       where o.owner_id = new.owner_id and o.id <> new.id and o.active
         and o.kind = 'circle_support'
         and o.title = new.title and coalesce(o.descr, '') = coalesce(new.descr, '')
    ) then raise exception 'help_offer_duplicate_role'; end if;
    return new;
  end if;

  if new.kind <> 'skill_offer' then raise exception 'network_offer_kind_invalid'; end if;

  -- Навык принадлежит автору и живёт в утверждённом каталоге.
  if new.skill_id is null or new.skill_key is null then raise exception 'skill_offer_skill_required'; end if;
  select * into v_skill from public.user_skills where id = new.skill_id;
  if not found or v_skill.owner_id <> new.owner_id or v_skill.skill_key <> new.skill_key then
    raise exception 'skill_offer_owner_or_key_mismatch';
  end if;
  select * into v_cat from public.skill_catalog where skill_key = new.skill_key and active;
  if not found then raise exception 'skill_offer_skill_not_allowed'; end if;

  -- Формат/результат/место — из закрытых словарей, текст карточки собирает сервер.
  if not public.bos_skill_interaction_allowed(new.interaction_key)
     or not public.bos_skill_outcome_allowed(new.outcome_key)
     or not public.bos_skill_mode_allowed(new.mode) then
    raise exception 'skill_offer_keys_invalid';
  end if;
  if new.title is distinct from public.bos_skill_offer_title(v_cat.label, new.interaction_key, new.outcome_key)
     or new.emoji is distinct from v_cat.emoji
     or new.descr is distinct from public.bos_skill_offer_descr(new.outcome_key) then
    raise exception 'skill_offer_presentation_is_server_owned';
  end if;

  -- Границы: длительность, места в неделю, ЦЕНА (новое) и уровень входа.
  if coalesce(new.when_text, '') !~ '^(30|45|60) мин$'
     or new.slots_week not between 1 and 5
     or not public.bos_contribution_price_ok(new.price_xp)
     or new.min_level <> 1 then
    raise exception 'skill_offer_boundaries_invalid';
  end if;

  -- Публикация сразу: черновиков и «сначала своим» больше нет.
  if new.visibility <> 'all' or new.status <> 'confirmed' then
    raise exception 'skill_offer_must_be_public';
  end if;

  if tg_op = 'UPDATE' then
    if old.kind <> 'skill_offer'
       or new.owner_id <> old.owner_id
       or new.skill_id <> old.skill_id
       or new.skill_key <> old.skill_key then
      raise exception 'skill_offer_identity_is_immutable';
    end if;
    -- Смысл вклада нельзя переписать задним числом, если по нему уже были дела.
    select count(*)::int into v_bookings from public.network_bookings where offer_id = old.id;
    if v_bookings > 0 and (
      new.interaction_key <> old.interaction_key
      or new.outcome_key <> old.outcome_key
      or new.mode <> old.mode
    ) then raise exception 'skill_offer_semantics_have_episodes'; end if;
  end if;

  -- НЕ БОЛЬШЕ ДВУХ активных вкладов у человека.
  if new.active then
    select count(*)::int into v_other from public.network_offers o
     where o.owner_id = new.owner_id and o.active and o.kind = 'skill_offer'
       and o.id is distinct from new.id;
    if v_other >= 2 then raise exception 'contribution_limit_two'; end if;
  end if;

  return new;
end $$;

-- ── 3) ВКЛАД ОДНОЙ ДВЕРЬЮ: выбрал → сохранил → он живой ──────────────────────
-- Раньше это было три шага (claim навыка → черновик → публикация после лестницы).
-- Теперь один вызов: заявить навык, собрать карточку, открыть её людям.
create or replace function public.bos_set_contribution(
  p_skill_key   text,
  p_interaction text,
  p_outcome     text,
  p_mode        text,
  p_duration    int,
  p_slots       int,
  p_price_xp    int,
  p_offer       uuid default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_cat   public.skill_catalog%rowtype;
  v_skill public.user_skills%rowtype;
  v_offer public.network_offers%rowtype;
  v_id    uuid;
  v_count int;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  if not public.bos_skill_interaction_allowed(p_interaction)
     or not public.bos_skill_outcome_allowed(p_outcome)
     or not public.bos_skill_mode_allowed(p_mode)
     or coalesce(p_duration, 0) not in (30, 45, 60)
     or coalesce(p_slots, 0) not between 1 and 5
     or not public.bos_contribution_price_ok(p_price_xp) then
    return jsonb_build_object('ok', false, 'err', 'boundaries');
  end if;
  select * into v_cat from public.skill_catalog where skill_key = p_skill_key and active;
  if not found then return jsonb_build_object('ok', false, 'err', 'skill_not_allowed'); end if;

  -- Навык заявляется молча — человек выбирает «чем полезен», а не «оформляет навык».
  select * into v_skill from public.user_skills
   where owner_id = v_uid and skill_key = p_skill_key for update;
  if not found then
    insert into public.user_skills (owner_id, skill_key, state)
    values (v_uid, p_skill_key, 'claimed')
    returning * into v_skill;
  elsif v_skill.state = 'suspended' then
    return jsonb_build_object('ok', false, 'err', 'skill_suspended');
  end if;

  if p_offer is not null then
    select * into v_offer from public.network_offers
     where id = p_offer and owner_id = v_uid and kind = 'skill_offer' for update;
    if not found then return jsonb_build_object('ok', false, 'err', 'offer_not_owned'); end if;
    v_id := v_offer.id;
  else
    select count(*)::int into v_count from public.network_offers
     where owner_id = v_uid and active and kind = 'skill_offer';
    if v_count >= 2 then return jsonb_build_object('ok', false, 'err', 'limit_two'); end if;
  end if;

  if v_id is null then
    insert into public.network_offers (
      owner_id, kind, skill_id, skill_key, interaction_key, outcome_key, mode,
      emoji, title, descr, price_xp, min_level, slots_week, when_text,
      active, status, visibility
    ) values (
      v_uid, 'skill_offer', v_skill.id, v_skill.skill_key, p_interaction, p_outcome, p_mode,
      v_cat.emoji,
      public.bos_skill_offer_title(v_cat.label, p_interaction, p_outcome),
      public.bos_skill_offer_descr(p_outcome),
      p_price_xp, 1, p_slots, p_duration || ' мин',
      true, 'confirmed', 'all'
    ) returning id into v_id;
  else
    update public.network_offers
       set skill_id = v_skill.id,
           skill_key = v_skill.skill_key,
           interaction_key = p_interaction,
           outcome_key = p_outcome,
           mode = p_mode,
           emoji = v_cat.emoji,
           title = public.bos_skill_offer_title(v_cat.label, p_interaction, p_outcome),
           descr = public.bos_skill_offer_descr(p_outcome),
           price_xp = p_price_xp,
           slots_week = p_slots,
           when_text = p_duration || ' мин',
           active = true, status = 'confirmed', visibility = 'all'
     where id = v_id;
  end if;

  return jsonb_build_object('ok', true, 'offer_id', v_id);
exception
  when raise_exception then
    return jsonb_build_object('ok', false, 'err', coalesce(sqlerrm, 'guard'));
end $$;
revoke all on function public.bos_set_contribution(text, text, text, text, int, int, int, uuid) from public;
grant execute on function public.bos_set_contribution(text, text, text, text, int, int, int, uuid) to authenticated;

create or replace function public.bos_drop_contribution(p_offer uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_owner uuid;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  select owner_id into v_owner from public.network_offers where id = p_offer and kind = 'skill_offer';
  if not found or v_owner <> v_uid then return jsonb_build_object('ok', false, 'err', 'offer_not_owned'); end if;
  -- Незакрытые дела не бросаем: снимаем витрину, история остаётся.
  update public.network_offers set active = false where id = p_offer;
  return jsonb_build_object('ok', true, 'offer_id', p_offer);
end $$;
revoke all on function public.bos_drop_contribution(uuid) from public;
grant execute on function public.bos_drop_contribution(uuid) to authenticated;

-- ── 4) ЗАКАЗ: доступ по «вклад активен», а не по лестнице доверия ────────────
create or replace function public.bos_request_skill_offer(
  p_offer uuid,
  p_request_note text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_o   public.network_offers%rowtype;
  v_b   public.network_bookings%rowtype;
  v_week text := to_char(current_date, 'IYYY-"W"IW');
  v_note text := nullif(btrim(coalesce(p_request_note, '')), '');
  v_open boolean := false;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  if v_note is null then return jsonb_build_object('ok', false, 'err', 'request_note'); end if;
  if char_length(v_note) > 240 then return jsonb_build_object('ok', false, 'err', 'note_too_long'); end if;

  select * into v_o from public.network_offers where id = p_offer and kind = 'skill_offer' for update;
  if not found or not v_o.active then return jsonb_build_object('ok', false, 'err', 'not_available'); end if;
  if v_o.owner_id = v_uid then return jsonb_build_object('ok', false, 'err', 'self'); end if;
  if public.bos_users_network_blocked(v_o.owner_id, v_uid) then
    return jsonb_build_object('ok', false, 'err', 'blocked');
  end if;
  v_open := exists (
    select 1 from public.user_skills s
     where s.id = v_o.skill_id and s.owner_id = v_o.owner_id and s.state <> 'suspended'
  ) and (
    (v_o.status = 'confirmed' and v_o.visibility = 'all')
    or public.bos_shares_circle(v_o.owner_id, v_uid)
  );
  if not v_open then return jsonb_build_object('ok', false, 'err', 'private'); end if;

  select * into v_b from public.network_bookings
   where offer_id = p_offer and booker_id = v_uid and week = v_week for update;
  if found then
    if v_b.lifecycle in ('requested', 'accepted', 'done') then
      return jsonb_build_object('ok', true, 'dup', true, 'booking_id', v_b.id, 'lifecycle', v_b.lifecycle);
    end if;
    update public.network_bookings
       set lifecycle = 'requested', request_note = v_note, kind = 'skill_episode',
           provider_done_at = null, recipient_done_at = null,
           price_xp = v_o.price_xp, skill_id = v_o.skill_id
     where id = v_b.id returning * into v_b;
  else
    begin
      insert into public.network_bookings (
        offer_id, owner_id, booker_id, week, price_xp, kind, lifecycle, request_note, skill_id
      ) values (
        p_offer, v_o.owner_id, v_uid, v_week, v_o.price_xp, 'skill_episode', 'requested', v_note, v_o.skill_id
      ) returning * into v_b;
    exception when unique_violation then
      select * into v_b from public.network_bookings
       where offer_id = p_offer and booker_id = v_uid and week = v_week;
      return jsonb_build_object('ok', true, 'dup', true, 'booking_id', v_b.id, 'lifecycle', v_b.lifecycle);
    end;
  end if;
  return jsonb_build_object('ok', true, 'booking_id', v_b.id, 'lifecycle', v_b.lifecycle, 'price_xp', v_o.price_xp);
end $$;
revoke all on function public.bos_request_skill_offer(uuid, text) from public;
grant execute on function public.bos_request_skill_offer(uuid, text) to authenticated;

create or replace function public.bos_skill_episode_action(p_episode uuid, p_action text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_b public.network_bookings%rowtype;
  v_o public.network_offers%rowtype;
  v_offer_id uuid;
  v_taken int := 0;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  if p_action is null or p_action not in ('accept', 'decline', 'cancel') then
    return jsonb_build_object('ok', false, 'err', 'action');
  end if;
  select offer_id into v_offer_id from public.network_bookings where id = p_episode;
  if not found then return jsonb_build_object('ok', false, 'err', 'gone'); end if;
  select * into v_o from public.network_offers where id = v_offer_id and kind = 'skill_offer' for update;
  if not found then return jsonb_build_object('ok', false, 'err', 'offer_gone'); end if;
  select * into v_b from public.network_bookings where id = p_episode for update;
  if not found or v_b.offer_id <> v_offer_id then return jsonb_build_object('ok', false, 'err', 'gone'); end if;

  if p_action = 'accept' then
    if v_uid <> v_b.owner_id then return jsonb_build_object('ok', false, 'err', 'provider_only'); end if;
    if v_b.lifecycle = 'accepted' then return jsonb_build_object('ok', true, 'dup', true, 'lifecycle', 'accepted'); end if;
    if v_b.lifecycle <> 'requested' then return jsonb_build_object('ok', false, 'err', 'state'); end if;
    if public.bos_users_network_blocked(v_b.owner_id, v_b.booker_id) then
      return jsonb_build_object('ok', false, 'err', 'blocked');
    end if;
    -- Жёсткий лимит мест в неделю: занятые места считаем по принятым и состоявшимся.
    select count(*)::int into v_taken from public.network_bookings
     where offer_id = v_b.offer_id and week = v_b.week
       and lifecycle in ('accepted', 'done') and id <> v_b.id;
    if v_taken >= v_o.slots_week then return jsonb_build_object('ok', false, 'err', 'full'); end if;
    update public.network_bookings set lifecycle = 'accepted' where id = v_b.id returning * into v_b;

  elsif p_action = 'decline' then
    if v_uid <> v_b.owner_id then return jsonb_build_object('ok', false, 'err', 'provider_only'); end if;
    if v_b.lifecycle = 'declined' then return jsonb_build_object('ok', true, 'dup', true, 'lifecycle', 'declined'); end if;
    if v_b.lifecycle <> 'requested' then return jsonb_build_object('ok', false, 'err', 'state'); end if;
    update public.network_bookings set lifecycle = 'declined' where id = v_b.id returning * into v_b;

  else
    if v_uid <> v_b.owner_id and v_uid <> v_b.booker_id then
      return jsonb_build_object('ok', false, 'err', 'participant_only');
    end if;
    if v_b.lifecycle = 'cancelled' then return jsonb_build_object('ok', true, 'dup', true, 'lifecycle', 'cancelled'); end if;
    if v_b.lifecycle not in ('requested', 'accepted') then return jsonb_build_object('ok', false, 'err', 'state'); end if;
    update public.network_bookings set lifecycle = 'cancelled' where id = v_b.id returning * into v_b;
  end if;

  return jsonb_build_object('ok', true, 'booking_id', v_b.id, 'lifecycle', v_b.lifecycle);
end $$;
revoke all on function public.bos_skill_episode_action(uuid, text) from public;
grant execute on function public.bos_skill_episode_action(uuid, text) to authenticated;

-- ── 5) СОСТОЯЛОСЬ = ПЛАТА. Платим за дело, а не за обещание ──────────────────
-- Заказчик подтверждает «состоялось» → в этот момент списываются XP (тот же
-- журнал, что у партнёров, ref = идемпотентность). Не хватило XP — дело не
-- закрывается, а честно возвращает 'insufficient'. Возвратов не бывает: пока
-- дела нет, никто ничего не платил.
drop function if exists public.bos_skill_mark_done(uuid, text);
create or replace function public.bos_skill_mark_done(p_episode uuid, p_role text, p_earned int default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_b public.network_bookings%rowtype;
  v_o public.network_offers%rowtype;
  v_offer_id uuid;
  v_charged int := 0;
  v_spent int;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  if p_role is null or p_role not in ('provider', 'recipient') then return jsonb_build_object('ok', false, 'err', 'role'); end if;

  select offer_id into v_offer_id from public.network_bookings where id = p_episode;
  if not found then return jsonb_build_object('ok', false, 'err', 'gone'); end if;
  select * into v_o from public.network_offers where id = v_offer_id for update;
  if not found then return jsonb_build_object('ok', false, 'err', 'offer_gone'); end if;
  select * into v_b from public.network_bookings where id = p_episode for update;
  if not found or v_b.offer_id <> v_offer_id then return jsonb_build_object('ok', false, 'err', 'gone'); end if;
  if v_b.lifecycle not in ('accepted', 'done') then return jsonb_build_object('ok', false, 'err', 'state'); end if;
  if v_uid <> v_b.owner_id and v_uid <> v_b.booker_id then
    return jsonb_build_object('ok', false, 'err', 'participant_only');
  end if;
  if public.bos_users_network_blocked(v_b.owner_id, v_b.booker_id) then
    return jsonb_build_object('ok', false, 'err', 'blocked');
  end if;

  if p_role = 'provider' then
    if v_uid <> v_b.owner_id then return jsonb_build_object('ok', false, 'err', 'provider_only'); end if;
    if v_b.provider_done_at is null then
      update public.network_bookings set provider_done_at = now() where id = v_b.id returning * into v_b;
    end if;
  else
    if v_uid <> v_b.booker_id then return jsonb_build_object('ok', false, 'err', 'recipient_only'); end if;
    -- ПОРЯДОК ВАЖЕН: заказчик подтверждает ПОСЛЕ исполнителя, и никак иначе.
    -- Иначе получалось худшее из возможного: человек нажимал «Состоялось», XP
    -- уходили, а дело оставалось незакрытым — плата ушла, подтверждения нет,
    -- впечатление оставить нельзя, вернуть нельзя. Теперь заказчик платит ровно
    -- в тот момент, когда его подтверждение ЗАКРЫВАЕТ дело, и ни секундой раньше.
    if v_b.provider_done_at is null then
      return jsonb_build_object('ok', false, 'err', 'wait_provider');
    end if;
    -- Плата берётся ровно один раз. Заработанное XP живёт на клиенте, поэтому
    -- порог «хватает ли» держит экран заказа; сервер отвечает лишь за то, чтобы
    -- списание случилось однажды.
    if coalesce(v_b.price_xp, 0) > 0 then
      -- Заработанное XP всё ещё считается на устройстве, поэтому сервер берёт его
      -- как заявку клиента — но уже НЕ пускает копилку в минус: раньше подтверждение
      -- списывало цену вслепую и баланс уползал ниже нуля.
      if p_earned is not null then
        select coalesce(-sum(amount), 0) into v_spent from public.xp_ledger
         where user_id = v_uid and amount < 0;
        if (p_earned - v_spent - v_b.price_xp) < 0 then
          return jsonb_build_object('ok', false, 'err', 'insufficient');
        end if;
      end if;
      begin
        insert into public.xp_ledger (user_id, kind, amount, ref, meta)
        values (v_uid, 'spend_network', -v_b.price_xp, 'netep:' || v_b.id::text,
                jsonb_build_object('episode', v_b.id, 'offer', v_b.offer_id, 'to', v_b.owner_id));
        v_charged := v_b.price_xp;
      exception when unique_violation then v_charged := 0;   -- повтор той же оплаты — уже сделано
      end;
    end if;
    if v_b.recipient_done_at is null then
      update public.network_bookings set recipient_done_at = now() where id = v_b.id returning * into v_b;
    end if;
  end if;

  if v_b.provider_done_at is not null and v_b.recipient_done_at is not null and v_b.lifecycle <> 'done' then
    update public.network_bookings set lifecycle = 'done' where id = v_b.id returning * into v_b;
  end if;

  if v_b.skill_id is not null then perform public.bos_refresh_user_skill(v_b.skill_id); end if;
  return jsonb_build_object(
    'ok', true, 'booking_id', v_b.id, 'lifecycle', v_b.lifecycle,
    'provider_done', v_b.provider_done_at is not null,
    'recipient_done', v_b.recipient_done_at is not null,
    'charged_xp', v_charged                       -- >0 ровно один раз, за реальное списание
  );
end $$;
revoke all on function public.bos_skill_mark_done(uuid, text, int) from public;
grant execute on function public.bos_skill_mark_done(uuid, text, int) to authenticated;

-- ── 6) ВПЕЧАТЛЕНИЕ — единственная форма подтверждения ────────────────────────
-- Не отзыв и не звёзды: одна живая фраза «что изменилось». Оставляет только тот,
-- у кого дело реально состоялось.
create or replace function public.bos_leave_impression(p_episode uuid, p_note text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_b public.network_bookings%rowtype;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  if v_note is null then return jsonb_build_object('ok', false, 'err', 'empty'); end if;
  v_note := left(v_note, 140);
  select * into v_b from public.network_bookings where id = p_episode;
  if not found then return jsonb_build_object('ok', false, 'err', 'gone'); end if;
  if v_b.booker_id <> v_uid then return jsonb_build_object('ok', false, 'err', 'recipient_only'); end if;
  if v_b.lifecycle <> 'done' then return jsonb_build_object('ok', false, 'err', 'not_done'); end if;

  insert into public.thanks (offer_id, from_id, to_id, week, note)
  values (v_b.offer_id, v_uid, v_b.owner_id, v_b.week, v_note)
  on conflict (offer_id, from_id, week) do update set note = excluded.note;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.bos_leave_impression(uuid, text) from public;
grant execute on function public.bos_leave_impression(uuid, text) to authenticated;

-- ── 7) ЧТЕНИЕ ВИТРИНЫ ────────────────────────────────────────────────────────
-- Один вызов собирает всё, что нужно списку людей: кто, чем полезен, сколько раз
-- этим воспользовались и сколько впечатлений оставили. Сырые строки «спасибо»
-- по-прежнему читают только участники — наружу уходит безопасная выжимка.
create or replace function public.bos_people_contributions(p_limit int default 60)
returns jsonb language plpgsql security definer stable set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_out jsonb;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  select coalesce(jsonb_agg(x order by rank desc, nm), '[]'::jsonb) into v_out
  from (
    select
    (select count(*)::int from public.network_bookings b
      where b.owner_id = p.id and b.lifecycle = 'done' and b.kind = 'skill_episode') as rank,
    coalesce(nullif(split_part(btrim(coalesce(p.username, '')), ' ', 1), ''), 'Участник') as nm,
    jsonb_build_object(
      'user_id', p.id,
      'name', coalesce(nullif(split_part(btrim(coalesce(p.username, '')), ' ', 1), ''), 'Участник'),
      'avatar', coalesce(p.avatar, 'default'),
      'level', coalesce((p.pub_orbit->>'level')::int, 0),
      -- Считаем ровно то, что человек видит на этой вкладке: состоявшиеся эпизоды
      -- вклада. Раньше сюда попадали и старые круговые брони, и счётчик врал.
      'done_count', (
        select count(*)::int from public.network_bookings b
         where b.owner_id = p.id and b.lifecycle = 'done' and b.kind = 'skill_episode'
      ),
      'people_count', (
        select count(distinct b.booker_id)::int from public.network_bookings b
         where b.owner_id = p.id and b.lifecycle = 'done' and b.kind = 'skill_episode'
      ),
      -- Тот же счёт, что и в карточке человека: впечатление считается, только если за
      -- ним стоит состоявшееся дело. Иначе на списке было одно число, а в профиле другое.
      'impressions_count', (
        select count(*)::int from public.thanks t
         where t.to_id = p.id and coalesce(btrim(t.note), '') <> ''
           and exists (
             select 1 from public.network_bookings b
              where b.offer_id = t.offer_id and b.booker_id = t.from_id
                and b.week = t.week and b.lifecycle = 'done'
           )
      ),
      'offers', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', o.id, 'skill_key', o.skill_key, 'title', o.title, 'descr', o.descr,
          'price_xp', o.price_xp, 'when_text', o.when_text, 'mode', o.mode,
          'slots_week', o.slots_week, 'interaction_key', o.interaction_key,
          'outcome_key', o.outcome_key,
          'free_slots', greatest(0, o.slots_week - (
            select count(*)::int from public.network_bookings b
             where b.offer_id = o.id and b.week = to_char(current_date, 'IYYY-"W"IW')
               and b.lifecycle in ('accepted', 'done')
          )),
            'done_count', (select count(*)::int from public.network_bookings b
                          where b.offer_id = o.id and b.lifecycle = 'done')
        ) order by o.created_at), '[]'::jsonb)
        from public.network_offers o
        where o.owner_id = p.id and o.kind = 'skill_offer' and o.active
          and o.status = 'confirmed' and o.visibility = 'all'
      )
    ) as x
    from public.profiles p
    where p.id <> v_uid
      and not public.bos_users_network_blocked(p.id, v_uid)
      and exists (
        select 1 from public.network_offers o
         where o.owner_id = p.id and o.kind = 'skill_offer' and o.active
           and o.status = 'confirmed' and o.visibility = 'all'
      )
    limit greatest(1, least(coalesce(p_limit, 60), 200))
  ) s;
  return jsonb_build_object('ok', true, 'people', v_out);
end $$;
revoke all on function public.bos_people_contributions(int) from public;
grant execute on function public.bos_people_contributions(int) to authenticated;

create or replace function public.bos_person_impressions(p_user uuid, p_limit int default 20)
returns jsonb language plpgsql security definer stable set search_path = public as $$
declare v_uid uuid := auth.uid(); v_out jsonb;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  if p_user is null then return jsonb_build_object('ok', false, 'err', 'user'); end if;
  if public.bos_users_network_blocked(p_user, v_uid) then
    return jsonb_build_object('ok', true, 'impressions', '[]'::jsonb);
  end if;
  select coalesce(jsonb_agg(x order by ts desc), '[]'::jsonb) into v_out from (
    select t.created_at as ts, jsonb_build_object(
      'id', t.id,
      'note', t.note,
      'created_at', t.created_at,
      'offer_title', o.title,
      'from_name', coalesce(nullif(split_part(btrim(coalesce(f.username, '')), ' ', 1), ''), 'Участник'),
      'from_avatar', coalesce(f.avatar, 'default')
    ) as x
    from public.thanks t
    join public.profiles f on f.id = t.from_id
    left join public.network_offers o on o.id = t.offer_id
    where t.to_id = p_user
      and coalesce(btrim(t.note), '') <> ''
      and not public.bos_users_network_blocked(t.from_id, v_uid)
      and exists (
        select 1 from public.network_bookings b
         where b.offer_id = t.offer_id and b.booker_id = t.from_id
           and b.week = t.week and b.lifecycle = 'done'
      )
    order by t.created_at desc
    limit greatest(1, least(coalesce(p_limit, 20), 50))
  ) s;
  return jsonb_build_object('ok', true, 'impressions', v_out);
end $$;
revoke all on function public.bos_person_impressions(uuid, int) from public;
grant execute on function public.bos_person_impressions(uuid, int) to authenticated;

-- Свой вклад: те же честные счётчики, но по своим строкам.
create or replace function public.bos_my_contributions()
returns jsonb language plpgsql security definer stable set search_path = public as $$
declare v_uid uuid := auth.uid(); v_out jsonb;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', o.id, 'skill_key', o.skill_key, 'title', o.title, 'descr', o.descr,
    'price_xp', o.price_xp, 'when_text', o.when_text, 'mode', o.mode,
    'slots_week', o.slots_week, 'interaction_key', o.interaction_key, 'outcome_key', o.outcome_key,
    'active', o.active,
    'done_count', (select count(*)::int from public.network_bookings b
                    where b.offer_id = o.id and b.lifecycle = 'done'),
    'people_count', (select count(distinct b.booker_id)::int from public.network_bookings b
                    where b.offer_id = o.id and b.lifecycle = 'done'),
    'waiting_count', (select count(*)::int from public.network_bookings b
                    where b.offer_id = o.id and b.lifecycle = 'requested'),
    'impressions_count', (select count(*)::int from public.thanks t
                    where t.offer_id = o.id and coalesce(btrim(t.note), '') <> '')
  ) order by o.created_at), '[]'::jsonb) into v_out
  from public.network_offers o
  where o.owner_id = v_uid and o.kind = 'skill_offer' and o.active;
  return jsonb_build_object('ok', true, 'contributions', v_out);
end $$;
revoke all on function public.bos_my_contributions() from public;
grant execute on function public.bos_my_contributions() to authenticated;

-- ── 8) ПАРТНЁРЫ: заявка → три поручительства от уровня ≥10 → публикация ──────
create table if not exists public.partner_places (
  id          uuid primary key default gen_random_uuid(),
  proposer_id uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  what        text not null,                 -- что человек получает
  about       text,                          -- пара предложений
  address     text not null,
  cost_xp     int  not null default 0,
  emblem      text,                          -- эмодзи места
  status      text not null default 'pending',  -- 'pending' | 'published' | 'rejected'
  created_at  timestamptz not null default now(),
  constraint partner_places_status_check check (status in ('pending', 'published', 'rejected')),
  constraint partner_places_cost_check   check (cost_xp between 0 and 2000 and cost_xp % 10 = 0),
  constraint partner_places_name_check   check (char_length(btrim(name)) between 2 and 60),
  constraint partner_places_what_check   check (char_length(btrim(what)) between 4 and 120),
  constraint partner_places_about_check  check (char_length(coalesce(about, '')) <= 400),
  constraint partner_places_addr_check   check (char_length(btrim(address)) between 4 and 160)
);
create index if not exists partner_places_status_idx on public.partner_places (status, created_at desc);

create table if not exists public.partner_vouches (
  place_id   uuid not null references public.partner_places(id) on delete cascade,
  voucher_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (place_id, voucher_id)
);

alter table public.partner_places  enable row level security;
alter table public.partner_vouches enable row level security;
revoke insert, update, delete on public.partner_places  from authenticated;
revoke insert, update, delete on public.partner_vouches from authenticated;
grant select on public.partner_places  to authenticated;
grant select on public.partner_vouches to authenticated;

-- Опубликованное видят все; свою заявку — автор; заявки на проверке — уровень ≥10.
create or replace function public.bos_viewer_level()
returns int language sql security definer stable set search_path = public as $$
  select coalesce((select (p.pub_orbit->>'level')::int from public.profiles p where p.id = auth.uid()), 0);
$$;
revoke all on function public.bos_viewer_level() from public;
grant execute on function public.bos_viewer_level() to authenticated;

drop policy if exists partner_places_read on public.partner_places;
create policy partner_places_read on public.partner_places for select to authenticated using (
  status = 'published' or proposer_id = auth.uid() or public.bos_viewer_level() >= 10
);
drop policy if exists partner_vouches_read on public.partner_vouches;
create policy partner_vouches_read on public.partner_vouches for select to authenticated using (
  voucher_id = auth.uid()
  or exists (select 1 from public.partner_places pl where pl.id = place_id and pl.proposer_id = auth.uid())
);

create or replace function public.bos_propose_partner(p_place jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_open int;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  if p_place is null or jsonb_typeof(p_place) <> 'object' then
    return jsonb_build_object('ok', false, 'err', 'payload');
  end if;
  select count(*)::int into v_open from public.partner_places
   where proposer_id = v_uid and status = 'pending';
  if v_open >= 3 then return jsonb_build_object('ok', false, 'err', 'too_many_pending'); end if;
  begin
    insert into public.partner_places (proposer_id, name, what, about, address, cost_xp, emblem)
    values (
      v_uid,
      btrim(coalesce(p_place->>'name', '')),
      btrim(coalesce(p_place->>'what', '')),
      nullif(btrim(coalesce(p_place->>'about', '')), ''),
      btrim(coalesce(p_place->>'address', '')),
      coalesce(nullif(p_place->>'cost_xp', '')::int, 0),
      left(coalesce(nullif(btrim(coalesce(p_place->>'emblem', '')), ''), '🎁'), 4)
    ) returning id into v_id;
  exception when check_violation or invalid_text_representation then
    return jsonb_build_object('ok', false, 'err', 'fields');
  end;
  return jsonb_build_object('ok', true, 'place_id', v_id);
end $$;
revoke all on function public.bos_propose_partner(jsonb) from public;
grant execute on function public.bos_propose_partner(jsonb) to authenticated;

-- Поручительство: «я там был, всё так». Только с уровня 10, не за свою заявку,
-- один голос на человека. Третий голос публикует место.
create or replace function public.bos_vouch_partner(p_place uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_p public.partner_places%rowtype;
  v_n int;
  v_age interval;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  if public.bos_viewer_level() < 10 then return jsonb_build_object('ok', false, 'err', 'level'); end if;
  -- Возраст аккаунта — единственная величина здесь, которую нельзя себе нарисовать:
  -- уровень приходит из витрины, которую пишет сам телефон, а created_at ставит база.
  -- Три свежих аккаунта, заведённых за вечер, места больше не публикуют.
  select now() - created_at into v_age from public.profiles where id = v_uid;
  if v_age is null or v_age < interval '14 days' then
    return jsonb_build_object('ok', false, 'err', 'too_new');
  end if;
  select * into v_p from public.partner_places where id = p_place for update;
  if not found then return jsonb_build_object('ok', false, 'err', 'gone'); end if;
  if v_p.proposer_id = v_uid then return jsonb_build_object('ok', false, 'err', 'self'); end if;
  -- Поручитель из одного круга с заявителем — это не независимый голос, а тот же
  -- голос вторым аккаунтом. «Трое независимых» должно значить именно независимых.
  if public.bos_shares_circle(v_p.proposer_id, v_uid) then
    return jsonb_build_object('ok', false, 'err', 'same_circle');
  end if;
  if v_p.status <> 'pending' then return jsonb_build_object('ok', true, 'dup', true, 'status', v_p.status); end if;
  insert into public.partner_vouches (place_id, voucher_id) values (p_place, v_uid)
    on conflict do nothing;
  select count(*)::int into v_n from public.partner_vouches where place_id = p_place;
  if v_n >= 3 then
    update public.partner_places set status = 'published' where id = p_place;
    return jsonb_build_object('ok', true, 'vouches', v_n, 'status', 'published');
  end if;
  return jsonb_build_object('ok', true, 'vouches', v_n, 'status', 'pending');
end $$;
revoke all on function public.bos_vouch_partner(uuid) from public;
grant execute on function public.bos_vouch_partner(uuid) to authenticated;

-- Голос можно ЗАБРАТЬ, пока место ещё на проверке: подтверждение без права передумать —
-- это не подтверждение, а ловушка. Опубликованное место голосом уже не двигают.
create or replace function public.bos_unvouch_partner(p_place uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_status text;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  select status into v_status from public.partner_places where id = p_place for update;
  if not found then return jsonb_build_object('ok', false, 'err', 'gone'); end if;
  if v_status <> 'pending' then return jsonb_build_object('ok', false, 'err', 'published'); end if;
  delete from public.partner_vouches where place_id = p_place and voucher_id = v_uid;
  return jsonb_build_object('ok', true,
    'vouches', (select count(*)::int from public.partner_vouches where place_id = p_place));
end $$;
revoke all on function public.bos_unvouch_partner(uuid) from public;
grant execute on function public.bos_unvouch_partner(uuid) to authenticated;

-- Автор отзывает свою заявку или снимает уже опубликованное место. Без этого
-- заявка висела «0 из 3» вечно, а опубликованный адрес нельзя было убрать вообще.
create or replace function public.bos_withdraw_partner(p_place uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_owner uuid;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  select proposer_id into v_owner from public.partner_places where id = p_place for update;
  if not found then return jsonb_build_object('ok', false, 'err', 'gone'); end if;
  if v_owner <> v_uid then return jsonb_build_object('ok', false, 'err', 'not_owner'); end if;
  delete from public.partner_places where id = p_place;   -- вместе с голосами (cascade)
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.bos_withdraw_partner(uuid) from public;
grant execute on function public.bos_withdraw_partner(uuid) to authenticated;

-- Витрина партнёров и очередь проверки одним вызовом: клиент не собирает
-- счётчики по одной строке и не гадает, чей голос уже стоит.
create or replace function public.bos_partner_places(p_scope text default 'published')
returns jsonb language plpgsql security definer stable set search_path = public as $$
declare v_uid uuid := auth.uid(); v_lvl int; v_out jsonb;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  v_lvl := public.bos_viewer_level();
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', pl.id, 'name', pl.name, 'what', pl.what, 'about', pl.about,
    'address', pl.address, 'cost_xp', pl.cost_xp, 'emblem', pl.emblem,
    'status', pl.status, 'created_at', pl.created_at,
    'mine', pl.proposer_id = v_uid,
    'vouches', (select count(*)::int from public.partner_vouches v where v.place_id = pl.id),
    'vouched_by_me', exists (select 1 from public.partner_vouches v where v.place_id = pl.id and v.voucher_id = v_uid),
    -- Кто именно поручился: голый счётчик «2 из 3» ничего не доказывает, а имя и лицо —
    -- уже чья-то репутация, поставленная на кон.
    'vouchers', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', coalesce(nullif(split_part(btrim(coalesce(f.username, '')), ' ', 1), ''), 'Участник'),
        'avatar', coalesce(f.avatar, 'default')
      )), '[]'::jsonb)
      from public.partner_vouches v join public.profiles f on f.id = v.voucher_id
      where v.place_id = pl.id
    )
  ) order by pl.created_at desc), '[]'::jsonb) into v_out
  from public.partner_places pl
  where case coalesce(p_scope, 'published')
    when 'published' then pl.status = 'published'
    when 'mine'      then pl.proposer_id = v_uid
    when 'pending'   then pl.status = 'pending' and v_lvl >= 10 and pl.proposer_id <> v_uid
    else false end;
  return jsonb_build_object('ok', true, 'places', v_out, 'level', v_lvl);
end $$;
revoke all on function public.bos_partner_places(text) from public;
grant execute on function public.bos_partner_places(text) to authenticated;

notify pgrst, 'reload schema';

commit;

-- ПРОВЕРКИ ПОСЛЕ ПРОГОНА (под разными пользователями):
--  1. Вкладка «Люди» пуста у всех — ни одного вклада, дела, впечатления.
--  2. bos_set_contribution('yoga','practice','clear_next_step','online',30,2,150)
--     → ok; карточка сразу видна ДРУГОМУ пользователю в bos_people_contributions.
--  3. Третий вклад → err='limit_two'.
--  4. Цена 155 → err='boundaries' (шаг 10 XP); цена 1500 → err='boundaries'.
--  5. Заказ → принять → провайдер «состоялось» → заказчик «состоялось»:
--     lifecycle='done', в xp_ledger ровно одна строка ref='netep:<episode>'.
--  6. Повторное «состоялось» второй раз XP не списывает.
--  7. bos_leave_impression до 'done' → err='not_done'; после → впечатление видно
--     всем в bos_person_impressions и НЕ видно сырой строкой в thanks.
--  8. bos_propose_partner → место видно автору и уровню ≥10, не видно остальным.
--  9. bos_vouch_partner с уровня <10 → err='level'; с аккаунта младше 14 дней →
--     err='too_new'; из общего круга с автором → err='same_circle'; три независимых
--     поручителя → status='published' и место появляется у всех.
-- 10. bos_unvouch_partner убирает свой голос, пока место на проверке;
--     bos_withdraw_partner удаляет заявку/место автора вместе с голосами.
-- 11. Подтверждение заказчика ДО отметки помогавшего → err='wait_provider',
--     XP не списаны. Списание не пускает копилку в минус → err='insufficient'.

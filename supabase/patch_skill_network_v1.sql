-- =============================================================================
-- BalanceOS · SKILL NETWORK v1
-- Follow-up к уже применённому patch_help_trust_p0.sql.
--
-- Два разных слоя в одной существующей модели:
--   circle_support — короткая бесплатная помощь своим; поведение P0 сохранено;
--   skill_offer    — публичный оффер доказанного навыка, только после явной публикации.
--
-- ВАЖНО: применять ПОСЛЕ patch_help_trust_p0.sql. Старый P0 нельзя повторно
-- запускать после этого файла: он заменит kind-aware функции своими P0-версиями.
-- Миграция идемпотентна и выполняется одной транзакцией.
-- =============================================================================

begin;

-- На повторном запуске сначала снимаем guard предыдущей версии: ниже есть
-- контролируемая миграция legacy-ключей и серверных presentation-полей. Новый
-- kind-aware guard возвращается в этой же транзакции до commit.
drop trigger if exists trg_guard_help_offer on public.network_offers;

-- 1. СЕРВЕРНЫЙ КАТАЛОГ НАВЫКОВ -----------------------------------------------

create table if not exists public.skill_catalog (
  skill_key     text primary key,
  label         text not null,
  title         text,
  icon_key      text not null,
  emoji         text not null,
  group_key     text,
  group_title   text,
  sort_order    int not null default 0,
  legacy_descr  text unique,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  constraint skill_catalog_key_shape check (skill_key ~ '^[a-z][a-z0-9_]{1,47}$')
);

alter table public.skill_catalog add column if not exists title text;
alter table public.skill_catalog add column if not exists sort_order int not null default 0;
alter table public.skill_catalog add column if not exists group_key text;
alter table public.skill_catalog add column if not exists group_title text;

-- Освобождаем unique legacy_descr перед переносом трёх старых ключей.
update public.skill_catalog set legacy_descr = null
 where skill_key in ('strength_training', 'focus_work', 'design');

insert into public.skill_catalog (
  skill_key, label, title, icon_key, emoji, group_key, group_title,
  sort_order, legacy_descr, active
) values
  ('product_strategy',     'Продуктовая стратегия',        'Продуктовая стратегия',        'Briefcase', '🧭', 'product',    'Продукт и бизнес',       10,  null, true),
  ('customer_research',    'Исследования пользователей',   'Исследования пользователей',   'Briefcase', '🔎', 'product',    'Продукт и бизнес',       20,  null, true),
  ('project_management',   'Управление проектами',         'Управление проектами',         'Briefcase', '🗂️', 'product',    'Продукт и бизнес',       30,  null, true),
  ('entrepreneurship',     'Предпринимательство',          'Предпринимательство',          'Briefcase', '🚀', 'product',    'Продукт и бизнес',       40,  null, true),
  ('sales',                'Продажи',                      'Продажи',                      'Briefcase', '🤝', 'product',    'Продукт и бизнес',       50,  null, true),
  ('service_design',       'Сервис-дизайн',                'Сервис-дизайн',                'Briefcase', '🧩', 'product',    'Продукт и бизнес',       60,  null, true),

  ('product_design',       'Продуктовый дизайн',           'Продуктовый дизайн',           'Pencil',    '📐', 'design',     'Дизайн и творчество',    70,  'Навык · Дизайн', true),
  ('graphic_design',       'Графический дизайн',           'Графический дизайн',           'Pencil',    '🎨', 'design',     'Дизайн и творчество',    80,  null, true),
  ('motion_design',        'Моушн-дизайн',                 'Моушн-дизайн',                 'Pencil',    '🎞️', 'design',     'Дизайн и творчество',    90,  null, true),
  ('photography',          'Фотография',                   'Фотография',                   'Pencil',    '📷', 'design',     'Дизайн и творчество',   100,  null, true),
  ('video',                'Видео',                        'Видео',                        'Pencil',    '🎬', 'design',     'Дизайн и творчество',   110,  null, true),
  ('writing',              'Тексты и редактура',           'Тексты и редактура',           'Pencil',    '✍️', 'design',     'Дизайн и творчество',   120,  null, true),

  ('frontend',             'Frontend-разработка',          'Frontend-разработка',          'Bolt',      '💻', 'technology', 'Технологии и AI',       130,  null, true),
  ('backend',              'Backend-разработка',           'Backend-разработка',           'Bolt',      '⚙️', 'technology', 'Технологии и AI',       140,  null, true),
  ('mobile',               'Мобильная разработка',         'Мобильная разработка',         'Bolt',      '📱', 'technology', 'Технологии и AI',       150,  null, true),
  ('data',                 'Аналитика данных',              'Аналитика данных',              'Bolt',      '📊', 'technology', 'Технологии и AI',       160,  null, true),
  ('ai_automation',        'AI и автоматизация',           'AI и автоматизация',           'Bolt',      '🤖', 'technology', 'Технологии и AI',       170,  null, true),
  ('no_code',              'No-code инструменты',          'No-code инструменты',          'Bolt',      '🧱', 'technology', 'Технологии и AI',       180,  null, true),

  ('marketing',            'Маркетинг',                    'Маркетинг',                    'ChartBar',  '📣', 'growth',     'Рост и коммуникация',   190,  null, true),
  ('content',              'Контент',                      'Контент',                      'ChartBar',  '📝', 'growth',     'Рост и коммуникация',   200,  null, true),
  ('public_speaking',      'Публичные выступления',        'Публичные выступления',        'ChartBar',  '🎤', 'growth',     'Рост и коммуникация',   210,  'Навык · Публичные выступления', true),
  ('negotiation',          'Переговоры',                   'Переговоры',                   'ChartBar',  '🤝', 'growth',     'Рост и коммуникация',   220,  null, true),
  ('career_navigation',    'Карьерная навигация',          'Карьерная навигация',          'ChartBar',  '🧭', 'growth',     'Рост и коммуникация',   230,  null, true),
  ('community_building',   'Развитие сообществ',           'Развитие сообществ',           'ChartBar',  '👥', 'growth',     'Рост и коммуникация',   240,  null, true),

  ('english',              'Английский язык',              'Английский язык',              'Book',      '🇬🇧', 'learning',   'Обучение и языки',      250,  null, true),
  ('language_practice',    'Языковая практика',            'Языковая практика',            'Book',      '🌍', 'learning',   'Обучение и языки',      260,  'Навык · Языковая практика', true),
  ('tutoring',             'Объяснение сложного',          'Объяснение сложного',          'Book',      '💡', 'learning',   'Обучение и языки',      270,  null, true),
  ('learning_design',      'Дизайн обучения',              'Дизайн обучения',              'Book',      '🧠', 'learning',   'Обучение и языки',      280,  null, true),
  ('study_systems',        'Системы обучения',             'Системы обучения',             'Book',      '📚', 'learning',   'Обучение и языки',      290,  null, true),
  ('research',             'Работа с исследованиями',      'Работа с исследованиями',      'Book',      '🔬', 'learning',   'Обучение и языки',      300,  null, true),

  ('running',              'Бег',                          'Бег',                          'Dumbbell',  '🏃', 'practice',   'Тело и практики',       310,  'Навык · Бег', true),
  ('strength',             'Силовые тренировки',           'Силовые тренировки',           'Dumbbell',  '🏋️', 'practice',   'Тело и практики',       320,  'Навык · Силовые тренировки', true),
  ('mobility',             'Мобильность и растяжка',       'Мобильность и растяжка',       'Dumbbell',  '🤸', 'practice',   'Тело и практики',       330,  null, true),
  ('yoga',                 'Йога',                         'Йога',                         'Dumbbell',  '🧘', 'practice',   'Тело и практики',       340,  null, true),
  ('meditation',           'Медитация',                    'Медитация',                    'Dumbbell',  '🌙', 'practice',   'Тело и практики',       350,  'Навык · Медитация', true),
  ('breathwork',           'Дыхательные практики',         'Дыхательные практики',         'Dumbbell',  '🌬️', 'practice',   'Тело и практики',       360,  null, true),

  ('planning',             'Личное планирование',          'Личное планирование',          'Calendar',  '🗓️', 'life',       'Организация жизни',     370,  'Навык · Планирование', true),
  ('focus',                'Фокус и глубокая работа',      'Фокус и глубокая работа',      'Calendar',  '⏱️', 'life',       'Организация жизни',     380,  'Навык · Фокус и работа', true),
  ('facilitation',         'Фасилитация встреч',           'Фасилитация встреч',           'Calendar',  '🧩', 'life',       'Организация жизни',     390,  null, true),
  ('event_making',         'Организация событий',          'Организация событий',          'Calendar',  '🎟️', 'life',       'Организация жизни',     400,  null, true),
  ('travel_orientation',   'Ориентация в новом городе',    'Ориентация в новом городе',    'Calendar',  '🧭', 'life',       'Организация жизни',     410,  null, true),
  ('home_organization',    'Организация пространства',     'Организация пространства',     'Calendar',  '🏠', 'life',       'Организация жизни',     420,  null, true),

  -- Не показываем в каталоге, но сохраняем ключи на время безопасной миграции.
  ('strength_training',    'Силовые тренировки',           'Силовые тренировки',           'Dumbbell',  '🏋️', 'practice',   'Тело и практики',       900, null, false),
  ('focus_work',           'Фокус и работа',               'Фокус и работа',               'Calendar',  '⏱️', 'life',       'Организация жизни',     910, null, false),
  ('design',               'Дизайн',                       'Дизайн',                       'Pencil',    '🎨', 'design',     'Дизайн и творчество',   920, null, false)
on conflict (skill_key) do update set
  label = excluded.label,
  title = excluded.title,
  icon_key = excluded.icon_key,
  emoji = excluded.emoji,
  group_key = excluded.group_key,
  group_title = excluded.group_title,
  sort_order = excluded.sort_order,
  legacy_descr = excluded.legacy_descr,
  active = excluded.active;

alter table public.skill_catalog enable row level security;
drop policy if exists skill_catalog_read on public.skill_catalog;
create policy skill_catalog_read on public.skill_catalog
  for select to authenticated using (active);
revoke insert, update, delete on public.skill_catalog from authenticated;
grant select on public.skill_catalog to authenticated;

-- Стабильные ключи взаимодействия и результата. UI может переводить подписи,
-- но сервер принимает только эти ключи.
create or replace function public.bos_skill_interaction_allowed(p_key text)
returns boolean language sql immutable set search_path = public as $$
  select p_key in ('question', 'review', 'diagnostic', 'plan', 'demo', 'together', 'practice', 'sprint');
$$;

create or replace function public.bos_skill_outcome_allowed(p_key text)
returns boolean language sql immutable set search_path = public as $$
  select p_key in ('clear_next_step', 'three_recommendations', 'working_first_result');
$$;

create or replace function public.bos_skill_mode_allowed(p_key text)
returns boolean language sql immutable set search_path = public as $$
  select p_key in ('online', 'nearby', 'either');
$$;

-- Presentation — только серверная производная от трёх каталогов. Клиент не
-- может превратить карточку навыка в произвольное объявление.
create or replace function public.bos_skill_offer_title(
  p_skill_label text,
  p_interaction text,
  p_outcome text
) returns text language sql immutable set search_path = public as $$
  select case p_outcome
    when 'three_recommendations' then 'Разобрать задачу по «' || p_skill_label || '»'
    when 'working_first_result' then 'Сделать первый шаг в «' || p_skill_label || '»'
    else (case p_interaction
      when 'question' then 'Разобрать конкретный вопрос'
      when 'review' then 'Разобрать работу и дать обратную связь'
      when 'diagnostic' then 'Найти узкое место и следующий шаг'
      when 'plan' then 'Собрать понятный план действий'
      when 'demo' then 'Показать подход на живом примере'
      when 'together' then 'Сделать первый рабочий шаг вместе'
      when 'practice' then 'Провести короткую практику'
      when 'sprint' then 'Запустить короткий спринт и сверить результат'
      else null end) || ' · ' || p_skill_label
  end;
$$;

create or replace function public.bos_skill_offer_descr(p_outcome text)
returns text language sql immutable set search_path = public as $$
  select case p_outcome
    when 'clear_next_step' then 'Человек уйдёт с одним конкретным действием.'
    when 'three_recommendations' then 'Короткая обратная связь без обещания результата.'
    when 'working_first_result' then 'Во встрече появится рабочий черновик или практика.'
    else null end;
$$;

revoke all on function public.bos_skill_interaction_allowed(text) from public;
revoke all on function public.bos_skill_outcome_allowed(text) from public;
revoke all on function public.bos_skill_mode_allowed(text) from public;
revoke all on function public.bos_skill_offer_title(text, text, text) from public;
revoke all on function public.bos_skill_offer_descr(text) from public;

-- 2. НАВЫК ЧЕЛОВЕКА -----------------------------------------------------------

create table if not exists public.user_skills (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references public.profiles(id) on delete cascade,
  skill_key        text not null references public.skill_catalog(skill_key) on delete restrict,
  source_offer_id  uuid references public.network_offers(id) on delete set null,
  state            text not null default 'claimed',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint user_skills_state_check check (state in ('claimed', 'trusted', 'suspended')),
  constraint user_skills_owner_key_unique unique (owner_id, skill_key),
  constraint user_skills_source_unique unique (source_offer_id)
);

alter table public.user_skills drop constraint if exists user_skills_source_offer_id_fkey;
alter table public.user_skills
  add constraint user_skills_source_offer_id_fkey foreign key (source_offer_id)
  references public.network_offers(id) on delete set null;

alter table public.user_skills enable row level security;

-- На upgrade отключаем старые sync-триггеры до завершения alias migration;
-- актуальные версии будут созданы ниже в той же транзакции.
drop trigger if exists trg_skill_source_changed on public.user_skills;
drop trigger if exists trg_skill_state_pause on public.user_skills;
drop trigger if exists trg_sync_skill_source on public.network_offers;

-- 3. РАСШИРЕНИЕ СУЩЕСТВУЮЩИХ OFFERS / BOOKINGS -------------------------------

alter table public.network_offers
  add column if not exists kind text not null default 'circle_support';
alter table public.network_offers
  add column if not exists skill_id uuid;
alter table public.network_offers
  add column if not exists skill_key text;
alter table public.network_offers
  add column if not exists interaction_key text;
alter table public.network_offers
  add column if not exists outcome_key text;
alter table public.network_offers
  add column if not exists mode text;

do $$
begin
  alter table public.network_offers drop constraint if exists network_offers_skill_fk;
  alter table public.network_offers
    add constraint network_offers_skill_fk foreign key (skill_id)
    references public.user_skills(id) on delete cascade;
  if not exists (
    select 1 from pg_constraint
     where conname = 'network_offers_skill_key_fk'
       and conrelid = 'public.network_offers'::regclass
  ) then
    alter table public.network_offers
      add constraint network_offers_skill_key_fk foreign key (skill_key)
      references public.skill_catalog(skill_key) on delete restrict;
  end if;
end $$;

-- Любая историческая строка остаётся помощью кругу. Ничего не публикуется этой
-- миграцией. Старый visibility='all' для support закрываем fail-closed.
update public.network_offers
   set kind = 'circle_support', visibility = 'circles'
 where kind is null
    or kind not in ('circle_support', 'skill_offer')
    or (kind = 'circle_support' and visibility <> 'circles');

-- Структурируем известные skill-support строки без создания user_skill и без
-- автоматического доверия.
update public.network_offers o
   set skill_key = c.skill_key
  from public.skill_catalog c
 where o.kind = 'circle_support'
   and o.title = 'Показать навык на практике'
   and o.descr = c.legacy_descr
   and o.skill_key is null;

update public.network_offers
   set mode = case
     when lower(coalesce(when_text, '')) like '%рядом%' then 'nearby'
     when lower(coalesce(when_text, '')) like '%онлайн%' then 'online'
     else mode
   end
 where kind = 'circle_support' and mode is null
   and (lower(coalesce(when_text, '')) like '%рядом%'
     or lower(coalesce(when_text, '')) like '%онлайн%');

alter table public.network_offers drop constraint if exists network_offers_kind_check;
-- NOT VALID сохраняет применимость поверх исторических P0-строк; PostgreSQL всё
-- равно проверяет эти constraints для каждой новой/изменённой строки.
alter table public.network_offers add constraint network_offers_kind_check
  check (kind in ('circle_support', 'skill_offer')) not valid;
alter table public.network_offers drop constraint if exists network_offers_mode_check;
alter table public.network_offers add constraint network_offers_mode_check
  check (mode is null or mode in ('online', 'nearby', 'either')) not valid;
alter table public.network_offers drop constraint if exists network_offers_skill_shape_check;
alter table public.network_offers add constraint network_offers_skill_shape_check check (
  kind = 'circle_support'
  or (
    kind = 'skill_offer'
    and skill_id is not null
    and skill_key is not null
    and interaction_key is not null
    and outcome_key is not null
    and mode is not null
  )
) not valid;

create unique index if not exists network_skill_offer_semantic_unique
  on public.network_offers (skill_id, interaction_key, outcome_key, mode)
  where kind = 'skill_offer';
create index if not exists network_offer_kind_skill_idx
  on public.network_offers (kind, skill_key, active, status, visibility);

alter table public.network_bookings
  add column if not exists kind text not null default 'circle_support';
alter table public.network_bookings
  add column if not exists lifecycle text not null default 'accepted';
alter table public.network_bookings
  add column if not exists request_note text;
alter table public.network_bookings
  add column if not exists provider_done_at timestamptz;
alter table public.network_bookings
  add column if not exists recipient_done_at timestamptz;
alter table public.network_bookings
  add column if not exists status text not null default 'accepted';
alter table public.network_bookings
  add column if not exists skill_id uuid;

do $$
begin
  alter table public.network_bookings drop constraint if exists network_bookings_skill_fk;
  alter table public.network_bookings
    add constraint network_bookings_skill_fk foreign key (skill_id)
    references public.user_skills(id) on delete set null;
end $$;

-- Старые брони — реальные старые записи, но не доказанные завершённые эпизоды.
update public.network_bookings
   set kind = 'circle_support', lifecycle = 'accepted', status = 'accepted'
 where kind is null or kind not in ('circle_support', 'skill_episode');

update public.network_bookings set status = lifecycle where status is distinct from lifecycle;

alter table public.network_bookings drop constraint if exists network_bookings_kind_check;
alter table public.network_bookings add constraint network_bookings_kind_check
  check (kind in ('circle_support', 'skill_episode')) not valid;
alter table public.network_bookings drop constraint if exists network_bookings_lifecycle_check;
alter table public.network_bookings add constraint network_bookings_lifecycle_check
  check (lifecycle in ('requested', 'accepted', 'declined', 'cancelled', 'done')) not valid;
alter table public.network_bookings drop constraint if exists network_bookings_note_check;
alter table public.network_bookings add constraint network_bookings_note_check
  check (char_length(coalesce(request_note, '')) <= 240) not valid;
alter table public.network_bookings drop constraint if exists network_bookings_done_shape_check;
alter table public.network_bookings add constraint network_bookings_done_shape_check check (
  lifecycle <> 'done' or (provider_done_at is not null and recipient_done_at is not null)
) not valid;
alter table public.network_bookings drop constraint if exists network_bookings_status_sync_check;
alter table public.network_bookings add constraint network_bookings_status_sync_check
  check (status = lifecycle) not valid;

create index if not exists network_booking_lifecycle_idx
  on public.network_bookings (offer_id, week, lifecycle);

-- lifecycle — каноническое поле, status — совместимый read-alias для уже
-- подготовленного cloud-клиента.
create or replace function public.bos_sync_booking_lifecycle_alias()
returns trigger language plpgsql set search_path = public as $$
begin
  new.status := new.lifecycle;
  return new;
end $$;
drop trigger if exists trg_booking_lifecycle_alias on public.network_bookings;
create trigger trg_booking_lifecycle_alias
  before insert or update of lifecycle, status on public.network_bookings
  for each row execute function public.bos_sync_booking_lifecycle_alias();

-- 4. БЛОКИ И ЖАЛОБЫ -----------------------------------------------------------

create table if not exists public.network_blocks (
  blocker_id  uuid not null references public.profiles(id) on delete cascade,
  blocked_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint network_blocks_not_self check (blocker_id <> blocked_id)
);

create table if not exists public.network_reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid not null references public.profiles(id) on delete cascade,
  target_user_id   uuid not null references public.profiles(id) on delete cascade,
  target_offer_id  uuid references public.network_offers(id) on delete set null,
  target_episode_id uuid references public.network_bookings(id) on delete set null,
  reason_key       text not null,
  details          text,
  status           text not null default 'submitted',
  created_at       timestamptz not null default now(),
  constraint network_reports_not_self check (reporter_id <> target_user_id),
  constraint network_reports_reason_check check (reason_key in ('spam', 'unsafe', 'misleading_skill', 'harassment', 'other')),
  constraint network_reports_status_check check (status in ('submitted', 'reviewing', 'actioned', 'dismissed')),
  constraint network_reports_details_check check (char_length(coalesce(details, '')) <= 500)
);

alter table public.network_reports add column if not exists target_episode_id uuid;
alter table public.network_reports drop constraint if exists network_reports_target_episode_id_fkey;
alter table public.network_reports
  add constraint network_reports_target_episode_id_fkey foreign key (target_episode_id)
  references public.network_bookings(id) on delete set null;

create index if not exists network_blocks_reverse_idx
  on public.network_blocks (blocked_id, blocker_id);
create index if not exists network_reports_target_idx
  on public.network_reports (target_user_id, created_at desc);
create index if not exists network_reports_episode_idx
  on public.network_reports (target_episode_id, created_at desc)
  where target_episode_id is not null;

alter table public.network_blocks enable row level security;
alter table public.network_reports enable row level security;

drop policy if exists network_blocks_read_mine on public.network_blocks;
create policy network_blocks_read_mine on public.network_blocks
  for select to authenticated using (blocker_id = auth.uid());

drop policy if exists network_reports_read_mine on public.network_reports;
create policy network_reports_read_mine on public.network_reports
  for select to authenticated using (reporter_id = auth.uid());

revoke insert, update, delete on public.network_blocks from authenticated;
revoke insert, update, delete on public.network_reports from authenticated;
grant select on public.network_blocks to authenticated;
grant select on public.network_reports to authenticated;

-- Приватный helper: используется только SECURITY DEFINER-функциями.
create or replace function public.bos_users_network_blocked(p_a uuid, p_b uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select p_a is not null and p_b is not null and exists (
    select 1 from public.network_blocks b
     where (b.blocker_id = p_a and b.blocked_id = p_b)
        or (b.blocker_id = p_b and b.blocked_id = p_a)
  );
$$;
revoke all on function public.bos_users_network_blocked(uuid, uuid) from public;
revoke execute on function public.bos_users_network_blocked(uuid, uuid) from anon, authenticated;

-- Безопасный helper для RLS: можно проверить только блок между текущим юзером
-- и владельцем видимой строки, но нельзя перебирать чужой граф блокировок.
create or replace function public.bos_network_blocked_with_me(p_other uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select case when auth.uid() is null then true
    else public.bos_users_network_blocked(auth.uid(), p_other) end;
$$;
revoke all on function public.bos_network_blocked_with_me(uuid) from public;
grant execute on function public.bos_network_blocked_with_me(uuid) to authenticated;

-- 4.1 LEGACY ALIASES ----------------------------------------------------------
-- Сохраняем canonical user_skill.id: на него уже могут ссылаться offers/bookings.
-- Если новый canonical key каким-то образом уже занят непустым навыком, не
-- угадываем и не удаляем evidence — останавливаем migration fail-closed.
do $$
declare
  r record;
  v_target text;
  v_existing uuid;
  v_existing_source uuid;
  v_existing_state text;
  v_source uuid;
  v_state text;
begin
  for r in
    select id, owner_id, skill_key, source_offer_id, state
      from public.user_skills
     where skill_key in ('strength_training', 'focus_work', 'design')
     order by id
  loop
    v_target := case r.skill_key
      when 'strength_training' then 'strength'
      when 'focus_work' then 'focus'
      else case when exists (
        select 1 from public.network_offers o
         where o.skill_id = r.id and o.kind = 'skill_offer'
           and lower(coalesce(o.title, '') || ' ' || coalesce(o.descr, ''))
             ~ '(граф|graphic|бренд|визуал)'
      ) then 'graphic_design' else 'product_design' end
    end;

    v_existing := null;
    v_existing_source := null;
    v_existing_state := null;
    select s.id, s.source_offer_id, s.state
      into v_existing, v_existing_source, v_existing_state
      from public.user_skills s
     where s.owner_id = r.owner_id and s.skill_key = v_target and s.id <> r.id
     limit 1;

    if v_existing is not null then
      if exists (select 1 from public.network_offers where skill_id = v_existing) then
        raise exception 'legacy_skill_alias_conflict:%:%', r.owner_id, v_target;
      end if;
      if r.source_offer_id is not null and v_existing_source is not null
         and r.source_offer_id <> v_existing_source then
        raise exception 'legacy_skill_sources_conflict:%:%', r.owner_id, v_target;
      end if;

      v_source := coalesce(r.source_offer_id, v_existing_source);
      v_state := case
        when r.state = 'suspended' or v_existing_state = 'suspended' then 'suspended'
        when r.state = 'trusted' or v_existing_state = 'trusted' then 'trusted'
        else 'claimed' end;
      update public.network_bookings set skill_id = r.id where skill_id = v_existing;
      update public.user_skills set source_offer_id = null where id = v_existing;
      delete from public.user_skills where id = v_existing;
      update public.user_skills
         set skill_key = v_target, source_offer_id = v_source,
             state = v_state, updated_at = now()
       where id = r.id;
    else
      update public.user_skills
         set skill_key = v_target, updated_at = now()
       where id = r.id;
    end if;

    update public.network_offers
       set skill_key = v_target
     where kind = 'skill_offer' and skill_id = r.id;

    -- Legacy «Навык · Дизайн» остаётся валидным support preset даже если редкий
    -- старый текст позволил классифицировать сам skill как graphic_design.
    update public.network_offers
       set skill_key = case when v_target = 'graphic_design' then 'product_design' else v_target end,
           descr = case v_target
             when 'strength' then 'Навык · Силовые тренировки'
             when 'focus' then 'Навык · Фокус и работа'
             when 'graphic_design' then 'Навык · Дизайн'
             when 'product_design' then 'Навык · Дизайн'
             else descr end
     where id = (select source_offer_id from public.user_skills where id = r.id)
       and kind = 'circle_support';
  end loop;

  -- Неclaimed legacy support тоже должен остаться редактируемым старым UI.
  update public.network_offers set skill_key = 'strength'
   where kind = 'circle_support'
     and (skill_key = 'strength_training' or descr = 'Навык · Силовые тренировки');
  update public.network_offers set skill_key = 'focus'
   where kind = 'circle_support'
     and (skill_key = 'focus_work' or descr = 'Навык · Фокус и работа');
  update public.network_offers set skill_key = 'product_design'
   where kind = 'circle_support'
     and (skill_key = 'design' or descr = 'Навык · Дизайн');

  -- Старые v1 keys нормализуются до текущего UI-контракта. Два оффера,
  -- которые схлопнулись бы в один semantic tuple, требуют ручного решения.
  if exists (
    select 1 from (
      select skill_id,
        case interaction_key
          when 'intro' then 'question'
          when 'guided_practice' then 'practice'
          when 'co_practice' then 'together'
          else interaction_key end as i,
        case outcome_key
          when 'first_step' then 'clear_next_step'
          when 'practice' then 'working_first_result'
          when 'feedback' then 'three_recommendations'
          when 'action_plan' then 'clear_next_step'
          else outcome_key end as o,
        mode, count(*)
      from public.network_offers
      where kind = 'skill_offer'
      group by skill_id,
        case interaction_key
          when 'intro' then 'question' when 'guided_practice' then 'practice'
          when 'co_practice' then 'together' else interaction_key end,
        case outcome_key
          when 'first_step' then 'clear_next_step' when 'practice' then 'working_first_result'
          when 'feedback' then 'three_recommendations' when 'action_plan' then 'clear_next_step'
          else outcome_key end,
        mode
      having count(*) > 1
    ) collision
  ) then
    raise exception 'legacy_skill_offer_semantic_collision';
  end if;

  update public.network_offers
     set interaction_key = case interaction_key
           when 'intro' then 'question'
           when 'guided_practice' then 'practice'
           when 'co_practice' then 'together'
           else interaction_key end,
         outcome_key = case outcome_key
           when 'first_step' then 'clear_next_step'
           when 'practice' then 'working_first_result'
           when 'feedback' then 'three_recommendations'
           when 'action_plan' then 'clear_next_step'
           else outcome_key end
   where kind = 'skill_offer';

  if exists (
    select 1 from public.network_offers o
     where o.kind = 'skill_offer'
       and (
         not coalesce(public.bos_skill_interaction_allowed(o.interaction_key), false)
         or not coalesce(public.bos_skill_outcome_allowed(o.outcome_key), false)
         or not coalesce(public.bos_skill_mode_allowed(o.mode), false)
       )
  ) then
    raise exception 'legacy_skill_offer_key_unknown';
  end if;

  update public.network_offers o
     set emoji = c.emoji,
         title = public.bos_skill_offer_title(c.label, o.interaction_key, o.outcome_key),
         descr = public.bos_skill_offer_descr(o.outcome_key)
    from public.skill_catalog c
   where o.kind = 'skill_offer' and o.skill_key = c.skill_key
     and public.bos_skill_interaction_allowed(o.interaction_key)
     and public.bos_skill_outcome_allowed(o.outcome_key);

  update public.network_offers o
     set status = case when (
       select count(*) from public.role_confirmations rc
        where rc.offer_id = o.id
          and not public.bos_users_network_blocked(o.owner_id, rc.confirmer_id)
     ) >= 2 then 'confirmed' else 'draft' end
   where o.kind = 'skill_offer' and o.visibility = 'circles';
end $$;

-- 5. ДОКАЗАТЕЛЬНОСТЬ НАВЫКА ---------------------------------------------------

-- Приватный агрегат. trusted = два разных подтверждающих skill-offer (legacy
-- source confirmations тоже сохраняются) + два взаимно завершённых skill_episode
-- с разными получателями. Заблокированные связи не
-- участвуют в доказательстве, но исходные строки не удаляются.
create or replace function public.bos_skill_evidence_raw(p_skill uuid)
returns jsonb language plpgsql security definer stable set search_path = public as $$
declare
  v_s public.user_skills%rowtype;
  v_roles int := 0;
  v_episodes int := 0;
  v_eligible boolean := false;
begin
  select * into v_s from public.user_skills where id = p_skill;
  if not found then
    return jsonb_build_object('exists', false, 'eligible', false, 'role_confirmations', 0, 'completed_episodes', 0);
  end if;

  select count(distinct rc.confirmer_id)::int into v_roles
    from public.role_confirmations rc
    join public.network_offers eo on eo.id = rc.offer_id
   where eo.owner_id = v_s.owner_id
     and (
       (eo.kind = 'skill_offer' and eo.skill_id = v_s.id and eo.skill_key = v_s.skill_key)
       or (v_s.source_offer_id is not null and eo.kind = 'circle_support' and eo.id = v_s.source_offer_id)
     )
     and not public.bos_users_network_blocked(v_s.owner_id, rc.confirmer_id);

  select count(distinct b.booker_id)::int into v_episodes
    from public.network_bookings b
    join public.network_offers eo on eo.id = b.offer_id
   where eo.kind = 'skill_offer'
     and eo.skill_id = v_s.id and eo.skill_key = v_s.skill_key
     and b.kind = 'skill_episode'
     and b.lifecycle = 'done'
     and b.provider_done_at is not null
     and b.recipient_done_at is not null
     and not public.bos_users_network_blocked(v_s.owner_id, b.booker_id);

  v_eligible := v_roles >= 2 and v_episodes >= 2;

  return jsonb_build_object(
    'exists', true,
    'skill_id', v_s.id,
    'skill_key', v_s.skill_key,
    'state', case
      when v_s.state = 'suspended' then 'suspended'
      when v_eligible then 'trusted'
      else 'claimed' end,
    'source_offer_id', v_s.source_offer_id,
    'role_confirmations', v_roles,
    'completed_episodes', v_episodes,
    'eligible', v_eligible
  );
end $$;
revoke all on function public.bos_skill_evidence_raw(uuid) from public;
revoke execute on function public.bos_skill_evidence_raw(uuid) from anon, authenticated;

-- RLS-safe проверка связи offer→skill. Таблица user_skills остаётся owner-only;
-- наружу возвращается только boolean для уже видимой offer-строки. state хранится
-- как удобный кэш для UI, но публичная RLS-проверка дополнительно
-- сверяет живое evidence. Поэтому удаление эпизода/оффера не оставляет ложный
-- публичный доступ даже до следующего явного refresh.
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
       and case
         when coalesce(p_require_trusted, false) then
           s.state = 'trusted'
           and coalesce((public.bos_skill_evidence_raw(s.id)->>'eligible')::boolean, false)
         else s.state <> 'suspended' and public.bos_shares_circle(p_owner, auth.uid())
       end
  );
$$;
revoke all on function public.bos_skill_link_allowed(uuid, uuid, text, boolean) from public;
grant execute on function public.bos_skill_link_allowed(uuid, uuid, text, boolean) to authenticated;

-- Пересчитывает state, но НИКОГДА не публикует автоматически. Потеря evidence
-- сразу прячет public offers; возвращение evidence лишь снова делает skill trusted.
create or replace function public.bos_refresh_user_skill(p_skill uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_s public.user_skills%rowtype;
  v_e jsonb;
  v_state text;
begin
  select * into v_s from public.user_skills where id = p_skill for update;
  if not found then return null; end if;
  if v_s.state = 'suspended' then
    update public.network_offers
       set active = false,
           status = case when (
             select count(*) from public.role_confirmations rc
              where rc.offer_id = network_offers.id
                and not public.bos_users_network_blocked(network_offers.owner_id, rc.confirmer_id)
           ) >= 2 then 'confirmed' else 'draft' end,
           visibility = 'circles'
     where kind = 'skill_offer' and skill_id = v_s.id
       ;
    return v_s.state;
  end if;

  v_e := public.bos_skill_evidence_raw(v_s.id);
  v_state := case when coalesce((v_e->>'eligible')::boolean, false) then 'trusted' else 'claimed' end;
  update public.user_skills set state = v_state, updated_at = now() where id = v_s.id;

  update public.network_offers
     set status = case when (
       select count(*) from public.role_confirmations rc
        where rc.offer_id = network_offers.id
          and not public.bos_users_network_blocked(network_offers.owner_id, rc.confirmer_id)
     ) >= 2 then 'confirmed' else 'draft' end
   where kind = 'skill_offer' and skill_id = v_s.id and visibility = 'circles';

  if v_state <> 'trusted' then
    update public.network_offers
       set status = case when (
             select count(*) from public.role_confirmations rc
              where rc.offer_id = network_offers.id
                and not public.bos_users_network_blocked(network_offers.owner_id, rc.confirmer_id)
           ) >= 2 then 'confirmed' else 'draft' end,
           visibility = 'circles'
     where kind = 'skill_offer' and skill_id = v_s.id
       ;
  end if;
  return v_state;
end $$;
revoke all on function public.bos_refresh_user_skill(uuid) from public;
revoke execute on function public.bos_refresh_user_skill(uuid) from anon, authenticated;

-- 6. KIND-AWARE GUARD: P0 ДЛЯ SUPPORT + НОВЫЕ ИНВАРИАНТЫ SKILL ---------------

create or replace function public.bos_guard_help_offer()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_votes int := 0;
  v_bookings int := 0;
  v_expected_status text;
  v_expected_emoji text;
  v_skill public.user_skills%rowtype;
  v_cat public.skill_catalog%rowtype;
begin
  if new.kind = 'circle_support' then
    -- Новые skill-only поля не превращают support в обходной путь.
    if new.skill_id is not null or new.interaction_key is not null or new.outcome_key is not null then
      raise exception 'circle_support_has_skill_offer_fields';
    end if;

    if new.title not in (
      'Поддержать привычку', 'Позвать на прогулку', 'Помочь вернуться в ритм',
      'Провести первую тренировку', 'Провести дыхание или медитацию',
      'Разобрать неделю', 'Собрать маленькую встречу',
      'Показать навык на практике', 'Провести совместный фокус-час',
      'Разобрать конкретную задачу'
    ) then raise exception 'help_offer_not_in_catalog'; end if;

    if new.title = 'Показать навык на практике' then
      select * into v_cat from public.skill_catalog
       where legacy_descr = new.descr and active;
      if not found then raise exception 'help_skill_not_in_catalog'; end if;
      new.skill_key := v_cat.skill_key;
    else
      if coalesce(new.descr, '') <> '' then raise exception 'help_offer_free_text_not_allowed'; end if;
      new.skill_key := null;
    end if;

    v_expected_emoji := case new.title
      when 'Поддержать привычку' then '🌱' when 'Позвать на прогулку' then '🚶'
      when 'Помочь вернуться в ритм' then '🔄' when 'Провести первую тренировку' then '🏃'
      when 'Провести дыхание или медитацию' then '🧘' when 'Разобрать неделю' then '🗓️'
      when 'Собрать маленькую встречу' then '🤝' when 'Показать навык на практике' then '💡'
      when 'Провести совместный фокус-час' then '⏱️' when 'Разобрать конкретную задачу' then '🎯'
      else null end;
    if new.emoji is distinct from v_expected_emoji then raise exception 'help_offer_icon_not_in_catalog'; end if;

    if coalesce(new.when_text, '') !~ '^(15|20|30) мин · (онлайн|рядом)$'
       or new.slots_week not between 1 and 3
       or new.price_xp <> 0 or new.min_level <> 1 then
      raise exception 'help_offer_boundaries_invalid';
    end if;
    new.mode := case when new.when_text like '%рядом' then 'nearby' else 'online' end;

    select count(*)::int into v_votes from public.role_confirmations rc
     where rc.offer_id = new.id
       and not public.bos_users_network_blocked(new.owner_id, rc.confirmer_id);
    v_expected_status := case when v_votes >= 2 then 'confirmed' else 'draft' end;
    if new.status <> v_expected_status then raise exception 'help_offer_status_is_derived'; end if;
    if new.visibility <> 'circles' then raise exception 'circle_support_visibility_is_fixed'; end if;

    if tg_op = 'UPDATE' then
      if new.owner_id <> old.owner_id or old.kind <> 'circle_support' or new.kind <> old.kind then
        raise exception 'help_offer_identity_is_immutable';
      end if;
      select count(*)::int into v_bookings from public.network_bookings where offer_id = old.id;
      if (v_votes > 0 or v_bookings > 0 or exists (
        select 1 from public.user_skills s where s.source_offer_id = old.id
      )) and (
        new.title <> old.title
        or new.emoji is distinct from old.emoji
        or new.descr is distinct from old.descr
        or new.skill_key is distinct from old.skill_key
      ) then raise exception 'help_offer_role_has_evidence'; end if;
    end if;

    if exists (
      select 1 from public.network_offers o
       where o.owner_id = new.owner_id and o.id <> new.id and o.active
         and o.kind = 'circle_support'
         and o.title = new.title and coalesce(o.descr, '') = coalesce(new.descr, '')
    ) then raise exception 'help_offer_duplicate_role'; end if;

  elsif new.kind = 'skill_offer' then
    if new.skill_id is null or new.skill_key is null then raise exception 'skill_offer_skill_required'; end if;
    select * into v_skill from public.user_skills where id = new.skill_id;
    if not found or v_skill.owner_id <> new.owner_id or v_skill.skill_key <> new.skill_key then
      raise exception 'skill_offer_owner_or_key_mismatch';
    end if;
    select * into v_cat from public.skill_catalog where skill_key = new.skill_key and active;
    if not found then raise exception 'skill_offer_skill_not_allowed'; end if;

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
    if coalesce(new.when_text, '') !~ '^(30|45|60) мин$'
       or new.slots_week not between 1 and 5
       or new.price_xp <> 0 or new.min_level <> 1 then
      raise exception 'skill_offer_boundaries_invalid';
    end if;

    select count(*)::int into v_votes from public.role_confirmations rc
     where rc.offer_id = new.id
       and not public.bos_users_network_blocked(new.owner_id, rc.confirmer_id);
    v_expected_status := case when v_votes >= 2 then 'confirmed' else 'draft' end;

    if tg_op = 'INSERT' then
      if new.status <> v_expected_status or new.visibility <> 'circles' then
        raise exception 'skill_offer_must_start_as_circle_draft';
      end if;
    else
      if old.kind <> 'skill_offer' or new.kind <> old.kind
         or new.owner_id <> old.owner_id
         or new.skill_id <> old.skill_id
         or new.skill_key <> old.skill_key
         or new.emoji is distinct from old.emoji then
        raise exception 'skill_offer_identity_is_immutable';
      end if;
      select count(*)::int into v_bookings from public.network_bookings where offer_id = old.id;
      if (v_bookings > 0 or v_votes > 0) and (
        new.interaction_key <> old.interaction_key
        or new.outcome_key <> old.outcome_key
        or new.mode <> old.mode
      ) then raise exception 'skill_offer_semantics_have_episodes'; end if;
    end if;

    if new.visibility = 'all' then
      if v_skill.state <> 'trusted' or new.status <> 'confirmed' then
        raise exception 'skill_offer_not_trusted_or_not_published';
      end if;
    elsif new.visibility = 'circles' then
      if new.status <> v_expected_status then
        raise exception 'skill_offer_draft_shape_invalid';
      end if;
    else
      raise exception 'skill_offer_visibility_invalid';
    end if;
  else
    raise exception 'network_offer_kind_invalid';
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_help_offer on public.network_offers;
create trigger trg_guard_help_offer
  before insert or update on public.network_offers
  for each row execute function public.bos_guard_help_offer();

-- Круг подтверждает конкретное применение навыка, пока оно circle-visible.
-- Public карточка больше не собирает новые подтверждения.
drop policy if exists role_conf_ins on public.role_confirmations;
create policy role_conf_ins on public.role_confirmations
  for insert with check (
    auth.uid() = confirmer_id
    and exists (
      select 1 from public.network_offers o
       where o.id = offer_id
         and o.active
         and o.owner_id <> auth.uid()
         and not public.bos_network_blocked_with_me(o.owner_id)
         and public.bos_shares_circle(o.owner_id, auth.uid())
         and (
           o.kind = 'circle_support'
           or (o.kind = 'skill_offer' and o.visibility = 'circles'
             and o.status in ('draft', 'confirmed'))
         )
    )
  );

-- Для skill offer confirmed/circles означает «роль подтверждена кругом», но это
-- ещё НЕ public. Публикация меняет visibility на all отдельным RPC.
create or replace function public.bos_recompute_offer_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_offer uuid;
  v_n int;
  v_skill uuid;
  v_owner uuid;
begin
  v_offer := case when tg_op = 'DELETE' then old.offer_id else new.offer_id end;
  select owner_id, skill_id into v_owner, v_skill
    from public.network_offers where id = v_offer;
  if not found then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  if v_skill is not null then
    perform 1 from public.user_skills where id = v_skill for update;
  end if;
  select count(*)::int into v_n from public.role_confirmations rc
   where rc.offer_id = v_offer
     and not public.bos_users_network_blocked(v_owner, rc.confirmer_id);
  update public.network_offers
     set status = case when v_n >= 2 then 'confirmed' else 'draft' end
   where id = v_offer
     and (kind = 'circle_support' or (kind = 'skill_offer' and visibility = 'circles'));
  if v_skill is not null then perform public.bos_refresh_user_skill(v_skill); end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

drop trigger if exists trg_offer_confirm on public.role_confirmations;
drop trigger if exists trg_offer_recompute on public.role_confirmations;
create trigger trg_offer_recompute
  after insert or delete on public.role_confirmations
  for each row execute function public.bos_recompute_offer_status();

-- Legacy source support всё ещё пересчитывает навык для обратной совместимости.
-- Новый путь получает confirmations прямо на skill_offer. Автопубликации нет.
create or replace function public.bos_sync_skill_source()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if new.kind = 'circle_support' then
    for v_id in select id from public.user_skills where source_offer_id = new.id loop
      perform public.bos_refresh_user_skill(v_id);
    end loop;
  end if;
  return new;
end $$;

drop trigger if exists trg_sync_skill_source on public.network_offers;
create trigger trg_sync_skill_source
  after update of status, active, skill_key on public.network_offers
  for each row execute function public.bos_sync_skill_source();

-- FK source_offer_id использует SET NULL: потеря legacy-источника немедленно
-- пересчитывает trust (новые skill confirmations могут его сохранить) и не
-- мешает каскадному удалению аккаунта.
create or replace function public.bos_sync_skill_after_source_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.bos_refresh_user_skill(new.id);
  return new;
end $$;
drop trigger if exists trg_skill_source_changed on public.user_skills;
create trigger trg_skill_source_changed
  after update of source_offer_id on public.user_skills
  for each row when (old.source_offer_id is distinct from new.source_offer_id)
  execute function public.bos_sync_skill_after_source_change();

-- claimed демотирует public offer обратно в круг, сохраняя ручной active/paused.
-- suspended скрывает полностью. Переход обратно в trusted НЕ публикует offer.
create or replace function public.bos_pause_offers_after_skill_state()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.state = 'suspended' then
    update public.network_offers
       set active = false,
           status = case when (
             select count(*) from public.role_confirmations rc
              where rc.offer_id = network_offers.id
                and not public.bos_users_network_blocked(network_offers.owner_id, rc.confirmer_id)
           ) >= 2 then 'confirmed' else 'draft' end,
           visibility = 'circles'
     where kind = 'skill_offer' and skill_id = new.id
       ;
  elsif new.state = 'claimed' then
    update public.network_offers
       set status = case when (
             select count(*) from public.role_confirmations rc
              where rc.offer_id = network_offers.id
                and not public.bos_users_network_blocked(network_offers.owner_id, rc.confirmer_id)
           ) >= 2 then 'confirmed' else 'draft' end,
           visibility = 'circles'
     where kind = 'skill_offer' and skill_id = new.id
       ;
  end if;
  return new;
end $$;
drop trigger if exists trg_skill_state_pause on public.user_skills;
create trigger trg_skill_state_pause
  after update of state on public.user_skills
  for each row when (old.state is distinct from new.state)
  execute function public.bos_pause_offers_after_skill_state();

-- Upgrade пересчитывает старый state уже по новой модели skill confirmations +
-- skill episodes. Порядок id делает массовый lock детерминированным.
do $$
declare v_skill uuid;
begin
  for v_skill in select id from public.user_skills order by id loop
    perform public.bos_refresh_user_skill(v_skill);
  end loop;
end $$;

-- 7. FAIL-CLOSED RLS ----------------------------------------------------------

drop policy if exists user_skills_read on public.user_skills;
create policy user_skills_read on public.user_skills for select to authenticated using (
  owner_id = auth.uid()
);
revoke insert, update, delete on public.user_skills from authenticated;
grant select on public.user_skills to authenticated;

drop policy if exists net_offers_read on public.network_offers;
create policy net_offers_read on public.network_offers for select to authenticated using (
  owner_id = auth.uid()
  or (
    kind = 'circle_support' and active
    and not public.bos_network_blocked_with_me(owner_id)
    and public.bos_shares_circle(owner_id, auth.uid())
  )
  or (
    kind = 'skill_offer' and active and status in ('draft', 'confirmed') and visibility = 'circles'
    and not public.bos_network_blocked_with_me(owner_id)
    and public.bos_shares_circle(owner_id, auth.uid())
    and public.bos_skill_link_allowed(skill_id, owner_id, skill_key, false)
  )
  or (
    kind = 'skill_offer' and active and status = 'confirmed' and visibility = 'all'
    and not public.bos_network_blocked_with_me(owner_id)
    and public.bos_skill_link_allowed(skill_id, owner_id, skill_key, true)
  )
  or (
    -- Участник не теряет контекст уже созданного эпизода, если автор поставил
    -- offer на паузу или evidence временно просело. При блоке скрываются оба.
    kind = 'skill_offer'
    and not public.bos_network_blocked_with_me(owner_id)
    and exists (
      select 1 from public.network_bookings b
       where b.offer_id = network_offers.id
         and (b.owner_id = auth.uid() or b.booker_id = auth.uid())
         and not public.bos_network_blocked_with_me(
           case when b.owner_id = auth.uid() then b.booker_id else b.owner_id end
         )
    )
  )
);

drop policy if exists net_book_read on public.network_bookings;
create policy net_book_read on public.network_bookings for select to authenticated using (
  (auth.uid() = booker_id or auth.uid() = owner_id)
  and not public.bos_network_blocked_with_me(
    case when auth.uid() = owner_id then booker_id else owner_id end
  )
);
revoke insert, update, delete on public.network_bookings from authenticated;
grant select on public.network_bookings to authenticated;

-- P0 raw social rows also obey a two-way block. Aggregates below repeat this
-- check because SECURITY DEFINER intentionally bypasses table RLS.
drop policy if exists role_conf_read on public.role_confirmations;
create policy role_conf_read on public.role_confirmations for select to authenticated using (
  exists (
    select 1 from public.network_offers o
     where o.id = role_confirmations.offer_id
       and not public.bos_network_blocked_with_me(o.owner_id)
       and not public.bos_network_blocked_with_me(role_confirmations.confirmer_id)
       and (
         role_confirmations.confirmer_id = auth.uid()
         or o.owner_id = auth.uid()
         or public.bos_shares_circle(o.owner_id, auth.uid())
       )
  )
);

drop policy if exists thanks_read on public.thanks;
create policy thanks_read on public.thanks for select to authenticated using (
  (from_id = auth.uid() and not public.bos_network_blocked_with_me(to_id))
  or (to_id = auth.uid() and not public.bos_network_blocked_with_me(from_id))
);

-- 8. SKILL RPC: CLAIM → DRAFT OFFER → EXPLICIT PUBLISH ------------------------

drop function if exists public.bos_claim_skill(text);
create function public.bos_claim_skill(p_skill text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_source uuid;
  v_skill uuid;
  v_state text;
  v_source_out uuid;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  if not exists (select 1 from public.skill_catalog where skill_key = p_skill and active) then
    return jsonb_build_object('ok', false, 'err', 'skill_not_allowed');
  end if;

  select o.id into v_source
    from public.network_offers o
   where o.owner_id = v_uid
     and o.kind = 'circle_support'
     and o.title = 'Показать навык на практике'
     and o.skill_key = p_skill
   order by o.active desc, (o.status = 'confirmed') desc, o.created_at asc
   limit 1;

  insert into public.user_skills (owner_id, skill_key, source_offer_id)
  values (v_uid, p_skill, v_source)
  on conflict (owner_id, skill_key) do update
    set source_offer_id = coalesce(user_skills.source_offer_id, excluded.source_offer_id),
        updated_at = now()
  returning id into v_skill;

  perform public.bos_refresh_user_skill(v_skill);
  select state, source_offer_id into v_state, v_source_out
    from public.user_skills where id = v_skill;
  return jsonb_build_object(
    'ok', true,
    'skill_id', v_skill,
    'skill_key', p_skill,
    'state', v_state,
    'source_offer_id', v_source_out,
    'needs_circle_offer', false,
    'needs_skill_offer', not exists (
      select 1 from public.network_offers o
       where o.kind = 'skill_offer' and o.skill_id = v_skill
    )
  );
end $$;
revoke all on function public.bos_claim_skill(text) from public;
grant execute on function public.bos_claim_skill(text) to authenticated;

-- Payload:
-- { offer_id?, skill_id, interaction_key, outcome_key, mode,
--   duration_min: 30|45|60, slots_week: 1..5 }
-- Создаёт/редактирует circle-visible draft. Публикация всем — отдельный RPC.
drop function if exists public.bos_upsert_skill_offer(jsonb);
create function public.bos_upsert_skill_offer(p_offer jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_offer uuid;
  v_skill_id uuid;
  v_skill public.user_skills%rowtype;
  v_cat public.skill_catalog%rowtype;
  v_interaction text;
  v_outcome text;
  v_mode text;
  v_duration int;
  v_slots int;
  v_existing public.network_offers%rowtype;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  if p_offer is null or jsonb_typeof(p_offer) <> 'object' then
    return jsonb_build_object('ok', false, 'err', 'payload');
  end if;

  begin
    v_offer := nullif(coalesce(p_offer->>'id', p_offer->>'offer_id'), '')::uuid;
    v_skill_id := nullif(p_offer->>'skill_id', '')::uuid;
    v_duration := case
      when p_offer ? 'when_text' then case
        when coalesce(p_offer->>'when_text', '') ~ '^(30|45|60) мин$'
          then split_part(p_offer->>'when_text', ' ', 1)::int
        else null
      end
      else coalesce(nullif(p_offer->>'duration_min', '')::int, 30)
    end;
    v_slots := coalesce(nullif(p_offer->>'slots_week', '')::int, 1);
  exception when invalid_text_representation or numeric_value_out_of_range then
    return jsonb_build_object('ok', false, 'err', 'payload');
  end;
  v_interaction := p_offer->>'interaction_key';
  v_outcome := p_offer->>'outcome_key';
  v_mode := p_offer->>'mode';

  if v_skill_id is null
     or not coalesce(public.bos_skill_interaction_allowed(v_interaction), false)
     or not coalesce(public.bos_skill_outcome_allowed(v_outcome), false)
     or not coalesce(public.bos_skill_mode_allowed(v_mode), false)
     or v_duration is null or v_duration not in (30, 45, 60)
     or v_slots not between 1 and 5 then
    return jsonb_build_object('ok', false, 'err', 'boundaries');
  end if;

  select * into v_skill from public.user_skills where id = v_skill_id for update;
  if not found or v_skill.owner_id <> v_uid then
    return jsonb_build_object('ok', false, 'err', 'skill_not_owned');
  end if;
  if v_skill.state = 'suspended' then
    return jsonb_build_object('ok', false, 'err', 'skill_suspended');
  end if;
  select * into v_cat from public.skill_catalog where skill_key = v_skill.skill_key and active;
  if not found then return jsonb_build_object('ok', false, 'err', 'skill_not_allowed'); end if;

  if v_offer is not null then
    select * into v_existing from public.network_offers where id = v_offer for update;
    if not found or v_existing.owner_id <> v_uid or v_existing.kind <> 'skill_offer'
       or v_existing.skill_id <> v_skill.id then
      return jsonb_build_object('ok', false, 'err', 'offer_not_owned');
    end if;
  else
    select * into v_existing
      from public.network_offers
     where owner_id = v_uid and kind = 'skill_offer' and skill_id = v_skill.id
       and interaction_key = v_interaction and outcome_key = v_outcome and mode = v_mode
     limit 1 for update;
    if found then v_offer := v_existing.id; end if;
  end if;

  if v_offer is null then
    insert into public.network_offers (
      owner_id, kind, skill_id, skill_key, interaction_key, outcome_key, mode,
      emoji, title, descr, price_xp, min_level, slots_week, when_text,
      active, status, visibility
    ) values (
      v_uid, 'skill_offer', v_skill.id, v_skill.skill_key, v_interaction, v_outcome, v_mode,
      v_cat.emoji,
      public.bos_skill_offer_title(v_cat.label, v_interaction, v_outcome),
      public.bos_skill_offer_descr(v_outcome),
      0, 1, v_slots, v_duration || ' мин',
      true, 'draft', 'circles'
    ) returning id into v_offer;
  else
    update public.network_offers
       set interaction_key = v_interaction,
           outcome_key = v_outcome,
           mode = v_mode,
           title = public.bos_skill_offer_title(v_cat.label, v_interaction, v_outcome),
           descr = public.bos_skill_offer_descr(v_outcome),
           slots_week = v_slots,
           when_text = v_duration || ' мин',
           active = case
             when visibility = 'circles' and status in ('draft', 'confirmed') then true
             else active
           end
     where id = v_offer;
  end if;

  select * into v_existing from public.network_offers where id = v_offer;
  return jsonb_build_object(
    'ok', true,
    'offer_id', v_offer,
    'skill_id', v_skill.id,
    'skill_key', v_skill.skill_key,
    'published', v_existing.active and v_existing.status = 'confirmed' and v_existing.visibility = 'all'
  );
end $$;
revoke all on function public.bos_upsert_skill_offer(jsonb) from public;
grant execute on function public.bos_upsert_skill_offer(jsonb) to authenticated;

create or replace function public.bos_publish_skill_offer(p_offer uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_skill_id uuid;
  v_owner uuid;
  v_state text;
  v_o public.network_offers%rowtype;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  select skill_id, owner_id into v_skill_id, v_owner
    from public.network_offers where id = p_offer and kind = 'skill_offer';
  if not found or v_owner <> v_uid then return jsonb_build_object('ok', false, 'err', 'offer_not_owned'); end if;

  -- Единый порядок блокировок для publish/upsert: сначала skill, затем offer.
  perform 1 from public.user_skills where id = v_skill_id for update;
  v_state := public.bos_refresh_user_skill(v_skill_id);
  if v_state <> 'trusted' then
    return jsonb_build_object('ok', false, 'err', 'not_trusted', 'evidence', public.bos_skill_evidence_raw(v_skill_id));
  end if;

  select * into v_o from public.network_offers where id = p_offer for update;
  if v_o.owner_id <> v_uid or v_o.kind <> 'skill_offer' or v_o.skill_id <> v_skill_id then
    return jsonb_build_object('ok', false, 'err', 'offer_changed');
  end if;
  update public.network_offers
     set status = 'confirmed', visibility = 'all', active = true
   where id = p_offer;
  return jsonb_build_object('ok', true, 'offer_id', p_offer, 'published', true);
end $$;
revoke all on function public.bos_publish_skill_offer(uuid) from public;
grant execute on function public.bos_publish_skill_offer(uuid) to authenticated;

create or replace function public.bos_pause_skill_offer(p_offer uuid, p_paused boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_skill uuid;
  v_status text;
  v_visibility text;
  v_skill_state text;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  select owner_id, skill_id, status, visibility
    into v_owner, v_skill, v_status, v_visibility
    from public.network_offers
   where id = p_offer and kind = 'skill_offer';
  if not found or v_owner <> v_uid then return jsonb_build_object('ok', false, 'err', 'offer_not_owned'); end if;
  if not coalesce(p_paused, true) then
    if v_status = 'confirmed' and v_visibility = 'all' then
      return public.bos_publish_skill_offer(p_offer);
    end if;
    perform 1 from public.user_skills where id = v_skill for update;
    select state into v_skill_state from public.user_skills where id = v_skill;
    if v_skill_state = 'suspended' then
      return jsonb_build_object('ok', false, 'err', 'skill_suspended');
    end if;
    perform 1 from public.network_offers where id = p_offer for update;
    update public.network_offers set active = true where id = p_offer;
    return jsonb_build_object('ok', true, 'offer_id', p_offer, 'paused', false, 'scope', 'circles');
  end if;
  -- Ветка pause не берёт skill-lock; lock offer нужен только после выбора ветки,
  -- чтобы не инвертировать порядок skill→offer относительно publish/upsert.
  perform 1 from public.network_offers where id = p_offer for update;
  update public.network_offers set active = false where id = p_offer;
  return jsonb_build_object('ok', true, 'offer_id', p_offer, 'paused', true);
end $$;
revoke all on function public.bos_pause_skill_offer(uuid, boolean) from public;
grant execute on function public.bos_pause_skill_offer(uuid, boolean) to authenticated;

drop function if exists public.bos_skill_evidence_summary(uuid);
drop function if exists public.bos_skill_evidence_summary(uuid, uuid);
create function public.bos_skill_evidence_summary(p_user uuid, p_skill uuid)
returns jsonb language plpgsql security definer stable set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_s public.user_skills%rowtype;
  v_e jsonb;
  v_visible boolean := false;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  select * into v_s from public.user_skills where id = p_skill and owner_id = p_user;
  if not found then return jsonb_build_object('ok', false, 'err', 'gone'); end if;
  if public.bos_users_network_blocked(v_uid, v_s.owner_id) then
    return jsonb_build_object('ok', false, 'err', 'blocked');
  end if;
  if v_uid <> v_s.owner_id then
    select exists (
      select 1 from public.network_offers o
       where o.kind = 'skill_offer'
         and o.skill_id = v_s.id
         and o.owner_id = v_s.owner_id
         and o.skill_key = v_s.skill_key
         and o.active
         and (
           (o.status in ('draft', 'confirmed') and o.visibility = 'circles'
             and public.bos_shares_circle(o.owner_id, v_uid)
             and public.bos_skill_link_allowed(o.skill_id, o.owner_id, o.skill_key, false))
           or
           (o.status = 'confirmed' and o.visibility = 'all'
             and public.bos_skill_link_allowed(o.skill_id, o.owner_id, o.skill_key, true))
         )
    ) into v_visible;
    if not v_visible then return jsonb_build_object('ok', false, 'err', 'private'); end if;
  end if;
  v_e := public.bos_skill_evidence_raw(v_s.id) || jsonb_build_object('ok', true);
  if v_uid <> v_s.owner_id then v_e := v_e - 'source_offer_id'; end if;
  return v_e;
end $$;
revoke all on function public.bos_skill_evidence_summary(uuid, uuid) from public;
grant execute on function public.bos_skill_evidence_summary(uuid, uuid) to authenticated;

-- 9. EPISODES: REQUEST → ACCEPT/DECLINE/CANCEL → TWO-SIDED DONE ---------------

-- Сохраняем P0-контракт: circle_support бронируется сразу и бесплатно. Старый
-- клиент не может обойти request lifecycle публичного skill_offer.
create or replace function public.bos_book_offer(
  p_offer uuid,
  p_week text,
  p_earned int default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_o public.network_offers%rowtype;
  v_taken int := 0;
  v_week text := to_char(current_date, 'IYYY-"W"IW');
  v_skill_id uuid;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  if p_week is distinct from v_week then return jsonb_build_object('ok', false, 'err', 'week'); end if;

  select * into v_o from public.network_offers where id = p_offer and active for update;
  if not found then return jsonb_build_object('ok', false, 'err', 'gone'); end if;
  if v_o.owner_id = v_uid then return jsonb_build_object('ok', false, 'err', 'self'); end if;
  if public.bos_users_network_blocked(v_o.owner_id, v_uid) then
    return jsonb_build_object('ok', false, 'err', 'blocked');
  end if;
  if v_o.kind = 'skill_offer' then
    return jsonb_build_object('ok', false, 'err', 'request_required');
  end if;
  if v_o.kind <> 'circle_support' then return jsonb_build_object('ok', false, 'err', 'kind'); end if;
  if v_o.status <> 'confirmed' then return jsonb_build_object('ok', false, 'err', 'unconfirmed'); end if;
  if not public.bos_shares_circle(v_o.owner_id, v_uid) then
    return jsonb_build_object('ok', false, 'err', 'private');
  end if;
  if v_o.min_level > 1 then return jsonb_build_object('ok', false, 'err', 'level_unverified'); end if;
  if v_o.price_xp > 0 then return jsonb_build_object('ok', false, 'err', 'xp_unverified'); end if;

  select id into v_skill_id from public.user_skills where source_offer_id = p_offer;

  if exists (
    select 1 from public.network_bookings
     where offer_id = p_offer and booker_id = v_uid and week = v_week
  ) then return jsonb_build_object('ok', true, 'dup', true); end if;

  select count(*)::int into v_taken from public.network_bookings
   where offer_id = p_offer and week = v_week and lifecycle in ('accepted', 'done')
     and not public.bos_users_network_blocked(owner_id, booker_id);
  if v_taken >= v_o.slots_week then
    return jsonb_build_object('ok', false, 'err', 'full');
  end if;

  begin
    insert into public.network_bookings (
      offer_id, owner_id, booker_id, week, price_xp, kind, lifecycle, skill_id
    ) values (
      p_offer, v_o.owner_id, v_uid, v_week, 0, 'circle_support', 'accepted', v_skill_id
    );
  exception when unique_violation then
    return jsonb_build_object('ok', true, 'dup', true);
  end;
  return jsonb_build_object('ok', true, 'taken', v_taken + 1, 'slots', v_o.slots_week, 'lifecycle', 'accepted');
end $$;
revoke all on function public.bos_book_offer(uuid, text, int) from public;
grant execute on function public.bos_book_offer(uuid, text, int) to authenticated;

drop function if exists public.bos_request_skill_offer(uuid, text, text);
drop function if exists public.bos_request_skill_offer(uuid, text);
create function public.bos_request_skill_offer(
  p_offer uuid,
  p_request_note text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_o public.network_offers%rowtype;
  v_b public.network_bookings%rowtype;
  v_skill_id uuid;
  v_week text := to_char(current_date, 'IYYY-"W"IW');
  v_note text := nullif(btrim(coalesce(p_request_note, '')), '');
  v_circle_scope boolean := false;
  v_public_scope boolean := false;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  if v_note is null then return jsonb_build_object('ok', false, 'err', 'request_note'); end if;
  if char_length(coalesce(v_note, '')) > 240 then return jsonb_build_object('ok', false, 'err', 'note_too_long'); end if;

  select skill_id into v_skill_id from public.network_offers
   where id = p_offer and kind = 'skill_offer';
  if not found or v_skill_id is null then return jsonb_build_object('ok', false, 'err', 'not_published'); end if;
  perform 1 from public.user_skills where id = v_skill_id for update;
  perform public.bos_refresh_user_skill(v_skill_id);
  select * into v_o from public.network_offers where id = p_offer for update;
  if not found or v_o.kind <> 'skill_offer' or not v_o.active then
    return jsonb_build_object('ok', false, 'err', 'not_available');
  end if;
  v_circle_scope := v_o.status in ('draft', 'confirmed') and v_o.visibility = 'circles'
    and public.bos_shares_circle(v_o.owner_id, v_uid)
    and exists (
      select 1 from public.user_skills s
       where s.id = v_o.skill_id and s.owner_id = v_o.owner_id
         and s.skill_key = v_o.skill_key and s.state <> 'suspended'
    );
  v_public_scope := v_o.status = 'confirmed' and v_o.visibility = 'all' and exists (
    select 1 from public.user_skills s
     where s.id = v_o.skill_id and s.owner_id = v_o.owner_id
       and s.skill_key = v_o.skill_key and s.state = 'trusted'
  );
  if not v_circle_scope and not v_public_scope then
    return jsonb_build_object('ok', false, 'err', 'private');
  end if;
  -- Пока сервер не хранит авторитетный XP/level, публичный доступ нельзя честно
  -- гейтить L10. v1 допускает authenticated viewer; price/min_level остаются 0/1.
  if v_o.owner_id = v_uid then return jsonb_build_object('ok', false, 'err', 'self'); end if;
  if public.bos_users_network_blocked(v_o.owner_id, v_uid) then
    return jsonb_build_object('ok', false, 'err', 'blocked');
  end if;

  select * into v_b from public.network_bookings
   where offer_id = p_offer and booker_id = v_uid and week = v_week for update;
  if found then
    if v_b.kind <> 'skill_episode' then return jsonb_build_object('ok', false, 'err', 'booking_kind'); end if;
    if v_b.lifecycle in ('requested', 'accepted', 'done') then
      return jsonb_build_object('ok', true, 'dup', true, 'booking_id', v_b.id, 'lifecycle', v_b.lifecycle);
    end if;
    update public.network_bookings
       set lifecycle = 'requested', request_note = v_note,
           provider_done_at = null, recipient_done_at = null,
           skill_id = v_o.skill_id
     where id = v_b.id
     returning * into v_b;
  else
    begin
      insert into public.network_bookings (
        offer_id, owner_id, booker_id, week, price_xp, kind, lifecycle, request_note, skill_id
      ) values (
        p_offer, v_o.owner_id, v_uid, v_week, 0, 'skill_episode', 'requested', v_note, v_o.skill_id
      ) returning * into v_b;
    exception when unique_violation then
      select * into v_b from public.network_bookings
       where offer_id = p_offer and booker_id = v_uid and week = v_week;
      return jsonb_build_object('ok', true, 'dup', true, 'booking_id', v_b.id, 'lifecycle', v_b.lifecycle);
    end;
  end if;
  return jsonb_build_object('ok', true, 'booking_id', v_b.id, 'lifecycle', v_b.lifecycle);
end $$;
revoke all on function public.bos_request_skill_offer(uuid, text) from public;
grant execute on function public.bos_request_skill_offer(uuid, text) to authenticated;

drop function if exists public.bos_skill_episode_action(uuid, text);
create function public.bos_skill_episode_action(p_episode uuid, p_action text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_b public.network_bookings%rowtype;
  v_o public.network_offers%rowtype;
  v_offer_id uuid;
  v_skill_id uuid;
  v_taken int := 0;
  v_circle_scope boolean := false;
  v_public_scope boolean := false;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  if p_action is null or p_action not in ('accept', 'decline', 'cancel') then
    return jsonb_build_object('ok', false, 'err', 'action');
  end if;

  -- Request/upsert используют offer→booking; здесь тот же порядок, иначе два
  -- одновременных action/request могли бы взаимно ждать разные row locks.
  select offer_id into v_offer_id from public.network_bookings where id = p_episode;
  if not found then return jsonb_build_object('ok', false, 'err', 'gone'); end if;
  select skill_id into v_skill_id from public.network_offers
   where id = v_offer_id and kind = 'skill_offer';
  if not found or v_skill_id is null then return jsonb_build_object('ok', false, 'err', 'offer_gone'); end if;
  perform 1 from public.user_skills where id = v_skill_id for update;
  perform public.bos_refresh_user_skill(v_skill_id);
  select * into v_o from public.network_offers where id = v_offer_id for update;
  if not found or v_o.kind <> 'skill_offer' then return jsonb_build_object('ok', false, 'err', 'offer_gone'); end if;
  select * into v_b from public.network_bookings where id = p_episode for update;
  if not found or v_b.kind <> 'skill_episode' or v_b.offer_id <> v_offer_id then
    return jsonb_build_object('ok', false, 'err', 'gone');
  end if;

  if p_action = 'accept' then
    if v_uid <> v_b.owner_id then return jsonb_build_object('ok', false, 'err', 'provider_only'); end if;
    if v_b.lifecycle = 'accepted' then return jsonb_build_object('ok', true, 'dup', true, 'lifecycle', 'accepted'); end if;
    if v_b.lifecycle <> 'requested' then return jsonb_build_object('ok', false, 'err', 'state'); end if;
    v_circle_scope := v_o.active and v_o.status in ('draft', 'confirmed') and v_o.visibility = 'circles'
      and public.bos_shares_circle(v_b.owner_id, v_b.booker_id);
    v_public_scope := v_o.active and v_o.status = 'confirmed' and v_o.visibility = 'all'
      and exists (
        select 1 from public.user_skills s
         where s.id = v_o.skill_id and s.owner_id = v_o.owner_id
           and s.skill_key = v_o.skill_key and s.state = 'trusted'
      );
    if not v_circle_scope and not v_public_scope then
      return jsonb_build_object('ok', false, 'err', 'not_available');
    end if;
    if public.bos_users_network_blocked(v_b.owner_id, v_b.booker_id) then
      return jsonb_build_object('ok', false, 'err', 'blocked');
    end if;
    select count(*)::int into v_taken from public.network_bookings
     where offer_id = v_b.offer_id and week = v_b.week
       and lifecycle in ('accepted', 'done') and id <> v_b.id
       and not public.bos_users_network_blocked(owner_id, booker_id);
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

-- Один RPC, но сторона задаётся явно и сверяется с auth.uid(). Повторный вызов
-- идемпотентен. circle_support можно отметить done только если он является source
-- хотя бы одного user_skill.
drop function if exists public.bos_skill_mark_done(uuid, text);
create function public.bos_skill_mark_done(p_episode uuid, p_role text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_b public.network_bookings%rowtype;
  v_offer_id uuid;
  v_booking_kind text;
  v_offer_skill uuid;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  if p_role is null or p_role not in ('provider', 'recipient') then return jsonb_build_object('ok', false, 'err', 'role'); end if;

  select offer_id, kind into v_offer_id, v_booking_kind
    from public.network_bookings where id = p_episode;
  if not found then return jsonb_build_object('ok', false, 'err', 'gone'); end if;
  if v_booking_kind = 'circle_support' then
    select id into v_offer_skill from public.user_skills
     where source_offer_id = v_offer_id;
  elsif v_booking_kind = 'skill_episode' then
    select skill_id into v_offer_skill from public.network_offers
     where id = v_offer_id and kind = 'skill_offer';
  end if;
  if v_offer_skill is null then return jsonb_build_object('ok', false, 'err', 'not_skill_evidence'); end if;
  perform 1 from public.user_skills where id = v_offer_skill for update;
  select * into v_b from public.network_bookings where id = p_episode for update;
  if not found or v_b.offer_id <> v_offer_id or v_b.kind <> v_booking_kind then
    return jsonb_build_object('ok', false, 'err', 'gone');
  end if;
  if v_b.lifecycle not in ('accepted', 'done') then return jsonb_build_object('ok', false, 'err', 'state'); end if;
  if v_b.kind not in ('circle_support', 'skill_episode') then
    return jsonb_build_object('ok', false, 'err', 'kind');
  end if;
  if v_uid <> v_b.owner_id and v_uid <> v_b.booker_id then
    return jsonb_build_object('ok', false, 'err', 'participant_only');
  end if;
  if public.bos_users_network_blocked(v_b.owner_id, v_b.booker_id) then
    return jsonb_build_object('ok', false, 'err', 'blocked');
  end if;
  if v_b.skill_id is distinct from v_offer_skill then
    update public.network_bookings set skill_id = v_offer_skill
     where id = v_b.id returning * into v_b;
  end if;

  if p_role = 'provider' then
    if v_uid <> v_b.owner_id then return jsonb_build_object('ok', false, 'err', 'provider_only'); end if;
    if v_b.provider_done_at is null then
      update public.network_bookings set provider_done_at = now() where id = v_b.id returning * into v_b;
    end if;
  else
    if v_uid <> v_b.booker_id then return jsonb_build_object('ok', false, 'err', 'recipient_only'); end if;
    if v_b.recipient_done_at is null then
      update public.network_bookings set recipient_done_at = now() where id = v_b.id returning * into v_b;
    end if;
  end if;

  if v_b.provider_done_at is not null and v_b.recipient_done_at is not null and v_b.lifecycle <> 'done' then
    update public.network_bookings set lifecycle = 'done' where id = v_b.id returning * into v_b;
  end if;

  perform public.bos_refresh_user_skill(v_offer_skill);
  return jsonb_build_object(
    'ok', true,
    'booking_id', v_b.id,
    'lifecycle', v_b.lifecycle,
    'provider_done', v_b.provider_done_at is not null,
    'recipient_done', v_b.recipient_done_at is not null
  );
end $$;
revoke all on function public.bos_skill_mark_done(uuid, text) from public;
grant execute on function public.bos_skill_mark_done(uuid, text) to authenticated;

-- Контакт открывается только после принятия эпизода и только его двум сторонам.
-- tg_id остаётся серверным секретом: наружу уходит лишь готовый deep-link и только
-- если сохранённое значение действительно похоже на Telegram numeric user id.
drop function if exists public.bos_skill_episode_contact(uuid);
create function public.bos_skill_episode_contact(p_episode uuid)
returns jsonb language plpgsql security definer stable set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_other uuid;
  v_name text;
  v_avatar text;
  v_tg text;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;

  select case
           when b.owner_id = v_uid then b.booker_id
           when b.booker_id = v_uid then b.owner_id
           else null
         end
    into v_other
    from public.network_bookings b
   where b.id = p_episode
     and b.kind = 'skill_episode'
     and b.lifecycle in ('accepted', 'done')
     and (b.owner_id = v_uid or b.booker_id = v_uid);
  if not found or v_other is null then
    return jsonb_build_object('ok', false, 'err', 'private');
  end if;
  if public.bos_users_network_blocked(v_uid, v_other) then
    return jsonb_build_object('ok', false, 'err', 'blocked');
  end if;

  select
      coalesce(nullif(split_part(btrim(coalesce(p.username, '')), ' ', 1), ''), 'Участник'),
      p.avatar,
      nullif(btrim(coalesce(p.tg_id, '')), '')
    into v_name, v_avatar, v_tg
    from public.profiles p
   where p.id = v_other;
  if not found then return jsonb_build_object('ok', false, 'err', 'private'); end if;

  return jsonb_build_object(
    'ok', true,
    'contact', jsonb_build_object(
      'first_name', v_name,
      'avatar', v_avatar,
      'telegram_url', case
        when v_tg ~ '^[0-9]{1,20}$' then 'tg://user?id=' || v_tg
        else null
      end
    )
  );
end $$;
revoke all on function public.bos_skill_episode_contact(uuid) from public;
grant execute on function public.bos_skill_episode_contact(uuid) to authenticated;

create or replace function public.bos_skill_offer_counts(p_offer uuid)
returns jsonb language plpgsql security definer stable set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_o public.network_offers%rowtype;
  v_week text := to_char(current_date, 'IYYY-"W"IW');
  v_requested int := 0;
  v_accepted int := 0;
  v_done int := 0;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  select * into v_o from public.network_offers where id = p_offer;
  if not found or v_o.kind <> 'skill_offer' then return jsonb_build_object('ok', false, 'err', 'gone'); end if;
  if v_uid <> v_o.owner_id and (
    not v_o.active
    or public.bos_users_network_blocked(v_uid, v_o.owner_id)
    or not (
      (v_o.status in ('draft', 'confirmed') and v_o.visibility = 'circles'
        and public.bos_skill_link_allowed(v_o.skill_id, v_o.owner_id, v_o.skill_key, false))
      or (v_o.status = 'confirmed' and v_o.visibility = 'all'
        and public.bos_skill_link_allowed(v_o.skill_id, v_o.owner_id, v_o.skill_key, true))
    )
  ) then return jsonb_build_object('ok', false, 'err', 'private'); end if;

  select
    count(*) filter (where lifecycle = 'requested')::int,
    count(*) filter (where lifecycle = 'accepted')::int,
    count(*) filter (where lifecycle = 'done')::int
    into v_requested, v_accepted, v_done
    from public.network_bookings b
   where b.offer_id = p_offer and b.week = v_week and b.kind = 'skill_episode'
     and not public.bos_users_network_blocked(b.owner_id, b.booker_id);

  return jsonb_build_object(
    'ok', true, 'week', v_week, 'slots', v_o.slots_week,
    'requested', v_requested, 'accepted', v_accepted, 'done', v_done,
    'taken', v_accepted + v_done,
    'available', greatest(0, v_o.slots_week - v_accepted - v_done)
  );
end $$;
revoke all on function public.bos_skill_offer_counts(uuid) from public;
grant execute on function public.bos_skill_offer_counts(uuid) to authenticated;

-- Совместимый агрегат слотов для старого клиента; pending requests слот не занимают.
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
  if not found then return 0; end if;
  if v_o.kind = 'circle_support' and v_o.status <> 'confirmed' then return 0; end if;
  if public.bos_users_network_blocked(v_uid, v_o.owner_id) then return 0; end if;
  if not (
    v_o.owner_id = v_uid
    or (v_o.kind = 'circle_support' and public.bos_shares_circle(v_o.owner_id, v_uid))
    or (v_o.kind = 'skill_offer' and v_o.status in ('draft', 'confirmed') and v_o.visibility = 'circles'
      and public.bos_skill_link_allowed(v_o.skill_id, v_o.owner_id, v_o.skill_key, false))
    or (v_o.kind = 'skill_offer' and v_o.status = 'confirmed' and v_o.visibility = 'all'
      and public.bos_skill_link_allowed(v_o.skill_id, v_o.owner_id, v_o.skill_key, true))
  ) then return 0; end if;
  select count(*)::int into v_n from public.network_bookings b
   where b.offer_id = p_offer and b.week = v_week
     and b.lifecycle in ('accepted', 'done')
     and not public.bos_users_network_blocked(b.owner_id, b.booker_id);
  return v_n;
end $$;
revoke all on function public.bos_offer_taken(uuid, text) from public;
grant execute on function public.bos_offer_taken(uuid, text) to authenticated;

-- Для skill-offer благодарность возможна только после двухстороннего done.
-- Для circle_support сохраняем P0-совместимость со старыми accepted bookings.
drop policy if exists thanks_ins on public.thanks;
create policy thanks_ins on public.thanks for insert with check (
  auth.uid() = from_id
  and from_id <> to_id
  and char_length(coalesce(note, '')) <= 140
  and exists (
    select 1 from public.network_offers o
    join public.network_bookings b on b.offer_id = o.id
     where o.id = thanks.offer_id
       and o.owner_id = thanks.to_id
       and b.booker_id = auth.uid()
       and b.week = thanks.week
       and not public.bos_network_blocked_with_me(o.owner_id)
       and (
         o.kind = 'circle_support'
         or (
           o.kind = 'skill_offer' and b.kind = 'skill_episode'
           and b.lifecycle = 'done'
           and b.provider_done_at is not null and b.recipient_done_at is not null
         )
       )
  )
);

-- Block-aware замены P0 aggregate RPC. Сырые ids/notes никогда не пересекают
-- блок, а публичные счётчики считают только действующие незаблокированные связи.
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
  if not found or v_o.kind not in ('circle_support', 'skill_offer') then
    return jsonb_build_object('n', 0, 'mine', false, 'ids', v_ids);
  end if;

  v_visible := v_o.owner_id = v_uid
    or (
      not public.bos_users_network_blocked(v_uid, v_o.owner_id)
      and (
        (v_o.active and public.bos_shares_circle(v_o.owner_id, v_uid))
        or (v_o.kind = 'skill_offer' and v_o.active
          and v_o.status = 'confirmed' and v_o.visibility = 'all'
          and public.bos_skill_link_allowed(v_o.skill_id, v_o.owner_id, v_o.skill_key, true))
        or exists (
          select 1 from public.role_confirmations rc
           where rc.offer_id = p_offer and rc.confirmer_id = v_uid
             and not public.bos_users_network_blocked(v_o.owner_id, rc.confirmer_id)
        )
      )
    );
  if not v_visible then return jsonb_build_object('n', 0, 'mine', false, 'ids', v_ids); end if;

  select count(*), coalesce(bool_or(rc.confirmer_id = v_uid), false)
    into v_n, v_mine
    from public.role_confirmations rc
   where rc.offer_id = p_offer
     and not public.bos_users_network_blocked(v_o.owner_id, rc.confirmer_id);

  v_names := v_o.owner_id = v_uid
    or (not public.bos_users_network_blocked(v_uid, v_o.owner_id)
      and public.bos_shares_circle(v_o.owner_id, v_uid));
  if v_names then
    select coalesce(jsonb_agg(rc.confirmer_id order by rc.created_at), '[]'::jsonb)
      into v_ids
      from public.role_confirmations rc
     where rc.offer_id = p_offer
       and not public.bos_users_network_blocked(v_o.owner_id, rc.confirmer_id)
       and not public.bos_users_network_blocked(v_uid, rc.confirmer_id);
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
    or (
      not public.bos_users_network_blocked(v_uid, v_o.owner_id)
      and (
        (v_o.kind = 'circle_support' and v_o.active
          and public.bos_shares_circle(v_o.owner_id, v_uid))
        or (v_o.kind = 'skill_offer' and v_o.active and v_o.status in ('draft', 'confirmed')
          and v_o.visibility = 'circles'
          and public.bos_skill_link_allowed(v_o.skill_id, v_o.owner_id, v_o.skill_key, false))
        or (v_o.kind = 'skill_offer' and v_o.active and v_o.status = 'confirmed'
          and v_o.visibility = 'all'
          and public.bos_skill_link_allowed(v_o.skill_id, v_o.owner_id, v_o.skill_key, true))
        or exists (
          select 1 from public.network_bookings b
           where b.offer_id = p_offer
             and (b.owner_id = v_uid or b.booker_id = v_uid)
             and not public.bos_users_network_blocked(b.owner_id, b.booker_id)
        )
      )
    );
  if not v_visible then return jsonb_build_object('n', 0, 'mine', false, 'notes', v_notes); end if;

  select count(*), coalesce(bool_or(t.from_id = v_uid), false)
    into v_n, v_mine
    from public.thanks t
   where t.offer_id = p_offer
     and not public.bos_users_network_blocked(t.from_id, t.to_id);

  select coalesce(
      jsonb_agg(t.note order by t.created_at)
        filter (where t.note is not null and t.note <> ''),
      '[]'::jsonb
    ) into v_notes
    from public.thanks t
   where t.offer_id = p_offer
     and (v_o.owner_id = v_uid or t.from_id = v_uid)
     and not public.bos_users_network_blocked(t.from_id, t.to_id);
  return jsonb_build_object('n', v_n, 'mine', v_mine, 'notes', v_notes);
end $$;
revoke all on function public.bos_offer_thanks_summary(uuid) from public;
grant execute on function public.bos_offer_thanks_summary(uuid) to authenticated;

create or replace function public.bos_user_thanks_count(p_user uuid)
returns int language sql security definer stable set search_path = public as $$
  select case
    when auth.uid() is null or p_user is null
      or public.bos_users_network_blocked(auth.uid(), p_user) then 0
    else (
      select count(*)::int from public.thanks t
       where t.to_id = p_user
         and not public.bos_users_network_blocked(t.from_id, t.to_id)
    )
  end;
$$;
revoke all on function public.bos_user_thanks_count(uuid) from public;
grant execute on function public.bos_user_thanks_count(uuid) to authenticated;

-- 10. SAFETY RPC --------------------------------------------------------------

create or replace function public.bos_block_network_user(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_skill uuid;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  if p_user is null or p_user = v_uid then return jsonb_build_object('ok', false, 'err', 'target'); end if;
  if not exists (select 1 from public.profiles where id = p_user) then
    return jsonb_build_object('ok', false, 'err', 'gone');
  end if;
  insert into public.network_blocks (blocker_id, blocked_id)
  values (v_uid, p_user) on conflict do nothing;

  -- Блок немедленно вычитает эту связь из evidence обеих сторон.
  for v_skill in
    select id from public.user_skills
     where owner_id in (v_uid, p_user)
     order by id
  loop
    perform public.bos_refresh_user_skill(v_skill);
  end loop;
  return jsonb_build_object('ok', true, 'blocked', true, 'user_id', p_user);
end $$;
revoke all on function public.bos_block_network_user(uuid) from public;
grant execute on function public.bos_block_network_user(uuid) to authenticated;

create or replace function public.bos_unblock_network_user(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_skill uuid;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  if p_user is null or p_user = v_uid then return jsonb_build_object('ok', false, 'err', 'target'); end if;
  delete from public.network_blocks where blocker_id = v_uid and blocked_id = p_user;
  for v_skill in
    select id from public.user_skills
     where owner_id in (v_uid, p_user)
     order by id
  loop
    perform public.bos_refresh_user_skill(v_skill);
  end loop;
  -- Evidence может снова стать trusted, но offers намеренно не включаются сами.
  return jsonb_build_object('ok', true, 'blocked', false, 'user_id', p_user);
end $$;
revoke all on function public.bos_unblock_network_user(uuid) from public;
grant execute on function public.bos_unblock_network_user(uuid) to authenticated;

drop function if exists public.bos_report_network(uuid, uuid, text, text);
drop function if exists public.bos_report_network(uuid, text, jsonb);
create function public.bos_report_network(
  p_user uuid,
  p_reason text,
  p_context jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_target uuid := p_user;
  v_context jsonb := coalesce(p_context, '{}'::jsonb);
  v_offer uuid;
  v_episode uuid;
  v_episode_offer uuid;
  v_episode_other uuid;
  v_offer_owner uuid;
  v_report uuid;
  v_details text;
  v_allowed boolean := false;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'err', 'auth'); end if;
  if p_reason is null or p_reason not in ('spam', 'unsafe', 'misleading_skill', 'harassment', 'other') then
    return jsonb_build_object('ok', false, 'err', 'reason');
  end if;
  if jsonb_typeof(v_context) <> 'object' then
    return jsonb_build_object('ok', false, 'err', 'context');
  end if;
  begin
    v_offer := nullif(v_context->>'offer_id', '')::uuid;
    v_episode := nullif(v_context->>'episode_id', '')::uuid;
  exception when invalid_text_representation then
    return jsonb_build_object('ok', false, 'err', 'context');
  end;
  v_details := nullif(btrim(coalesce(v_context->>'note', '')), '');
  if char_length(coalesce(v_details, '')) > 500 then
    return jsonb_build_object('ok', false, 'err', 'details_too_long');
  end if;

  if v_target is null or v_target = v_uid then
    return jsonb_build_object('ok', false, 'err', 'target');
  end if;

  -- Episode UUID принимается только от его участника; он однозначно определяет
  -- другого человека и связанный offer, не создавая UUID-oracle.
  if v_episode is not null then
    select b.offer_id,
           case
             when b.owner_id = v_uid then b.booker_id
             when b.booker_id = v_uid then b.owner_id
             else null
           end
      into v_episode_offer, v_episode_other
      from public.network_bookings b
     where b.id = v_episode;
    if not found or v_episode_other is null then
      return jsonb_build_object('ok', false, 'err', 'target_unavailable');
    end if;
    if v_target <> v_episode_other then
      return jsonb_build_object('ok', false, 'err', 'target_mismatch');
    end if;
    if v_offer is not null and v_offer <> v_episode_offer then
      return jsonb_build_object('ok', false, 'err', 'context_mismatch');
    end if;
    v_offer := v_episode_offer;
    v_allowed := true;
  end if;

  if v_offer is not null then
    select o.owner_id into v_offer_owner
      from public.network_offers o where o.id = v_offer;
    if not found then return jsonb_build_object('ok', false, 'err', 'target_unavailable'); end if;

    if v_episode is null then
      if v_target <> v_offer_owner then
        return jsonb_build_object('ok', false, 'err', 'target_mismatch');
      end if;
      select exists (
        select 1 from public.network_offers o
         where o.id = v_offer
           and (
             public.bos_users_network_blocked(v_uid, o.owner_id)
             or
             (o.kind = 'circle_support' and o.active
               and public.bos_shares_circle(o.owner_id, v_uid))
             or (o.kind = 'skill_offer' and o.active and o.status in ('draft', 'confirmed')
               and o.visibility = 'circles'
               and public.bos_skill_link_allowed(o.skill_id, o.owner_id, o.skill_key, false))
             or (o.kind = 'skill_offer' and o.active and o.status = 'confirmed'
               and o.visibility = 'all'
               and public.bos_skill_link_allowed(o.skill_id, o.owner_id, o.skill_key, true))
             or exists (
               select 1 from public.network_bookings b
                where b.offer_id = o.id
                  and (b.owner_id = v_uid or b.booker_id = v_uid)
             )
           )
      ) into v_allowed;
    end if;
  end if;

  -- Жалоба без object context допустима только на человека, с которым уже есть
  -- социальная связь, эпизод или реально видимый публичный skill offer.
  if v_offer is null and v_episode is null then
    select
      public.bos_shares_circle(v_target, v_uid)
      or public.bos_users_network_blocked(v_uid, v_target)
      or exists (
        select 1 from public.network_bookings b
         where (b.owner_id = v_uid and b.booker_id = v_target)
            or (b.owner_id = v_target and b.booker_id = v_uid)
      )
      or exists (
        select 1 from public.network_offers o
         where o.owner_id = v_target
           and o.kind = 'skill_offer' and o.active
           and o.status = 'confirmed' and o.visibility = 'all'
           and public.bos_skill_link_allowed(o.skill_id, o.owner_id, o.skill_key, true)
      )
      into v_allowed;
  end if;

  if not v_allowed or not exists (select 1 from public.profiles where id = v_target) then
    return jsonb_build_object('ok', false, 'err', 'target_unavailable');
  end if;

  -- Повторный тап/ретрай не создаёт очередь одинаковых жалоб.
  select r.id into v_report
    from public.network_reports r
   where r.reporter_id = v_uid
     and r.target_user_id = v_target
     and r.target_offer_id is not distinct from v_offer
     and r.target_episode_id is not distinct from v_episode
     and r.reason_key = p_reason
     and r.created_at >= now() - interval '10 minutes'
   order by r.created_at desc
   limit 1;
  if found then
    return jsonb_build_object('ok', true, 'dup', true, 'report_id', v_report, 'status', 'submitted');
  end if;

  insert into public.network_reports (
    reporter_id, target_user_id, target_offer_id, target_episode_id, reason_key, details
  ) values (
    v_uid, v_target, v_offer, v_episode, p_reason, v_details
  ) returning id into v_report;

  -- details намеренно не возвращаем и не публикуем ни в одном aggregate RPC.
  return jsonb_build_object('ok', true, 'report_id', v_report, 'status', 'submitted');
end $$;
revoke all on function public.bos_report_network(uuid, text, jsonb) from public;
grant execute on function public.bos_report_network(uuid, text, jsonb) to authenticated;

-- 11. ФИНАЛЬНЫЕ ГРАНТЫ / SCHEMA RELOAD ---------------------------------------

grant select on public.network_offers to authenticated;
grant select on public.network_bookings to authenticated;

notify pgrst, 'reload schema';

commit;

-- POST-DEPLOY SMOKE TESTS (под разными authenticated users):
-- 1. Старый netUpsertOffer создаёт только circle_support draft/circles/free/L1.
-- 2. bos_claim_skill('product_design') → needs_skill_offer=true, legacy source не нужен.
-- 3. bos_upsert_skill_offer(review + three_recommendations) создаёт серверные
--    title/descr и active draft/circles: его видит общий
--    принятый круг, но не посторонний пользователь.
-- 4. После двух role confirmations offer = confirmed/circles и остаётся доступен своим.
-- 5. Два подтверждения + два two-sided done skill_episode от РАЗНЫХ booker → eligible=true.
-- 6. bos_publish_skill_offer(id) до evidence → not_trusted; после → public row.
-- 7. Старый bos_book_offer(skill_offer,...) → request_required.
-- 8. request→accept→provider done→recipient done; только после второго lifecycle=done.
-- 9. block в любую сторону скрывает public offer/episode и вычитает evidence.
-- 10. bos_skill_episode_contact доступен участникам только в accepted/done, после
--    block возвращает blocked и никогда не содержит отдельного raw tg_id.
-- 11. bos_report_network(user, reason, {offer_id|episode_id,note}) принимает только
--    видимый offer/свой episode; details видит только reporter/service role.
-- 12. Повторный запуск ЭТОГО файла проходит; повторный старый P0 после него запрещён.

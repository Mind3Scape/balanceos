-- ЖАЛОБЫ (экран «Пожаловаться» из кадров Figma).
-- Таблица insert-only: человек может ПОДАТЬ жалобу, но не может читать чужие (и свои
-- тоже — просмотр только из дашборда Supabase). Прогнать один раз в SQL Editor.

create table if not exists public.reports (
  id          bigint generated always as identity primary key,
  from_uid    uuid not null default auth.uid(),
  kind        text not null default 'team',      -- team | user
  target_id   text,                              -- cloudId группы или uid человека
  reason      text not null,                     -- id причины из списка кадра
  sub_reason  text,                              -- id подпричины (есть пока только у «Ненависти»)
  text        text not null default '',          -- описание, максимум 200 знаков
  created_at  timestamptz not null default now()
);

alter table public.reports enable row level security;

-- Вставлять может любой вошедший, но только от своего имени и не длиннее 200 знаков.
drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports
  for insert to authenticated
  with check (from_uid = auth.uid() and char_length(text) <= 200);

-- select-политики НЕТ намеренно: чтение жалоб — только сервисной ролью/из дашборда.

-- BalanceOS — КРАСИВЫЕ короткие реферальные ссылки.
-- Было:  t.me/BalanceOS8_bot?startapp=ref_550e8400-e29b-41d4-a716-446655440000  (длинный UUID)
-- Стало: t.me/BalanceOS8_bot?startapp=ref_3a9f2c1                               (короткий код)
--
-- Каждому профилю даётся короткий уникальный `ref_code`. Ссылка несёт его; функция входа
-- tg-auth превращает код обратно в UUID пригласившего (см. обновлённый tg-auth/index.ts).
--
-- DEPLOY (Дэвид, один раз):
--   1) Supabase → SQL Editor → вставь ВЕСЬ этот файл → Run.
--   2) Передеплой функцию tg-auth (Supabase → Edge Functions → tg-auth → вставь новый
--      tg-auth/index.ts → Deploy). Без шага 2 короткие коды не будут засчитываться.
-- Клиент уже умеет и так, и так: пока не задеплоено — ссылка падает на старый UUID (работает),
-- после — сама начинает отдавать короткий код. Ничего не ломается в переходный момент.

-- 1) короткий уникальный код у профиля
alter table public.profiles add column if not exists ref_code text unique;

-- 2) генератор: 7 символов, повтор пока не уникален (md5 — есть всегда, без расширений)
create or replace function public.gen_ref_code() returns text
language plpgsql as $$
declare c text;
begin
  loop
    c := substr(md5(random()::text || clock_timestamp()::text), 1, 7);
    exit when not exists (select 1 from public.profiles where ref_code = c);
  end loop;
  return c;
end; $$;

-- 3) выдать код всем, у кого его ещё нет (существующие юзеры)
update public.profiles set ref_code = public.gen_ref_code() where ref_code is null;

-- 4) новым профилям код выдаётся сам (расширяем существующий триггер handle_new_user).
--    referred_by по-прежнему UUID — tg-auth кладёт в метаданные уже разрешённый id.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, tg_id, username, referred_by, ref_code)
  values (
    new.id,
    new.raw_user_meta_data->>'tg_id',
    coalesce(new.raw_user_meta_data->>'username', ''),
    (new.raw_user_meta_data->>'referred_by')::uuid,
    public.gen_ref_code()
  )
  on conflict (id) do nothing;
  return new;
end; $$;

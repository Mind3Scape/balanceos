-- ═══════════════════════════════════════════════════════════════════════════════
-- ЖИВАЯ АВТО-ПРИВЯЗКА (A). Запустить ОДИН раз в Supabase → SQL Editor. Идемпотентно.
--
-- Смысл: вступил в ПРИВАТНЫЙ круг/команду ИЛИ в общую привычку → его profiles.referred_by
-- автоматически ставится на ВЛАДЕЛЬЦА (если ещё пуст). Так дерево «Связей» во «Вселенной»
-- наполняется САМО из реальных кругов — без ручного backfill, на каждое будущее вступление.
-- Логика зеркалит supabase/patch_referral_backfill.sql (тот — разово по прошлым; этот — вперёд).
--
-- Правила: пишем ТОЛЬКО где referred_by пуст (НИКОГДА не перетираем пригласившего); не сам-на-себя;
-- круги — только ПРИВАТНЫЕ (позвали лично), участник должен быть принят (role<>'pending').
-- ═══════════════════════════════════════════════════════════════════════════════

create or replace function public.bos_autolink_referrer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_owner uuid;
begin
  if TG_TABLE_NAME = 'team_members' then
    if NEW.role = 'pending' then return NEW; end if;              -- заявка ещё не принята — не считаем
    select t.owner_id into v_owner from public.teams t
      where t.id = NEW.team_id and coalesce(t.vis, 'private') = 'private';
  elsif TG_TABLE_NAME = 'shared_habit_members' then
    select sh.owner_id into v_owner from public.shared_habits sh where sh.code = NEW.code;
  end if;

  if v_owner is not null and v_owner <> NEW.user_id then
    update public.profiles set referred_by = v_owner
      where id = NEW.user_id and referred_by is null;            -- только если пусто → не перетираем
  end if;
  return NEW;
end;
$$;

drop trigger if exists bos_autolink_team on public.team_members;
create trigger bos_autolink_team
  after insert or update of role on public.team_members            -- прямое вступление ИЛИ принятие заявки
  for each row execute function public.bos_autolink_referrer();

drop trigger if exists bos_autolink_habit on public.shared_habit_members;
create trigger bos_autolink_habit
  after insert on public.shared_habit_members
  for each row execute function public.bos_autolink_referrer();

-- ── ДИАГНОСТИКА «реальные vs тестовые» (по желанию — раскомментируй и запусти) ──────────────
-- Реальный Telegram-юзер = есть tg_id; веб-аноним/тест = tg_id пустой. Сколько каких СРЕДИ тех,
-- кто показывается во «Вселенной» (pub_orbit не пуст):
-- select (tg_id is not null) as real_telegram, count(*)
--   from public.profiles where pub_orbit is not null group by 1;
-- Сколько людей связано (referred_by заполнен) — до/после backfill+autolink:
-- select count(*) as with_inviter from public.profiles where referred_by is not null;

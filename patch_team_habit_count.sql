-- patch_team_habit_count.sql
-- Adds a per-habit default count to TEAM habits, so a trainer's «норма по умолчанию»
-- (e.g. «Отжимания · 30 раз/день») propagates to every member's adopted personal copy,
-- which each member can then adjust to their own number (30 / 50).
--
-- SAFE + idempotent. The app already works WITHOUT this migration (team-habit creation
-- falls back to a base insert and adopted copies default to 1 раз/день). Run this in the
-- Supabase SQL editor to ACTIVATE count propagation to OTHER members.
--
-- No RLS change needed — existing team_habits policies already govern insert/select.

alter table public.team_habits
  add column if not exists goal_per_day integer not null default 1;

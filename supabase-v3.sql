-- ============================================================
--  NEMEA v3 — medals, levels, public profiles, leaderboard.
--
--  Supabase -> SQL Editor -> New query -> paste all -> Run.
--  Additive. Drops nothing. Safe to run twice.
-- ============================================================

-- ------------------------------------------------------------
--  1. The numbers other people are allowed to see
--
--  Medals are worked out on the device from workout_days, which is
--  private. These columns are the published copy — written by the
--  app when you finish a workout, read by anyone who taps your name
--  on Discover. Nothing here reveals what you weigh or what you ate.
-- ------------------------------------------------------------
alter table public.profiles add column if not exists level          integer not null default 1;
alter table public.profiles add column if not exists medals         jsonb   not null default '{}'::jsonb;
alter table public.profiles add column if not exists best_streak    integer not null default 0;
alter table public.profiles add column if not exists current_streak integer not null default 0;
alter table public.profiles add column if not exists stats_at       timestamptz;

-- ------------------------------------------------------------
--  2. Reading somebody else's profile
--
--  A function rather than a relaxed policy on `profiles`, because
--  row-level security cannot hide a column. This returns the six
--  fields that are meant to be public and physically cannot return
--  height, weight or the calorie target.
-- ------------------------------------------------------------
create or replace function public.public_profile(uid uuid)
returns table (
  id             uuid,
  name           text,
  level          integer,
  medals         jsonb,
  best_streak    integer,
  current_streak integer
)
language sql security definer stable set search_path = public as $$
  select p.id,
         split_part(coalesce(nullif(trim(p.full_name), ''), 'Someone'), ' ', 1),
         p.level, p.medals, p.best_streak, p.current_streak
    from public.profiles p
   where p.id = uid
     and auth.uid() is not null
$$;

-- ------------------------------------------------------------
--  3. The board
--
--  Longest unbroken run, then current run. First names only — the
--  same rule the feed follows.
-- ------------------------------------------------------------
create or replace function public.leaderboard(top integer default 20)
returns table (
  id             uuid,
  name           text,
  level          integer,
  medals         jsonb,
  best_streak    integer,
  current_streak integer
)
language sql security definer stable set search_path = public as $$
  select p.id,
         split_part(coalesce(nullif(trim(p.full_name), ''), 'Someone'), ' ', 1),
         p.level, p.medals, p.best_streak, p.current_streak
    from public.profiles p
   where auth.uid() is not null
     and p.best_streak > 0
   order by p.best_streak desc, p.current_streak desc, p.created_at asc
   limit greatest(1, least(coalesce(top, 20), 100))
$$;

grant execute on function public.public_profile(uuid) to authenticated;
grant execute on function public.leaderboard(integer)  to authenticated;

-- ============================================================
--  Done. Medals and levels appear as people train — there is
--  nothing to start and nothing to switch on.
-- ============================================================

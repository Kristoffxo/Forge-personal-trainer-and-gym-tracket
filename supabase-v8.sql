-- ============================================================
--  REPPO v8 — the journey.
--
--  Supabase -> SQL Editor -> New query -> paste all -> Run.
--  Additive. Drops nothing. Safe to run twice.
-- ============================================================

-- ------------------------------------------------------------
--  1. What you weighed when you got there
--
--  One row per milestone reached. The starting point is milestone 0,
--  written the first time the journey screen is opened, so there is
--  always something to measure the rest against.
-- ------------------------------------------------------------
create table if not exists public.journey_entries (
  user_id    uuid not null references auth.users on delete cascade,
  milestone  smallint not null check (milestone between 0 and 13),
  day_count  integer not null default 0,
  weight_kg  numeric(5,1),
  bmi        numeric(4,1),
  muscle_kg  numeric(5,1),
  note       text,
  created_at timestamptz not null default now(),
  primary key (user_id, milestone)
);

create index if not exists journey_user_idx
  on public.journey_entries (user_id, milestone);

alter table public.journey_entries enable row level security;

drop policy if exists journey_read   on public.journey_entries;
drop policy if exists journey_write  on public.journey_entries;
drop policy if exists journey_update on public.journey_entries;

-- Yours and nobody else's. Weight and body composition are health
-- information; the database enforces that, not only the app.
create policy journey_read on public.journey_entries for select
  using (user_id = auth.uid());
create policy journey_write on public.journey_entries for insert
  with check (user_id = auth.uid());
create policy journey_update on public.journey_entries for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------
--  2. How many days you have trained, ever
--
--  The streak is gone. What the journey counts is the number of
--  distinct days with a workout on them — rest days cost nothing and
--  a gap takes nothing away.
-- ------------------------------------------------------------
create or replace function public.days_trained()
returns integer language sql stable security definer set search_path = public as $$
  select count(distinct day)::int
    from public.workout_days
   where user_id = auth.uid();
$$;

grant execute on function public.days_trained() to authenticated;

-- ------------------------------------------------------------
--  3. The board ranks by days trained, not by longest run
--
--  Ranking people by their longest unbroken run rewards whoever
--  most recently had a clear fortnight. Days trained rewards
--  turning up, which is the thing the app is actually for, and it
--  is the same number the journey map counts.
-- ------------------------------------------------------------
--  The profile columns the board reads. They belong to v3, which
--  has not been run on every project, and the functions below select
--  them by name — so add them here rather than failing on the first
--  database that skipped a migration. All no-ops where they exist.
alter table public.profiles add column if not exists level          integer not null default 1;
alter table public.profiles add column if not exists medals         jsonb   not null default '{}'::jsonb;
alter table public.profiles add column if not exists best_streak    integer not null default 0;
alter table public.profiles add column if not exists current_streak integer not null default 0;
alter table public.profiles add column if not exists stats_at       timestamptz;
alter table public.profiles add column if not exists days_trained   integer not null default 0;

-- `create or replace` cannot change a function's return type, and
-- this one gained columns since it was first written — so drop it
-- first. Dropping an RPC is safe: nothing stores a reference to it.
drop function if exists public.leaderboard(integer);

create or replace function public.leaderboard(top integer default 20)
returns table (
  id             uuid,
  name           text,
  level          integer,
  medals         jsonb,
  best_streak    integer,
  current_streak integer,
  days_trained   integer
)
language sql security definer stable set search_path = public as $$
  select p.id,
         split_part(coalesce(nullif(trim(p.full_name), ''), 'Someone'), ' ', 1),
         p.level, p.medals, p.best_streak, p.current_streak, p.days_trained
    from public.profiles p
   where auth.uid() is not null
     and p.days_trained > 0
   order by p.days_trained desc, p.created_at asc
   limit greatest(1, least(coalesce(top, 20), 100))
$$;

grant execute on function public.leaderboard(integer) to authenticated;

--  and the same number on somebody's profile card, or tapping a name
--  on the board shows a journey with nothing in it
-- `create or replace` cannot change a function's return type, and
-- this one gained columns since it was first written — so drop it
-- first. Dropping an RPC is safe: nothing stores a reference to it.
drop function if exists public.public_profile(uuid);

create or replace function public.public_profile(uid uuid)
returns table (
  id             uuid,
  name           text,
  level          integer,
  medals         jsonb,
  best_streak    integer,
  current_streak integer,
  days_trained   integer
)
language sql security definer stable set search_path = public as $$
  select p.id,
         split_part(coalesce(nullif(trim(p.full_name), ''), 'Someone'), ' ', 1),
         p.level, p.medals, p.best_streak, p.current_streak, p.days_trained
    from public.profiles p
   where auth.uid() is not null
     and p.id = uid
$$;

grant execute on function public.public_profile(uuid) to authenticated;

-- ============================================================
--  Done.
-- ============================================================

-- ============================================================
--  v8b — profile pictures
--
--  Run this too. Same bucket as the feed, one file per person at
--  avatars/<user id>.jpg. Only the path is stored on the profile.
-- ============================================================
alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists avatar_at   timestamptz;

--  The board and profile cards carry the picture, so a face can be
--  shown next to a name without a second round trip per row.
-- `create or replace` cannot change a function's return type, and
-- this one gained columns since it was first written — so drop it
-- first. Dropping an RPC is safe: nothing stores a reference to it.
drop function if exists public.leaderboard(integer);

create or replace function public.leaderboard(top integer default 20)
returns table (
  id             uuid,
  name           text,
  level          integer,
  medals         jsonb,
  best_streak    integer,
  current_streak integer,
  days_trained   integer,
  avatar_path    text,
  avatar_at      timestamptz
)
language sql security definer stable set search_path = public as $$
  select p.id,
         split_part(coalesce(nullif(trim(p.full_name), ''), 'Someone'), ' ', 1),
         p.level, p.medals, p.best_streak, p.current_streak, p.days_trained,
         p.avatar_path, p.avatar_at
    from public.profiles p
   where auth.uid() is not null
     and p.days_trained > 0
   order by p.days_trained desc, p.created_at asc
   limit greatest(1, least(coalesce(top, 20), 100))
$$;

-- `create or replace` cannot change a function's return type, and
-- this one gained columns since it was first written — so drop it
-- first. Dropping an RPC is safe: nothing stores a reference to it.
drop function if exists public.public_profile(uuid);

create or replace function public.public_profile(uid uuid)
returns table (
  id             uuid,
  name           text,
  level          integer,
  medals         jsonb,
  best_streak    integer,
  current_streak integer,
  days_trained   integer,
  avatar_path    text,
  avatar_at      timestamptz
)
language sql security definer stable set search_path = public as $$
  select p.id,
         split_part(coalesce(nullif(trim(p.full_name), ''), 'Someone'), ' ', 1),
         p.level, p.medals, p.best_streak, p.current_streak, p.days_trained,
         p.avatar_path, p.avatar_at
    from public.profiles p
   where auth.uid() is not null
     and p.id = uid
$$;

grant execute on function public.leaderboard(integer)  to authenticated;
grant execute on function public.public_profile(uuid)  to authenticated;

--  Posts carry the poster's picture the way they already carry the
--  name, so the feed renders in one query instead of a join per row.
alter table public.posts add column if not exists avatar_path text;
alter table public.posts add column if not exists avatar_at   timestamptz;

--  Overwriting your own picture is an UPDATE on storage.objects, not
--  only an INSERT, and there was no update policy — so the second
--  time somebody changed their picture it was refused.
drop policy if exists posts_img_update on storage.objects;
create policy posts_img_update on storage.objects for update
  using (
    bucket_id = 'posts'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'posts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

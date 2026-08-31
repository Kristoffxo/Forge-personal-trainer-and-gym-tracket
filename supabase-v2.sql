-- ============================================================
--  NEMEA v2 — challenges, likes, onboarding, notifications.
--
--  Supabase -> SQL Editor -> New query -> paste all -> Run.
--  Additive. Drops nothing. Safe to run twice.
-- ============================================================

-- ------------------------------------------------------------
--  1. What we ask people when they first open the app
-- ------------------------------------------------------------
alter table public.profiles add column if not exists experience text;   -- beginner | intermediate | advanced
alter table public.profiles add column if not exists goal       text;   -- lose | keep | gain
alter table public.profiles add column if not exists sex        text;   -- male | female
alter table public.profiles add column if not exists birth_year integer;
alter table public.profiles add column if not exists onboarded  boolean not null default false;

-- ------------------------------------------------------------
--  2. Did you train today?
--
--  One row per person per day. Everything that counts as a
--  workout — the planner, a gym session, a home session — writes
--  the same row, so a challenge does not care where you trained.
-- ------------------------------------------------------------
create table if not exists public.workout_days (
  user_id    uuid not null references auth.users on delete cascade,
  day        date not null,
  kind       text,                       -- planner | gym | home | challenge
  name       text,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- ------------------------------------------------------------
--  3. Challenges
--
--  `grace_used` is the one missed day everybody gets. The app
--  tells you it has been spent; the second miss ends the run.
-- ------------------------------------------------------------
create table if not exists public.challenges (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users on delete cascade,
  days       integer not null,
  started_on date not null default (now() at time zone 'utc')::date,
  grace_used boolean not null default false,
  status     text not null default 'active',   -- active | done | broken
  ended_on   date,
  created_at timestamptz not null default now()
);
create index if not exists challenges_user_idx on public.challenges (user_id, status);

--  only one running at a time
create unique index if not exists challenges_one_active
  on public.challenges (user_id) where status = 'active';

-- ------------------------------------------------------------
--  4. Likes, which nobody can trace
--
--  The table has a user_id because a like has to be unique per
--  person. The read policy hides everyone else's row, so the app
--  can tell you *that* people liked a post and never *who*.
--  Counts come from the security-definer function below, which
--  returns numbers and no identities at all.
-- ------------------------------------------------------------
create table if not exists public.likes (
  post_id    bigint not null references public.posts on delete cascade,
  user_id    uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create or replace function public.like_counts(ids bigint[])
returns table (post_id bigint, n bigint)
language sql security definer stable set search_path = public as $$
  select l.post_id, count(*) from public.likes l
   where l.post_id = any(ids)
   group by l.post_id
$$;

-- ------------------------------------------------------------
--  5. Where to send the six o'clock notification
--
--  The push is sent with no payload — the service worker picks
--  the quote itself — so nothing personal is ever in transit.
-- ------------------------------------------------------------
create table if not exists public.push_subs (
  endpoint   text primary key,
  user_id    uuid not null references auth.users on delete cascade,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subs_user_idx on public.push_subs (user_id);

-- ------------------------------------------------------------
--  6. Access rules
-- ------------------------------------------------------------
alter table public.workout_days enable row level security;
alter table public.challenges   enable row level security;
alter table public.likes        enable row level security;
alter table public.push_subs    enable row level security;

drop policy if exists wd_read    on public.workout_days;
drop policy if exists wd_write   on public.workout_days;
drop policy if exists ch_read    on public.challenges;
drop policy if exists ch_write   on public.challenges;
drop policy if exists ch_update  on public.challenges;
drop policy if exists likes_read on public.likes;
drop policy if exists likes_add  on public.likes;
drop policy if exists likes_del  on public.likes;
drop policy if exists ps_read    on public.push_subs;
drop policy if exists ps_write   on public.push_subs;
drop policy if exists ps_del     on public.push_subs;

create policy wd_read  on public.workout_days for select using (user_id = auth.uid());
create policy wd_write on public.workout_days for insert with check (user_id = auth.uid());

create policy ch_read   on public.challenges for select using (user_id = auth.uid());
create policy ch_write  on public.challenges for insert with check (user_id = auth.uid());
create policy ch_update on public.challenges for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

--  you can only ever see your own like — this is what makes them anonymous
create policy likes_read on public.likes for select using (user_id = auth.uid());
create policy likes_add  on public.likes for insert with check (user_id = auth.uid());
create policy likes_del  on public.likes for delete using (user_id = auth.uid());

create policy ps_read  on public.push_subs for select using (user_id = auth.uid());
create policy ps_write on public.push_subs for insert with check (user_id = auth.uid());
create policy ps_del   on public.push_subs for delete using (user_id = auth.uid());

grant execute on function public.like_counts(bigint[]) to anon, authenticated;

-- ============================================================
--  Done.
-- ============================================================

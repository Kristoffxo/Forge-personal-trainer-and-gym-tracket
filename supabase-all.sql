-- ============================================================
--  REPPO — everything, in order.
--
--  Supabase -> SQL Editor -> New query -> paste all -> Run.
--
--  Every migration the app has ever needed, concatenated in the
--  order they were written. All of it is additive and all of it is
--  safe to run twice: tables and indexes are guarded, policies are
--  dropped before they are created, functions are create-or-replace.
--
--  Run this when you do not know which migrations a project has
--  had. It drops nothing and deletes no data.
-- ============================================================


-- ============================================================
--  supabase-setup.sql
-- ============================================================
-- ============================================================
--  REPPO — full setup with real email/password accounts
--  Supabase -> SQL Editor -> New query -> paste all -> Run
--  Safe to run more than once.
-- ============================================================

-- These four tables used to be dropped here before being recreated,
-- directly under a comment promising the file was safe to run twice.
-- It was not: re-running it deleted every profile, every diary entry
-- and every plan in the database. The tables below are `if not
-- exists`, so nothing needs dropping. A deliberate wipe lives in
-- supabase-reset.sql, where somebody has to mean it.

-- ---------- who each account is ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  full_name  text,
  role       text not null default 'client' check (role in ('client','coach')),
  height_cm  numeric,
  weight_kg  numeric,
  goal_kcal  integer default 2200,
  created_at timestamptz not null default now()
);

-- a profile row is created automatically the moment someone signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- "is the person asking a coach?" — security definer so it can read profiles
-- without tripping the very policies it is being used by
create or replace function public.is_coach()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and role = 'coach');
$$;

-- ---------- chat ----------
create table if not exists public.messages (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users on delete cascade,
  sender     text not null check (sender in ('client','coach')),
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_user_idx on public.messages (user_id, created_at);

-- ---------- food diary ----------
create table if not exists public.diary (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users on delete cascade,
  day        date not null,
  meal       text not null,
  name       text not null,
  portion    text,
  grams      numeric,
  kcal       numeric,
  protein    numeric,
  carbs      numeric,
  fat        numeric,
  created_at timestamptz not null default now()
);
create index if not exists diary_user_idx on public.diary (user_id, day);

-- ---------- training plan ----------
create table if not exists public.plans (
  user_id     uuid primary key references auth.users on delete cascade,
  split       text,
  per_session integer,
  days        jsonb,
  updated_at  timestamptz not null default now()
);

-- ============================================================
--  ACCESS RULES
--  Each person reads and writes only their own rows.
--  A coach can read everyone, and can reply into any thread.
--  This is enforced by the database, not by the app.
-- ============================================================
alter table public.profiles enable row level security;
alter table public.messages enable row level security;
alter table public.diary    enable row level security;
alter table public.plans    enable row level security;

-- Dropped first so this file can be run again without
-- failing on a policy that already exists.
drop policy if exists profiles_read on public.profiles;
drop policy if exists profiles_write on public.profiles;
drop policy if exists messages_read on public.messages;
drop policy if exists messages_write on public.messages;
drop policy if exists diary_read on public.diary;
drop policy if exists diary_write on public.diary;
drop policy if exists diary_delete on public.diary;
drop policy if exists plans_read on public.plans;
drop policy if exists plans_write on public.plans;
drop policy if exists plans_update on public.plans;

create policy profiles_read   on public.profiles for select
  using (id = auth.uid() or public.is_coach());
create policy profiles_write  on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

create policy messages_read   on public.messages for select
  using (user_id = auth.uid() or public.is_coach());
create policy messages_write  on public.messages for insert
  with check ((user_id = auth.uid() and sender = 'client') or public.is_coach());

create policy diary_read      on public.diary for select
  using (user_id = auth.uid() or public.is_coach());
create policy diary_write     on public.diary for insert
  with check (user_id = auth.uid());
create policy diary_delete    on public.diary for delete
  using (user_id = auth.uid());

create policy plans_read      on public.plans for select
  using (user_id = auth.uid() or public.is_coach());
create policy plans_write     on public.plans for insert
  with check (user_id = auth.uid());
create policy plans_update    on public.plans for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- live chat updates
-- Postgres has no "add table if not exists" for a publication, and
-- adding one twice is an error rather than a no-op — so ask first.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- ============================================================
--  Kept for reference. Reppo has no coach role in the app any more,
--  the coach (change the email to whichever he registered with):
--
--    update public.profiles set role = 'coach'
--    where id = (select id from auth.users where email = 'you@example.com');
-- ============================================================


-- ============================================================
--  supabase-upgrade.sql
-- ============================================================
-- ============================================================
--  REPPO — upgrade: the feed, workout logging, and the extra
--  profile fields the calorie target is worked out from.
--
--  Supabase -> SQL Editor -> New query -> paste all -> Run.
--
--  This one is ADDITIVE. Unlike supabase-setup.sql it drops
--  nothing, so it is safe to run against a project that already
--  has people and food diaries in it. Safe to run twice.
-- ============================================================

-- ------------------------------------------------------------
--  1. Profile: what the daily calorie target is derived from
-- ------------------------------------------------------------
alter table public.profiles add column if not exists sex        text;
alter table public.profiles add column if not exists birth_year integer;
alter table public.profiles add column if not exists activity   text;
alter table public.profiles add column if not exists goal       text;
alter table public.profiles add column if not exists onboarded  boolean not null default false;

-- ------------------------------------------------------------
--  2. The feed
--
--  A post carries the poster's first name and nothing else. There
--  is no username column and no location column, by design — the
--  only identity on the feed is a first name.
-- ------------------------------------------------------------
create table if not exists public.posts (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users on delete cascade,
  name       text not null,
  image_path text not null,          -- object key in the 'posts' storage bucket
  caption    text,
  created_at timestamptz not null default now()
);
create index if not exists posts_recent_idx on public.posts (created_at desc);

--  One photo a day, each. The feed is meant to be a record you can look
--  back on rather than a stream, and a unique index is the only place
--  this can be enforced honestly — a check in the app is a suggestion.
--  The day is UTC so the client and the database always agree on it.
create unique index if not exists posts_one_a_day
  on public.posts (user_id, ((created_at at time zone 'utc')::date));

create table if not exists public.comments (
  id         bigint generated always as identity primary key,
  post_id    bigint not null references public.posts on delete cascade,
  user_id    uuid not null references auth.users on delete cascade,
  name       text not null,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id, created_at);

--  Anyone can hide anyone. Blocking is enforced in the read policies
--  below, so a blocked person's posts and comments simply are not
--  returned — the app does not have to filter them itself.
create table if not exists public.blocks (
  blocker    uuid not null references auth.users on delete cascade,
  blocked    uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked)
);

--  Reports are write-only from the app. Nobody can read them back
--  through the API; they are for whoever runs the app to look at in
--  the dashboard. An app that lets people post photographs needs
--  this to be listable on either store.
create table if not exists public.reports (
  id         bigint generated always as identity primary key,
  reporter   uuid not null references auth.users on delete cascade,
  post_id    bigint references public.posts on delete cascade,
  comment_id bigint references public.comments on delete cascade,
  reason     text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
--  3. Workout logging — what was actually lifted
-- ------------------------------------------------------------
create table if not exists public.sets (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users on delete cascade,
  day        date not null default current_date,
  exercise   text not null,
  set_no     integer not null,
  weight_kg  numeric,
  reps       integer,
  created_at timestamptz not null default now()
);
create index if not exists sets_user_ex_idx on public.sets (user_id, exercise, day desc);

-- ------------------------------------------------------------
--  4. Access rules
-- ------------------------------------------------------------
alter table public.posts    enable row level security;
alter table public.comments enable row level security;
alter table public.blocks   enable row level security;
alter table public.reports  enable row level security;
alter table public.sets     enable row level security;

drop policy if exists posts_read     on public.posts;
drop policy if exists posts_write    on public.posts;
drop policy if exists posts_delete   on public.posts;
drop policy if exists comments_read  on public.comments;
drop policy if exists comments_write on public.comments;
drop policy if exists comments_del   on public.comments;
drop policy if exists blocks_read    on public.blocks;
drop policy if exists blocks_write   on public.blocks;
drop policy if exists blocks_delete  on public.blocks;
drop policy if exists reports_write  on public.reports;
drop policy if exists sets_read      on public.sets;
drop policy if exists sets_write     on public.sets;
drop policy if exists sets_delete    on public.sets;

--  The feed is shared: any signed-in person sees it, minus anyone
--  they have blocked. Signed-out means nothing.
create policy posts_read on public.posts for select
  using (
    auth.uid() is not null
    and user_id not in (select blocked from public.blocks where blocker = auth.uid())
  );
create policy posts_write on public.posts for insert
  with check (user_id = auth.uid());
create policy posts_delete on public.posts for delete
  using (user_id = auth.uid());

create policy comments_read on public.comments for select
  using (
    auth.uid() is not null
    and user_id not in (select blocked from public.blocks where blocker = auth.uid())
  );
create policy comments_write on public.comments for insert
  with check (user_id = auth.uid());
create policy comments_del on public.comments for delete
  using (user_id = auth.uid());

create policy blocks_read   on public.blocks for select using (blocker = auth.uid());
create policy blocks_write  on public.blocks for insert with check (blocker = auth.uid());
create policy blocks_delete on public.blocks for delete using (blocker = auth.uid());

--  insert only — there is deliberately no select policy
create policy reports_write on public.reports for insert
  with check (reporter = auth.uid());

create policy sets_read   on public.sets for select using (user_id = auth.uid());
create policy sets_write  on public.sets for insert with check (user_id = auth.uid());
create policy sets_delete on public.sets for delete using (user_id = auth.uid());

-- ------------------------------------------------------------
--  5. Photo storage
--
--  Public read, because a feed image is fetched by <img> with no
--  Authorization header. Writes are restricted to a folder named
--  after the person's own id, so nobody can overwrite anyone
--  else's photograph.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('posts', 'posts', true, 8388608,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 8388608,
      allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists posts_img_read   on storage.objects;
drop policy if exists posts_img_write  on storage.objects;
drop policy if exists posts_img_delete on storage.objects;

create policy posts_img_read on storage.objects for select
  using (bucket_id = 'posts');

create policy posts_img_write on storage.objects for insert
  with check (
    bucket_id = 'posts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy posts_img_delete on storage.objects for delete
  using (
    bucket_id = 'posts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
--  Done. The app needs nothing else to run the feed.
-- ============================================================


-- ============================================================
--  supabase-v2.sql
-- ============================================================
-- ============================================================
--  REPPO v2 — challenges, likes, onboarding, notifications.
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

--  `kind` and `name` were added after the table was. `create table
--  if not exists` does nothing to a table that already exists, so a
--  database created before that change never got the columns and the
--  calendar reads back empty. These add them where they are missing
--  and do nothing where they are not.
alter table public.workout_days add column if not exists kind text;
alter table public.workout_days add column if not exists name text;

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


-- ============================================================
--  supabase-v3.sql
-- ============================================================
-- ============================================================
--  REPPO v3 — medals, levels, public profiles, leaderboard.
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


-- ============================================================
--  supabase-v4.sql
-- ============================================================
-- ============================================================
--  REPPO v4 — the trainer, credits, and account deletion.
--
--  Supabase -> SQL Editor -> New query -> paste all -> Run.
--  Additive. Drops nothing. Safe to run twice.
-- ============================================================

-- ------------------------------------------------------------
--  1. Credits
--
--  A question costs one credit per line, so ten credits buys a
--  ten-line question. The balance lives on the profile; every
--  movement is written to a ledger, because money is involved and
--  "where did my credits go" has to have an answer.
-- ------------------------------------------------------------
alter table public.profiles add column if not exists credits integer not null default 0;

create table if not exists public.credit_ledger (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users on delete cascade,
  delta      integer not null,          -- + bought, - spent
  reason     text not null,             -- purchase | question | grant | refund
  note       text,
  created_at timestamptz not null default now()
);
create index if not exists ledger_user_idx on public.credit_ledger (user_id, created_at desc);

-- ------------------------------------------------------------
--  2. Spending, atomically.
--
--  Two questions asked at the same moment must not both pass a
--  balance check for the same credit. Doing it in one statement
--  under the row lock is what stops that.
-- ------------------------------------------------------------
create or replace function public.spend_credits(n integer, why text default 'question')
returns integer language plpgsql security definer set search_path = public as $$
declare
  left_after integer;
begin
  if n is null or n < 1 then
    raise exception 'nothing to spend';
  end if;

  update public.profiles
     set credits = credits - n
   where id = auth.uid() and credits >= n
   returning credits into left_after;

  if left_after is null then
    raise exception 'not enough credits';
  end if;

  insert into public.credit_ledger (user_id, delta, reason)
  values (auth.uid(), -n, coalesce(why, 'question'));

  return left_after;
end $$;

grant execute on function public.spend_credits(integer, text) to authenticated;

-- ------------------------------------------------------------
--  3. The conversation
--
--  `messages` already exists from the first setup. This only makes
--  sure the policies match how it is used now: you read and write
--  your own thread, and whoever runs the app reads and answers all
--  of them. There is no bot on the other end.
-- ------------------------------------------------------------
alter table public.messages enable row level security;

drop policy if exists messages_read  on public.messages;
drop policy if exists messages_write on public.messages;

create policy messages_read on public.messages for select
  using (user_id = auth.uid() or public.is_admin());

create policy messages_write on public.messages for insert
  with check (
    (user_id = auth.uid() and sender = 'client')
    or (public.is_admin() and sender = 'coach')
  );

alter table public.credit_ledger enable row level security;
drop policy if exists ledger_read on public.credit_ledger;
create policy ledger_read on public.credit_ledger for select
  using (user_id = auth.uid() or public.is_admin());

-- ------------------------------------------------------------
--  4. Granting credits by hand
--
--  Until a payment gateway is wired up, this is how somebody gets
--  credits: they pay you however you like, and you run this.
--
--    select public.grant_credits('them@example.com', 10, 'paid by UPI');
-- ------------------------------------------------------------
create or replace function public.grant_credits(who text, n integer, note text default null)
returns integer language plpgsql security definer set search_path = public as $$
declare
  uid uuid;
  total integer;
begin
  if not public.is_admin() then
    raise exception 'only an admin can grant credits';
  end if;

  select id into uid from auth.users where lower(email) = lower(who);
  if uid is null then raise exception 'no account for %', who; end if;

  update public.profiles set credits = credits + n
   where id = uid returning credits into total;

  insert into public.credit_ledger (user_id, delta, reason, note)
  values (uid, n, 'grant', note);

  return total;
end $$;

grant execute on function public.grant_credits(text, integer, text) to authenticated;

-- ============================================================
--  Done. Nothing here takes a payment — see the note on the
--  Trainer screen. Credits are granted by hand until a gateway
--  is connected.
-- ============================================================


-- ============================================================
--  supabase-v5.sql
-- ============================================================
-- ============================================================
--  REPPO v5 — payments, so credits arrive on their own.
--
--  Supabase -> SQL Editor -> New query -> paste all -> Run.
--  Additive. Drops nothing. Safe to run twice.
-- ============================================================

-- ------------------------------------------------------------
--  1. Every payment, from the moment it is started
--
--  A row is written when the order is created and updated when
--  Razorpay confirms it. `payment_id` is unique, which is what
--  makes a repeated webhook harmless — the same payment can never
--  add credits twice, however many times it arrives.
-- ------------------------------------------------------------
create table if not exists public.payments (
  order_id    text primary key,          -- Razorpay order id
  user_id     uuid not null references auth.users on delete cascade,
  credits     integer not null,
  paise       integer not null,          -- what it cost, in the smallest unit
  status      text not null default 'created',   -- created | paid | failed
  payment_id  text unique,               -- set once, by the webhook
  created_at  timestamptz not null default now(),
  paid_at     timestamptz
);
create index if not exists payments_user_idx on public.payments (user_id, created_at desc);

alter table public.payments enable row level security;

drop policy if exists payments_read on public.payments;
create policy payments_read on public.payments for select
  using (user_id = auth.uid() or public.is_admin());

-- nothing writes here from the app; only the Worker, with the
-- service key, which bypasses these policies entirely

-- ------------------------------------------------------------
--  2. Crediting a paid order, exactly once
--
--  Called by the Worker after it has verified Razorpay's signature.
--  The guard is the status change: if the row is not still
--  'created' the update matches nothing and no credits are added,
--  so a webhook delivered five times still pays out once.
-- ------------------------------------------------------------
create or replace function public.settle_payment(
  p_order   text,
  p_payment text
)
returns integer language plpgsql security definer set search_path = public as $$
declare
  row_user uuid;
  row_credits integer;
  total integer;
begin
  update public.payments
     set status = 'paid', payment_id = p_payment, paid_at = now()
   where order_id = p_order
     and status = 'created'
   returning user_id, credits into row_user, row_credits;

  if row_user is null then
    -- already settled, or no such order. Either way, do nothing.
    return null;
  end if;

  update public.profiles
     set credits = credits + row_credits
   where id = row_user
   returning credits into total;

  insert into public.credit_ledger (user_id, delta, reason, note)
  values (row_user, row_credits, 'purchase', p_order);

  return total;
end $$;

revoke execute on function public.settle_payment(text, text) from anon, authenticated;

-- ============================================================
--  Done. Nothing here trusts the app about whether money moved —
--  only Razorpay's signed webhook can settle a payment.
-- ============================================================

-- ------------------------------------------------------------
--  3. Asking a question, and paying for it, in one go
--
--  The old flow took the credits, then inserted the message, then
--  tried to hand the credits back if the insert failed. That refund
--  could not work — spend_credits refuses a negative amount — and a
--  function that can hand credits back is a function that can mint
--  them, so adding one was the wrong fix.
--
--  Doing both in one function means one transaction: if the message
--  cannot be saved, the exception rolls the spend back with it and
--  nobody is charged for a question that was never asked.
--
--  The price is worked out here too, not in the browser. A client
--  that computed its own cost could offer a pound and pay a penny.
-- ------------------------------------------------------------
create or replace function public.trainer_cost(p_body text)
returns integer language sql immutable as $$
  select least(10, greatest(
    1,
    (select count(*)::int
       from regexp_split_to_table(btrim(p_body), E'\n') as l
      where btrim(l) <> ''),
    ceil(length(btrim(p_body)) / 90.0)::int
  ))
$$;

create or replace function public.ask_trainer(p_body text)
returns json language plpgsql security definer set search_path = public as $$
declare
  body text := btrim(coalesce(p_body, ''));
  n integer;
  left_after integer;
  saved public.messages;
begin
  if body = '' then
    raise exception 'nothing to ask';
  end if;

  n := public.trainer_cost(body);

  update public.profiles
     set credits = credits - n
   where id = auth.uid() and credits >= n
   returning credits into left_after;

  if left_after is null then
    raise exception 'not enough credits';
  end if;

  insert into public.credit_ledger (user_id, delta, reason)
  values (auth.uid(), -n, 'question');

  insert into public.messages (user_id, sender, body)
  values (auth.uid(), 'client', body)
  returning * into saved;

  return json_build_object('cost', n, 'left', left_after, 'message', to_json(saved));
end $$;

grant execute on function public.trainer_cost(text) to authenticated;
grant execute on function public.ask_trainer(text)  to authenticated;


-- ============================================================
--  supabase-v6.sql
-- ============================================================
-- ============================================================
--  REPPO v6 — the daily reminder, at a time you choose.
--
--  Supabase -> SQL Editor -> New query -> paste all -> Run.
--  Additive. Drops nothing. Safe to run twice.
-- ============================================================

-- ------------------------------------------------------------
--  1. What hour to send at
--
--  Stored in India time, 0-23, because that is the clock every
--  user of this app reads. The Worker runs every hour and sends
--  only to the rows whose hour has come round; without the filter
--  an hourly cron would push twenty-four times a day, which is the
--  one bug in here worth being careful about.
--
--  Six in the evening stays the default, so nobody who never opens
--  Settings notices any change at all.
-- ------------------------------------------------------------
alter table public.push_subs
  add column if not exists send_hour smallint not null default 18;

alter table public.push_subs
  drop constraint if exists push_subs_hour_sane;
alter table public.push_subs
  add constraint push_subs_hour_sane check (send_hour between 0 and 23);

create index if not exists push_subs_hour_idx on public.push_subs (send_hour);

-- ------------------------------------------------------------
--  2. You may change your own row, and only your own
--
--  Turning a reminder on already inserts here; changing the time is
--  an update, which had no policy at all before, so it silently did
--  nothing.
-- ------------------------------------------------------------
drop policy if exists ps_update on public.push_subs;
create policy ps_update on public.push_subs for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
--  Done.
-- ============================================================


-- ============================================================
--  supabase-v7.sql
-- ============================================================
-- ============================================================
--  REPPO v7 — head-to-head rounds.
--
--  Supabase -> SQL Editor -> New query -> paste all -> Run.
--  Additive. Drops nothing. Safe to run twice.
-- ============================================================

-- ------------------------------------------------------------
--  1. A round
--
--  One row per match. It is created by whoever arrives first and
--  claimed by whoever arrives second, which is the whole of the
--  matchmaking: no queue, no server, just the oldest unclaimed row
--  for the chosen exercise.
--
--  Scores are two plain columns rather than a child table, because
--  both players write only their own and read both, several times a
--  second. One row is the cheapest thing to keep in step.
-- ------------------------------------------------------------
create table if not exists public.rounds (
  id          uuid primary key default gen_random_uuid(),
  move        text not null check (move in ('pushups', 'squats', 'situps', 'plank', 'burpees')),
  seconds     integer not null default 60,

  a_id        uuid not null references auth.users on delete cascade,
  a_name      text not null,
  a_score     integer not null default 0,
  a_done      boolean not null default false,

  b_id        uuid references auth.users on delete cascade,
  b_name      text,
  b_score     integer not null default 0,
  b_done      boolean not null default false,

  started_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists rounds_open_idx
  on public.rounds (move, created_at) where b_id is null;
create index if not exists rounds_mine_idx on public.rounds (a_id, created_at desc);
create index if not exists rounds_theirs_idx on public.rounds (b_id, created_at desc);

alter table public.rounds enable row level security;

drop policy if exists rounds_read on public.rounds;
drop policy if exists rounds_open on public.rounds;
drop policy if exists rounds_write on public.rounds;

-- You can see a round you are in, and any round still waiting for
-- somebody — that second half is what makes joining possible.
create policy rounds_read on public.rounds for select
  using (a_id = auth.uid() or b_id = auth.uid() or b_id is null);

create policy rounds_open on public.rounds for insert
  with check (a_id = auth.uid());

-- Updates go through the two functions below, never straight from
-- the app: a client that could write this table could write the
-- other person's score.
create policy rounds_write on public.rounds for update
  using (false) with check (false);

-- ------------------------------------------------------------
--  2. Joining
--
--  Takes the oldest round for this exercise that nobody has claimed,
--  and claims it. `for update skip locked` is what stops two people
--  arriving at the same moment and both joining the same round —
--  the second one skips it and opens a new one instead.
-- ------------------------------------------------------------
create or replace function public.join_round(p_move text, p_name text)
returns public.rounds language plpgsql security definer set search_path = public as $$
declare
  found public.rounds;
begin
  if p_move not in ('pushups', 'squats', 'situps', 'plank', 'burpees') then
    raise exception 'unknown move';
  end if;

  select * into found
    from public.rounds
   where move = p_move
     and b_id is null
     and a_id <> auth.uid()
     and created_at > now() - interval '2 minutes'
   order by created_at
   for update skip locked
   limit 1;

  if found.id is not null then
    update public.rounds
       set b_id = auth.uid(),
           b_name = coalesce(nullif(p_name, ''), 'Someone'),
           started_at = now()
     where id = found.id
     returning * into found;
    return found;
  end if;

  insert into public.rounds (move, a_id, a_name)
  values (p_move, auth.uid(), coalesce(nullif(p_name, ''), 'Someone'))
  returning * into found;
  return found;
end $$;

grant execute on function public.join_round(text, text) to authenticated;

-- ------------------------------------------------------------
--  3. Your own score, and only your own
-- ------------------------------------------------------------
create or replace function public.score_round(p_id uuid, p_score integer, p_done boolean)
returns public.rounds language plpgsql security definer set search_path = public as $$
declare
  row public.rounds;
begin
  select * into row from public.rounds where id = p_id;
  if row.id is null then raise exception 'no such round'; end if;

  if row.a_id = auth.uid() then
    update public.rounds
       set a_score = greatest(0, least(500, p_score)), a_done = p_done
     where id = p_id returning * into row;
  elsif row.b_id = auth.uid() then
    update public.rounds
       set b_score = greatest(0, least(500, p_score)), b_done = p_done
     where id = p_id returning * into row;
  else
    raise exception 'not your round';
  end if;

  return row;
end $$;

grant execute on function public.score_round(uuid, integer, boolean) to authenticated;

-- ------------------------------------------------------------
--  4. Giving up on a round nobody joined
-- ------------------------------------------------------------
create or replace function public.leave_round(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.rounds
   where id = p_id and a_id = auth.uid() and b_id is null;
end $$;

grant execute on function public.leave_round(uuid) to authenticated;

-- ------------------------------------------------------------
--  5. Rounds nobody ever joined do not need keeping
-- ------------------------------------------------------------
create or replace function public.purge_stale_rounds()
returns void language sql security definer set search_path = public as $$
  delete from public.rounds
   where created_at < now() - interval '1 day';
$$;

-- ------------------------------------------------------------
--  6. Running this a second time, after the moves widened
--
--  The check constraint was written when there were two exercises.
--  Dropping and re-adding it is what lets an existing database take
--  the other three.
-- ------------------------------------------------------------
alter table public.rounds drop constraint if exists rounds_move_check;
alter table public.rounds add constraint rounds_move_check
  check (move in ('pushups', 'squats', 'situps', 'plank', 'burpees'));

-- ============================================================
--  Done.
-- ============================================================


-- ============================================================
--  supabase-v8.sql
-- ============================================================
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

-- ------------------------------------------------------------
--  Pictures on the feed
--
--  profiles_read only lets you see your own row, so the feed could
--  never look up anybody else's picture — every post but your own
--  fell back to a letter. Posts do carry a copy of the path, but
--  only from the moment this shipped, and a copy goes stale the
--  first time somebody changes their picture.
--
--  This returns nothing but a picture and the time it changed, for
--  a list of people, in one round trip per page of the feed.
-- ------------------------------------------------------------
create or replace function public.avatars_for(ids uuid[])
returns table (id uuid, avatar_path text, avatar_at timestamptz)
language sql security definer stable set search_path = public as $$
  select p.id, p.avatar_path, p.avatar_at
    from public.profiles p
   where auth.uid() is not null
     and p.id = any(ids)
     and p.avatar_path is not null
$$;

grant execute on function public.avatars_for(uuid[]) to authenticated;


-- ============================================================
--  supabase-v9.sql
-- ============================================================
-- ============================================================
--  REPPO v9 — the admin portal.
--
--  Supabase -> SQL Editor -> New query -> paste all -> Run.
--  Additive. Drops nothing. Safe to run twice.
--
--  Everything here is security definer and every function starts by
--  asking is_admin(). That is deliberate: an admin needs to read
--  rows that row-level security exists to hide, so the check has to
--  live inside the function rather than in a policy the caller could
--  be outside of. Nothing here is granted to anon.
-- ============================================================

-- ------------------------------------------------------------
--  1. Everyone, with enough to judge them by
--
--  One row per account: who they are, when they joined, how much
--  they have trained, and how much they have posted. Deliberately
--  not their diary, their weights or their messages — an admin
--  screen should show what is needed to moderate, and looking at
--  somebody's body measurements is not moderating.
-- ------------------------------------------------------------
create or replace function public.admin_users(
  q text default null,
  lim integer default 50,
  off integer default 0
)
returns table (
  id            uuid,
  email         text,
  name          text,
  created_at    timestamptz,
  last_sign_in  timestamptz,
  is_admin      boolean,
  days_trained  integer,
  posts         integer,
  reports       integer,
  avatar_path   text,
  avatar_at     timestamptz
)
language sql security definer stable set search_path = public as $$
  select p.id,
         u.email::text,
         coalesce(nullif(trim(p.full_name), ''), 'Someone'),
         u.created_at,
         u.last_sign_in_at,
         p.is_admin,
         (select count(distinct w.day)::int from public.workout_days w where w.user_id = p.id),
         (select count(*)::int from public.posts po where po.user_id = p.id),
         (select count(*)::int from public.reports re
            join public.posts po2 on po2.id = re.post_id
           where po2.user_id = p.id),
         p.avatar_path,
         p.avatar_at
    from public.profiles p
    join auth.users u on u.id = p.id
   where public.is_admin()
     and (
       q is null or q = ''
       or u.email ilike '%' || q || '%'
       or coalesce(p.full_name, '') ilike '%' || q || '%'
     )
   order by u.created_at desc
   limit greatest(1, least(coalesce(lim, 50), 200))
  offset greatest(0, coalesce(off, 0))
$$;

grant execute on function public.admin_users(text, integer, integer) to authenticated;

-- ------------------------------------------------------------
--  2. What one person has been doing
--
--  Counts and dates, not contents. Enough to answer "is this
--  account real, active, and behaving" without reading anybody's
--  food diary line by line.
-- ------------------------------------------------------------
create or replace function public.admin_user_detail(uid uuid)
returns table (
  id             uuid,
  email          text,
  name           text,
  created_at     timestamptz,
  last_sign_in   timestamptz,
  is_admin       boolean,
  days_trained   integer,
  first_trained  date,
  last_trained   date,
  posts          integer,
  comments       integer,
  likes_given    integer,
  reports_against integer,
  food_days      integer,
  journey_notes  integer,
  reminders_on   boolean
)
language sql security definer stable set search_path = public as $$
  select p.id,
         u.email::text,
         coalesce(nullif(trim(p.full_name), ''), 'Someone'),
         u.created_at,
         u.last_sign_in_at,
         p.is_admin,
         (select count(distinct w.day)::int from public.workout_days w where w.user_id = uid),
         (select min(w.day) from public.workout_days w where w.user_id = uid),
         (select max(w.day) from public.workout_days w where w.user_id = uid),
         (select count(*)::int from public.posts po where po.user_id = uid),
         (select count(*)::int from public.comments c where c.user_id = uid),
         (select count(*)::int from public.likes l where l.user_id = uid),
         (select count(*)::int from public.reports re
            join public.posts po2 on po2.id = re.post_id
           where po2.user_id = uid),
         (select count(distinct d.day)::int from public.diary d where d.user_id = uid),
         (select count(*)::int from public.journey_entries j where j.user_id = uid),
         exists (select 1 from public.push_subs s where s.user_id = uid)
    from public.profiles p
    join auth.users u on u.id = p.id
   where public.is_admin()
     and p.id = uid
$$;

grant execute on function public.admin_user_detail(uuid) to authenticated;

-- ------------------------------------------------------------
--  3. What one person has posted
--
--  So a report can be judged against the rest of an account rather
--  than one photograph in isolation.
-- ------------------------------------------------------------
create or replace function public.admin_user_posts(uid uuid, lim integer default 30)
returns table (
  --  posts.id is a bigint identity, not a uuid. Declaring it wrong
  --  fails at creation time, which is the good outcome: Postgres
  --  checks the whole row type against the final select.
  id         bigint,
  image_path text,
  caption    text,
  created_at timestamptz,
  reports    integer
)
language sql security definer stable set search_path = public as $$
  select po.id, po.image_path, po.caption, po.created_at,
         (select count(*)::int from public.reports re where re.post_id = po.id)
    from public.posts po
   where public.is_admin()
     and po.user_id = uid
   order by po.created_at desc
   limit greatest(1, least(coalesce(lim, 30), 100))
$$;

grant execute on function public.admin_user_posts(uuid, integer) to authenticated;

-- ------------------------------------------------------------
--  4. The shape of the place
--
--  Totals for the top of the admin screen. Cheap enough to run on
--  every open at the size this app is.
-- ------------------------------------------------------------
create or replace function public.admin_overview()
returns table (
  users            integer,
  active_7d        integer,
  active_30d       integer,
  new_7d           integer,
  posts            integer,
  open_reports     integer,
  reminders_on     integer
)
language sql security definer stable set search_path = public as $$
  select (select count(*)::int from public.profiles),
         (select count(distinct w.user_id)::int from public.workout_days w
           where w.day >= (current_date - 7)),
         (select count(distinct w.user_id)::int from public.workout_days w
           where w.day >= (current_date - 30)),
         (select count(*)::int from auth.users u
           where u.created_at >= now() - interval '7 days'),
         (select count(*)::int from public.posts),
         (select count(*)::int from public.reports),
         (select count(distinct s.user_id)::int from public.push_subs s)
   where public.is_admin()
$$;

grant execute on function public.admin_overview() to authenticated;

-- ------------------------------------------------------------
--  5. Making somebody an admin, or taking it away
--
--  An admin cannot remove their own badge. Locking yourself out of
--  the only account that can let you back in is not a mistake worth
--  allowing.
-- ------------------------------------------------------------
create or replace function public.admin_set_admin(uid uuid, make_admin boolean)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'not an admin';
  end if;
  if uid = auth.uid() then
    raise exception 'you cannot change your own admin status';
  end if;
  update public.profiles set is_admin = coalesce(make_admin, false) where id = uid;
  return true;
end $$;

grant execute on function public.admin_set_admin(uuid, boolean) to authenticated;

-- ============================================================
--  Done. Account deletion is not here on purpose: removing an
--  auth.users row needs the service key, which lives only in the
--  Worker, so the admin screen calls /api/admin/delete-user and the
--  Worker re-checks is_admin before it does anything.
-- ============================================================


-- ============================================================
--  supabase-v10.sql
-- ============================================================
-- ============================================================
--  REPPO v10 — who liked your photograph.
--
--  Supabase -> SQL Editor -> New query -> paste all -> Run.
--  Additive. Drops nothing. Safe to run twice.
-- ============================================================

-- ------------------------------------------------------------
--  Only the person who posted it can ask.
--
--  likes_read deliberately shows you nothing but your own likes,
--  and that stays true: this does not loosen the policy, it steps
--  around it for one question asked by one person about their own
--  post. Somebody scrolling the feed still cannot find out who
--  liked anybody else's photograph, and nobody can find out what
--  a given person has liked.
--
--  Returns a first name, the days they have trained (the app turns
--  that into a league) and their picture. Not their email, not
--  their id, not when they liked it — a list of who is enough, and
--  a timestamp turns it into a record of who was awake at 2am.
-- ------------------------------------------------------------
create or replace function public.post_likers(pid bigint, lim integer default 60)
returns table (
  name         text,
  days_trained integer,
  avatar_path  text,
  avatar_at    timestamptz
)
language sql security definer stable set search_path = public as $$
  select split_part(coalesce(nullif(trim(p.full_name), ''), 'Someone'), ' ', 1),
         coalesce(p.days_trained, 0),
         p.avatar_path,
         p.avatar_at
    from public.likes l
    join public.profiles p on p.id = l.user_id
   where l.post_id = pid
     --  the asker has to own the post
     and exists (
       select 1 from public.posts po
        where po.id = pid and po.user_id = auth.uid()
     )
     --  and not see people who blocked them
     and not exists (
       select 1 from public.blocks b
        where b.blocker = l.user_id and b.blocked = auth.uid()
     )
   order by l.created_at desc
   limit greatest(1, least(coalesce(lim, 60), 200))
$$;

grant execute on function public.post_likers(bigint, integer) to authenticated;

-- ------------------------------------------------------------
--  What happened on your posts while you were away
--
--  Likes and comments on things you posted, newer than a moment you
--  supply. Yours only — the check is on posts.user_id, so this
--  cannot be used to watch anybody else's photograph.
--
--  Your own likes and comments on your own post are left out. Being
--  told you commented on yourself is not news.
-- ------------------------------------------------------------
create or replace function public.my_activity(since timestamptz default null, lim integer default 40)
returns table (
  kind        text,
  post_id     bigint,
  name        text,
  body        text,
  happened_at timestamptz
)
language sql security definer stable set search_path = public as $$
  select 'like'::text,
         l.post_id,
         split_part(coalesce(nullif(trim(p.full_name), ''), 'Someone'), ' ', 1),
         null::text,
         l.created_at
    from public.likes l
    join public.posts po on po.id = l.post_id
    join public.profiles p on p.id = l.user_id
   where po.user_id = auth.uid()
     and l.user_id <> auth.uid()
     and (since is null or l.created_at > since)

  union all

  select 'comment'::text,
         c.post_id,
         split_part(coalesce(nullif(trim(c.name), ''), 'Someone'), ' ', 1),
         left(c.body, 80),
         c.created_at
    from public.comments c
    join public.posts po on po.id = c.post_id
   where po.user_id = auth.uid()
     and c.user_id <> auth.uid()
     and (since is null or c.created_at > since)

   order by 5 desc
   limit greatest(1, least(coalesce(lim, 40), 100))
$$;

grant execute on function public.my_activity(timestamptz, integer) to authenticated;

-- ============================================================
--  Done.
-- ============================================================


-- ============================================================
--  supabase-moderation.sql
-- ============================================================
-- ============================================================
--  REPPO — moderation and a feed that clears itself.
--
--  Supabase -> SQL Editor -> New query -> paste all -> Run.
--  Additive and safe to run twice.
--
--  Three things:
--    1. an admin who can delete anyone's post
--    2. the feed only shows the last 7 days
--    3. a nightly job that actually deletes what has aged out
-- ============================================================

-- ------------------------------------------------------------
--  1. Who is an admin
-- ------------------------------------------------------------
alter table public.profiles add column if not exists is_admin boolean not null default false;

--  security definer so it can read profiles without tripping the
--  policies that are written in terms of it
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and is_admin);
$$;

--  >>> CHANGE THIS EMAIL if you sign in as someone else <<<
update public.profiles set is_admin = true
where id = (select id from auth.users
            where lower(email) = lower('thearyanbasantani@gmail.com'));

-- ------------------------------------------------------------
--  2. The feed is the last 7 days, and an admin can delete anything
-- ------------------------------------------------------------
drop policy if exists posts_read     on public.posts;
drop policy if exists posts_delete   on public.posts;
drop policy if exists comments_read  on public.comments;
drop policy if exists comments_del   on public.comments;
drop policy if exists reports_read   on public.reports;

--  A post older than a week simply is not returned. This is the part
--  that makes the feed feel current even if the nightly job is late.
create policy posts_read on public.posts for select
  using (
    auth.uid() is not null
    and created_at > now() - interval '7 days'
    and user_id not in (select blocked from public.blocks where blocker = auth.uid())
  );

create policy posts_delete on public.posts for delete
  using (user_id = auth.uid() or public.is_admin());

create policy comments_read on public.comments for select
  using (
    auth.uid() is not null
    and user_id not in (select blocked from public.blocks where blocker = auth.uid())
  );

create policy comments_del on public.comments for delete
  using (user_id = auth.uid() or public.is_admin());

--  Reports were write-only. An admin needs to be able to read them,
--  or reporting is a button that goes nowhere.
create policy reports_read on public.reports for select
  using (public.is_admin());

--  An admin can also remove the photograph itself, not just the row
drop policy if exists posts_img_delete on storage.objects;
create policy posts_img_delete on storage.objects for delete
  using (
    bucket_id = 'posts'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

-- ------------------------------------------------------------
--  3. Deleting what has aged out
--
--  The read policy hides old posts; this is what stops the storage
--  bucket growing forever. It removes the photograph first, then the
--  row, so a failure half way through cannot orphan a file.
-- ------------------------------------------------------------
create or replace function public.purge_old_posts()
returns integer language plpgsql security definer set search_path = public as $$
declare
  removed integer;
begin
  delete from storage.objects
   where bucket_id = 'posts'
     and name in (select image_path from public.posts
                  where created_at < now() - interval '7 days');

  with gone as (
    delete from public.posts
     where created_at < now() - interval '7 days'
    returning 1
  )
  select count(*) into removed from gone;

  return removed;
end $$;

--  Run it nightly. pg_cron has to be enabled on the project; if this
--  section fails the rest of the migration has already applied and the
--  feed still hides old posts — you would just be deleting them by hand
--  (or by calling select public.purge_old_posts(); yourself).
do $$
begin
  create extension if not exists pg_cron;

  -- the job name stays as it is: it has to match what is already
  -- scheduled in the live database, or this creates a second copy
  perform cron.unschedule('nemea-purge-old-posts')
   where exists (select 1 from cron.job where jobname = 'nemea-purge-old-posts');

  perform cron.schedule(
    'nemea-purge-old-posts',
    '17 3 * * *',                       -- 03:17 UTC, nightly
    'select public.purge_old_posts();'
  );
exception when others then
  raise notice 'pg_cron not available (%), skipping the nightly job. '
               'The 7-day read filter still applies.', sqlerrm;
end $$;

-- ============================================================
--  Check it worked:
--    select id, is_admin from public.profiles where is_admin;
--    select public.purge_old_posts();
-- ============================================================

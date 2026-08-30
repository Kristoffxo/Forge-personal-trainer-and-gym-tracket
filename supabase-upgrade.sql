-- ============================================================
--  NEMEA — upgrade: the feed, workout logging, and the extra
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

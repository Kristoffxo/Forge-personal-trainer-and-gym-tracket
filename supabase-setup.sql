-- ============================================================
--  REPPO — full setup with real email/password accounts
--  Supabase -> SQL Editor -> New query -> paste all -> Run
--  Safe to run more than once.
-- ============================================================

drop table if exists public.messages cascade;
drop table if exists public.diary    cascade;
drop table if exists public.plans    cascade;
drop table if exists public.profiles cascade;

-- ---------- who each account is ----------
create table public.profiles (
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
create table public.messages (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users on delete cascade,
  sender     text not null check (sender in ('client','coach')),
  body       text not null,
  created_at timestamptz not null default now()
);
create index messages_user_idx on public.messages (user_id, created_at);

-- ---------- food diary ----------
create table public.diary (
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
create index diary_user_idx on public.diary (user_id, day);

-- ---------- training plan ----------
create table public.plans (
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
alter publication supabase_realtime add table public.messages;

-- ============================================================
--  Kept for reference. Reppo has no coach role in the app any more,
--  the coach (change the email to whichever he registered with):
--
--    update public.profiles set role = 'coach'
--    where id = (select id from auth.users where email = 'you@example.com');
-- ============================================================

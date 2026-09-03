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
  id         uuid,
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

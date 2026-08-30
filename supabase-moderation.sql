-- ============================================================
--  NEMEA — moderation and a feed that clears itself.
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

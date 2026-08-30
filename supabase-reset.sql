-- ============================================================
--  NEMEA — wipe everyone, and make one email the admin.
--
--  Supabase -> SQL Editor -> New query -> paste all -> Run.
--
--  *** THIS DELETES EVERY ACCOUNT AND EVERYTHING IN THEM. ***
--  Feed photos, comments, food diaries, training plans, logged
--  sets, weights on the server — all of it, for every user
--  including the test one. There is no undo.
--
--  After it runs, sign up fresh in the app with the email below
--  and you will be an admin automatically.
-- ============================================================

-- ------------------------------------------------------------
--  Whose account becomes the admin.
--  Change this one line if you use a different email.
-- ------------------------------------------------------------
create or replace function public.admin_email()
returns text language sql immutable as $$
  select 'thearyanbasantani@gmail.com'
$$;

-- ------------------------------------------------------------
--  1. Delete the accounts.
--
--  Everything else — profiles, posts, comments, diary, plans,
--  sets, blocks, reports — hangs off auth.users with
--  `on delete cascade`, so removing the users removes the lot.
--
--  The photographs are NOT deleted here. Supabase blocks direct
--  deletes on storage.objects (`42501: Direct deletion from
--  storage tables is not allowed`) because it would orphan the
--  underlying files. Once the rows above are gone nothing in the
--  app can reach those photos anyway; empty the bucket from
--  Storage -> posts -> select all -> Delete to reclaim the space.
-- ------------------------------------------------------------
delete from auth.users;

-- ------------------------------------------------------------
--  2. Admin is granted at sign-up, not afterwards.
--
--  The old migration flagged an account that had to already
--  exist, which is why nothing happened if you ran it before
--  signing up. This moves the decision into the trigger that
--  creates the profile, so the ordering cannot go wrong again.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    lower(new.email) = lower(public.admin_email())
  )
  on conflict (id) do update
    set is_admin = excluded.is_admin;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
--  3. Check
-- ------------------------------------------------------------
select
  (select count(*) from auth.users)      as users_left,
  (select count(*) from public.posts)    as posts_left,
  (select count(*) from public.diary)    as diary_rows_left,
  (select count(*) from storage.objects
    where bucket_id = 'posts')           as photos_to_clear_by_hand,
  public.admin_email()                   as admin_will_be;

-- ============================================================
--  users_left, posts_left and diary_rows_left should be 0.
--  photos_to_clear_by_hand is what to remove in Storage -> posts.
--  Now sign up in the app with that email. Then confirm with:
--
--    select u.email, p.is_admin
--      from public.profiles p join auth.users u on u.id = p.id;
-- ============================================================

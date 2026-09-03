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

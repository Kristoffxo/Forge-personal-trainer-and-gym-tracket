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
  move        text not null check (move in ('pushups', 'squats')),
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
  if p_move not in ('pushups', 'squats') then
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

-- ============================================================
--  Done.
-- ============================================================

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

-- ============================================================
--  Done.
-- ============================================================

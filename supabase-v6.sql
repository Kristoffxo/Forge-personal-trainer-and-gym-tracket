-- ============================================================
--  NEMEA v6 — the daily reminder, at a time you choose.
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

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

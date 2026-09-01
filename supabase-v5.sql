-- ============================================================
--  REPPO v5 — payments, so credits arrive on their own.
--
--  Supabase -> SQL Editor -> New query -> paste all -> Run.
--  Additive. Drops nothing. Safe to run twice.
-- ============================================================

-- ------------------------------------------------------------
--  1. Every payment, from the moment it is started
--
--  A row is written when the order is created and updated when
--  Razorpay confirms it. `payment_id` is unique, which is what
--  makes a repeated webhook harmless — the same payment can never
--  add credits twice, however many times it arrives.
-- ------------------------------------------------------------
create table if not exists public.payments (
  order_id    text primary key,          -- Razorpay order id
  user_id     uuid not null references auth.users on delete cascade,
  credits     integer not null,
  paise       integer not null,          -- what it cost, in the smallest unit
  status      text not null default 'created',   -- created | paid | failed
  payment_id  text unique,               -- set once, by the webhook
  created_at  timestamptz not null default now(),
  paid_at     timestamptz
);
create index if not exists payments_user_idx on public.payments (user_id, created_at desc);

alter table public.payments enable row level security;

drop policy if exists payments_read on public.payments;
create policy payments_read on public.payments for select
  using (user_id = auth.uid() or public.is_admin());

-- nothing writes here from the app; only the Worker, with the
-- service key, which bypasses these policies entirely

-- ------------------------------------------------------------
--  2. Crediting a paid order, exactly once
--
--  Called by the Worker after it has verified Razorpay's signature.
--  The guard is the status change: if the row is not still
--  'created' the update matches nothing and no credits are added,
--  so a webhook delivered five times still pays out once.
-- ------------------------------------------------------------
create or replace function public.settle_payment(
  p_order   text,
  p_payment text
)
returns integer language plpgsql security definer set search_path = public as $$
declare
  row_user uuid;
  row_credits integer;
  total integer;
begin
  update public.payments
     set status = 'paid', payment_id = p_payment, paid_at = now()
   where order_id = p_order
     and status = 'created'
   returning user_id, credits into row_user, row_credits;

  if row_user is null then
    -- already settled, or no such order. Either way, do nothing.
    return null;
  end if;

  update public.profiles
     set credits = credits + row_credits
   where id = row_user
   returning credits into total;

  insert into public.credit_ledger (user_id, delta, reason, note)
  values (row_user, row_credits, 'purchase', p_order);

  return total;
end $$;

revoke execute on function public.settle_payment(text, text) from anon, authenticated;

-- ============================================================
--  Done. Nothing here trusts the app about whether money moved —
--  only Razorpay's signed webhook can settle a payment.
-- ============================================================

-- ------------------------------------------------------------
--  3. Asking a question, and paying for it, in one go
--
--  The old flow took the credits, then inserted the message, then
--  tried to hand the credits back if the insert failed. That refund
--  could not work — spend_credits refuses a negative amount — and a
--  function that can hand credits back is a function that can mint
--  them, so adding one was the wrong fix.
--
--  Doing both in one function means one transaction: if the message
--  cannot be saved, the exception rolls the spend back with it and
--  nobody is charged for a question that was never asked.
--
--  The price is worked out here too, not in the browser. A client
--  that computed its own cost could offer a pound and pay a penny.
-- ------------------------------------------------------------
create or replace function public.trainer_cost(p_body text)
returns integer language sql immutable as $$
  select least(10, greatest(
    1,
    (select count(*)::int
       from regexp_split_to_table(btrim(p_body), E'\n') as l
      where btrim(l) <> ''),
    ceil(length(btrim(p_body)) / 90.0)::int
  ))
$$;

create or replace function public.ask_trainer(p_body text)
returns json language plpgsql security definer set search_path = public as $$
declare
  body text := btrim(coalesce(p_body, ''));
  n integer;
  left_after integer;
  saved public.messages;
begin
  if body = '' then
    raise exception 'nothing to ask';
  end if;

  n := public.trainer_cost(body);

  update public.profiles
     set credits = credits - n
   where id = auth.uid() and credits >= n
   returning credits into left_after;

  if left_after is null then
    raise exception 'not enough credits';
  end if;

  insert into public.credit_ledger (user_id, delta, reason)
  values (auth.uid(), -n, 'question');

  insert into public.messages (user_id, sender, body)
  values (auth.uid(), 'client', body)
  returning * into saved;

  return json_build_object('cost', n, 'left', left_after, 'message', to_json(saved));
end $$;

grant execute on function public.trainer_cost(text) to authenticated;
grant execute on function public.ask_trainer(text)  to authenticated;

-- Reorders the customer reservation flow: reservations no longer require
-- documents up front; documents + payment happen after admin approval,
-- gated by a new "confirmed" status. Also adds the public availability
-- lookup used to auto-show cars as reserved. Run after schema_handover.sql.

alter table public.reservations drop constraint if exists reservations_status_check;
alter table public.reservations
  add constraint reservations_status_check
  check (status in ('pending', 'approved', 'confirmed', 'rejected', 'cancelled', 'delivered', 'completed'));

alter table public.reservations
  add column if not exists amount_due numeric,
  add column if not exists amount_paid numeric not null default 0,
  add column if not exists paid_at timestamptz,
  add column if not exists paid_by uuid references public.profiles (id),
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmed_by uuid references public.profiles (id);

create index if not exists reservations_car_dates_idx
  on public.reservations (car_id, status, start_date, end_date);

-- Tighten the customer insert policy now that reservations carry payment
-- state: a customer can only ever create a fresh, unpaid, pending request
-- — every later transition (approve/confirm/payment) is admin-only via the
-- existing "admins can update reservations" policy (customers have no
-- update policy on this table at all).
drop policy if exists "customers can create their own reservations" on public.reservations;
create policy "customers can create their own reservations"
  on public.reservations for insert
  with check (
    auth.uid() = customer_id
    and status = 'pending'
    and amount_paid = 0
  );

-- ── public availability lookup ────────────────────────────────────────────
-- RLS on `reservations` only lets a customer see their own rows (or an
-- admin see everything), so signed-out visitors browsing dates can't query
-- the table directly. This function exposes just enough (which car is
-- blocked, for which dates) for anyone to check availability, without
-- exposing customer identity or reservation details. security definer runs
-- it as the function owner (which created the table and so bypasses RLS),
-- same pattern as handle_new_user() in schema.sql.
create or replace function public.get_car_availability()
returns table (reservation_id uuid, car_id uuid, start_date date, end_date date)
language sql
security definer
set search_path = public
as $$
  select id, car_id, start_date, end_date
  from public.reservations
  where status in ('approved', 'confirmed', 'delivered')
    and start_date is not null
    and end_date is not null;
$$;

grant execute on function public.get_car_availability() to anon, authenticated;

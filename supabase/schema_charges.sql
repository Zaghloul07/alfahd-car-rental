-- Post-return fines/damage charges. A separate table (not columns on
-- handover_reports) because there can be zero-to-many charges per
-- reservation (e.g. a late fee AND a damage fee), it keeps the immutable
-- inspection record untouched, and it's cheap to expose to the customer via
-- its own RLS policy. Run after schema_notifications.sql.

create table if not exists public.reservation_charges (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  amount numeric not null check (amount > 0),
  reason text not null,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index if not exists reservation_charges_reservation_idx
  on public.reservation_charges (reservation_id);

alter table public.reservation_charges enable row level security;

create policy "admins can manage reservation charges"
  on public.reservation_charges for all
  using (auth.uid() in (select id from public.profiles where is_admin))
  with check (auth.uid() in (select id from public.profiles where is_admin));

create policy "customers can read their own reservation charges"
  on public.reservation_charges for select
  using (
    exists (
      select 1 from public.reservations r
      where r.id = reservation_id and r.customer_id = auth.uid()
    )
  );

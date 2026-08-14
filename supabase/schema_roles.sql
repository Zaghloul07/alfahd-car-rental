-- Adds a coarse role for a delivery/return-only staff account type, on top
-- of the existing is_admin flag (left untouched so every is_admin-gated
-- policy elsewhere keeps working unchanged). Run after schema_reservation_flow.sql.

alter table public.profiles
  add column if not exists role text check (role in ('admin', 'staff'));

-- Migrate existing admins to the new role (idempotent, safe to re-run).
update public.profiles set role = 'admin' where is_admin = true and role is null;

-- After creating a staff user via Supabase Auth, assign them:
--   update public.profiles set role = 'staff' where email = 'staff@example.com';

-- ── reservations: staff see/act on only the handover-relevant slice ──────
create policy "staff can read handover-stage reservations"
  on public.reservations for select
  using (
    status in ('confirmed', 'delivered', 'completed')
    and auth.uid() in (select id from public.profiles where role = 'staff')
  );

create policy "staff can update handover-stage reservations"
  on public.reservations for update
  using (
    status in ('confirmed', 'delivered')
    and auth.uid() in (select id from public.profiles where role = 'staff')
  );

-- ── customers: staff need name/phone to know who to hand the car to ──────
create policy "staff can read customers"
  on public.customers for select
  using (auth.uid() in (select id from public.profiles where role = 'staff'));

-- ── cars: staff need to see the car regardless of published/draft state ──
create policy "staff can read all cars"
  on public.cars for select
  using (auth.uid() in (select id from public.profiles where role = 'staff'));

-- ── handover_reports / handover_photos: admin-only → admin-or-staff ──────
drop policy if exists "admins can manage handover reports" on public.handover_reports;
create policy "admins and staff can manage handover reports"
  on public.handover_reports for all
  using (auth.uid() in (select id from public.profiles where is_admin or role = 'staff'))
  with check (auth.uid() in (select id from public.profiles where is_admin or role = 'staff'));

drop policy if exists "admins can manage handover photos" on public.handover_photos;
create policy "admins and staff can manage handover photos"
  on public.handover_photos for all
  using (auth.uid() in (select id from public.profiles where is_admin or role = 'staff'))
  with check (auth.uid() in (select id from public.profiles where is_admin or role = 'staff'));

-- ── storage: handover-photos bucket ───────────────────────────────────────
drop policy if exists "admins can upload handover photos" on storage.objects;
create policy "admins and staff can upload handover photos"
  on storage.objects for insert
  with check (
    bucket_id = 'handover-photos'
    and auth.uid() in (select id from public.profiles where is_admin or role = 'staff')
  );

drop policy if exists "admins can read all handover photos" on storage.objects;
create policy "admins and staff can read all handover photos"
  on storage.objects for select
  using (
    bucket_id = 'handover-photos'
    and auth.uid() in (select id from public.profiles where is_admin or role = 'staff')
  );

-- Note: customer-documents bucket and cars/car-images admin policies are
-- intentionally left is_admin-only — staff never review ID documents or
-- manage listings, matching the "delivery/return only" scope.

-- Renames the 'staff' role to 'inspector' and re-scopes the schema_roles.sql
-- RLS policies accordingly (schema_roles.sql itself is already applied and
-- is left untouched as a historical record). Run after schema_charges.sql.

-- ── profiles.role ──────────────────────────────────────────────────────
-- Constraint must be loosened before the data migrates — otherwise the
-- UPDATE below gets checked against the still-old ('admin','staff') rule.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'inspector', 'staff'));

update public.profiles set role = 'inspector' where role = 'staff';

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'inspector'));

-- ── notifications.recipient_role ──────────────────────────────────────
alter table public.notifications drop constraint if exists notifications_recipient_role_check;
alter table public.notifications add constraint notifications_recipient_role_check
  check (recipient_role in ('admin', 'inspector', 'staff'));

update public.notifications set recipient_role = 'inspector' where recipient_role = 'staff';

alter table public.notifications drop constraint if exists notifications_recipient_role_check;
alter table public.notifications add constraint notifications_recipient_role_check
  check (recipient_role in ('admin', 'inspector'));

-- ── reservations ─────────────────────────────────────────────────────
drop policy if exists "staff can read handover-stage reservations" on public.reservations;
drop policy if exists "inspectors can read handover-stage reservations" on public.reservations;
create policy "inspectors can read handover-stage reservations"
  on public.reservations for select
  using (
    status in ('confirmed', 'delivered', 'completed')
    and auth.uid() in (select id from public.profiles where role = 'inspector')
  );

drop policy if exists "staff can update handover-stage reservations" on public.reservations;
drop policy if exists "inspectors can update handover-stage reservations" on public.reservations;
create policy "inspectors can update handover-stage reservations"
  on public.reservations for update
  using (
    status in ('confirmed', 'delivered')
    and auth.uid() in (select id from public.profiles where role = 'inspector')
  );

-- ── customers ────────────────────────────────────────────────────────
drop policy if exists "staff can read customers" on public.customers;
drop policy if exists "inspectors can read customers" on public.customers;
create policy "inspectors can read customers"
  on public.customers for select
  using (auth.uid() in (select id from public.profiles where role = 'inspector'));

-- ── cars ─────────────────────────────────────────────────────────────
drop policy if exists "staff can read all cars" on public.cars;
drop policy if exists "inspectors can read all cars" on public.cars;
create policy "inspectors can read all cars"
  on public.cars for select
  using (auth.uid() in (select id from public.profiles where role = 'inspector'));

-- ── handover_reports / handover_photos ──────────────────────────────
drop policy if exists "admins and staff can manage handover reports" on public.handover_reports;
drop policy if exists "admins and inspectors can manage handover reports" on public.handover_reports;
create policy "admins and inspectors can manage handover reports"
  on public.handover_reports for all
  using (auth.uid() in (select id from public.profiles where is_admin or role = 'inspector'))
  with check (auth.uid() in (select id from public.profiles where is_admin or role = 'inspector'));

drop policy if exists "admins and staff can manage handover photos" on public.handover_photos;
drop policy if exists "admins and inspectors can manage handover photos" on public.handover_photos;
create policy "admins and inspectors can manage handover photos"
  on public.handover_photos for all
  using (auth.uid() in (select id from public.profiles where is_admin or role = 'inspector'))
  with check (auth.uid() in (select id from public.profiles where is_admin or role = 'inspector'));

-- ── storage: handover-photos bucket ─────────────────────────────────
drop policy if exists "admins and staff can upload handover photos" on storage.objects;
drop policy if exists "admins and inspectors can upload handover photos" on storage.objects;
create policy "admins and inspectors can upload handover photos"
  on storage.objects for insert
  with check (
    bucket_id = 'handover-photos'
    and auth.uid() in (select id from public.profiles where is_admin or role = 'inspector')
  );

drop policy if exists "admins and staff can read all handover photos" on storage.objects;
drop policy if exists "admins and inspectors can read all handover photos" on storage.objects;
create policy "admins and inspectors can read all handover photos"
  on storage.objects for select
  using (
    bucket_id = 'handover-photos'
    and auth.uid() in (select id from public.profiles where is_admin or role = 'inspector')
  );

-- Note: the two "admins and staff can read/mark their notifications" policies
-- (schema_notifications.sql) compare recipient_role by value equality against
-- profiles.role, not a hardcoded 'staff' literal, so they need no change here
-- — both sides migrate to 'inspector' together.

-- Vehicle delivery/return handover inspections: photos of the odometer,
-- fuel gauge, and car body, plus an in-person customer signature, captured
-- by an admin when the car goes out to a customer and again when it comes
-- back. Run after schema_customers.sql.

-- Allow the reservation to progress past "approved" as the car is handed
-- over and later returned.
alter table public.reservations drop constraint if exists reservations_status_check;
alter table public.reservations
  add constraint reservations_status_check
  check (status in ('pending', 'approved', 'rejected', 'cancelled', 'delivered', 'completed'));

-- ── handover_reports ────────────────────────────────────────────────────
create table if not exists public.handover_reports (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  type text not null check (type in ('delivery', 'return')),
  odometer_km integer not null check (odometer_km >= 0),
  fuel_level text not null check (fuel_level in ('empty', 'quarter', 'half', 'three_quarter', 'full')),
  notes text,
  signature_path text not null,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (reservation_id, type)
);

create index if not exists handover_reports_reservation_idx on public.handover_reports (reservation_id);

alter table public.handover_reports enable row level security;

create policy "admins can manage handover reports"
  on public.handover_reports for all
  using (auth.uid() in (select id from public.profiles where is_admin))
  with check (auth.uid() in (select id from public.profiles where is_admin));

create policy "customers can read their own handover reports"
  on public.handover_reports for select
  using (
    exists (
      select 1 from public.reservations r
      where r.id = reservation_id and r.customer_id = auth.uid()
    )
  );

-- ── handover_photos ─────────────────────────────────────────────────────
create table if not exists public.handover_photos (
  id uuid primary key default gen_random_uuid(),
  handover_id uuid not null references public.handover_reports (id) on delete cascade,
  photo_type text not null check (photo_type in ('odometer', 'fuel', 'body')),
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists handover_photos_handover_idx on public.handover_photos (handover_id);

alter table public.handover_photos enable row level security;

create policy "admins can manage handover photos"
  on public.handover_photos for all
  using (auth.uid() in (select id from public.profiles where is_admin))
  with check (auth.uid() in (select id from public.profiles where is_admin));

create policy "customers can read their own handover photos"
  on public.handover_photos for select
  using (
    exists (
      select 1 from public.handover_reports hr
      join public.reservations r on r.id = hr.reservation_id
      where hr.id = handover_id and r.customer_id = auth.uid()
    )
  );

-- ── storage: handover-photos bucket (private) ──────────────────────────
insert into storage.buckets (id, name, public)
values ('handover-photos', 'handover-photos', false)
on conflict (id) do nothing;

-- Files are stored under `${handover_report_id}/...` so ownership can be
-- traced back to the reservation's customer via a join.
create policy "admins can upload handover photos"
  on storage.objects for insert
  with check (
    bucket_id = 'handover-photos'
    and auth.uid() in (select id from public.profiles where is_admin)
  );

create policy "admins can read all handover photos"
  on storage.objects for select
  using (
    bucket_id = 'handover-photos'
    and auth.uid() in (select id from public.profiles where is_admin)
  );

create policy "customers can read their own handover photos"
  on storage.objects for select
  using (
    bucket_id = 'handover-photos'
    and exists (
      select 1 from public.handover_reports hr
      join public.reservations r on r.id = hr.reservation_id
      where hr.id::text = (storage.foldername(name))[1] and r.customer_id = auth.uid()
    )
  );

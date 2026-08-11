-- Customer accounts, document upload, and rental reservation requests.
-- Run after schema.sql. Customers sign up with phone + password (no SMS
-- verification yet); auth.users.email is a synthetic address derived from
-- the phone number so we can reuse Supabase's email/password auth.

create table if not exists public.customers (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  phone text not null unique,
  national_id_front_url text,
  national_id_back_url text,
  driving_license_url text,
  documents_submitted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.customers enable row level security;

create policy "customers can read their own row"
  on public.customers for select
  using (auth.uid() = id);

create policy "customers can update their own row"
  on public.customers for update
  using (auth.uid() = id);

create policy "customers can insert their own row"
  on public.customers for insert
  with check (auth.uid() = id);

create policy "admins can read all customers"
  on public.customers for select
  using (auth.uid() in (select id from public.profiles where is_admin));

-- ── reservations ───────────────────────────────────────────────────────
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id)
);

create index if not exists reservations_status_idx on public.reservations (status);
create index if not exists reservations_customer_idx on public.reservations (customer_id);

alter table public.reservations enable row level security;

create policy "customers can read their own reservations"
  on public.reservations for select
  using (auth.uid() = customer_id);

create policy "customers can create their own reservations"
  on public.reservations for insert
  with check (auth.uid() = customer_id);

create policy "admins can read all reservations"
  on public.reservations for select
  using (auth.uid() in (select id from public.profiles where is_admin));

create policy "admins can update reservations"
  on public.reservations for update
  using (auth.uid() in (select id from public.profiles where is_admin));

-- ── storage: customer-documents bucket (private) ──────────────────────
insert into storage.buckets (id, name, public)
values ('customer-documents', 'customer-documents', false)
on conflict (id) do nothing;

-- Files are stored under `${auth.uid()}/...` so owners can be checked
-- against the first path segment.
create policy "customers can upload their own documents"
  on storage.objects for insert
  with check (
    bucket_id = 'customer-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "customers can read their own documents"
  on storage.objects for select
  using (
    bucket_id = 'customer-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "admins can read all customer documents"
  on storage.objects for select
  using (
    bucket_id = 'customer-documents'
    and auth.uid() in (select id from public.profiles where is_admin)
  );

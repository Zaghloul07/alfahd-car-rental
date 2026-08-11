-- Run this once in the Supabase SQL editor for a new project.

-- ── profiles ────────────────────────────────────────────────────────────
-- One row per auth user. is_admin gates access to /admin.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are readable by their owner"
  on public.profiles for select
  using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- After creating your first user via Supabase Auth, promote them:
--   update public.profiles set is_admin = true where email = 'you@example.com';

-- ── cars ────────────────────────────────────────────────────────────────
create table if not exists public.cars (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  listing_type text not null check (listing_type in ('rent', 'sale')),
  status text not null default 'draft' check (status in ('draft', 'published', 'sold', 'rented')),

  make text not null,
  model text not null,
  year int not null,
  title text not null,
  description text,
  images text[] not null default '{}',
  mileage_km int,
  transmission text check (transmission in ('automatic', 'manual')),
  fuel_type text check (fuel_type in ('petrol', 'diesel', 'electric', 'hybrid')),
  category text,
  location text not null,

  -- sale-specific
  sale_price numeric,
  price_negotiable boolean not null default false,
  installment_available boolean not null default false,
  inspected boolean not null default false,

  -- rent-specific
  rent_term text check (rent_term in ('short_term', 'long_term')),
  daily_price numeric,
  monthly_price numeric
);

create index if not exists cars_listing_type_status_idx on public.cars (listing_type, status);

alter table public.cars enable row level security;

create policy "published cars are publicly readable"
  on public.cars for select
  using (status = 'published' or auth.uid() in (
    select id from public.profiles where is_admin
  ));

create policy "admins can insert cars"
  on public.cars for insert
  with check (auth.uid() in (select id from public.profiles where is_admin));

create policy "admins can update cars"
  on public.cars for update
  using (auth.uid() in (select id from public.profiles where is_admin));

create policy "admins can delete cars"
  on public.cars for delete
  using (auth.uid() in (select id from public.profiles where is_admin));

-- ── storage: car-images bucket ────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('car-images', 'car-images', true)
on conflict (id) do nothing;

create policy "car images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'car-images');

create policy "admins can upload car images"
  on storage.objects for insert
  with check (
    bucket_id = 'car-images'
    and auth.uid() in (select id from public.profiles where is_admin)
  );

create policy "admins can delete car images"
  on storage.objects for delete
  using (
    bucket_id = 'car-images'
    and auth.uid() in (select id from public.profiles where is_admin)
  );

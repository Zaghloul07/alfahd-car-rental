-- Splits the generic 'body' handover photo into four labeled angles
-- (front/back/left/right), so a delivery photo and a return photo can be
-- matched by angle for damage comparison. Also adds the table AI damage
-- findings get stored in. Run after schema_handover_return_date.sql.

-- 'body' is kept as a still-allowed legacy value so existing rows from
-- before this change (which can't be retroactively assigned an angle)
-- aren't rejected — the AI comparison just skips reservations whose
-- delivery/return photos are still the old unlabeled 'body' type.
alter table public.handover_photos drop constraint if exists handover_photos_photo_type_check;
alter table public.handover_photos add constraint handover_photos_photo_type_check
  check (photo_type in ('odometer', 'fuel', 'body', 'body_front', 'body_back', 'body_left', 'body_right'));

create table if not exists public.handover_damage_findings (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations (id) on delete cascade,
  angle text not null check (angle in ('front', 'back', 'left', 'right')),
  finding text not null,
  created_at timestamptz not null default now()
);

create index if not exists handover_damage_findings_reservation_idx
  on public.handover_damage_findings (reservation_id);

alter table public.handover_damage_findings enable row level security;

create policy "admins and inspectors can manage damage findings"
  on public.handover_damage_findings for all
  using (auth.uid() in (select id from public.profiles where is_admin or role = 'inspector'))
  with check (auth.uid() in (select id from public.profiles where is_admin or role = 'inspector'));

create policy "customers can read their own damage findings"
  on public.handover_damage_findings for select
  using (
    exists (
      select 1 from public.reservations r
      where r.id = reservation_id and r.customer_id = auth.uid()
    )
  );

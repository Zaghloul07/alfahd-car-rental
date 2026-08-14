-- In-app notifications for reservation lifecycle events. Broadcast by role
-- (not per-user) — appropriate for a small team. Admins always see every
-- notification regardless of recipient_role (enforced in the app query
-- layer, not RLS, since is_admin already bypasses recipient_role in the
-- policies below); staff only see the handover-relevant slice. Run after
-- schema_roles.sql.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_role text not null check (recipient_role in ('admin', 'staff')),
  type text not null check (type in (
    'reservation_created', 'reservation_approved', 'reservation_rejected',
    'reservation_cancelled', 'documents_submitted', 'payment_marked_paid',
    'reservation_confirmed', 'handover_delivered', 'handover_returned',
    'fine_added'
  )),
  reservation_id uuid references public.reservations (id) on delete cascade,
  message text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_role, read_at, created_at desc);

alter table public.notifications enable row level security;

create policy "admins and staff can read their notifications"
  on public.notifications for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and (p.is_admin or p.role = notifications.recipient_role)
    )
  );

create policy "admins and staff can mark their notifications read"
  on public.notifications for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and (p.is_admin or p.role = notifications.recipient_role)
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and (p.is_admin or p.role = notifications.recipient_role)
    )
  );

-- No direct insert policy: notifications are triggered by customer actions
-- (reservation created, documents submitted) as well as admin/staff
-- actions, and customers have no `profiles` row to grant them insert
-- rights against. Inserts only happen through this security definer
-- function, which bypasses RLS the same way get_car_availability() does.
create or replace function public.create_notification(
  p_recipient_role text,
  p_type text,
  p_reservation_id uuid,
  p_message text,
  p_link text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notifications (recipient_role, type, reservation_id, message, link)
  values (p_recipient_role, p_type, p_reservation_id, p_message, p_link);
$$;

grant execute on function public.create_notification(text, text, uuid, text, text) to anon, authenticated;

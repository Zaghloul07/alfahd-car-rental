-- Extends notifications to support customer-targeted rows (not just the
-- existing role-wide admin/inspector broadcasts), so a customer can see
-- updates on their own reservation. Run after schema_handover_body_angles.sql.

alter table public.notifications
  add column if not exists customer_id uuid references public.customers (id) on delete cascade;

create index if not exists notifications_customer_idx
  on public.notifications (customer_id, read_at, created_at desc);

alter table public.notifications drop constraint if exists notifications_recipient_role_check;
alter table public.notifications add constraint notifications_recipient_role_check
  check (recipient_role in ('admin', 'inspector', 'customer'));

create policy "customers can read their own notifications"
  on public.notifications for select
  using (customer_id = auth.uid());

create policy "customers can mark their own notifications read"
  on public.notifications for update
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

-- Replace create_notification() with a version that also accepts an
-- optional customer id — drop first since adding a parameter changes the
-- function's signature (Postgres would otherwise create an overload).
drop function if exists public.create_notification(text, text, uuid, text, text);

create or replace function public.create_notification(
  p_recipient_role text,
  p_type text,
  p_reservation_id uuid,
  p_message text,
  p_link text,
  p_customer_id uuid default null
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notifications (recipient_role, type, reservation_id, message, link, customer_id)
  values (p_recipient_role, p_type, p_reservation_id, p_message, p_link, p_customer_id);
$$;

grant execute on function public.create_notification(text, text, uuid, text, text, uuid) to anon, authenticated;

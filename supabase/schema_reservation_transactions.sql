-- Adds a `type` to reservation_charges so admins can also record refunds
-- (money owed back to the customer, e.g. for an early return), not just
-- additive fines/damage charges. `amount` stays a positive magnitude in
-- both cases — application code nets it against `type` for revenue
-- reporting. Also adds the 'refund_issued' notification type. Run after
-- schema_customer_notifications.sql.

alter table public.reservation_charges
  add column if not exists type text not null default 'charge' check (type in ('charge', 'refund'));

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'reservation_created', 'reservation_approved', 'reservation_rejected',
    'reservation_cancelled', 'documents_submitted', 'payment_marked_paid',
    'reservation_confirmed', 'handover_delivered', 'handover_returned',
    'fine_added', 'refund_issued'
  ));

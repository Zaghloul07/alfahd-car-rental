-- Fixes a bug where an inspector could never record a car RETURN.
--
-- "inspectors can update handover-stage reservations" (schema_inspector_role.sql)
-- only had a USING clause, no WITH CHECK. Postgres reuses USING as the check
-- for the *new* row when WITH CHECK is omitted on an UPDATE policy. Since the
-- USING clause only allowed status in ('confirmed', 'delivered'), updating a
-- reservation's status to 'completed' (the return step) was silently rejected
-- by RLS — even though delivery (confirmed -> delivered) worked fine, since
-- 'delivered' is itself in that allowed set. Run any time after
-- schema_inspector_role.sql.

drop policy if exists "inspectors can update handover-stage reservations" on public.reservations;
create policy "inspectors can update handover-stage reservations"
  on public.reservations for update
  using (
    status in ('confirmed', 'delivered')
    and auth.uid() in (select id from public.profiles where role = 'inspector')
  )
  with check (
    status in ('delivered', 'completed')
    and auth.uid() in (select id from public.profiles where role = 'inspector')
  );

-- Lets an inspector record the actual date a car was returned (which can be
-- earlier — or later — than the reservation's agreed end_date), used to
-- show the admin the agreed-vs-actual rental cost. Nullable — only ever set
-- on type='return' handover_reports rows. Run after schema_inspector_role.sql.

alter table public.handover_reports
  add column if not exists return_date date;

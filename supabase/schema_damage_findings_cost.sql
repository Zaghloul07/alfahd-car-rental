-- Adds bilingual descriptions and an estimated repair cost to AI damage
-- findings. `finding` (English-only) is renamed to `finding_en`; existing
-- rows keep their English text with no Arabic translation or cost estimate
-- (both nullable, so old rows degrade gracefully in the UI). Run after
-- schema_reservation_transactions.sql.

alter table public.handover_damage_findings rename column finding to finding_en;
alter table public.handover_damage_findings add column if not exists finding_ar text;
alter table public.handover_damage_findings add column if not exists estimated_cost_egp numeric;
